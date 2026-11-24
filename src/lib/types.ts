export type Category = "shirts" | "polos" | "trousers" | "denim" | "blazers" | "ethnic";
export type Shape = "shirt" | "polo" | "tee" | "henley" | "trouser" | "jeans" | "blazer" | "bandh" | "kurta";
export type Pattern = "solid" | "stripe" | "hstripe" | "check" | "denim";
export type PaymentMethod = "online" | "cod";

export interface Variant {
  id: string;
  size: string;
  sku: string;
  stock: number;
}

/** Fields the garment illustration needs. */
export interface GarmentLook {
  colorHex: string;
  shape: Shape;
  pattern: Pattern;
  patternHex: string | null;
  collar: "mandarin" | null;
  trim: boolean;
  drawstring: boolean;
}

export interface Product extends GarmentLook {
  id: string;
  slug: string;
  name: string;
  category: Category;
  description: string;
  fit: string;
  fabric: string;
  weight: string;
  care: string;
  colorName: string;
  price: number;
  mrp: number;
  rating: number;
  reviewCount: number;
  tag: string | null;
  imageUrl: string | null;
  variants: Variant[];
}

/** The slice of a product kept in the bag (localStorage). Prices are re-checked on the server. */
export type ProductSummary = Pick<
  Product,
  "id" | "slug" | "name" | "category" | "colorName" | "price" | "mrp" | "imageUrl" | keyof GarmentLook
>;

export interface CartLine {
  productId: string;
  size: string;
  qty: number;
  product: ProductSummary;
}

export interface Coupon {
  code: string;
  kind: "percent" | "flat";
  value: number;
  maxDiscount: number | null;
  minSubtotal: number;
}

export interface CheckoutCustomer {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}
