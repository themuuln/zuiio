"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin";
import { type SyncResult, syncAllProviders } from "@/lib/catalog-sync";

/**
 * Run full sync across all providers and revalidate admin cache.
 * Programmatic callers use this directly.
 */
export async function syncAllProvidersAction(): Promise<SyncResult> {
  await assertAdmin();
  const result = await syncAllProviders();
  revalidatePath("/", "layout");
  return result;
}

/**
 * Form-compatible wrapper — accepts FormData (unused), returns void.
 * Used as <form action={syncAllProvidersFormAction}>.
 */
export async function syncAllProvidersFormAction(
  _formData: FormData,
): Promise<void> {
  await syncAllProvidersAction();
}
