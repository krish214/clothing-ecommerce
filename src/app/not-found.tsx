import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap">
      <div className="empty spaced">
        <h3>We couldn&rsquo;t find that page</h3>
        <p>The product may have sold out or moved.</p>
        <Link className="btn primary" href="/">Back to the shop</Link>
      </div>
    </div>
  );
}
