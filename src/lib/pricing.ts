import type { Coupon, PaymentMethod } from "./types";

export const FREE_SHIPPING_THRESHOLD = 1499;
export const SHIPPING_FEE = 99;
export const COD_FEE = 49;
export const COD_LIMIT = 10000;
export const MAX_QTY_PER_LINE = 10;

export interface PricedLine {
  price: number;
  mrp: number;
  qty: number;
}

export interface Totals {
  count: number;
  mrpTotal: number;
  subtotal: number;
  couponDiscount: number;
  couponNote: string | null;
  shippingFee: number;
  codFee: number;
  total: number;
  /** How much more the shopper must add for free shipping (0 when already free). */
  toFreeShipping: number;
  savings: number;
}

export function couponDiscount(coupon: Coupon | null, subtotal: number): { amount: number; note: string | null } {
  if (!coupon) return { amount: 0, note: null };
  if (subtotal < coupon.minSubtotal) {
    return { amount: 0, note: `Add ₹${(coupon.minSubtotal - subtotal).toLocaleString("en-IN")} more to use ${coupon.code}` };
  }
  let amount = coupon.kind === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount != null) amount = Math.min(amount, coupon.maxDiscount);
  return { amount: Math.min(amount, subtotal), note: null };
}

/**
 * Single source of truth for order maths. The browser uses it to show the bag;
 * the orders API runs it again with prices from the database before charging.
 */
export function computeTotals(lines: PricedLine[], coupon: Coupon | null, method: PaymentMethod | null): Totals {
  let count = 0;
  let mrpTotal = 0;
  let subtotal = 0;
  for (const l of lines) {
    count += l.qty;
    mrpTotal += l.mrp * l.qty;
    subtotal += l.price * l.qty;
  }
  const { amount, note } = couponDiscount(coupon, subtotal);
  const afterCoupon = subtotal - amount;
  const shippingFee = count === 0 || afterCoupon >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const codFee = method === "cod" && count > 0 ? COD_FEE : 0;
  return {
    count,
    mrpTotal,
    subtotal,
    couponDiscount: amount,
    couponNote: note,
    shippingFee,
    codFee,
    total: afterCoupon + shippingFee + codFee,
    toFreeShipping: count === 0 ? FREE_SHIPPING_THRESHOLD : Math.max(0, FREE_SHIPPING_THRESHOLD - afterCoupon),
    savings: mrpTotal - subtotal + amount,
  };
}
