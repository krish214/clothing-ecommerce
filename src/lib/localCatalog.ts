import { createHash } from "crypto";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { isBottomwear, sizeRank } from "./catalog";
import type { Category, Pattern, Product, Shape } from "./types";

type SqlValue = string | number | boolean | null;

/** Stable ids so bag lines stay valid UUIDs while the store runs without Supabase. */
function localId(key: string): string {
  const hex = createHash("sha256").update(key).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function parseSqlRows(block: string): SqlValue[][] {
  const rows: SqlValue[][] = [];
  let i = 0;
  while (i < block.length) {
    while (i < block.length && /[\s,]/.test(block[i])) i++;
    if (i >= block.length || block[i] !== "(") break;
    i++;
    const row: SqlValue[] = [];
    while (i < block.length && block[i] !== ")") {
      while (i < block.length && /[\s,]/.test(block[i])) i++;
      if (block[i] === ")") break;
      if (block[i] === "'") {
        i++;
        let value = "";
        while (i < block.length) {
          if (block[i] === "'" && block[i + 1] === "'") {
            value += "'";
            i += 2;
          } else if (block[i] === "'") {
            i++;
            break;
          } else {
            value += block[i++];
          }
        }
        row.push(value);
      } else {
        let token = "";
        while (i < block.length && block[i] !== "," && block[i] !== ")") token += block[i++];
        token = token.trim();
        if (token === "null") row.push(null);
        else if (token === "true") row.push(true);
        else if (token === "false") row.push(false);
        else row.push(Number(token));
      }
    }
    if (block[i] === ")") i++;
    rows.push(row);
  }
  return rows;
}

let cache: Product[] | null = null;

const ADDED_PATH = join(process.cwd(), "data", "added-products.json");

function readAdded(): Product[] {
  try {
    const parsed = JSON.parse(readFileSync(ADDED_PATH, "utf8")) as Product[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function seedProducts(): Product[] {
  if (cache) return cache;
  const sql = readFileSync(join(process.cwd(), "supabase/seed.sql"), "utf8");
  const productBlock = sql.match(/insert into public\.products[\s\S]*?values\s*([\s\S]*?);/)?.[1];
  const soldBlock = sql.match(/with sold_out\(slug, size\) as \(values\s*([\s\S]*?)\n\)/)?.[1];
  if (!productBlock) throw new Error("Could not read the sample catalogue from supabase/seed.sql");

  const soldOut = new Set(
    (soldBlock ? parseSqlRows(soldBlock) : []).map((row) => `${row[0]}|${row[1]}`),
  );

  cache = parseSqlRows(productBlock).map((row) => {
    const slug = String(row[0]);
    const category = row[2] as Category;
    const sizes = isBottomwear(category) ? ["30", "32", "34", "36", "38"] : ["S", "M", "L", "XL", "XXL"];
    return {
      id: localId(slug),
      slug,
      name: String(row[1]),
      category,
      description: String(row[3]),
      fit: String(row[4]),
      fabric: String(row[5]),
      weight: String(row[6]),
      care: String(row[7]),
      colorName: String(row[8]),
      colorHex: String(row[9]),
      shape: row[10] as Shape,
      pattern: row[11] as Pattern,
      patternHex: row[12] == null ? null : String(row[12]),
      collar: row[13] === "mandarin" ? "mandarin" : null,
      trim: row[14] === true,
      drawstring: row[15] === true,
      price: Number(row[16]),
      mrp: Number(row[17]),
      rating: Number(row[18]),
      reviewCount: Number(row[19]),
      tag: row[20] == null ? null : String(row[20]),
      imageUrl: null,
      variants: sizes
        .map((size) => ({
          id: localId(`${slug}:${size}`),
          size,
          sku: `${slug.toUpperCase()}-${size}`,
          stock: soldOut.has(`${slug}|${size}`) ? 0 : 25,
        }))
        .sort((a, b) => sizeRank(a.size) - sizeRank(b.size)),
    };
  });
  return cache;
}

/** Sample catalogue plus any pieces saved from /admin while Supabase is not configured. */
export function localProducts(): Product[] {
  const added = readAdded();
  const taken = new Set(added.map((product) => product.slug));
  return [...added, ...seedProducts().filter((product) => !taken.has(product.slug))];
}

export function saveLocalProduct(product: Product) {
  const taken = new Set(localProducts().map((item) => item.slug));
  if (taken.has(product.slug)) throw new Error("A piece with this name is already in the shop.");
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(ADDED_PATH, JSON.stringify([product, ...readAdded()], null, 2));
}

export const LOCAL_COUPONS = [
  { code: "FIRST10", kind: "percent" as const, value: 10, maxDiscount: 500, minSubtotal: 0 },
  { code: "SAVE300", kind: "flat" as const, value: 300, maxDiscount: null, minSubtotal: 2999 },
];
