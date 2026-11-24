import type { Metadata } from "next";
import Link from "next/link";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="wrap co">
      <Link href="/" className="back">← Continue shopping</Link>
      <h1 className="h1">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
