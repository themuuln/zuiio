"use server";
import { resolveTxt } from "node:dns/promises";
import { capture } from "@zuiio/capture";

import { requireActionContext } from "@/lib/action-utils";
import {
  deriveDomainVerificationToken,
  expectedTxtValue,
  hasMatchingTxt,
} from "@/lib/domain-verify";
import { revalidateEntity } from "@/lib/revalidate";
import type { Database } from "@/lib/supabase/types";

export type OrgSettingsState = {
  error?: string;
  success?: boolean;
};

export type VerifyDomainState = {
  error?: string;
  success?: boolean;
  verified?: boolean;
  token?: string;
};

const DNS_RESOLVE_TIMEOUT_MS = 8000;

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
  const ogImageUrl = (formData.get("og_image_url") as string) || null;
  const customDomain = (formData.get("custom_domain") as string) || null;

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
  const normalizedCustomDomain = customDomain?.toLowerCase() || null;
  const { data: existingProfile } = await supabase
    .from("organization_public_profiles")
    .select("custom_domain, domain_verified")
    .eq("organization_id", organizationId)
    .maybeSingle();
  const existingCustomDomain =
    existingProfile?.custom_domain?.toLowerCase() ?? null;
  const domainVerified =
    !!normalizedCustomDomain &&
    existingCustomDomain === normalizedCustomDomain &&
    existingProfile?.domain_verified === true;

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
      business_hours:
        Object.keys(businessHours ?? {}).length > 0 ? businessHours : null,
      social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null,
      updated_at: new Date().toISOString(),
    };

  const result = await supabase
    .from("organization_public_profiles")
    .upsert(payload, { onConflict: "organization_id" });

  if (result.error) {
    capture(result.error, { context: "updatePublicProfile" });
    return { error: `Хадгалахад алдаа гарлаа: ${result.error.message}` };
  }

  revalidateEntity("settings");
  return { success: true };
}

/**
 * Verifies ownership of the organization's custom domain by checking
 * that the derived TXT record is published in DNS. The token is derived
 * from the organization id (never stored); on a match the profile's
 * domain_verified flag is set server-side.
 */
export async function verifyCustomDomain(
  _prevState: VerifyDomainState | undefined,
  _formData: FormData,
): Promise<VerifyDomainState> {
  const ctx = await requireActionContext("settings.manage");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const { data: profile, error: profileError } = await supabase
    .from("organization_public_profiles")
    .select("custom_domain, domain_verified")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (profileError) {
    capture(profileError, { context: "verifyCustomDomain: load profile" });
    return { error: `Хадгалахад алдаа гарлаа: ${profileError.message}` };
  }

  const domain = profile?.custom_domain?.trim().toLowerCase();
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
    capture(err, { context: "verifyCustomDomain: resolveTxt" });
    return {
      error: `DNS бичлэг шалгахад алдаа гарлаа: ${
        err instanceof Error ? err.message : "DNS query failed"
      }`,
      token: expected,
    };
  }

  if (!hasMatchingTxt(records, expected)) {
    return {
      error: `Баталгаажуулах TXT бичлэг олдсонгүй. Дараах утгыг нэмнэ үү: ${expected}`,
      token: expected,
    };
  }

  const { error: updateError } = await supabase
    .from("organization_public_profiles")
    .update({
      domain_verified: true,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId);

  if (updateError) {
    capture(updateError, { context: "verifyCustomDomain: update" });
    return {
      error: `Хадгалахад алдаа гарлаа: ${updateError.message}`,
      token: expected,
    };
  }

  revalidateEntity("settings");
  return { success: true, verified: true, token: expected };
}
