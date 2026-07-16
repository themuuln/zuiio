import { NextRequest, NextResponse } from "next/server";
import { getActiveIdps, getSpConfig } from "@/lib/saml-config";
import { randomBytes } from "node:crypto";

/**
 * GET /saml/sso?idp=<entity_id>
 * Initiates SAML SSO by redirecting to the IdP with an AuthnRequest.
 */
export async function GET(request: NextRequest) {
  const idpEntityId = request.nextUrl.searchParams.get("idp");

  if (!idpEntityId) {
    // List available IdPs
    const idps = await getActiveIdps();
    return NextResponse.json({
      message: "SAML SSO — Select an Identity Provider",
      idps: idps.map((idp) => ({
        name: idp.name,
        entity_id: idp.entityId,
        url: `/saml/sso?idp=${encodeURIComponent(idp.entityId)}`,
      })),
    });
  }

  const idps = await getActiveIdps();
  const idp = idps.find((i) => i.entityId === idpEntityId);

  if (!idp) {
    return NextResponse.json(
      { error: "IdP олдсонгүй эсвэл идэвхгүй байна." },
      { status: 404 },
    );
  }

  const sp = getSpConfig();
  const relayState = request.nextUrl.searchParams.get("returnTo") ?? "/";

  // Generate a random InResponseTo ID
  const id = `_saml_request_${randomBytes(16).toString("hex")}`;

  // Build the AuthnRequest XML
  const authnRequest = buildAuthnRequest({
    id,
    destination: idp.ssoUrl,
    assertionConsumerServiceURL: sp.assertion_consumer_service_url,
    issuer: sp.entity_id,
    nameIDFormat: idp.nameIdFormat,
    forceAuthn: sp.force_authn,
  });

  // Encode and redirect
  const encodedRequest = Buffer.from(authnRequest).toString("base64");

  const response = NextResponse.redirect(
    `${idp.ssoUrl}?SAMLRequest=${encodeURIComponent(encodedRequest)}&RelayState=${encodeURIComponent(relayState)}`,
  );

  response.cookies.set("saml_request_id", id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}

/**
 * Build a SAML AuthnRequest XML.
 */
function buildAuthnRequest(params: {
  id: string;
  destination: string;
  assertionConsumerServiceURL: string;
  issuer: string;
  nameIDFormat: string;
  forceAuthn: boolean;
}): string {
  const issueInstant = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  return `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest
    xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="${params.id}"
    Version="2.0"
    IssueInstant="${issueInstant}"
    Destination="${params.destination}"
    AssertionConsumerServiceURL="${params.assertionConsumerServiceURL}"
    ForceAuthn="${params.forceAuthn ? "true" : "false"}"
    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${params.issuer}</saml:Issuer>
  <samlp:NameIDPolicy Format="${params.nameIDFormat}" AllowCreate="false"/>
</samlp:AuthnRequest>`;
}
