import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { createProduct, ProductDraft } from "@/lib/createProduct";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Sign in to add clothes." }, { status: 401 });
  const parsed = ProductDraft.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Some details are missing.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  try {
    const product = await createProduct(parsed.data);
    return NextResponse.json({ slug: product.slug, name: product.name });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save this piece.";
    const status = message.includes("already") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
