import { NextResponse } from "next/server";
import { z } from "zod";
import { loadCoupon } from "@/lib/coupons";

const Body = z.object({ code: z.string().trim().min(1).max(32) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a coupon code." }, { status: 400 });

  const coupon = await loadCoupon(parsed.data.code);
  if (!coupon) {
    return NextResponse.json(
      { error: `${parsed.data.code.toUpperCase()} isn't a valid code. Check the spelling and try again.` },
      { status: 404 },
    );
  }
  return NextResponse.json({ coupon });
}
