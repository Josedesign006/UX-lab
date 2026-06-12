import { NextResponse } from "next/server";
import { logout, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  logout();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
