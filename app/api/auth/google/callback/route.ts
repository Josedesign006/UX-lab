import { NextRequest, NextResponse } from "next/server";
import {
  appOrigin,
  exchangeGoogleCode,
  googleRedirectUri,
  isGoogleConfigured,
} from "@/lib/oauth";
import {
  createSession,
  newUserId,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import {
  createUser,
  getUserByEmail,
  getUserByGoogleId,
  setUserGoogleId,
} from "@/lib/db";

export const dynamic = "force-dynamic";

function fail(req: NextRequest, reason: string) {
  const url = new URL("/login", appOrigin(req));
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  if (!isGoogleConfigured()) return fail(req, "google_disabled");

  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const cookieState = req.cookies.get("g_state")?.value;
  const next = req.cookies.get("g_next")?.value || "/";

  if (params.get("error") || !code) return fail(req, "google_cancelled");
  if (!state || !cookieState || state !== cookieState)
    return fail(req, "google_state");

  const account = await exchangeGoogleCode(code, googleRedirectUri(req));
  if (!account) return fail(req, "google_exchange");

  // Find existing user by Google id, else by email (link accounts), else create.
  let user = await getUserByGoogleId(account.sub);
  if (!user) {
    const byEmail = await getUserByEmail(account.email);
    if (byEmail) {
      await setUserGoogleId(byEmail.id, account.sub);
      user = byEmail;
    } else {
      user = await createUser({
        id: newUserId(),
        email: account.email,
        passwordHash: "", // Google-only account, no password
        googleId: account.sub,
        createdAt: new Date().toISOString(),
      });
    }
  }

  const session = await createSession(user.id);
  const res = NextResponse.redirect(new URL(next, appOrigin(req)));
  res.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions());
  res.cookies.set("g_state", "", { path: "/", maxAge: 0 });
  res.cookies.set("g_next", "", { path: "/", maxAge: 0 });
  return res;
}
