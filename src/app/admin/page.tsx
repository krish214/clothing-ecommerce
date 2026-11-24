import type { Metadata } from "next";
import AdminLogin from "@/components/AdminLogin";
import AdminStudio from "@/components/AdminStudio";
import { adminPasswordIsDefault, isAdmin } from "@/lib/adminAuth";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Add clothes",
  robots: { index: false, follow: false },
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ added?: string }> }) {
  if (!(await isAdmin())) return <AdminLogin showDefault={adminPasswordIsDefault()} />;
  const { added } = await searchParams;
  const products = await getProducts();
  return <AdminStudio products={products} addedSlug={added} />;
}
