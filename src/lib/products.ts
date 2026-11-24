import { sizeRank } from "./catalog";
import { localProducts } from "./localCatalog";
import { isSupabaseConfigured, supabasePublic } from "./supabase";
import type { Product } from "./types";

const SELECT = "*, product_variants(id, size, sku, stock)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export function mapProduct(r: Row): Product {
  const variants = ((r.product_variants ?? []) as Row[])
    .map((v) => ({ id: v.id, size: v.size, sku: v.sku, stock: v.stock }))
    .sort((a, b) => sizeRank(a.size) - sizeRank(b.size));
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    description: r.description,
    fit: r.fit,
    fabric: r.fabric,
    weight: r.weight,
    care: r.care,
    colorName: r.color_name,
    colorHex: r.color_hex,
    shape: r.shape,
    pattern: r.pattern,
    patternHex: r.pattern_hex,
    collar: r.collar,
    trim: r.trim,
    drawstring: r.drawstring,
    price: r.price,
    mrp: r.mrp,
    rating: Number(r.rating),
    reviewCount: r.review_count,
    tag: r.tag,
    imageUrl: r.image_url,
    variants,
  };
}

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return localProducts();
  const { data, error } = await supabasePublic()
    .from("products")
    .select(SELECT)
    .eq("is_active", true)
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load products: ${error.message}`);
  return (data ?? []).map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return localProducts().find((p) => p.slug === slug) ?? null;
  const { data, error } = await supabasePublic()
    .from("products")
    .select(SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(`Could not load product: ${error.message}`);
  return data ? mapProduct(data) : null;
}

export async function getRelated(p: Product, limit = 4): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return localProducts()
      .filter((item) => item.category === p.category && item.id !== p.id)
      .slice(0, limit);
  }
  const { data, error } = await supabasePublic()
    .from("products")
    .select(SELECT)
    .eq("is_active", true)
    .eq("category", p.category)
    .neq("id", p.id)
    .order("sort_order")
    .limit(limit);
  if (error) return [];
  return (data ?? []).map(mapProduct);
}
