import type { Product, ProductSummary } from "./types";

/** Snapshot of a product kept in the bag. Safe to import in client components. */
export function toSummary(p: Product): ProductSummary {
  const { id, slug, name, category, colorName, price, mrp, imageUrl, colorHex, shape, pattern, patternHex, collar, trim, drawstring } = p;
  return { id, slug, name, category, colorName, price, mrp, imageUrl, colorHex, shape, pattern, patternHex, collar, trim, drawstring };
}
