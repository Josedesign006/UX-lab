import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  googleAuthUrl,
  googleRedirectUri,
  isGoogleConfigured,
} from "@/lib/oauth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isGoogleConfigured()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const state = crypto.randomBytes(16).toString("hex");
  const next = req.nextUrl.searchParams.get("next") || "/";

  const res = NextResponse.redirect(
    googleAuthUrl(googleRedirectUri(req), state)
  );
  // short-lived, httpOnly — verified against the `state` returned by Google
  const opts = {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  };
  res.cookies.set("g_state", state, opts);
  res.cookies.set("g_next", next, opts);
  return res;
}
