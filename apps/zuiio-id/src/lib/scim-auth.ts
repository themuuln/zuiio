import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export interface ScimAuthContext {
  clientId: string;
  orgId?: string;
}

/**
 * Verify SCIM bearer token.
 * SCIM uses a static API token (not OAuth) configured per product.
 * The token is a UUID stored in the product_catalog table's scim_token column.
 */
export async function verifyBearerToken(
  request: NextRequest,
): Promise<ScimAuthContext | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  if (!token) return null;

  const admin = await createAdminClient();

  // Look up the token in product_catalog (we'll add scim_token column via migration)
  const { data: product } = await admin
    .from("product_catalog")
    .select("id, scim_token")
    .eq("scim_token", token)
    .single();

  if (product) {
    return {
      clientId: product.id as string,
    };
  }

  // Also check SAML IdP tokens
  const { data: samlIdp } = await admin
    .from("saml_idps")
    .select("id, name")
    .eq("certificate", token)
    .eq("active", true)
    .single();

  if (samlIdp) {
    return { clientId: samlIdp.id as string };
  }

  return null;
}
