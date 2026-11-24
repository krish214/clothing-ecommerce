"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/context/StoreProvider";
import { BOTTOM_SIZES, CATEGORIES, categoryLabel, FITS, MAX_PRICE, TOP_SIZES } from "@/lib/catalog";
import { discountPct, formatINR } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import { CloseIcon } from "./icons";

type Sort = "featured" | "price-asc" | "price-desc" | "discount" | "rating";

function href(params: { cat?: string | null; q?: string | null; saved?: boolean }) {
  const sp = new URLSearchParams();
  if (params.cat) sp.set("cat", params.cat);
  if (params.q) sp.set("q", params.q);
  if (params.saved) sp.set("saved", "1");
  const s = sp.toString();
  return s ? `/?${s}#catalogue` : "/#catalogue";
}

export default function Catalogue({
  products,
  cat,
  q,
  saved,
}: {
  products: Product[];
  cat: Category | null;
  q: string;
  saved: boolean;
}) {
  const { wishlist, ready } = useStore();
  const [sizes, setSizes] = useState<string[]>([]);
  const [fits, setFits] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [sort, setSort] = useState<Sort>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = products.filter((p) => {
      if (saved && !(ready && wishlist.includes(p.id))) return false;
      if (cat && p.category !== cat) return false;
      if (p.price > maxPrice) return false;
      if (fits.length && !fits.includes(p.fit)) return false;
      if (sizes.length && !p.variants.some((v) => sizes.includes(v.size) && v.stock > 0)) return false;
      if (needle) {
        const hay = `${p.name} ${p.colorName} ${p.fabric} ${p.fit} ${categoryLabel(p.category)}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    const sorters: Record<Sort, ((a: Product, b: Product) => number) | null> = {
      featured: null,
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      discount: (a, b) => discountPct(b.price, b.mrp) - discountPct(a.price, a.mrp),
      rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
    };
    const s = sorters[sort];
    return s ? [...list].sort(s) : list;
  }, [products, cat, q, saved, wishlist, ready, sizes, fits, maxPrice, sort]);

  const resetLocal = () => {
    setSizes([]);
    setFits([]);
    setMaxPrice(MAX_PRICE);
    setSort("featured");
  };

  const countFor = (c: Category | null) => (c ? products.filter((p) => p.category === c).length : products.length);
  const label = saved ? "saved" : cat ? categoryLabel(cat).toLowerCase() : "";

  return (
    <div className="wrap" id="catalogue">
      <nav className="cats" aria-label="Categories">
        <Link href={href({ q })} className="chip" aria-current={!cat && !saved ? "page" : undefined}>
          All <span className="n">{countFor(null)}</span>
        </Link>
        {CATEGORIES.map((c) => (
          <Link key={c.id} href={href({ cat: c.id, q })} className="chip" aria-current={cat === c.id ? "page" : undefined}>
            {c.label} <span className="n">{countFor(c.id)}</span>
          </Link>
        ))}
      </nav>

      <div className="shop">
        <aside className={`filters${filtersOpen ? " open" : ""}`} id="filters" aria-label="Filters">
          <div className="fgroup">
            <h4>Size</h4>
            <p className="sub">Shirts, polos, blazers, kurtas</p>
            <div className="size-grid">
              {TOP_SIZES.map((s) => (
                <button key={s} type="button" className="sz" aria-pressed={sizes.includes(s)} onClick={() => toggle(sizes, setSizes, s)}>
                  {s}
                </button>
              ))}
            </div>
            <p className="sub">Trousers &amp; denim (waist, in)</p>
            <div className="size-grid">
              {BOTTOM_SIZES.map((s) => (
                <button key={s} type="button" className="sz" aria-pressed={sizes.includes(s)} onClick={() => toggle(sizes, setSizes, s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="fgroup">
            <h4>Fit</h4>
            <div className="checks">
              {FITS.map((f) => (
                <label key={f}>
                  <input type="checkbox" id={`fit-${f}`} checked={fits.includes(f)} onChange={() => toggle(fits, setFits, f)} />
                  {f}
                  <span className="n">{products.filter((p) => p.fit === f).length}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="fgroup">
            <h4>Price</h4>
            <input
              type="range"
              id="max-price"
              min={500}
              max={MAX_PRICE}
              step={100}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              aria-label="Maximum price"
            />
            <div className="range-out">
              <span>₹500</span>
              <span>Up to {formatINR(maxPrice)}</span>
            </div>
          </div>

          <button type="button" className="btn ghost sm" onClick={resetLocal}>
            Clear filters
          </button>
        </aside>

        <div className="results">
          <div className="toolbar">
            <p className="result-count">
              <b>{visible.length}</b> {visible.length === 1 ? "style" : "styles"}
              {label && ` · ${label}`}
            </p>
            <button
              type="button"
              className="btn ghost sm only-mobile"
              aria-expanded={filtersOpen}
              aria-controls="filters"
              onClick={() => setFiltersOpen((o) => !o)}
            >
              Filters
            </button>
            <label className="sort" htmlFor="sort">
              Sort
              <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="featured">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="discount">Biggest discount</option>
                <option value="rating">Top rated</option>
              </select>
            </label>
          </div>

          <div className="active-filters">
            {saved && (
              <Link className="pill" href={href({ cat, q })}>
                Saved only <CloseIcon size={11} />
              </Link>
            )}
            {q && (
              <Link className="pill" href={href({ cat, saved })}>
                “{q}” <CloseIcon size={11} />
              </Link>
            )}
            {sizes.map((s) => (
              <button key={s} type="button" className="pill" onClick={() => toggle(sizes, setSizes, s)}>
                Size {s} <CloseIcon size={11} />
              </button>
            ))}
            {fits.map((f) => (
              <button key={f} type="button" className="pill" onClick={() => toggle(fits, setFits, f)}>
                {f} fit <CloseIcon size={11} />
              </button>
            ))}
            {maxPrice < MAX_PRICE && (
              <button type="button" className="pill" onClick={() => setMaxPrice(MAX_PRICE)}>
                Up to {formatINR(maxPrice)} <CloseIcon size={11} />
              </button>
            )}
          </div>

          <div className="grid">
            {visible.length ? (
              visible.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)
            ) : saved && ready && wishlist.length === 0 ? (
              <div className="empty">
                <h3>Nothing saved yet</h3>
                <p>Tap the heart on any piece to keep it here.</p>
                <Link className="btn primary" href="/">Browse everything</Link>
              </div>
            ) : (
              <div className="empty">
                <h3>No matches</h3>
                <p>Try a different size, a higher price limit, or a broader search.</p>
                <Link className="btn primary" href="/" onClick={resetLocal}>Clear filters</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
