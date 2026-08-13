"use server";
import { resolve4, resolveCname, resolveTxt } from "node:dns/promises";
import { capture, withDbCapture } from "@zuiio/capture";

import { type ActionContext, requireActionContext } from "@/lib/action-utils";
import {
  deriveDomainVerificationToken,
  expectedTxtValue,
  hasMatchingTxt,
  isValidDomain,
} from "@/lib/domain-verify";
import { revalidateEntity, revalidateEntityTag } from "@/lib/revalidate";
import type { Database } from "@/lib/supabase/types";
import {
  attachDomainToVercel,
  type DnsRecord,
  detachDomainFromVercel,
  dnsRecordFor,
  getVercelDomainStatus,
  VERCEL_CNAME_TARGET,
  VERCEL_EDGE_IP,
} from "@/lib/vercel-domains";

export type OrgSettingsState = {
  error?: string;
  success?: boolean;
};

export type VerifyDomainState = {
  error?: string;
  success?: boolean;
  verified?: boolean;
  token?: string;
  vercelAttached?: boolean;
  vercelError?: string;
  dnsRecord?: DnsRecord;
};

export type CheckDnsState = {
  error?: string;
  success?: boolean;
  pointing?: boolean;
  vercelVerified?: boolean;
  live?: boolean;
  vercelConfigured?: boolean;
  aRecords?: string[];
  cname?: string | null;
  expected?: string;
  expectedCname?: string;
};

const DNS_RESOLVE_TIMEOUT_MS = 8000;

/**
 * Parse a non-negative NUMERIC(12,2) field from the form. Returns the
 * number or a user-facing error object (empty/blank → 0).
 */
function parseNonNegativeAmount(
  value: FormDataEntryValue | null,
  label: string,
): number | { error: string } {
  if (value === null || String(value).trim() === "") return 0;
  const parsed = Number.parseFloat(String(value));
  if (Number.isNaN(parsed) || parsed < 0) {
    return { error: `${label} 0-ээс бага байж болохгүй.` };
  }
  return Math.round(parsed * 100) / 100;
}

export async function updateReportEmailSettings(
  _prevState: OrgSettingsState | undefined,
  formData: FormData,
): Promise<OrgSettingsState> {
  const ctx = await requireActionContext("settings.manage");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const enabled = formData.get("report_email_enabled") === "on";
  const time = formData.get("report_email_time") as string;
  const recipient = (formData.get("report_email_recipient") as string) || null;

  if (enabled && !time) {
    return { error: "Цагийг сонгоно уу." };
  }

  // Validate time format (HH:MM)
  if (enabled && !/^\d{2}:\d{2}$/.test(time)) {
    return { error: "Цагийн формат буруу байна. (Жишээ: 18:00)" };
  }

  const { error: updateError } = await supabase
    .from("organizations")
    .update({
      report_email_enabled: enabled,
      report_email_time: enabled ? time : null,
      report_email_recipient: recipient || null,
    })
    .eq("id", organizationId);

  if (updateError) {
    capture(updateError, {
      context: "organization: updateReportEmailSettings",
    });
    return {
      error: `Тохиргоо хадгалахад алдаа гарлаа: ${updateError.message}`,
    };
  }

  revalidateEntity("settings");
  return { success: true };
}

export async function updatePublicProfile(
  _prevState: OrgSettingsState | undefined,
  formData: FormData,
): Promise<OrgSettingsState> {
  const ctx = await requireActionContext("settings.manage");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const catalogEnabled = formData.get("catalog_enabled") === "on";
  const displayName = (formData.get("display_name") as string) || null;
  const description = (formData.get("description") as string) || null;
  const contactEmail = (formData.get("contact_email") as string) || null;
  const contactPhone = (formData.get("contact_phone") as string) || null;
  const address = (formData.get("address") as string) || null;
  const websiteUrl = (formData.get("website_url") as string) || null;
  const logoUrl = (formData.get("logo_url") as string) || null;
  const bannerUrl = (formData.get("banner_url") as string) || null;
  const policies = (formData.get("policies") as string) || null;
  const gaMeasurementId = (formData.get("ga_measurement_id") as string) || null;
  const metaPixelId = (formData.get("meta_pixel_id") as string) || null;
  const metaTitle = (formData.get("meta_title") as string) || null;
  const metaDescription = (formData.get("meta_description") as string) || null;
  const ogImageUrl = formData.get("og_image_url") as string | null;
  const customDomain = (formData.get("custom_domain") as string) || null;
  const adminDomain = (formData.get("admin_domain") as string) || null;

  // Storefront checkout configuration (public profile).
  const deliveryEnabled = formData.get("delivery_enabled") === "on";
  const pickupEnabled = formData.get("pickup_enabled") === "on";
  const showStock = formData.get("show_stock") === "on";
  const deliveryFeeAmount = parseNonNegativeAmount(
    formData.get("delivery_fee_amount"),
    "Хүргэлтийн төлбөр",
  );
  if (typeof deliveryFeeAmount !== "number") return deliveryFeeAmount;
  const freeDeliveryThreshold = parseNonNegativeAmount(
    formData.get("free_delivery_threshold"),
    "Үнэгүй хүргэлтийн босго",
  );
  if (typeof freeDeliveryThreshold !== "number") return freeDeliveryThreshold;

  // Optional positive integer estimate of delivery time in hours (nullable).
  const estimatedDeliveryHoursRaw = formData.get("estimated_delivery_hours");
  let estimatedDeliveryHours: number | null = null;
  if (
    estimatedDeliveryHoursRaw !== null &&
    String(estimatedDeliveryHoursRaw).trim() !== ""
  ) {
    const parsed = Number(estimatedDeliveryHoursRaw);
    if (Number.isNaN(parsed) || parsed < 1 || !Number.isInteger(parsed)) {
      return {
        error:
          "Ойролцоо хүргэлтийн хугацаа 1-ээс багагүй бүхэл тоо байх ёстой.",
      };
    }
    estimatedDeliveryHours = parsed;
  }

  const paymentBankName =
    (formData.get("payment_bank_name") as string)?.trim() || null;
  const paymentBankAccount =
    (formData.get("payment_bank_account") as string)?.trim() || null;
  const paymentAccountName =
    (formData.get("payment_account_name") as string)?.trim() || null;
  const qpayQrUrl = (formData.get("qpay_qr_url") as string)?.trim() || null;

  // Parse business hours from form (JSON string sent by client)
  let businessHours: Record<string, string> | null = null;
  const businessHoursRaw = formData.get("business_hours") as string;
  if (businessHoursRaw) {
    try {
      businessHours = JSON.parse(businessHoursRaw);
    } catch {
      // Invalid JSON, skip
    }
  }

  // Build social links object from individual form fields
  const socialLinks: Record<string, string> = {};
  const socialPlatforms = [
    "facebook",
    "instagram",
    "twitter",
    "youtube",
    "tiktok",
    "linkedin",
  ];
  for (const platform of socialPlatforms) {
    const url = formData.get(`social_${platform}`) as string;
    if (url?.trim()) {
      socialLinks[platform] = url.trim();
    }
  }

  // Fetch the current profile so domain_verified is only preserved while
  // the custom domain is unchanged (verification is server-owned now).
  const rawCustomDomain = customDomain?.trim().toLowerCase() || null;
  if (rawCustomDomain && !isValidDomain(rawCustomDomain)) {
    return {
      error: "Домэйн формат буруу байна. Жишээ: shop.mydomain.mn",
    };
  }
  const normalizedCustomDomain = rawCustomDomain;
  const rawAdminDomain = adminDomain?.trim().toLowerCase() || null;
  if (rawAdminDomain && !isValidDomain(rawAdminDomain)) {
    return {
      error: "Домэйн формат буруу байна. Жишээ: erp.mydomain.mn",
    };
  }
  const normalizedAdminDomain = rawAdminDomain;
  const { data: existingProfile } = await withDbCapture(
    "updatePublicProfile: fetch existing",
    supabase
      .from("organization_public_profiles")
      .select(
        "custom_domain, domain_verified, admin_domain, admin_domain_verified",
      )
      .eq("organization_id", organizationId)
      .maybeSingle(),
  );
  const existingCustomDomain =
    existingProfile?.custom_domain?.toLowerCase() ?? null;
  const domainVerified =
    !!normalizedCustomDomain &&
    existingCustomDomain === normalizedCustomDomain &&
    existingProfile?.domain_verified === true;
  const existingAdminDomain =
    existingProfile?.admin_domain?.toLowerCase() ?? null;
  const adminDomainVerified =
    !!normalizedAdminDomain &&
    existingAdminDomain === normalizedAdminDomain &&
    existingProfile?.admin_domain_verified === true;

  const payload: Database["public"]["Tables"]["organization_public_profiles"]["Insert"] =
    {
      organization_id: organizationId,
      catalog_enabled: catalogEnabled,
      display_name: displayName,
      description,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      address,
      website_url: websiteUrl,
      logo_url: logoUrl,
      banner_url: bannerUrl,
      policies,
      ga_measurement_id: gaMeasurementId,
      meta_pixel_id: metaPixelId,
      meta_title: metaTitle,
      meta_description: metaDescription,
      og_image_url: ogImageUrl,
      custom_domain: normalizedCustomDomain,
      domain_verified: domainVerified,
      admin_domain: normalizedAdminDomain,
      admin_domain_verified: adminDomainVerified,
      business_hours:
        Object.keys(businessHours ?? {}).length > 0 ? businessHours : null,
      social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null,
      delivery_enabled: deliveryEnabled,
      pickup_enabled: pickupEnabled,
      show_stock: showStock,
      delivery_fee_amount: deliveryFeeAmount,
      free_delivery_threshold: freeDeliveryThreshold,
      estimated_delivery_hours: estimatedDeliveryHours,
      payment_bank_name: paymentBankName,
      payment_bank_account: paymentBankAccount,
      payment_account_name: paymentAccountName,
      qpay_qr_url: qpayQrUrl,
      updated_at: new Date().toISOString(),
    };

  const result = await withDbCapture(
    "updatePublicProfile: upsert profile",
    supabase
      .from("organization_public_profiles")
      .upsert(payload, { onConflict: "organization_id" }),
  );

  if (result.error) {
    capture(result.error, { context: "updatePublicProfile" });
    return { error: `Хадгалахад алдаа гарлаа: ${result.error.message}` };
  }

  // The org changed its custom domain and the old one was verified —
  // release it from the Vercel project so another org can claim it.
  if (
    existingCustomDomain &&
    existingProfile?.domain_verified === true &&
    existingCustomDomain !== normalizedCustomDomain
  ) {
    try {
      await detachDomainFromVercel(existingCustomDomain);
    } catch (e) {
      capture(e, { context: "updatePublicProfile: detach old domain" });
    }
  }

  // Same for the admin (ERP) domain.
  if (
    existingAdminDomain &&
    existingProfile?.admin_domain_verified === true &&
    existingAdminDomain !== normalizedAdminDomain
  ) {
    try {
      await detachDomainFromVercel(existingAdminDomain);
    } catch (e) {
      capture(e, { context: "updatePublicProfile: detach old admin domain" });
    }
  }

  revalidateEntity("settings");
  revalidateEntityTag("storefront", organizationId);
  return { success: true };
}

/**
 * Column pair on organization_public_profiles for a domain role. The
 * storefront domain (custom_domain) serves the public shop; the admin
 * domain (admin_domain) serves the ERP dashboard. The verification and
 * DNS-check flows are identical — only the columns differ.
 */
const DOMAIN_ROLES = {
  storefront: {
    domainColumn: "custom_domain",
    verifiedColumn: "domain_verified",
  },
  admin: {
    domainColumn: "admin_domain",
    verifiedColumn: "admin_domain_verified",
  },
} as const;

type DomainRole = keyof typeof DOMAIN_ROLES;

type DomainSpec = (typeof DOMAIN_ROLES)[DomainRole];

/** Loads the org's saved domain + verified flag for the given role. */
async function loadProfileDomain(
  supabase: ActionContext["supabase"],
  organizationId: string,
  spec: DomainSpec,
): Promise<{ domain: string | null; verified: boolean } | { error: string }> {
  const columns =
    spec.domainColumn === "custom_domain"
      ? "custom_domain, domain_verified"
      : "admin_domain, admin_domain_verified";
  const { data, error } = await supabase
    .from("organization_public_profiles")
    .select(columns)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    capture(error, { context: "loadProfileDomain" });
    return { error: `Хадгалахад алдаа гарлаа: ${error.message}` };
  }

  const row = data as
    | { custom_domain: string | null; domain_verified: boolean }
    | { admin_domain: string | null; admin_domain_verified: boolean }
    | null;
  const domain =
    spec.domainColumn === "custom_domain"
      ? (row as { custom_domain: string | null } | null)?.custom_domain
      : (row as { admin_domain: string | null } | null)?.admin_domain;
  const verified =
    spec.verifiedColumn === "domain_verified"
      ? (row as { domain_verified: boolean } | null)?.domain_verified
      : (row as { admin_domain_verified: boolean } | null)
          ?.admin_domain_verified;
  return {
    domain: domain?.trim().toLowerCase() ?? null,
    verified: verified === true,
  };
}

/** Marks the role's verified flag on the profile. */
async function markDomainVerified(
  supabase: ActionContext["supabase"],
  organizationId: string,
  spec: DomainSpec,
): Promise<{ error?: string }> {
  const patch =
    spec.verifiedColumn === "domain_verified"
      ? { domain_verified: true, updated_at: new Date().toISOString() }
      : {
          admin_domain_verified: true,
          updated_at: new Date().toISOString(),
        };
  const { error } = await supabase
    .from("organization_public_profiles")
    .update(patch)
    .eq("organization_id", organizationId);

  if (error) {
    capture(error, { context: "markDomainVerified" });
    return { error: `Хадгалахад алдаа гарлаа: ${error.message}` };
  }
  return {};
}

/**
 * Shared TXT ownership verification: checks the derived TXT record in DNS
 * for the org's saved domain of the given role; on a match sets the role's
 * verified flag and attaches the domain to the Zer Vercel project so the
 * storefront/dashboard actually serves on it. Best-effort: verification
 * stays recorded even if the attach fails (retried via the DNS check step).
 */
async function verifyDomainForRole(
  ctx: ActionContext,
  spec: DomainSpec,
): Promise<VerifyDomainState> {
  const { supabase, organizationId } = ctx;

  const loaded = await loadProfileDomain(supabase, organizationId, spec);
  if ("error" in loaded) return { error: loaded.error };

  const domain = loaded.domain;
  if (!domain) {
    return { error: "Эхлээд домэйнээ оруулна уу." };
  }

  const token = deriveDomainVerificationToken(organizationId);
  const expected = expectedTxtValue(token);

  let records: string[][];
  try {
    records = await Promise.race([
      resolveTxt(domain),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("DNS query timed out")),
          DNS_RESOLVE_TIMEOUT_MS,
        ),
      ),
    ]);
  } catch (err) {
    capture(err, { context: "verifyDomainForRole: resolveTxt" });
    return {
      error: `DNS бичлэг шалгахад алдаа гарлаа: ${
        err instanceof Error ? err.message : "DNS query failed"
      }`,
      token,
    };
  }

  if (!hasMatchingTxt(records, expected)) {
    return {
      error: `Баталгаажуулах TXT бичлэг олдсонгүй. Дараах утгыг нэмнэ үү: ${expected}`,
      token,
    };
  }

  const updated = await markDomainVerified(supabase, organizationId, spec);
  if (updated.error) {
    return { error: updated.error, token };
  }

  const vercel = await attachDomainToVercel(domain);
  const vercelAttached = vercel.configured && vercel.attached;

  revalidateEntity("settings");
  revalidateEntityTag("storefront", organizationId);
  return {
    success: true,
    verified: true,
    token,
    dnsRecord: dnsRecordFor(domain),
    vercelAttached,
    vercelError:
      vercel.configured && !vercel.attached ? vercel.error : undefined,
  };
}

/**
 * Shared DNS-pointing check: resolves the A/CNAME records and compares
 * them with Vercel's targets, then reads Vercel's own verification flag.
 */
async function checkDomainDnsForRole(
  ctx: ActionContext,
  spec: DomainSpec,
): Promise<CheckDnsState> {
  const { supabase, organizationId } = ctx;

  const loaded = await loadProfileDomain(supabase, organizationId, spec);
  if ("error" in loaded) return { error: loaded.error };

  const domain = loaded.domain;
  if (!domain) {
    return { error: "Эхлээд домэйнээ оруулна уу." };
  }

  let aRecords: string[] = [];
  let cname: string | null = null;
  try {
    aRecords = await resolve4(domain);
  } catch {
    // No A record yet — possibly still propagating or using CNAME.
  }
  try {
    const [cnameRecord] = await resolveCname(domain);
    cname = cnameRecord ?? null;
  } catch {
    // No CNAME — expected for apex records.
  }

  const pointsAtVercel =
    aRecords.includes(VERCEL_EDGE_IP) ||
    cname?.toLowerCase() === VERCEL_CNAME_TARGET;

  const vercel = await getVercelDomainStatus(domain);

  return {
    success: true,
    aRecords,
    cname,
    expected: VERCEL_EDGE_IP,
    expectedCname: VERCEL_CNAME_TARGET,
    pointing: pointsAtVercel,
    vercelConfigured: vercel.configured,
    vercelVerified: vercel.configured ? vercel.verified : false,
    live: pointsAtVercel && (vercel.configured ? vercel.verified : false),
    error:
      vercel.configured && !vercel.present
        ? "Домэйн Vercel төсөлд холбогдоогүй байна. 'Баталгаажуулах' товчийг дахин дарна уу."
        : undefined,
  };
}

/**
 * Verifies ownership of the organization's custom (storefront) domain by
 * checking that the derived TXT record is published in DNS. The token is
 * derived from the organization id (never stored); on a match the
 * profile's domain_verified flag is set server-side.
 */
export async function verifyCustomDomain(
  _prevState: VerifyDomainState | undefined,
  _formData: FormData,
): Promise<VerifyDomainState> {
  const ctx = await requireActionContext("settings.manage");
  if ("error" in ctx) return ctx;
  return verifyDomainForRole(ctx, DOMAIN_ROLES.storefront);
}

/**
 * Verifies ownership of the organization's admin (ERP) domain — same TXT
 * flow as the storefront domain, recorded in admin_domain_verified.
 */
export async function verifyAdminDomain(
  _prevState: VerifyDomainState | undefined,
  _formData: FormData,
): Promise<VerifyDomainState> {
  const ctx = await requireActionContext("settings.manage");
  if ("error" in ctx) return ctx;
  return verifyDomainForRole(ctx, DOMAIN_ROLES.admin);
}

/**
 * Checks whether the org's custom (storefront) domain currently points at
 * Vercel: resolves the A/CNAME records and compares them with Vercel's
 * targets, then reads Vercel's own verification flag for the domain.
 */
export async function checkCustomDomainDns(
  _prevState: CheckDnsState | undefined,
  _formData: FormData,
): Promise<CheckDnsState> {
  const ctx = await requireActionContext("settings.manage");
  if ("error" in ctx) return ctx;
  return checkDomainDnsForRole(ctx, DOMAIN_ROLES.storefront);
}

/**
 * Checks whether the org's admin (ERP) domain currently points at Vercel.
 */
export async function checkAdminDomainDns(
  _prevState: CheckDnsState | undefined,
  _formData: FormData,
): Promise<CheckDnsState> {
  const ctx = await requireActionContext("settings.manage");
  if ("error" in ctx) return ctx;
  return checkDomainDnsForRole(ctx, DOMAIN_ROLES.admin);
}
