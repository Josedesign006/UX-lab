/**
 * Transactional email via Resend's HTTP API (no SDK — keeps deps minimal).
 * Activates only when RESEND_API_KEY is set; otherwise password-reset emails
 * are skipped and the feature is reported as unavailable.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Resend lets you send from onboarding@resend.dev without a verified domain
// (to your own account email). Set RESEND_FROM to a verified-domain sender
// to deliver to anyone.
const RESEND_FROM = process.env.RESEND_FROM ?? "UXLab <onboarding@resend.dev>";

export function isEmailConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  });
  return res.ok;
}

export function passwordResetEmail(resetUrl: string): {
  subject: string;
  html: string;
} {
  return {
    subject: "Reset your UXLab password",
    html: `
      <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#101010">
        <h2 style="font-size:20px;margin:0 0 12px">Reset your password</h2>
        <p style="color:#555;line-height:1.6;margin:0 0 24px">
          We received a request to reset your UXLab password. This link expires
          in 1 hour. If you didn't ask for this, you can ignore this email.
        </p>
        <a href="${resetUrl}" style="display:inline-block;background:#101010;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600">
          Reset password
        </a>
        <p style="color:#999;font-size:12px;line-height:1.6;margin:24px 0 0">
          Or paste this link into your browser:<br>${resetUrl}
        </p>
      </div>
    `,
  };
}
