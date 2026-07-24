import { createAdminClient } from "@/lib/supabase/server";

export interface SamlIdp {
  id: string;
  name: string;
  entityId: string;
  ssoUrl: string;
  sloUrl: string | null;
  certificate: string;
  nameIdFormat: string;
  productId: string | null;
  organizationId: string | null;
  active: boolean;
}

/**
 * Get SAML configuration for this SP.
 */
export function getSpConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    entity_id: `${baseUrl}/saml/metadata`,
    assertion_consumer_service_url: `${baseUrl}/saml/acs`,
    single_logout_service_url: `${baseUrl}/saml/slo`,
    allow_create: false,
    force_authn: false,
    sign_authn_request: true,
  };
}

/**
 * Get all active SAML IdPs.
 */
export async function getActiveIdps(): Promise<SamlIdp[]> {
  const admin = await createAdminClient();
  const { data } = await admin
    .from("saml_idps")
    .select("*")
    .eq("active", true)
    .order("name");

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    entityId: row.entity_id as string,
    ssoUrl: row.sso_url as string,
    sloUrl: row.slo_url as string | null,
    certificate: row.certificate as string,
    nameIdFormat: row.name_id_format as string,
    productId: row.product_id as string | null,
    organizationId: row.organization_id as string | null,
    active: row.active as boolean,
  }));
}

/**
 * Get a SAML IdP by entity ID.
 */
export async function getIdpByEntityId(
  entityId: string,
): Promise<SamlIdp | null> {
  const admin = await createAdminClient();
  const { data } = await admin
    .from("saml_idps")
    .select("*")
    .eq("entity_id", entityId)
    .eq("active", true)
    .single();

  if (!data) return null;

  return {
    id: data.id as string,
    name: data.name as string,
    entityId: data.entity_id as string,
    ssoUrl: data.sso_url as string,
    sloUrl: data.slo_url as string | null,
    certificate: data.certificate as string,
    nameIdFormat: data.name_id_format as string,
    productId: data.product_id as string | null,
    organizationId: data.organization_id as string | null,
    active: data.active as boolean,
  };
}

/**
 * Record a SAML assertion for audit.
 */
export async function recordSamlAssertion(params: {
  idpId: string;
  userId?: string;
  nameId?: string;
  sessionIndex?: string;
  attributes?: Record<string, unknown>;
  status: "success" | "error" | "denied";
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  const admin = await createAdminClient();
  await admin.from("saml_assertions").insert({
    idp_id: params.idpId,
    user_id: params.userId ?? null,
    name_id: params.nameId ?? null,
    session_index: params.sessionIndex ?? null,
    attributes: params.attributes ?? null,
    status: params.status,
    ip_address: params.ipAddress ?? null,
    user_agent: params.userAgent ?? null,
  });
}
