"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/context/StoreProvider";
import { formatINR } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import type { Coupon } from "@/lib/types";
import OrderSummary from "./OrderSummary";
import Price from "./Price";
import ProductImage from "./ProductImage";
import { CloseIcon } from "./icons";

export default function CartDrawer() {
  const { cart, bagOpen, closeBag, setQty, removeLine, totals, coupon, setCoupon, showToast } = useStore();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [code, setCode] = useState("");
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!bagOpen) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeBag();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prevFocus?.focus?.();
    };
  }, [bagOpen, closeBag]);

  if (!bagOpen) return null;

  const t = totals();
  const shipPct = Math.min(100, Math.round((1 - t.toFreeShipping / FREE_SHIPPING_THRESHOLD) * 100));

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim();
    if (!c) return;
    setChecking(true);
    setCouponMsg(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c }),
      });
      const json = (await res.json()) as { coupon?: Coupon; error?: string };
      if (json.coupon) {
        setCoupon(json.coupon);
        setCode("");
      } else {
        setCouponMsg(json.error ?? "That code didn't work.");
      }
    } catch {
      setCouponMsg("Couldn't check the code. Check your connection and try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="overlay side" onClick={(e) => e.target === e.currentTarget && closeBag()}>
      <div className="drawer" role="dialog" aria-modal="true" aria-label="Your bag">
        <div className="drawer-head">
          <h2>
            Your bag <span className="count-note">{t.count} item{t.count === 1 ? "" : "s"}</span>
          </h2>
          <button ref={closeRef} type="button" className="x" onClick={closeBag} aria-label="Close bag">
            <CloseIcon />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="drawer-body">
            <div className="empty bare">
              <h3>Your bag is empty</h3>
              <p>Shirts start at {formatINR(1299)}, tees at {formatINR(699)}.</p>
              <button type="button" className="btn primary" onClick={closeBag}>Start shopping</button>
            </div>
          </div>
        ) : (
          <>
            <div className="drawer-body">
              <div className="ship-meter">
                {t.toFreeShipping > 0 ? (
                  <span>Add <b>{formatINR(t.toFreeShipping)}</b> more for free shipping</span>
                ) : (
                  <span className="good"><b>You&rsquo;ve unlocked free shipping</b></span>
                )}
                <div className="bar"><i style={{ width: `${shipPct}%` }} /></div>
              </div>

              <ul className="lines">
                {cart.map((l) => (
                  <li className="line" key={`${l.productId}-${l.size}`}>
                    <Link href={`/products/${l.product.slug}`} className="card-hit" onClick={closeBag} aria-label={`View ${l.product.name}`}>
                      <ProductImage product={l.product} sizes="80px" />
                    </Link>
                    <div className="line-info">
                      <h3>{l.product.name}</h3>
                      <p className="meta">Size {l.size} · {l.product.colorName}</p>
                      <Price price={l.product.price * l.qty} mrp={l.product.mrp * l.qty} />
                      <div className="line-foot">
                        <div className="stepper sm" aria-label={`Quantity for ${l.product.name}`}>
                          <button type="button" onClick={() => setQty(l.productId, l.size, l.qty - 1)} aria-label="Decrease">−</button>
                          <output>{l.qty}</output>
                          <button type="button" onClick={() => setQty(l.productId, l.size, l.qty + 1)} aria-label="Increase">+</button>
                        </div>
                        <button
                          type="button"
                          className="rm"
                          onClick={() => {
                            removeLine(l.productId, l.size);
                            showToast(`Removed ${l.product.name}`);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="coupon">
                <label className="label" htmlFor="coupon">Coupon code</label>
                {coupon ? (
                  <p className="msg">
                    {t.couponNote ? (
                      <span className="bad">{t.couponNote}</span>
                    ) : (
                      <span className="good">{coupon.code} applied. You save {formatINR(t.couponDiscount)}.</span>
                    )}{" "}
                    <button type="button" className="rm" onClick={() => setCoupon(null)}>Remove</button>
                  </p>
                ) : (
                  <form className="row" onSubmit={applyCoupon} noValidate>
                    <input id="coupon" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter code" autoComplete="off" />
                    <button type="submit" className="btn ghost sm" disabled={checking}>{checking ? "Checking…" : "Apply"}</button>
                  </form>
                )}
                {couponMsg && <p className="msg bad">{couponMsg}</p>}
                {!coupon && <p className="hint">Try <code>FIRST10</code> or <code>SAVE300</code></p>}
              </div>

              <OrderSummary t={t} couponCode={coupon?.code} />
            </div>

            <div className="drawer-foot">
              <Link href="/checkout" className="btn primary lg" onClick={closeBag}>
                Checkout · {formatINR(t.total)}
              </Link>
              <p className="fine">Prices include GST. 15-day returns.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
