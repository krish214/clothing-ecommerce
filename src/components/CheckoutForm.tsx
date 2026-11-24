"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/context/StoreProvider";
import { INDIAN_STATES, PINCODE_PREFIX, isValidIndianMobile, isValidPincode } from "@/lib/delivery";
import { formatINR } from "@/lib/format";
import { COD_LIMIT } from "@/lib/pricing";
import type { PaymentMethod } from "@/lib/types";
import OrderSummary from "./OrderSummary";
import ProductImage from "./ProductImage";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

type Fields = {
  name: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  pincode: string;
  city: string;
  state: string;
};
const EMPTY: Fields = { name: "", phone: "", email: "", addressLine1: "", addressLine2: "", pincode: "", city: "", state: "" };

type RazorpayInfo = { keyId: string; orderId: string; amount: number; currency: string };

function validate(f: Fields): Partial<Record<keyof Fields, string>> {
  const e: Partial<Record<keyof Fields, string>> = {};
  if (f.name.trim().length < 2) e.name = "Enter the name of the person receiving the order.";
  if (!isValidIndianMobile(f.phone)) e.phone = "Enter a 10-digit mobile number starting with 6, 7, 8 or 9.";
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "This email address looks incomplete.";
  if (f.addressLine1.trim().length < 5) e.addressLine1 = "Add your flat or house number and street.";
  if (!isValidPincode(f.pincode)) e.pincode = "Pincodes are 6 digits and don't start with 0.";
  if (!f.city.trim()) e.city = "Enter your city.";
  if (!f.state) e.state = "Choose your state.";
  return e;
}

export default function CheckoutForm() {
  const router = useRouter();
  const { cart, ready, coupon, totals, clearCart } = useStore();
  const [f, setF] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [method, setMethod] = useState<PaymentMethod>("online");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ orderId: string; razorpay: RazorpayInfo } | null>(null);

  const t = totals(method);
  const codAllowed = totals("cod").total <= COD_LIMIT;

  if (!ready) return <div className="co-loading" aria-busy="true" />;
  if (!cart.length && !pending) {
    return (
      <div className="empty">
        <h3>Your bag is empty</h3>
        <p>Add something you like, then come back to check out.</p>
        <Link className="btn primary" href="/">Browse the shop</Link>
      </div>
    );
  }

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let v = e.target.value;
    if (k === "phone" || k === "pincode") v = v.replace(/\D/g, "");
    setF((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "pincode" && v.length === 6) {
        const m = PINCODE_PREFIX[v.slice(0, 3)];
        if (m) {
          if (!prev.city) next.city = m[0];
          if (!prev.state) next.state = m[1];
        }
      }
      return next;
    });
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  function openRazorpay(orderId: string, rp: RazorpayInfo) {
    const checkout = new window.Razorpay({
      key: rp.keyId,
      order_id: rp.orderId,
      amount: rp.amount,
      currency: rp.currency,
      name: "Loom & Lapel",
      description: "Order payment",
      prefill: { name: f.name, email: f.email || undefined, contact: `+91${f.phone}` },
      theme: { color: "#2C3D9C" },
      handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        setBusy(true);
        const res = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, ...resp }),
        });
        if (res.ok) {
          clearCart();
          router.push(`/orders/${orderId}`);
        } else {
          const j = await res.json().catch(() => ({}));
          setBusy(false);
          setFormError(j.error ?? "We couldn't confirm your payment. If money left your account, it will reflect on your order shortly.");
        }
      },
      modal: {
        ondismiss: () => {
          setBusy(false);
          setPending({ orderId, razorpay: rp });
          setFormError("Payment wasn't completed. Your items are held for 30 minutes, so you can try again.");
        },
      },
    });
    checkout.on("payment.failed", (r: any) => {
      setFormError(r?.error?.description ? `Payment failed: ${r.error.description}` : "Payment failed. Try another method.");
    });
    checkout.open();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const errs = validate(f);
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      document.getElementById(`f-${first}`)?.focus();
      return;
    }
    setBusy(true);

    if (method === "online" && !(await loadRazorpay())) {
      setBusy(false);
      setFormError("Couldn't load the payment window. Check your connection or choose cash on delivery.");
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: f,
          items: cart.map((l) => ({ productId: l.productId, size: l.size, qty: l.qty })),
          couponCode: coupon?.code ?? null,
          paymentMethod: method,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setBusy(false);
        setFormError(json.error ?? "We couldn't place your order. Please try again.");
        return;
      }
      if (method === "cod") {
        clearCart();
        router.push(`/orders/${json.orderId}`);
        return;
      }
      openRazorpay(json.orderId, json.razorpay);
    } catch {
      setBusy(false);
      setFormError("Network error. Check your connection and try again.");
    }
  }

  const field = (k: keyof Fields, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, span2 = false) => (
    <div className={`field${span2 ? " span2" : ""}${errors[k] ? " invalid" : ""}`}>
      <label htmlFor={`f-${k}`}>{label}</label>
      <input id={`f-${k}`} value={f[k]} onChange={set(k)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `e-${k}` : undefined} {...props} />
      {errors[k] && <small id={`e-${k}`}>{errors[k]}</small>}
    </div>
  );

  return (
    <div className="co-grid">
      <form onSubmit={submit} noValidate className="co-form">
        <fieldset disabled={!!pending}>
          <legend>Delivery address</legend>
          <div className="fgrid">
            {field("name", "Full name", { autoComplete: "name" }, true)}
            <div className={`field${errors.phone ? " invalid" : ""}`}>
              <label htmlFor="f-phone">Mobile number</label>
              <div className="prefix">
                <span>+91</span>
                <input id="f-phone" inputMode="numeric" maxLength={10} autoComplete="tel-national" value={f.phone} onChange={set("phone")} aria-invalid={!!errors.phone} />
              </div>
              {errors.phone && <small>{errors.phone}</small>}
            </div>
            {field("email", "Email (optional)", { type: "email", autoComplete: "email" })}
            {field("addressLine1", "Flat, house no., building, street", { autoComplete: "address-line1" }, true)}
            {field("addressLine2", "Area or locality (optional)", { autoComplete: "address-line2" }, true)}
            {field("pincode", "Pincode", { inputMode: "numeric", maxLength: 6, autoComplete: "postal-code" })}
            {field("city", "City", { autoComplete: "address-level2" })}
            <div className={`field span2${errors.state ? " invalid" : ""}`}>
              <label htmlFor="f-state">State</label>
              <select id="f-state" value={f.state} onChange={set("state")} aria-invalid={!!errors.state}>
                <option value="">Choose state</option>
                {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
              {errors.state && <small>{errors.state}</small>}
            </div>
          </div>
        </fieldset>

        <fieldset disabled={!!pending}>
          <legend>Payment</legend>
          <div className="pay">
            <label className="payopt">
              <input type="radio" name="pay" value="online" checked={method === "online"} onChange={() => setMethod("online")} />
              <span><b>Pay online</b><small>UPI, cards, net banking and wallets through Razorpay</small></span>
            </label>
            <label className={`payopt${codAllowed ? "" : " off"}`}>
              <input type="radio" name="pay" value="cod" checked={method === "cod"} disabled={!codAllowed} onChange={() => setMethod("cod")} />
              <span>
                <b>Cash on delivery</b>
                <small>{codAllowed ? "₹49 handling fee, pay when it arrives" : `Available on orders up to ${formatINR(COD_LIMIT)}`}</small>
              </span>
            </label>
          </div>
        </fieldset>

        {formError && <p className="form-error" role="alert">{formError}</p>}

        {pending ? (
          <button type="button" className="btn primary lg" onClick={() => openRazorpay(pending.orderId, pending.razorpay)}>
            Retry payment · {formatINR(pending.razorpay.amount / 100)}
          </button>
        ) : (
          <button type="submit" className="btn primary lg" disabled={busy}>
            {busy ? "Placing order…" : `${method === "cod" ? "Place order" : "Pay"} · ${formatINR(t.total)}`}
          </button>
        )}
      </form>

      <aside className="co-sum" aria-label="Order summary">
        <h2>Order summary · {t.count} item{t.count === 1 ? "" : "s"}</h2>
        <ul className="mini">
          {cart.map((l) => (
            <li key={`${l.productId}-${l.size}`}>
              <ProductImage product={l.product} sizes="56px" />
              <div className="mini-text">
                <div>{l.product.name}</div>
                <div className="meta">Size {l.size} · Qty {l.qty}</div>
              </div>
              <span className="amt">{formatINR(l.product.price * l.qty)}</span>
            </li>
          ))}
        </ul>
        <OrderSummary t={t} couponCode={coupon?.code} />
      </aside>
    </div>
  );
}
