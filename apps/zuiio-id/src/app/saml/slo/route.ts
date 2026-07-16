import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveIdps, recordSamlAssertion } from "@/lib/saml-config";
import { extractIp, extractUserAgent } from "@/lib/supabase/audit";
import { randomBytes } from "node:crypto";

/**
 * GET /saml/slo
 * Initiates Single Logout — signs out locally and redirects to IdP SLO.
 */
export async function GET(request: NextRequest) {
  const ip = extractIp(request.headers);
  const ua = extractUserAgent(request.headers);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Audit the logout
    await recordSamlAssertion({
      idpId: "unknown",
      userId: user.id,
      status: "success",
      ipAddress: ip,
      userAgent: ua,
    });

    // Sign out locally
    await supabase.auth.signOut();
  }

  // Find the IdP SLO URL (simplified — would need to know which IdP)
  const idps = await getActiveIdps();
  const idpWithSlo = idps.find((idp) => idp.sloUrl);

  if (idpWithSlo?.sloUrl) {
    const logoutRequest = buildLogoutRequest({
      id: `_saml_logout_${randomBytes(16).toString("hex")}`,
      destination: idpWithSlo.sloUrl,
      nameId: user?.email ?? "",
    });

    const encoded = Buffer.from(logoutRequest).toString("base64");
    return NextResponse.redirect(
      `${idpWithSlo.sloUrl}?SAMLRequest=${encodeURIComponent(encoded)}`,
    );
  }

  // No IdP SLO — just redirect to login
  return NextResponse.redirect("/login");
}

function buildLogoutRequest(params: {
  id: string;
  destination: string;
  nameId: string;
}): string {
  const issueInstant = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return `<?xml version="1.0" encoding="UTF-8"?>
<samlp:LogoutRequest
    xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="${params.id}"
    Version="2.0"
    IssueInstant="${issueInstant}"
    Destination="${params.destination}">
  <saml:Issuer>${baseUrl}/saml/metadata</saml:Issuer>
  <saml:NameID>${params.nameId}</saml:NameID>
</samlp:LogoutRequest>`;
}
