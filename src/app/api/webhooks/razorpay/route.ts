import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/razorpay";

/**
 * Razorpay webhook. Subscribe to "payment.captured" in the Razorpay dashboard.
 * Catches payments where the shopper closed the tab before the browser could call /api/payments/verify.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(raw) as {
    event: string;
    payload?: { payment?: { entity?: { id: string; order_id: string } } };
  };

  if (event.event === "payment.captured") {
    const p = event.payload?.payment?.entity;
    if (p?.order_id) await markOrderPaid({ razorpayOrderId: p.order_id }, p.id);
  }
  // Failed attempts are ignored: the shopper can retry on the same Razorpay order,
  // and unpaid orders release their stock through expire_pending_orders().
  return NextResponse.json({ received: true });
}
