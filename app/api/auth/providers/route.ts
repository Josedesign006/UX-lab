import { NextResponse } from "next/server";
import { isGoogleConfigured } from "@/lib/oauth";
import { isEmailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

// Lets the login UI show only the auth methods this instance has configured.
export async function GET() {
  return NextResponse.json({
    google: isGoogleConfigured(),
    passwordReset: isEmailConfigured(),
  });
}
