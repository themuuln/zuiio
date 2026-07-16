import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getIdpByEntityId, recordSamlAssertion } from "@/lib/saml-config";
import { extractIp, extractUserAgent } from "@/lib/supabase/audit";
import { XMLParser } from "fast-xml-parser";

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
    // Decode the SAML Response
    const decoded = Buffer.from(samlResponse, "base64").toString("utf-8");

    // Parse XML (simplified — production would use @node-saml/node-saml)
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const parsed = parser.parse(decoded);

    // Extract assertion (the structure varies by IdP)
    const assertion =
      parsed?.["saml2p:Response"]?.["saml2:Assertion"] ??
      parsed?.["samlp:Response"]?.["saml:Assertion"];

    if (!assertion) {
      return NextResponse.redirect(
        new URL("/error?code=saml_parse_error", request.url),
      );
    }

    // Extract NameID (user identifier)
    const nameId =
      assertion?.["saml2:Subject"]?.["saml2:NameID"]?.["#text"] ??
      assertion?.["saml:Subject"]?.["saml:NameID"]?.["#text"];

    // Extract attributes
    const attributeStatement =
      assertion?.["saml2:AttributeStatement"] ??
      assertion?.["saml:AttributeStatement"];
    const attributes: Record<string, string> = {};

    if (attributeStatement?.["saml2:Attribute"]) {
      const attrs = Array.isArray(attributeStatement["saml2:Attribute"])
        ? attributeStatement["saml2:Attribute"]
        : [attributeStatement["saml2:Attribute"]];
      for (const attr of attrs) {
        const name = attr["@_Name"];
        const value =
          attr["saml2:AttributeValue"]?.["#text"] ??
          attr["saml2:AttributeValue"];
        if (name && value) {
          attributes[name] = String(value);
        }
      }
    }

    // Determine email from NameID or attributes
    const email = nameId ?? attributes["email"] ?? attributes["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];

    if (!email) {
      return NextResponse.redirect(
        new URL("/error?code=saml_no_email", request.url),
      );
    }

    // Find or create the user via JIT provisioning
    const admin = await createAdminClient();
    const fullName = attributes["displayName"] ?? attributes["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ?? email.split("@")[0];
    const username = email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";

    // Try to invite (creates user if not exists, returns existing if already exists)
    const { data: userData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        username,
        saml_provider: "saml",
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    });

    if (inviteError) {
      // If invite fails (user already exists), try to get user by listing
      const { data: users } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      const existingUser = users?.users?.find((u) => u.email === email);
      if (!existingUser) {
        return NextResponse.redirect(
          new URL("/error?code=saml_user_creation_failed", request.url),
        );
      }
      var userId = existingUser.id;
    } else {
      var userId = userData?.user?.id;
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
      idpId: "unknown", // Would need to resolve from InResponseTo
      userId,
      nameId: nameId ?? undefined,
      attributes,
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
