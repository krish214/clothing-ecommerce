"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { computeTotals, MAX_QTY_PER_LINE, type Totals } from "@/lib/pricing";
import type { CartLine, Coupon, PaymentMethod, ProductSummary } from "@/lib/types";

interface Toast {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
}

interface Store {
  ready: boolean;
  cart: CartLine[];
  wishlist: string[];
  coupon: Coupon | null;
  totals: (method?: PaymentMethod | null) => Totals;
  addToCart: (product: ProductSummary, size: string, qty: number) => void;
  setQty: (productId: string, size: string, qty: number) => void;
  removeLine: (productId: string, size: string) => void;
  clearCart: () => void;
  toggleWish: (productId: string) => boolean;
  setCoupon: (c: Coupon | null) => void;
  bagOpen: boolean;
  openBag: () => void;
  closeBag: () => void;
  toast: Toast | null;
  showToast: (message: string, action?: Toast["action"]) => void;
}

const StoreContext = createContext<Store | null>(null);

const KEYS = { cart: "ll-cart-v1", wish: "ll-wish-v1", coupon: "ll-coupon-v1" };

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: the bag still works for this visit */
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [coupon, setCouponState] = useState<Coupon | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved bag after hydration so server and client render the same first frame.
  useEffect(() => {
    setCart(read<CartLine[]>(KEYS.cart, []));
    setWishlist(read<string[]>(KEYS.wish, []));
    setCouponState(read<Coupon | null>(KEYS.coupon, null));
    setReady(true);
  }, []);
  useEffect(() => { if (ready) write(KEYS.cart, cart); }, [cart, ready]);
  useEffect(() => { if (ready) write(KEYS.wish, wishlist); }, [wishlist, ready]);
  useEffect(() => { if (ready) write(KEYS.coupon, coupon); }, [coupon, ready]);

  const showToast = useCallback((message: string, action?: Toast["action"]) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, action });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const addToCart = useCallback((product: ProductSummary, size: string, qty: number) => {
    setCart((prev) => {
      const i = prev.findIndex((l) => l.productId === product.id && l.size === size);
      if (i === -1) return [...prev, { productId: product.id, size, qty, product }];
      const next = [...prev];
      next[i] = { ...next[i], product, qty: Math.min(MAX_QTY_PER_LINE, next[i].qty + qty) };
      return next;
    });
  }, []);

  const setQty = useCallback((productId: string, size: string, qty: number) => {
    setCart((prev) =>
      qty < 1
        ? prev.filter((l) => !(l.productId === productId && l.size === size))
        : prev.map((l) => (l.productId === productId && l.size === size ? { ...l, qty: Math.min(MAX_QTY_PER_LINE, qty) } : l)),
    );
  }, []);

  const removeLine = useCallback((productId: string, size: string) => setQty(productId, size, 0), [setQty]);
  const clearCart = useCallback(() => { setCart([]); setCouponState(null); }, []);

  const toggleWish = useCallback(
    (productId: string) => {
      const on = !wishlist.includes(productId);
      setWishlist((prev) => (on ? [...prev.filter((id) => id !== productId), productId] : prev.filter((id) => id !== productId)));
      return on;
    },
    [wishlist],
  );

  const totals = useCallback(
    (method: PaymentMethod | null = null) =>
      computeTotals(cart.map((l) => ({ price: l.product.price, mrp: l.product.mrp, qty: l.qty })), coupon, method),
    [cart, coupon],
  );

  const value = useMemo<Store>(
    () => ({
      ready, cart, wishlist, coupon, totals, addToCart, setQty, removeLine, clearCart, toggleWish,
      setCoupon: setCouponState,
      bagOpen, openBag: () => setBagOpen(true), closeBag: () => setBagOpen(false),
      toast, showToast,
    }),
    [ready, cart, wishlist, coupon, totals, addToCart, setQty, removeLine, clearCart, toggleWish, bagOpen, toast, showToast],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
