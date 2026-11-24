import type { Category, Pattern, Shape } from "./types";

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "shirts", label: "Shirts" },
  { id: "polos", label: "Polos & Tees" },
  { id: "trousers", label: "Trousers" },
  { id: "denim", label: "Denim" },
  { id: "blazers", label: "Blazers" },
  { id: "ethnic", label: "Ethnic wear" },
];

export const TOP_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export const BOTTOM_SIZES = ["30", "32", "34", "36", "38"] as const;
export const FITS = ["Slim", "Regular", "Relaxed", "Tapered", "Straight", "Boxy"] as const;
export const MAX_PRICE = 6500;

export const SHAPES: { id: Shape; label: string }[] = [
  { id: "shirt", label: "Shirt" },
  { id: "polo", label: "Polo" },
  { id: "tee", label: "T-shirt" },
  { id: "henley", label: "Henley" },
  { id: "trouser", label: "Trousers" },
  { id: "jeans", label: "Jeans" },
  { id: "blazer", label: "Blazer" },
  { id: "bandh", label: "Bandhgala" },
  { id: "kurta", label: "Kurta" },
];

export const PATTERNS: { id: Pattern; label: string }[] = [
  { id: "solid", label: "Solid" },
  { id: "stripe", label: "Pinstripe" },
  { id: "hstripe", label: "Horizontal stripe" },
  { id: "check", label: "Check" },
  { id: "denim", label: "Denim weave" },
];

export const TAGS = ["New", "Bestseller", "Festive"] as const;

/** Cut used for the drawn garment when a category is picked in admin. */
export const SHAPE_FOR: Record<Category, Shape> = {
  shirts: "shirt",
  polos: "polo",
  trousers: "trouser",
  denim: "jeans",
  blazers: "blazer",
  ethnic: "kurta",
};

export const patternNeedsSecondColor = (pattern: Pattern) => pattern === "stripe" || pattern === "hstripe" || pattern === "check";

export const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
export const isCategory = (id: string | undefined): id is Category => CATEGORIES.some((c) => c.id === id);
export const isBottomwear = (cat: Category) => cat === "trousers" || cat === "denim";

const SIZE_ORDER = [...TOP_SIZES, ...BOTTOM_SIZES] as string[];
export const sizeRank = (s: string) => {
  const i = SIZE_ORDER.indexOf(s);
  return i === -1 ? 99 : i;
};

export const SIZE_GUIDE = {
  tops: {
    head: ["Size", "Chest", "Length", "Shoulder"],
    rows: [
      ["S", 38, 28, 17],
      ["M", 40, 29, 17.5],
      ["L", 42, 30, 18],
      ["XL", 44, 31, 18.5],
      ["XXL", 46, 31.5, 19],
    ],
    note: "Garment measurements in inches. Polos and tees run 1 in shorter.",
  },
  bottoms: {
    head: ["Waist size", "Waist", "Hip", "Inseam"],
    rows: [
      ["30", 30, 38, 31],
      ["32", 32, 40, 31.5],
      ["34", 34, 42, 32],
      ["36", 36, 44, 32],
      ["38", 38, 46, 32],
    ],
    note: "Body measurements in inches. Free hemming on request.",
  },
} as const;
