import { NextRequest } from "next/server";

/**
 * Google OAuth 2.0 — implemented with plain fetch so the project keeps zero
 * extra dependencies. Activates only when GOOGLE_CLIENT_ID and
 * GOOGLE_CLIENT_SECRET are set; otherwise the button is hidden and the route
 * returns 404, so self-hosters need no Google setup.
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export function isGoogleConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

/** Public base URL of this deployment, used to build the OAuth redirect URI. */
export function appOrigin(req: NextRequest): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) return `${proto}://${host}`;
  return req.nextUrl.origin;
}

export function googleRedirectUri(req: NextRequest): string {
  return `${appOrigin(req)}/api/auth/google/callback`;
}

export function googleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email",
    state,
    prompt: "select_account",
    access_type: "online",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** Exchange the auth code for the verified Google account (email + stable id). */
export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<{ email: string; sub: string } | null> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return null;
  const { id_token } = (await tokenRes.json()) as { id_token?: string };
  if (!id_token) return null;

  // The id_token is a JWT signed by Google; we just received it over TLS
  // directly from Google's token endpoint, so decoding the payload is safe.
  const payload = JSON.parse(
    Buffer.from(id_token.split(".")[1], "base64url").toString("utf-8")
  ) as { email?: string; email_verified?: boolean; sub?: string };

  if (!payload.email || !payload.sub) return null;
  return { email: payload.email.toLowerCase(), sub: payload.sub };
}
