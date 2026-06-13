import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createPasswordReset, getUserByEmail } from "@/lib/db";
import { isEmailConfigured, passwordResetEmail, sendEmail } from "@/lib/email";
import { appOrigin } from "@/lib/oauth";

export const dynamic = "force-dynamic";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Password reset isn't available on this instance." },
      { status: 503 }
    );
  }
  const { email } = await req.json();

  // Always return the same response whether or not the email exists — no
  // account enumeration. The email is only sent when a matching user is found.
  if (email && /.+@.+\..+/.test(email)) {
    const user = await getUserByEmail(email);
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      await createPasswordReset({
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + RESET_TTL_MS).toISOString(),
      });
      const resetUrl = `${appOrigin(req)}/reset?token=${token}`;
      const { subject, html } = passwordResetEmail(resetUrl);
      await sendEmail({ to: user.email, subject, html });
    }
  }

  return NextResponse.json({
    ok: true,
    message: "If that email has an account, a reset link is on its way.",
  });
}
