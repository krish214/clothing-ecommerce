import { NextResponse } from "next/server";
import { z } from "zod";
import { markOrderPaid } from "@/lib/orders";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { supabaseAdmin } from "@/lib/supabase";

const Body = z.object({
  orderId: z.string().uuid(),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

/** Called by the browser after Razorpay Checkout succeeds. The webhook is the backup if this never arrives. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment response" }, { status: 400 });
  const b = parsed.data;

  if (!verifyPaymentSignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature)) {
    return NextResponse.json({ error: "We couldn't verify this payment. If money left your account, contact us with your order number." }, { status: 400 });
  }

  const { data: order } = await supabaseAdmin()
    .from("orders")
    .select("id, razorpay_order_id")
    .eq("id", b.orderId)
    .maybeSingle();
  if (!order || order.razorpay_order_id !== b.razorpay_order_id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  await markOrderPaid({ id: order.id }, b.razorpay_payment_id);
  return NextResponse.json({ ok: true });
}
