"use client";

import { useState } from "react";
import { useStore } from "@/context/StoreProvider";
import { isBottomwear } from "@/lib/catalog";
import { toSummary } from "@/lib/summary";
import type { Product } from "@/lib/types";
import WishButton from "./WishButton";

export default function ProductActions({ product }: { product: Product }) {
  const { addToCart, showToast, openBag } = useStore();
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const variant = product.variants.find((v) => v.size === size);
  const maxQty = Math.min(5, variant?.stock ?? 5);
  const lowStock = variant && variant.stock > 0 && variant.stock <= 5;

  const add = () => {
    if (!size || !variant) {
      setError("Pick a size to add this to your bag.");
      return;
    }
    addToCart(toSummary(product), size, qty);
    showToast(`Added ${product.name}, size ${size}`, { label: "View bag", run: openBag });
  };

  return (
    <div className="actions">
      <div className="row-between">
        <span className="label" id="size-label">Select {isBottomwear(product.category) ? "waist size" : "size"}</span>
      </div>
      <div className="size-grid" role="group" aria-labelledby="size-label">
        {product.variants.map((v) => (
          <button
            key={v.id}
            type="button"
            className="sz"
            aria-pressed={size === v.size}
            disabled={v.stock === 0}
            aria-label={v.stock === 0 ? `${v.size}, sold out` : v.size}
            onClick={() => {
              setSize(v.size);
              setQty((q) => Math.min(q, Math.min(5, v.stock)));
              setError(null);
            }}
          >
            {v.size}
          </button>
        ))}
      </div>
      {error && <p className="err" role="alert">{error}</p>}
      {lowStock && <p className="low">Only {variant.stock} left in {size}</p>}

      <div className="pd-actions">
        <div className="stepper" aria-label="Quantity">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
          <output aria-live="polite">{qty}</output>
          <button type="button" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} aria-label="Increase quantity">+</button>
        </div>
        <button type="button" className="btn primary" onClick={add}>
          Add to bag
        </button>
        <WishButton productId={product.id} name={product.name} className="btn ghost square wish-inline" />
      </div>
    </div>
  );
}
