import { formatINR } from "@/lib/format";
import type { Totals } from "@/lib/pricing";

export default function OrderSummary({ t, couponCode }: { t: Totals; couponCode?: string | null }) {
  const mrpDiscount = t.mrpTotal - t.subtotal;
  return (
    <>
      <dl className="sum">
        <dt>Bag total (MRP)</dt>
        <dd>{formatINR(t.mrpTotal)}</dd>
        {mrpDiscount > 0 && (
          <>
            <dt>Discount on MRP</dt>
            <dd className="save">−{formatINR(mrpDiscount)}</dd>
          </>
        )}
        {t.couponDiscount > 0 && (
          <>
            <dt>Coupon {couponCode}</dt>
            <dd className="save">−{formatINR(t.couponDiscount)}</dd>
          </>
        )}
        <dt>Shipping</dt>
        <dd>{t.shippingFee ? formatINR(t.shippingFee) : <span className="save">Free</span>}</dd>
        {t.codFee > 0 && (
          <>
            <dt>Cash on delivery fee</dt>
            <dd>{formatINR(t.codFee)}</dd>
          </>
        )}
        <dt className="total">Total</dt>
        <dd className="total">{formatINR(t.total)}</dd>
      </dl>
      {t.savings > 0 && <p className="savings">You save {formatINR(t.savings)} on this order</p>}
    </>
  );
}
