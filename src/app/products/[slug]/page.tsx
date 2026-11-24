import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PincodeCheck from "@/components/PincodeCheck";
import Price from "@/components/Price";
import ProductActions from "@/components/ProductActions";
import ProductCard from "@/components/ProductCard";
import ProductImage from "@/components/ProductImage";
import SizeGuide from "@/components/SizeGuide";
import { categoryLabel, isBottomwear } from "@/lib/catalog";
import { getProductBySlug, getRelated } from "@/lib/products";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Not found" };
  return {
    title: p.name,
    description: `${p.name} in ${p.colorName}. ${p.fit} fit, ${p.fabric}. ₹${p.price.toLocaleString("en-IN")} inclusive of taxes.`,
    openGraph: p.imageUrl ? { images: [p.imageUrl] } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = await getRelated(product);

  // Structured data so search engines can show price and stock.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    color: product.colorName,
    material: product.fabric,
    image: product.imageUrl ?? undefined,
    aggregateRating: product.reviewCount
      ? { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount }
      : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: product.variants.some((v) => v.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="wrap pdp">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Shop</Link> <span aria-hidden="true">/</span>{" "}
        <Link href={`/?cat=${product.category}#catalogue`}>{categoryLabel(product.category)}</Link>
      </nav>

      <div className="pd-grid">
        <div className="pd-media">
          <ProductImage product={product} sizes="(max-width: 760px) 100vw, 50vw" priority />
        </div>

        <div className="pd-info">
          <p className="eyebrow">{categoryLabel(product.category)} · {product.fit} fit</p>
          <h1>{product.name}</h1>
          <p className="rating">
            <b>★ {product.rating.toFixed(1)}</b>
            <span>{product.reviewCount} ratings</span>
          </p>
          <Price price={product.price} mrp={product.mrp} large />
          <p className="tax">Inclusive of all taxes</p>
          <p className="colour">
            <span className="sw" style={{ background: product.colorHex }} />
            {product.colorName}
          </p>

          <ProductActions product={product} />
          <SizeGuide bottoms={isBottomwear(product.category)} />
          <PincodeCheck />

          <p className="desc">{product.description}</p>
          <dl className="specs">
            <dt>Fabric</dt><dd>{product.fabric}</dd>
            <dt>Weight</dt><dd>{product.weight}</dd>
            <dt>Fit</dt><dd>{product.fit}</dd>
            <dt>Care</dt><dd>{product.care}</dd>
            <dt>Returns</dt><dd>15 days, free size exchange</dd>
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="related" aria-labelledby="related-h">
          <h2 id="related-h">More {categoryLabel(product.category).toLowerCase()}</h2>
          <div className="grid">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
