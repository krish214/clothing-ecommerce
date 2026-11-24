import { LOCAL_COUPONS } from "./localCatalog";
import { isSupabaseConfigured, supabaseAdmin } from "./supabase";
import type { Coupon } from "./types";

export async function loadCoupon(rawCode: string): Promise<Coupon | null> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;
  if (!isSupabaseConfigured()) return LOCAL_COUPONS.find((coupon) => coupon.code === code) ?? null;
  const { data } = await supabaseAdmin()
    .from("coupons")
    .select("code, kind, value, max_discount, min_subtotal, expires_at")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  return { code: data.code, kind: data.kind, value: data.value, maxDiscount: data.max_discount, minSubtotal: data.min_subtotal };
}
