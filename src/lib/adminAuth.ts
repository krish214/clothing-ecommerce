import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "ll_admin";
const WEEK = 60 * 60 * 24 * 7;

/** Local default so /admin works before ADMIN_PASSWORD is set. */
export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() || "loom-admin";
}

export function adminPasswordIsDefault(): boolean {
  return !process.env.ADMIN_PASSWORD?.trim();
}

function sign(payload: string): string {
  return createHmac("sha256", adminPassword()).update(payload).digest("hex");
}

export function adminToken(): string {
  const payload = `admin.${Date.now() + WEEK * 1000}`;
  return `${payload}.${sign(payload)}`;
}

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, exp, sig] = parts;
  if (role !== "admin" || !exp || !sig || Number(exp) < Date.now()) return false;
  const expected = sign(`${role}.${exp}`);
  if (expected.length !== sig.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

export const adminCookie = {
  name: COOKIE,
  options: { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: WEEK },
};
