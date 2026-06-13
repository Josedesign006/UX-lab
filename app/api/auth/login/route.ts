import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { getUserByEmail } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const user = email ? await getUserByEmail(email) : undefined;
  // identical error for unknown email vs wrong password — no account enumeration
  if (!user || !verifyPassword(password ?? "", user.passwordHash)) {
    return NextResponse.json(
      { error: "Incorrect email or password." },
      { status: 401 }
    );
  }
  const session = await createSession(user.id);
  const res = NextResponse.json({ ok: true, email: user.email });
  res.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions());
  return res;
}
