/**
 * Minimal Shiprocket client: logs in, caches the token, and creates an order + shipment.
 * Docs: https://apidocs.shiprocket.in
 * Leave SHIPROCKET_EMAIL empty to turn this off (orders still save; ship them manually).
 */
const BASE = "https://apiv2.shiprocket.in/v1/external";

let token: { value: string; expires: number } | null = null;

export const shiprocketEnabled = () => Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);

async function getToken(): Promise<string> {
  if (token && token.expires > Date.now()) return token.value;
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.SHIPROCKET_EMAIL, password: process.env.SHIPROCKET_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Shiprocket login failed (${res.status})`);
  const json = (await res.json()) as { token: string };
  // Tokens last 10 days; refresh a day early.
  token = { value: json.token, expires: Date.now() + 9 * 24 * 60 * 60 * 1000 };
  return token.value;
}

export interface ShipOrder {
  orderNo: string;
  createdAt: string;
  paymentMethod: "online" | "cod";
  customerName: string;
  phone: string;
  email: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  couponDiscount: number;
  shippingFee: number;
  codFee: number;
  total: number;
  items: { name: string; sku: string; qty: number; unitPrice: number }[];
}

function shiprocketDate(iso: string) {
  // "YYYY-MM-DD HH:mm" in IST
  const d = new Date(new Date(iso).getTime() + 5.5 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

export async function createShipment(o: ShipOrder): Promise<{ orderId: string; shipmentId: string }> {
  const [first, ...rest] = o.customerName.trim().split(/\s+/);
  const units = o.items.reduce((n, i) => n + i.qty, 0);
  const body = {
    order_id: o.orderNo,
    order_date: shiprocketDate(o.createdAt),
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
    billing_customer_name: first,
    billing_last_name: rest.join(" "),
    billing_address: o.addressLine1,
    billing_address_2: o.addressLine2 ?? "",
    billing_city: o.city,
    billing_pincode: o.pincode,
    billing_state: o.state,
    billing_country: "India",
    billing_email: o.email ?? "",
    billing_phone: o.phone,
    shipping_is_billing: true,
    order_items: o.items.map((i) => ({ name: i.name, sku: i.sku, units: i.qty, selling_price: i.unitPrice })),
    payment_method: o.paymentMethod === "cod" ? "COD" : "Prepaid",
    shipping_charges: o.shippingFee,
    transaction_charges: o.codFee,
    total_discount: o.couponDiscount,
    sub_total: o.subtotal,
    // Folded garments: a rough parcel size per unit. Adjust to your packaging.
    length: 30,
    breadth: 25,
    height: Math.min(30, 4 * units),
    weight: Math.max(0.5, 0.45 * units),
  };

  const res = await fetch(`${BASE}/orders/create/adhoc`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { order_id?: number; shipment_id?: number; message?: string };
  if (!res.ok || !json.order_id) throw new Error(`Shiprocket order failed: ${json.message ?? res.status}`);
  return { orderId: String(json.order_id), shipmentId: String(json.shipment_id ?? "") };
}
