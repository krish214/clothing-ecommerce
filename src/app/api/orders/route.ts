import { NextResponse } from "next/server";
import { z } from "zod";
import { loadCoupon } from "@/lib/coupons";
import { isValidIndianMobile, isValidPincode, INDIAN_STATES } from "@/lib/delivery";
import { fulfilOrder } from "@/lib/orders";
import { COD_LIMIT, computeTotals, MAX_QTY_PER_LINE } from "@/lib/pricing";
import { razorpay } from "@/lib/razorpay";
import { supabaseAdmin } from "@/lib/supabase";

const Body = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().refine(isValidIndianMobile, "Invalid mobile number"),
    email: z.string().trim().email().max(120).optional().or(z.literal("")),
    addressLine1: z.string().trim().min(5).max(160),
    addressLine2: z.string().trim().max(160).optional().or(z.literal("")),
    city: z.string().trim().min(2).max(60),
    state: z.string().refine((s) => INDIAN_STATES.includes(s), "Invalid state"),
    pincode: z.string().refine(isValidPincode, "Invalid pincode"),
  }),
  items: z
    .array(z.object({ productId: z.string().uuid(), size: z.string().max(4), qty: z.number().int().min(1).max(MAX_QTY_PER_LINE) }))
    .min(1)
    .max(30),
  couponCode: z.string().trim().max(32).optional().nullable(),
  paymentMethod: z.enum(["online", "cod"]),
});

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Some checkout details are missing or invalid. Check the form and try again.");
  const { customer, items, couponCode, paymentMethod } = parsed.data;
  const db = supabaseAdmin();

  // Re-price every line from the database. Never trust prices sent by the browser.
  const ids = [...new Set(items.map((i) => i.productId))];
  const { data: rows, error } = await db
    .from("products")
    .select("id, name, price, mrp, is_active, product_variants(id, size, sku, stock)")
    .in("id", ids);
  if (error) return fail("We couldn't load your bag right now. Please try again.", 500);

  const lines = [];
  for (const item of items) {
    const p = rows?.find((r) => r.id === item.productId);
    if (!p || !p.is_active) return fail("An item in your bag is no longer available. Remove it and try again.", 409);
    const v = (p.product_variants as { id: string; size: string; sku: string; stock: number }[]).find((x) => x.size === item.size);
    if (!v) return fail(`${p.name} isn't made in size ${item.size}.`, 409);
    if (v.stock < item.qty) {
      return fail(
        v.stock === 0
          ? `${p.name} in size ${item.size} just sold out. Remove it to continue.`
          : `Only ${v.stock} left of ${p.name} in size ${item.size}. Lower the quantity to continue.`,
        409,
      );
    }
    lines.push({
      product_id: p.id,
      variant_id: v.id,
      product_name: p.name,
      size: v.size,
      sku: v.sku,
      unit_price: p.price,
      mrp: p.mrp,
      qty: item.qty,
      line_total: p.price * item.qty,
    });
  }

  const coupon = couponCode ? await loadCoupon(couponCode) : null;
  const t = computeTotals(
    lines.map((l) => ({ price: l.unit_price, mrp: l.mrp, qty: l.qty })),
    coupon,
    paymentMethod,
  );
  if (paymentMethod === "cod" && t.total > COD_LIMIT) {
    return fail(`Cash on delivery is available for orders up to ₹${COD_LIMIT.toLocaleString("en-IN")}. Please pay online.`);
  }

  // Insert order + items and reserve stock atomically.
  const { data: created, error: rpcError } = await db.rpc("create_order", {
    p: {
      payment_method: paymentMethod,
      customer_name: customer.name,
      phone: customer.phone,
      email: customer.email ?? "",
      address_line1: customer.addressLine1,
      address_line2: customer.addressLine2 ?? "",
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      mrp_total: t.mrpTotal,
      subtotal: t.subtotal,
      coupon_code: t.couponDiscount > 0 && coupon ? coupon.code : "",
      coupon_discount: t.couponDiscount,
      shipping_fee: t.shippingFee,
      cod_fee: t.codFee,
      total: t.total,
      items: lines.map(({ mrp: _mrp, ...l }) => l),
    },
  });
  if (rpcError) {
    if (rpcError.message.includes("OUT_OF_STOCK")) return fail("A size in your bag just sold out. Refresh your bag and try again.", 409);
    return fail("We couldn't place your order. Please try again.", 500);
  }
  const order = created as { id: string; order_no: string };

  if (paymentMethod === "cod") {
    await fulfilOrder(order.id);
    return NextResponse.json({ orderId: order.id, orderNo: order.order_no, total: t.total });
  }

  try {
    const rp = await razorpay().orders.create({
      amount: t.total * 100, // paise
      currency: "INR",
      receipt: order.order_no,
      notes: { order_id: order.id },
    });
    await db.from("orders").update({ razorpay_order_id: rp.id }).eq("id", order.id);
    return NextResponse.json({
      orderId: order.id,
      orderNo: order.order_no,
      total: t.total,
      razorpay: { keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, orderId: rp.id, amount: rp.amount, currency: rp.currency },
    });
  } catch {
    await db.rpc("cancel_order", { p_order: order.id });
    return fail("Online payment is unavailable right now. Try again in a minute or choose cash on delivery.", 502);
  }
}
