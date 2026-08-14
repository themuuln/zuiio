"use server";

import { capture, withDbCapture } from "@zuiio/capture";
import { revalidatePath } from "next/cache";
import { requireWriteAction } from "@/lib/action-utils";
import { getString } from "@/lib/validation";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type ProviderRow = {
  id: string;
  name: string;
  provider_type: string;
  api_key: string | null;
  api_secret: string | null;
  config: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

// ---------------------------------------------------------------------------
// listProviders
// ---------------------------------------------------------------------------

export async function listProviders(): Promise<ProviderRow[]> {
  const ctx = await requireWriteAction("settings.manage");
  if ("error" in ctx) return [];

  const { supabase, organizationId } = ctx;

  const { data, error } = await withDbCapture(
    "delivery-providers: list",
    supabase
      .from("delivery_providers")
      .select("*")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
  );

  if (error) {
    capture(error, { context: "delivery-providers: list" });
    return [];
  }

  return (data ?? []).map((p) => ({
    ...p,
    is_active: p.is_active ?? true,
    config: p.config as Record<string, unknown> | null,
    created_at: p.created_at ?? new Date().toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// createProvider
// ---------------------------------------------------------------------------

export async function createProvider(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("settings.manage");
  if ("error" in ctx) return { error: ctx.error };

  const { supabase, organizationId } = ctx;

  const name = getString(formData, "name");
  const providerType = getString(formData, "provider_type");
  const apiKey = getString(formData, "api_key") || null;
  const apiSecret = getString(formData, "api_secret") || null;

  if (!name) return { error: "Нэр оруулна уу" };
  if (!providerType) return { error: "Төрөл сонгоно уу" };

  const { error } = await withDbCapture(
    "delivery-providers: create",
    supabase.from("delivery_providers").insert({
      organization_id: organizationId,
      name,
      provider_type: providerType,
      api_key: apiKey,
      api_secret: apiSecret,
      is_active: true,
    }),
  );

  if (error) {
    capture(error, { context: "delivery-providers: create" });
    return { error: "Хүргэлтийн провайдер үүсгэхэд алдаа гарлаа" };
  }

  revalidatePath("/settings/delivery-providers");
  return { success: true as const };
}

// ---------------------------------------------------------------------------
// updateProvider
// ---------------------------------------------------------------------------

export async function updateProvider(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("settings.manage");
  if ("error" in ctx) return { error: ctx.error };

  const { supabase, organizationId } = ctx;

  const id = getString(formData, "id");
  const name = getString(formData, "name");
  const providerType = getString(formData, "provider_type");
  const apiKey = getString(formData, "api_key") || null;
  const apiSecret = getString(formData, "api_secret") || null;
  const isActiveRaw = getString(formData, "is_active");

  if (!id) return { error: "ID оруулна уу" };
  if (!name) return { error: "Нэр оруулна уу" };

  const isActive = isActiveRaw === "true";

  const { error } = await withDbCapture(
    "delivery-providers: update",
    supabase
      .from("delivery_providers")
      .update({
        name,
        provider_type: providerType,
        api_key: apiKey,
        api_secret: apiSecret,
        is_active: isActive,
      })
      .eq("id", id)
      .eq("organization_id", organizationId),
  );

  if (error) {
    capture(error, { context: "delivery-providers: update" });
    return { error: "Хүргэлтийн провайдер засахад алдаа гарлаа" };
  }

  revalidatePath("/settings/delivery-providers");
  return { success: true as const };
}

// ---------------------------------------------------------------------------
// deleteProvider
// ---------------------------------------------------------------------------

export async function deleteProvider(id: string) {
  const ctx = await requireWriteAction("settings.manage");
  if ("error" in ctx) return { error: ctx.error };

  const { supabase, organizationId } = ctx;

  const { error } = await withDbCapture(
    "delivery-providers: delete",
    supabase
      .from("delivery_providers")
      .delete()
      .eq("id", id)
      .eq("organization_id", organizationId),
  );

  if (error) {
    capture(error, { context: "delivery-providers: delete" });
    return { error: "Хүргэлтийн провайдер устгахад алдаа гарлаа" };
  }

  revalidatePath("/settings/delivery-providers");
  return { success: true as const };
}
