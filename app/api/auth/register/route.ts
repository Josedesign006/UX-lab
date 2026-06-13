import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  hashPassword,
  newUserId,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { createUser, getUserByEmail } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !/.+@.+\..+/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }
  if (await getUserByEmail(email)) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }
  const user = await createUser({
    id: newUserId(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  });
  const session = await createSession(user.id);
  const res = NextResponse.json({ ok: true, email: user.email });
  res.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions());
  return res;
}
