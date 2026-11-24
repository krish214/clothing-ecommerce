import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { estimateDelivery } from "@/lib/delivery";
import { formatINR } from "@/lib/format";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your order", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS: Record<string, { stamp: string; heading: (n: string) => string; tone: "ok" | "wait" | "bad" }> = {
  paid: { stamp: "Payment received", heading: (n) => `Thank you, ${n}`, tone: "ok" },
  cod_confirmed: { stamp: "Order confirmed", heading: (n) => `Thank you, ${n}`, tone: "ok" },
  shipped: { stamp: "Shipped", heading: () => "Your order is on its way", tone: "ok" },
  delivered: { stamp: "Delivered", heading: () => "Delivered", tone: "ok" },
  pending_payment: { stamp: "Awaiting payment", heading: () => "We're waiting for your payment", tone: "wait" },
  needs_review: { stamp: "Being checked", heading: () => "We're checking your payment", tone: "wait" },
  cancelled: { stamp: "Cancelled", heading: () => "This order was cancelled", tone: "bad" },
};

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  // The order id is an unguessable UUID, which acts as the link's access key.
  const { data: o } = await supabaseAdmin().from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!o) notFound();

  const s = STATUS[o.status] ?? STATUS.pending_payment;
  const firstName = String(o.customer_name).split(" ")[0];
  const eta = estimateDelivery(o.pincode, new Date(o.paid_at ?? o.created_at));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = o.order_items as any[];

  return (
    <div className="wrap">
      <div className="done">
        <span className={`stamp ${s.tone}`}>{s.stamp}</span>
        <h1 className="h1">{s.heading(firstName)}</h1>
        {s.tone === "ok" && (
          <p className="lede">
            Updates will go to +91 {o.phone}
            {o.email ? ` and ${o.email}` : ""}. Keep this page link to check your order later.
          </p>
        )}
        {o.status === "pending_payment" && (
          <p className="lede">If you completed the payment, refresh this page in a few minutes to see it confirmed. Unpaid orders are released after 30 minutes.</p>
        )}

        <div className="box">
          <div><span>Order number</span><b className="mono">{o.order_no}</b></div>
          {s.tone === "ok" && <div><span>Arriving by</span><b>{eta.label}</b></div>}
          <div><span>Payment</span><b>{o.payment_method === "cod" ? "Cash on delivery" : o.paid_at ? "Paid online" : "Online, not paid yet"}</b></div>
          <div><span>Total</span><b className="num">{formatINR(o.total)}</b></div>
          <div className="wide">
            <span>Delivering to</span>
            <b>
              {o.address_line1}
              {o.address_line2 ? `, ${o.address_line2}` : ""}, {o.city}, {o.state} {o.pincode}
            </b>
          </div>
        </div>

        <ul className="mini boxed">
          {items.map((i) => (
            <li key={i.id}>
              <div className="mini-text">
                <div>{i.product_name}</div>
                <div className="meta">Size {i.size} · Qty {i.qty}</div>
              </div>
              <span className="amt">{formatINR(i.line_total)}</span>
            </li>
          ))}
        </ul>

        <div>
          <Link className="btn primary lg" href="/">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
