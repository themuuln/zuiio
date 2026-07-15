"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";

const ruleSchema = z
  .object({
    scope: z.enum(["global", "region", "package"]),
    regionId: z.string().optional(),
    packageId: z.string().optional(),
    markupPercent: z.coerce.number().min(0).max(500),
    note: z.string().max(200).optional(),
  })
  .refine(
    (data) =>
      (data.scope === "global" && !data.regionId && !data.packageId) ||
      (data.scope === "region" && data.regionId) ||
      (data.scope === "package" && data.packageId),
    "scope target mismatch",
  );

export async function upsertRuleAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const parsed = ruleSchema.parse({
    scope: formData.get("scope"),
    regionId: formData.get("regionId") || undefined,
    packageId: formData.get("packageId") || undefined,
    markupPercent: formData.get("markupPercent"),
    note: formData.get("note") || undefined,
  });

  await getDb().insertPricingRule({
    scope: parsed.scope,
    region_id: parsed.regionId ?? null,
    package_id: parsed.packageId ?? null,
    markup_percent: parsed.markupPercent,
    note: parsed.note ?? null,
  });
  revalidatePath("/", "layout");
}

export async function deactivateRuleAction(ruleId: string): Promise<void> {
  await assertAdmin();
  const db = getDb();
  const rules = await db.listPricingRules();
  const rule = rules.find((r) => r.id === ruleId);
  if (!rule) return;
  if (rule.scope === "global") {
    throw new Error("Cannot deactivate the global rule — replace it instead");
  }
  await db.updatePricingRule(ruleId, { is_active: false });
  revalidatePath("/", "layout");
}
