import Link from "next/link";
import Catalogue from "@/components/Catalogue";
import ProductImage from "@/components/ProductImage";
import { isCategory } from "@/lib/catalog";
import { formatINR } from "@/lib/format";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

const HERO_SLUGS = ["silk-blend-festive-kurta-maroon", "jodhpuri-bandhgala-black", "unstructured-cotton-blazer-navy"];

export default async function Home({ searchParams }: { searchParams: Promise<{ cat?: string; q?: string; saved?: string }> }) {
  const sp = await searchParams;
  const products = await getProducts();
  const hero = HERO_SLUGS.map((s) => products.find((p) => p.slug === s)).filter((p) => p !== undefined);

  return (
    <>
      <section className="hero">
        <div className="wrap hero-in">
          <div>
            <p className="eyebrow">Wedding &amp; festive season</p>
            <h1>
              Dressed for every <em>muhurtham</em>
            </h1>
            <p className="sub">
              Kurtas, bandhgalas and blazers cut for the season, plus everyday shirts and chinos in breathable cotton and linen.
            </p>
            <div className="ctas">
              <Link className="btn primary lg" href="/?cat=ethnic#catalogue">Shop the festive edit</Link>
              <Link className="btn ghost lg" href="/?cat=blazers#catalogue">Browse blazers</Link>
            </div>
          </div>
          {hero.length > 0 && (
            <div className="madras">
              {hero.map((p) => (
                <Link key={p.id} href={`/products/${p.slug}`} className="ht" aria-label={p.name}>
                  <ProductImage product={p} sizes="160px" priority />
                  <span>{formatINR(p.price)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Catalogue
        products={products}
        cat={isCategory(sp.cat) ? sp.cat : null}
        q={(sp.q ?? "").slice(0, 60)}
        saved={sp.saved === "1"}
      />
    </>
  );
}
