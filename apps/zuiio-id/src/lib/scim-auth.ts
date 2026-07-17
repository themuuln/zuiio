import { NextRequest } from "next/server";
import { verifyScimToken } from "@/lib/products/catalog";
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

  // Check product_catalog SCIM tokens first
  const product = await verifyScimToken(token);
  if (product) {
    return { clientId: product.productId };
  }

  // Fallback: check SAML IdP tokens
  const admin = await createAdminClient();
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
