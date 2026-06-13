import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  hashPassword,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import {
  deletePasswordReset,
  getPasswordReset,
  getUserById,
  setUserPassword,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token) {
    return NextResponse.json({ error: "Missing reset token." }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }
  const reset = await getPasswordReset(token);
  if (!reset) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 }
    );
  }
  const user = await getUserById(reset.userId);
  if (!user) {
    await deletePasswordReset(token);
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 }
    );
  }

  await setUserPassword(user.id, hashPassword(password));
  await deletePasswordReset(token); // single-use

  // Log the user straight in after a successful reset.
  const session = await createSession(user.id);
  const res = NextResponse.json({ ok: true, email: user.email });
  res.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions());
  return res;
}
