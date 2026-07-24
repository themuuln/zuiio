"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin";
import { type SyncResult, syncCatalog } from "@/lib/catalog-sync";
import { getDb } from "@/lib/db";

export async function syncCatalogAction(): Promise<SyncResult> {
  await assertAdmin();
  const result = await syncCatalog();
  revalidatePath("/", "layout");
  return result;
}

export async function togglePackageAction(
  packageId: string,
  enabled: boolean,
): Promise<void> {
  await assertAdmin();
  await getDb().updatePackage(packageId, { is_enabled: enabled });
  revalidatePath("/", "layout");
}

export async function clearRepricingFlagAction(
  packageId: string,
): Promise<void> {
  await assertAdmin();
  await getDb().updatePackage(packageId, { needs_repricing: false });
  revalidatePath("/", "layout");
}
