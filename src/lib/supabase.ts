import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`);
  return v;
}

/** True when .env.local has a real project URL and anon key, not the placeholders from .env.example. */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) return false;
  if (url.includes("your-project.supabase.co") || key === "your-anon-key") return false;
  return true;
}

/** True when the service-role key can write products, coupons and orders. */
export function isSupabaseAdminConfigured(): boolean {
  if (!isSupabaseConfigured()) return false;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return key.length > 20 && key !== "your-service-role-key";
}

let publicClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

/** Anon-key client. Row level security limits it to the active catalogue. */
export function supabasePublic(): SupabaseClient {
  publicClient ??= createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    auth: { persistSession: false },
  });
  return publicClient;
}

/** Service-role client. Server code only: orders, coupons and stock. */
export function supabaseAdmin(): SupabaseClient {
  if (typeof window !== "undefined") throw new Error("supabaseAdmin() must not run in the browser");
  adminClient ??= createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
  return adminClient;
}
