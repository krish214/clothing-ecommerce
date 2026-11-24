import { randomUUID } from "crypto";
import { z } from "zod";
import { BOTTOM_SIZES, FITS, isBottomwear, patternNeedsSecondColor, TOP_SIZES } from "./catalog";
import { saveLocalProduct } from "./localCatalog";
import { getProducts } from "./products";
import { isSupabaseAdminConfigured, supabaseAdmin } from "./supabase";
import type { Category, Pattern, Product, Shape } from "./types";

const SHAPES = ["shirt", "polo", "tee", "henley", "trouser", "jeans", "blazer", "bandh", "kurta"] as const;
const PATTERNS = ["solid", "stripe", "hstripe", "check", "denim"] as const;
const CATEGORIES = ["shirts", "polos", "trousers", "denim", "blazers", "ethnic"] as const;

export const ProductDraft = z
  .object({
    name: z.string().trim().min(2).max(80),
    category: z.enum(CATEGORIES),
    description: z.string().trim().min(10).max(600),
    fit: z.enum(FITS),
    fabric: z.string().trim().min(2).max(80),
    weight: z.string().trim().max(40).default(""),
    care: z.string().trim().max(80).default(""),
    colorName: z.string().trim().min(2).max(40),
    colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Pick a colour"),
    shape: z.enum(SHAPES),
    pattern: z.enum(PATTERNS),
    patternHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
    collar: z.boolean().default(false),
    trim: z.boolean().default(false),
    drawstring: z.boolean().default(false),
    price: z.number().int().min(1).max(100000),
    mrp: z.number().int().min(1).max(200000),
    tag: z.string().trim().max(24).nullable().optional(),
    stock: z.number().int().min(0).max(999).default(25),
  })
  .refine((draft) => draft.mrp >= draft.price, { message: "MRP has to be at least the selling price", path: ["mrp"] })
  .refine((draft) => !patternNeedsSecondColor(draft.pattern) || Boolean(draft.patternHex), {
    message: "Pick a second colour for the stripe or check",
    path: ["patternHex"],
  });

export type ProductDraftInput = z.infer<typeof ProductDraft>;

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildProduct(draft: ProductDraftInput, id: string): Product {
  const slug = slugify(draft.name);
  const sizes = isBottomwear(draft.category) ? [...BOTTOM_SIZES] : [...TOP_SIZES];
  return {
    id,
    slug,
    name: draft.name,
    category: draft.category as Category,
    description: draft.description,
    fit: draft.fit,
    fabric: draft.fabric,
    weight: draft.weight,
    care: draft.care,
    colorName: draft.colorName,
    colorHex: draft.colorHex,
    shape: draft.shape as Shape,
    pattern: draft.pattern as Pattern,
    patternHex: patternNeedsSecondColor(draft.pattern) ? draft.patternHex ?? null : null,
    collar: draft.collar ? "mandarin" : null,
    trim: draft.trim,
    drawstring: draft.drawstring,
    price: draft.price,
    mrp: draft.mrp,
    rating: 0,
    reviewCount: 0,
    tag: draft.tag?.trim() ? draft.tag.trim() : null,
    imageUrl: null,
    variants: sizes.map((size) => ({
      id: randomUUID(),
      size,
      sku: `${slug.toUpperCase()}-${size}`,
      stock: draft.stock,
    })),
  };
}

export async function createProduct(draft: ProductDraftInput): Promise<Product> {
  const slug = slugify(draft.name);
  if (!slug) throw new Error("Give the piece a name with letters or numbers.");

  const existing = await getProducts();
  if (existing.some((product) => product.slug === slug)) {
    throw new Error("A piece with this name is already in the shop.");
  }

  if (!isSupabaseAdminConfigured()) {
    const product = buildProduct(draft, randomUUID());
    saveLocalProduct(product);
    return product;
  }

  const product = buildProduct(draft, randomUUID());
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("products")
    .insert({
      slug: product.slug,
      name: product.name,
      category: product.category,
      description: product.description,
      fit: product.fit,
      fabric: product.fabric,
      weight: product.weight,
      care: product.care,
      color_name: product.colorName,
      color_hex: product.colorHex,
      shape: product.shape,
      pattern: product.pattern,
      pattern_hex: product.patternHex,
      collar: product.collar,
      trim: product.trim,
      drawstring: product.drawstring,
      price: product.price,
      mrp: product.mrp,
      rating: 0,
      review_count: 0,
      tag: product.tag,
      image_url: null,
      is_active: true,
      sort_order: 0,
    })
    .select("id")
    .single();
  if (error || !data) {
    if (error?.code === "23505") throw new Error("A piece with this name is already in the shop.");
    throw new Error("Could not save this piece. Check the colour, price and sizes.");
  }

  const { error: variantError } = await db.from("product_variants").insert(
    product.variants.map((variant) => ({
      product_id: data.id,
      size: variant.size,
      sku: variant.sku,
      stock: variant.stock,
    })),
  );
  if (variantError) {
    await db.from("products").delete().eq("id", data.id);
    throw new Error("Could not save sizes for this piece.");
  }

  return { ...product, id: data.id };
}
