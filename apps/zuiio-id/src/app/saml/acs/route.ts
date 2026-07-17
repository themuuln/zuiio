import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getIdpByEntityId, getSpConfig, recordSamlAssertion } from "@/lib/saml-config";
import { extractIp, extractUserAgent } from "@/lib/supabase/audit";
import { SAML } from "@node-saml/node-saml";

/**
 * POST /saml/acs
 * Assertion Consumer Service — receives SAML Response from IdP.
 *
 * In production, you would use @node-saml/node-saml for proper
 * signature verification and assertion parsing. This is a simplified
 * implementation that extracts user info from the SAML Response XML.
 */
export async function POST(request: NextRequest) {
  const ip = extractIp(request.headers);
  const ua = extractUserAgent(request.headers);

  const formData = await request.formData();
  const samlResponse = formData.get("SAMLResponse") as string | null;
  const relayState = (formData.get("RelayState") as string) || "/";

  if (!samlResponse) {
    return NextResponse.redirect(
      new URL("/error?code=saml_missing_response", request.url),
    );
  }

  try {
    // First, decode and parse to get the Issuer for IdP lookup
    const decoded = Buffer.from(samlResponse, "base64").toString("utf-8");

    // Extract Issuer from XML (simplified parse for issuer extraction)
    const issuerMatch = decoded.match(/<saml:Issuer[^>]*>([^<]+)<\/saml:Issuer>/i)
      ?? decoded.match(/<saml2:Issuer[^>]*>([^<]+)<\/saml2:Issuer>/i);
    const issuerEntityId = issuerMatch?.[1];

    if (!issuerEntityId) {
      return NextResponse.redirect(
        new URL("/error?code=saml_no_issuer", request.url),
      );
    }

    // Look up IdP from database
    const idp = await getIdpByEntityId(issuerEntityId);
    if (!idp) {
      return NextResponse.redirect(
        new URL("/error?code=saml_unknown_idp", request.url),
      );
    }

    // Create SAML instance with IdP certificate from database
    const saml = new SAML({
      idpCert: idp.certificate,
      issuer: getSpConfig().entity_id,
      callbackUrl: getSpConfig().assertion_consumer_service_url,
      wantAssertionsSigned: true,
      wantAuthnResponseSigned: true,
    });

    const { profile } = await saml.validatePostResponseAsync({
      SAMLResponse: samlResponse,
    });

    if (!profile) {
      return NextResponse.redirect(
        new URL("/error?code=saml_validation_failed", request.url),
      );
    }

    // Extract user info from validated profile
    const email = profile.nameID ?? profile.email;

    if (!email) {
      return NextResponse.redirect(
        new URL("/error?code=saml_no_email", request.url),
      );
    }

    // Find or create the user via JIT provisioning
    const admin = await createAdminClient();
    const fullName = profile.displayName ?? profile.givenName ?? email.split("@")[0];
    const username = email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";

    // Try to invite (creates user if not exists)
    const { data: userData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        username,
        saml_provider: "saml",
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    });

    let userId: string | undefined;

    if (inviteError) {
      // If invite fails (user already exists), query by email
      const { data: { users } } = await admin.auth.admin.listUsers();
      const existingUser = users?.find((u) => u.email === email);
      if (!existingUser) {
        return NextResponse.redirect(
          new URL("/error?code=saml_user_creation_failed", request.url),
        );
      }
      userId = existingUser.id;
    } else {
      userId = userData?.user?.id;
    }

    if (!userId) {
      return NextResponse.redirect(
        new URL("/error?code=saml_user_creation_failed", request.url),
      );
    }

    // Create a session via Supabase
    await createClient();

    // Generate a magic link for the user to get a session
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      return NextResponse.redirect(
        new URL("/error?code=saml_session_failed", request.url),
      );
    }

    // Record the assertion
    await recordSamlAssertion({
      idpId: profile.issuer ?? "unknown",
      userId,
      nameId: profile.nameID ?? undefined,
      attributes: { email: profile.email, name: profile.nameID } as Record<string, unknown>,
      status: "success",
      ipAddress: ip,
      userAgent: ua,
    });

    // Redirect to the magic link to establish session
    return NextResponse.redirect(linkData.properties.action_link);
  } catch (err) {
    console.error("[SAML ACS] Error:", err);
    return NextResponse.redirect(
      new URL("/error?code=saml_processing_error", request.url),
    );
  }
}
