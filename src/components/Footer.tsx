import Link from "next/link";
import { formatINR } from "@/lib/format";
import { COD_LIMIT, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/pricing";

export default function Footer() {
  return (
    <footer>
      <div className="wrap foot">
        <div>
          <div className="brand static">
            <span className="mark">L&amp;L</span>
            <span className="word">Loom &amp; Lapel</span>
          </div>
          <p>Menswear in cotton, linen and wool blends. Shipped from Chennai across India.</p>
          <p><Link href="/admin">Add clothes</Link></p>
        </div>
        <div>
          <h4>Shipping</h4>
          <ul>
            <li>Free above {formatINR(FREE_SHIPPING_THRESHOLD)}, else {formatINR(SHIPPING_FEE)}</li>
            <li>2–6 working days across India</li>
            <li>Cash on delivery up to {formatINR(COD_LIMIT)}</li>
          </ul>
        </div>
        <div>
          <h4>Returns</h4>
          <ul>
            <li>15-day returns and exchanges</li>
            <li>Free size exchange on first order</li>
            <li>Tags must be attached</li>
          </ul>
        </div>
        <div>
          <h4>Offers</h4>
          <ul>
            <li><b className="code">FIRST10</b> 10% off, up to ₹500</li>
            <li><b className="code">SAVE300</b> ₹300 off above ₹2,999</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
