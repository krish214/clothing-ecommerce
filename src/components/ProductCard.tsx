import Link from "next/link";
import Price from "./Price";
import ProductImage from "./ProductImage";
import WishButton from "./WishButton";
import type { Product } from "@/lib/types";

export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const soldOut = product.variants.every((v) => v.stock === 0);
  return (
    <article className="card">
      <Link href={`/products/${product.slug}`} className="card-hit" tabIndex={-1} aria-hidden="true">
        <ProductImage product={product} priority={priority} />
      </Link>
      {product.tag && <span className={`badge${product.tag === "Festive" ? " festive" : ""}`}>{product.tag}</span>}
      <WishButton productId={product.id} name={product.name} />
      <div className="card-body">
        <h3>
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="spec">
          {product.fit} · {product.colorName}
        </p>
        {soldOut ? <p className="soldout">Sold out</p> : <Price price={product.price} mrp={product.mrp} />}
      </div>
    </article>
  );
}
