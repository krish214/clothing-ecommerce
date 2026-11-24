import { supabaseAdmin } from "./supabase";
import { createShipment, shiprocketEnabled } from "./shiprocket";

/**
 * Marks an online order as paid. Safe to call twice (checkout callback and webhook both do):
 * only the first call changes the row and triggers fulfilment.
 */
export async function markOrderPaid(where: { id?: string; razorpayOrderId?: string }, paymentId: string) {
  const db = supabaseAdmin();
  let q = db
    .from("orders")
    .update({ status: "paid", razorpay_payment_id: paymentId, paid_at: new Date().toISOString() })
    .eq("status", "pending_payment");
  q = where.id ? q.eq("id", where.id) : q.eq("razorpay_order_id", where.razorpayOrderId!);
  const { data, error } = await q.select("id");
  if (error) throw new Error(error.message);

  if (data && data.length) {
    await fulfilOrder(data[0].id);
    return { updated: true };
  }

  // Payment arrived after the order expired and its stock was released: flag it for a person.
  let late = db.from("orders").update({ status: "needs_review", razorpay_payment_id: paymentId }).eq("status", "cancelled");
  late = where.id ? late.eq("id", where.id) : late.eq("razorpay_order_id", where.razorpayOrderId!);
  await late;
  return { updated: false };
}

/** Pushes the order to Shiprocket. Failures are recorded on the order and never block the shopper. */
export async function fulfilOrder(orderId: string) {
  if (!shiprocketEnabled()) return;
  const db = supabaseAdmin();
  const { data: o } = await db.from("orders").select("*, order_items(*)").eq("id", orderId).single();
  if (!o || o.shiprocket_order_id) return;
  try {
    const r = await createShipment({
      orderNo: o.order_no,
      createdAt: o.created_at,
      paymentMethod: o.payment_method,
      customerName: o.customer_name,
      phone: o.phone,
      email: o.email,
      addressLine1: o.address_line1,
      addressLine2: o.address_line2,
      city: o.city,
      state: o.state,
      pincode: o.pincode,
      subtotal: o.subtotal,
      couponDiscount: o.coupon_discount,
      shippingFee: o.shipping_fee,
      codFee: o.cod_fee,
      total: o.total,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (o.order_items as any[]).map((i) => ({ name: `${i.product_name} (${i.size})`, sku: i.sku, qty: i.qty, unitPrice: i.unit_price })),
    });
    await db
      .from("orders")
      .update({ shiprocket_order_id: r.orderId, shiprocket_shipment_id: r.shipmentId, fulfilment_error: null })
      .eq("id", orderId);
  } catch (e) {
    await db.from("orders").update({ fulfilment_error: String((e as Error).message).slice(0, 500) }).eq("id", orderId);
  }
}
