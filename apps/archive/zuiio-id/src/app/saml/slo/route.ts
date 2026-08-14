import { NextResponse } from "next/server";

/**
 * SAML is disabled for now. Enable when enterprise customers require SAML SSO.
 * TODO: Enable when Azure AD or other enterprise IdP integration is needed.
 */
export async function GET() {
  return NextResponse.json(
    { error: "SAML is not configured. Use email/password or Google sign-in." },
    { status: 501 },
  );
}
