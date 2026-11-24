import { discountPct, formatINR } from "@/lib/format";

export default function Price({ price, mrp, large = false }: { price: number; mrp: number; large?: boolean }) {
  const off = discountPct(price, mrp);
  return (
    <div className={`price${large ? " lg" : ""}`}>
      <span className="now">{formatINR(price)}</span>
      {off > 0 && (
        <>
          <s aria-label={`MRP ${formatINR(mrp)}`}>{formatINR(mrp)}</s>
          <span className="off">{off}% off</span>
        </>
      )}
    </div>
  );
}
