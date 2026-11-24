"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import Garment from "@/components/Garment";
import { CATEGORIES, categoryLabel, FITS, isBottomwear, PATTERNS, patternNeedsSecondColor, SHAPE_FOR, SHAPES, TAGS } from "@/lib/catalog";
import { formatINR } from "@/lib/format";
import type { Category, Pattern, Product, Shape } from "@/lib/types";

type Draft = {
  name: string;
  category: Category;
  description: string;
  fit: string;
  fabric: string;
  weight: string;
  care: string;
  colorName: string;
  colorHex: string;
  shape: Shape;
  pattern: Pattern;
  patternHex: string;
  collar: boolean;
  trim: boolean;
  drawstring: boolean;
  price: string;
  mrp: string;
  tag: string;
  stock: string;
};

const EMPTY: Draft = {
  name: "",
  category: "shirts",
  description: "",
  fit: "Regular",
  fabric: "",
  weight: "",
  care: "Machine wash cold",
  colorName: "",
  colorHex: "#2C3D9C",
  shape: "shirt",
  pattern: "solid",
  patternHex: "#1F2C5A",
  collar: false,
  trim: false,
  drawstring: false,
  price: "",
  mrp: "",
  tag: "New",
  stock: "25",
};

export default function AdminStudio({ products, addedSlug }: { products: Product[]; addedSlug?: string }) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const added = products.find((product) => product.slug === addedSlug);

  const look = useMemo(
    () => ({
      colorHex: /^#[0-9A-Fa-f]{6}$/.test(draft.colorHex) ? draft.colorHex : "#888888",
      shape: draft.shape,
      pattern: draft.pattern,
      patternHex: patternNeedsSecondColor(draft.pattern) ? draft.patternHex : null,
      collar: draft.collar ? ("mandarin" as const) : null,
      trim: draft.trim,
      drawstring: draft.drawstring,
    }),
    [draft],
  );

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const price = Number(draft.price);
    const mrp = Number(draft.mrp);
    const stock = Number(draft.stock);
    if (!Number.isInteger(price) || price < 1) return setError("Enter a selling price in whole rupees.");
    if (!Number.isInteger(mrp) || mrp < price) return setError("MRP has to be at least the selling price.");
    if (!Number.isInteger(stock) || stock < 0) return setError("Stock has to be a whole number.");
    if (patternNeedsSecondColor(draft.pattern) && !/^#[0-9A-Fa-f]{6}$/.test(draft.patternHex)) {
      return setError("Pick a second colour for the stripe or check.");
    }

    setPending(true);
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft,
        price,
        mrp,
        stock,
        patternHex: patternNeedsSecondColor(draft.pattern) ? draft.patternHex : null,
        tag: draft.tag || null,
      }),
    });
    const body = (await res.json().catch(() => null)) as { slug?: string; error?: string } | null;
    setPending(false);
    if (!res.ok || !body?.slug) {
      setError(body?.error ?? "Could not save this piece.");
      return;
    }
    window.location.href = `/admin?added=${body.slug}`;
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin";
  }

  const sizes = isBottomwear(draft.category) ? "30–38" : "S–XXL";

  return (
    <div className="admin wrap">
      <div className="admin-bar">
        <div>
          <p className="eyebrow">Shop admin</p>
          <h1 className="h1">Add clothes</h1>
        </div>
        <button type="button" className="btn ghost sm" onClick={logout}>
          Sign out
        </button>
      </div>
      <p className="lede">
        New pieces show up in the shop right away. Until a photo is uploaded, the garment is drawn from the colour and cut you pick.
      </p>
      {added && (
        <p className="note">
          {added.name} is in the shop. <Link href={`/products/${added.slug}`}>View it</Link>
        </p>
      )}

      <div className="admin-grid">
        <form className="co-form" onSubmit={onSubmit}>
          <fieldset disabled={pending}>
            <legend>The piece</legend>
            <div className="fgrid">
              <div className="field span2">
                <label htmlFor="name">Name</label>
                <input id="name" value={draft.name} onChange={(event) => set("name", event.target.value)} required maxLength={80} placeholder="Oxford shirt, olive" />
              </div>
              <div className="field">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={draft.category}
                  onChange={(event) => {
                    const category = event.target.value as Category;
                    setDraft((current) => ({ ...current, category, shape: SHAPE_FOR[category] }));
                  }}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="fit">Fit</label>
                <select id="fit" value={draft.fit} onChange={(event) => set("fit", event.target.value)}>
                  {FITS.map((fit) => (
                    <option key={fit} value={fit}>{fit}</option>
                  ))}
                </select>
              </div>
              <div className="field span2">
                <label htmlFor="description">Description</label>
                <textarea id="description" value={draft.description} onChange={(event) => set("description", event.target.value)} required minLength={10} maxLength={600} placeholder="What it is made of, and how it is worn." />
              </div>
              <div className="field">
                <label htmlFor="fabric">Fabric</label>
                <input id="fabric" value={draft.fabric} onChange={(event) => set("fabric", event.target.value)} required maxLength={80} placeholder="100% cotton Oxford" />
              </div>
              <div className="field">
                <label htmlFor="weight">Weight</label>
                <input id="weight" value={draft.weight} onChange={(event) => set("weight", event.target.value)} maxLength={40} placeholder="140 GSM" />
              </div>
              <div className="field span2">
                <label htmlFor="care">Care</label>
                <input id="care" value={draft.care} onChange={(event) => set("care", event.target.value)} maxLength={80} />
              </div>
            </div>
          </fieldset>

          <fieldset disabled={pending}>
            <legend>Look</legend>
            <div className="fgrid">
              <div className="field">
                <label htmlFor="colorName">Colour name</label>
                <input id="colorName" value={draft.colorName} onChange={(event) => set("colorName", event.target.value)} required maxLength={40} placeholder="Olive" />
              </div>
              <div className="field">
                <label htmlFor="colorHex">Colour</label>
                <div className="color-row">
                  <input id="colorHex" type="color" value={draft.colorHex} onChange={(event) => set("colorHex", event.target.value)} aria-label="Garment colour" />
                  <input value={draft.colorHex} onChange={(event) => set("colorHex", event.target.value)} aria-label="Colour hex" maxLength={7} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="shape">Cut</label>
                <select id="shape" value={draft.shape} onChange={(event) => set("shape", event.target.value as Shape)}>
                  {SHAPES.map((shape) => (
                    <option key={shape.id} value={shape.id}>{shape.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="pattern">Pattern</label>
                <select id="pattern" value={draft.pattern} onChange={(event) => set("pattern", event.target.value as Pattern)}>
                  {PATTERNS.map((pattern) => (
                    <option key={pattern.id} value={pattern.id}>{pattern.label}</option>
                  ))}
                </select>
              </div>
              {patternNeedsSecondColor(draft.pattern) && (
                <div className="field span2">
                  <label htmlFor="patternHex">Pattern colour</label>
                  <div className="color-row">
                    <input id="patternHex" type="color" value={draft.patternHex} onChange={(event) => set("patternHex", event.target.value)} aria-label="Pattern colour" />
                    <input value={draft.patternHex} onChange={(event) => set("patternHex", event.target.value)} aria-label="Pattern colour hex" maxLength={7} />
                  </div>
                </div>
              )}
              <div className="checks checks-row span2">
                <label>
                  <input type="checkbox" checked={draft.collar} onChange={(event) => set("collar", event.target.checked)} />
                  Mandarin collar
                </label>
                <label>
                  <input type="checkbox" checked={draft.trim} onChange={(event) => set("trim", event.target.checked)} />
                  Border trim
                </label>
                <label>
                  <input type="checkbox" checked={draft.drawstring} onChange={(event) => set("drawstring", event.target.checked)} />
                  Drawstring
                </label>
              </div>
            </div>
          </fieldset>

          <fieldset disabled={pending}>
            <legend>Price and stock</legend>
            <div className="fgrid">
              <div className="field">
                <label htmlFor="price">Selling price</label>
                <div className="prefix">
                  <span>₹</span>
                  <input id="price" inputMode="numeric" value={draft.price} onChange={(event) => set("price", event.target.value.replace(/[^\d]/g, ""))} required placeholder="1499" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="mrp">MRP</label>
                <div className="prefix">
                  <span>₹</span>
                  <input id="mrp" inputMode="numeric" value={draft.mrp} onChange={(event) => set("mrp", event.target.value.replace(/[^\d]/g, ""))} required placeholder="1999" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="stock">Stock per size</label>
                <input id="stock" inputMode="numeric" value={draft.stock} onChange={(event) => set("stock", event.target.value.replace(/[^\d]/g, ""))} required />
                <small className="hint">Sizes {sizes} are created together.</small>
              </div>
              <div className="field">
                <label htmlFor="tag">Tag</label>
                <select id="tag" value={draft.tag} onChange={(event) => set("tag", event.target.value)}>
                  <option value="">None</option>
                  {TAGS.map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {error && <p className="form-error">{error}</p>}
          <button className="btn primary lg" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Add to the shop"}
          </button>
        </form>

        <aside className="admin-preview">
          <p className="eyebrow">Preview</p>
          <div className="tile">
            <Garment look={look} />
          </div>
          <h2>{draft.name.trim() || "New piece"}</h2>
          <p>{draft.colorName || "Colour"} · {draft.fit}</p>
          {draft.price && <p className="price-line">{formatINR(Number(draft.price))}</p>}
        </aside>
      </div>

      <section className="admin-list">
        <h2>In the shop <span className="count-note">{products.length}</span></h2>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Piece</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <span className="swatch" style={{ background: product.colorHex }} />
                    <Link href={`/products/${product.slug}`}>{product.name}</Link>
                  </td>
                  <td>{categoryLabel(product.category)}</td>
                  <td>{formatINR(product.price)}</td>
                  <td>{product.variants.reduce((sum, variant) => sum + variant.stock, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
