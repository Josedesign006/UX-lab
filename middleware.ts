import { NextRequest, NextResponse } from "next/server";

/**
 * Gate researcher pages behind a session cookie. Real authorization happens
 * in the API routes (this only handles UX redirects). Participant links
 * (/p/*) and the API stay out of the matcher so respondents never log in.
 */
export function middleware(req: NextRequest) {
  const token = req.cookies.get("uxlab_session")?.value;
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/studies/:path*"],
};
