"use server";

import { capture, withDbCapture } from "@zuiio/capture";
import { after } from "next/server";
import { requireWriteAction } from "@/lib/action-utils";
import { logAuditEventWithClient } from "@/lib/audit";
import { revalidateEntities, revalidateEntityTag } from "@/lib/revalidate";
import { getString } from "@/lib/validation";

function _parseFloatSafe(value: FormDataEntryValue | null): number {
  if (typeof value !== "string") return 0;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function parseIntSafe(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function getJSONStrings(formData: FormData, key: string): string[] {
  const raw = formData.get(key);
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── Create ────────────────────────────────────────────────────────────────

export async function createPromotion(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("promotions.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const name = getString(formData, "name");
  const description = getString(formData, "description");
  const type = getString(formData, "type") as
    | "buy_x_get_y"
    | "threshold_discount"
    | "free_shipping"
    | "bundle_discount";
  const isActive = formData.get("is_active") === "true";
  const priority = parseIntSafe(formData.get("priority")) ?? 0;
  const stackable = formData.get("stackable") === "true";
  const validFrom = getString(formData, "valid_from");
  const validUntil = getString(formData, "valid_until");
  const usageLimit = parseIntSafe(formData.get("usage_limit"));

  // Condition arrays passed as JSON strings (each element is a JSON string)
  const conditions: string[] = (() => {
    const raw = formData.get("conditions");
    if (typeof raw !== "string") return [];
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  })();
  const rewards: string[] = (() => {
    const raw = formData.get("rewards");
    if (typeof raw !== "string") return [];
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  })();

  // Validate
  if (!name) {
    return { error: "Нэр шаардлагатай." };
  }

  const validTypes = [
    "buy_x_get_y",
    "threshold_discount",
    "free_shipping",
    "bundle_discount",
  ] as const;
  if (!validTypes.includes(type as (typeof validTypes)[number])) {
    return { error: "Буруу сурталчилгааны төрөл." };
  }

  if (!validFrom) {
    return { error: "Хүчинтэй эхлэх огноо шаардлагатай." };
  }

  // Parse condition and reward objects
  let parsedConditions: Array<{
    condition_type: string;
    operator: string;
    condition_value: string;
  }> = [];
  let parsedRewards: Array<{
    reward_type: string;
    reward_value: number;
    reward_product_id: string | null;
    reward_max_count: number | null;
  }> = [];

  try {
    parsedConditions = conditions.map((c) => {
      const obj = JSON.parse(c);
      return {
        condition_type: obj.condition_type,
        operator: obj.operator ?? "gte",
        condition_value: String(obj.condition_value),
      };
    });
  } catch {
    return { error: "Нөхцөлүүдийн өгөгдөл буруу байна." };
  }

  try {
    parsedRewards = rewards.map((r) => {
      const obj = JSON.parse(r);
      return {
        reward_type: obj.reward_type,
        reward_value: Number(obj.reward_value) || 0,
        reward_product_id: obj.reward_product_id ?? null,
        reward_max_count: obj.reward_max_count ?? null,
      };
    });
  } catch {
    return { error: "Урамшууллын өгөгдөл буруу байна." };
  }

  if (parsedConditions.length === 0) {
    return { error: "Дор хаяж нэг нөхцөл шаардлагатай." };
  }

  if (parsedRewards.length === 0) {
    return { error: "Дор хаяж нэг урамшуулал шаардлагатай." };
  }

  // Insert promotion
  const { data: promotion, error: promoError } = await withDbCapture(
    "promotions: create",
    supabase
      .from("promotions")
      .insert({
        organization_id: organizationId,
        name,
        description: description || null,
        type,
        is_active: isActive,
        priority,
        stackable,
        valid_from: validFrom,
        valid_until: validUntil || null,
        usage_limit: usageLimit,
        created_by: userId,
      })
      .select("id")
      .single(),
  );

  if (promoError) {
    capture(promoError, { context: "createPromotion: insert" });
    return {
      error: `Сурталчилгаа үүсгэхэд алдаа гарлаа: ${promoError.message}`,
    };
  }

  // Insert conditions
  const { error: condError } = await withDbCapture(
    "promotions: insert conditions",
    supabase.from("promotion_conditions").insert(
      parsedConditions.map((c) => ({
        promotion_id: promotion.id,
        condition_type: c.condition_type,
        operator: c.operator,
        condition_value: c.condition_value,
      })),
    ),
  );

  if (condError) {
    capture(condError, { context: "createPromotion: insert conditions" });
    return { error: "Нөхцөлүүдийг хадгалахад алдаа гарлаа." };
  }

  // Insert rewards
  const { error: rewardError } = await withDbCapture(
    "promotions: insert rewards",
    supabase.from("promotion_rewards").insert(
      parsedRewards.map((r) => ({
        promotion_id: promotion.id,
        reward_type: r.reward_type,
        reward_value: r.reward_value,
        reward_product_id: r.reward_product_id,
        reward_max_count: r.reward_max_count,
      })),
    ),
  );

  if (rewardError) {
    capture(rewardError, { context: "createPromotion: insert rewards" });
    return { error: "Урамшууллуудыг хадгалахад алдаа гарлаа." };
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "created",
      "promotion",
      promotion.id,
      undefined,
      `Сурталчилгаа "${name}" үүсгэсэн`,
    ),
  );

  revalidateEntities(["promotions"]);
  revalidateEntityTag("products", organizationId);
  return { success: true as const, error: undefined };
}

// ─── Update ────────────────────────────────────────────────────────────────

export async function updatePromotion(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("promotions.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const promotionId = getString(formData, "id");
  if (!promotionId) {
    return { error: "Сурталчилгааны ID олдсонгүй." };
  }

  const name = getString(formData, "name");
  const description = getString(formData, "description");
  const type = getString(formData, "type") as
    | "buy_x_get_y"
    | "threshold_discount"
    | "free_shipping"
    | "bundle_discount";
  const isActive = formData.get("is_active") === "true";
  const priority = parseIntSafe(formData.get("priority")) ?? 0;
  const stackable = formData.get("stackable") === "true";
  const validFrom = getString(formData, "valid_from");
  const validUntil = getString(formData, "valid_until");
  const usageLimit = parseIntSafe(formData.get("usage_limit"));

  // Condition and reward arrays passed as JSON strings
  const conditions = getJSONStrings(formData, "conditions");
  const rewards = getJSONStrings(formData, "rewards");

  // Validate
  if (!name) {
    return { error: "Нэр шаардлагатай." };
  }

  const validTypes = [
    "buy_x_get_y",
    "threshold_discount",
    "free_shipping",
    "bundle_discount",
  ] as const;
  if (!validTypes.includes(type as (typeof validTypes)[number])) {
    return { error: "Буруу сурталчилгааны төрөл." };
  }

  if (!validFrom) {
    return { error: "Хүчинтэй эхлэх огноо шаардлагатай." };
  }

  let parsedConditions: Array<{
    condition_type: string;
    operator: string;
    condition_value: string;
  }> = [];
  let parsedRewards: Array<{
    reward_type: string;
    reward_value: number;
    reward_product_id: string | null;
    reward_max_count: number | null;
  }> = [];

  try {
    parsedConditions = conditions.map((c) => {
      const obj = JSON.parse(c);
      return {
        condition_type: obj.condition_type,
        operator: obj.operator ?? "gte",
        condition_value: String(obj.condition_value),
      };
    });
  } catch {
    return { error: "Нөхцөлүүдийн өгөгдөл буруу байна." };
  }

  try {
    parsedRewards = rewards.map((r) => {
      const obj = JSON.parse(r);
      return {
        reward_type: obj.reward_type,
        reward_value: Number(obj.reward_value) || 0,
        reward_product_id: obj.reward_product_id ?? null,
        reward_max_count: obj.reward_max_count ?? null,
      };
    });
  } catch {
    return { error: "Урамшууллын өгөгдөл буруу байна." };
  }

  if (parsedConditions.length === 0) {
    return { error: "Дор хаяж нэг нөхцөл шаардлагатай." };
  }

  if (parsedRewards.length === 0) {
    return { error: "Дор хаяж нэг урамшуулал шаардлагатай." };
  }

  // Update promotion
  const { error: promoError } = await withDbCapture(
    "promotions: update",
    supabase
      .from("promotions")
      .update({
        name,
        description: description || null,
        type,
        is_active: isActive,
        priority,
        stackable,
        valid_from: validFrom,
        valid_until: validUntil || null,
        usage_limit: usageLimit,
      })
      .eq("id", promotionId)
      .eq("organization_id", organizationId),
  );

  if (promoError) {
    capture(promoError, { context: "updatePromotion: update" });
    return {
      error: `Сурталчилгаа шинэчлэхэд алдаа гарлаа: ${promoError.message}`,
    };
  }

  // Replace conditions: delete existing, insert new
  const { error: delCondError } = await withDbCapture(
    "promotions: delete old conditions",
    supabase
      .from("promotion_conditions")
      .delete()
      .eq("promotion_id", promotionId),
  );

  if (delCondError) {
    capture(delCondError, { context: "updatePromotion: delete conditions" });
    return { error: "Нөхцөлүүдийг шинэчлэхэд алдаа гарлаа." };
  }

  const { error: insCondError } = await withDbCapture(
    "promotions: insert conditions",
    supabase.from("promotion_conditions").insert(
      parsedConditions.map((c) => ({
        promotion_id: promotionId,
        condition_type: c.condition_type,
        operator: c.operator,
        condition_value: c.condition_value,
      })),
    ),
  );

  if (insCondError) {
    capture(insCondError, { context: "updatePromotion: insert conditions" });
    return { error: "Нөхцөлүүдийг шинэчлэхэд алдаа гарлаа." };
  }

  // Replace rewards: delete existing, insert new
  const { error: delRewardError } = await withDbCapture(
    "promotions: delete old rewards",
    supabase.from("promotion_rewards").delete().eq("promotion_id", promotionId),
  );

  if (delRewardError) {
    capture(delRewardError, { context: "updatePromotion: delete rewards" });
    return { error: "Урамшууллуудыг шинэчлэхэд алдаа гарлаа." };
  }

  const { error: insRewardError } = await withDbCapture(
    "promotions: insert rewards",
    supabase.from("promotion_rewards").insert(
      parsedRewards.map((r) => ({
        promotion_id: promotionId,
        reward_type: r.reward_type,
        reward_value: r.reward_value,
        reward_product_id: r.reward_product_id,
        reward_max_count: r.reward_max_count,
      })),
    ),
  );

  if (insRewardError) {
    capture(insRewardError, { context: "updatePromotion: insert rewards" });
    return { error: "Урамшууллуудыг шинэчлэхэд алдаа гарлаа." };
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "updated",
      "promotion",
      promotionId,
      undefined,
      `Сурталчилгаа "${name}" шинэчилсэн`,
    ),
  );

  revalidateEntities(["promotions"]);
  revalidateEntityTag("products", organizationId);
  return { success: true as const, error: undefined };
}

// ─── Toggle active ─────────────────────────────────────────────────────────

export async function togglePromotionActive(
  promotionId: string,
  isActive: boolean,
) {
  const ctx = await requireWriteAction("promotions.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const { data: promotion, error: fetchError } = await withDbCapture(
    "promotions: fetch for toggle",
    supabase
      .from("promotions")
      .select("name")
      .eq("id", promotionId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !promotion) {
    return { error: "Сурталчилгаа олдсонгүй." };
  }

  const { error } = await withDbCapture(
    "promotions: toggle active",
    supabase
      .from("promotions")
      .update({ is_active: isActive })
      .eq("id", promotionId)
      .eq("organization_id", organizationId),
  );

  if (error) {
    capture(error, { context: "togglePromotionActive" });
    return {
      error: `Төлөв шинэчлэхэд алдаа гарлаа: ${error.message}`,
    };
  }

  const action = isActive ? "Идэвхжүүлсэн" : "Идэвхгүйжүүлсэн";

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      isActive ? "activated" : "deactivated",
      "promotion",
      promotionId,
      { is_active: { old: !isActive, new: isActive } },
      `Сурталчилгаа "${promotion.name}" ${action}`,
    ),
  );

  revalidateEntities(["promotions"]);
  revalidateEntityTag("products", organizationId);
  return { success: true as const, error: undefined };
}

// ─── Delete ────────────────────────────────────────────────────────────────

export async function deletePromotion(promotionId: string) {
  const ctx = await requireWriteAction("promotions.delete");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  // Fetch promotion details for audit before deleting
  const { data: promotion, error: fetchError } = await withDbCapture(
    "promotions: fetch for delete",
    supabase
      .from("promotions")
      .select("name")
      .eq("id", promotionId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !promotion) {
    return { error: "Сурталчилгаа олдсонгүй." };
  }

  const { error } = await withDbCapture(
    "promotions: delete",
    supabase
      .from("promotions")
      .delete()
      .eq("id", promotionId)
      .eq("organization_id", organizationId),
  );

  if (error) {
    capture(error, { context: "deletePromotion: delete" });
    return {
      error: `Сурталчилгаа устгахад алдаа гарлаа: ${error.message}`,
    };
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "deleted",
      "promotion",
      promotionId,
      undefined,
      `Сурталчилгаа "${promotion.name}" устгасан`,
    ),
  );

  revalidateEntities(["promotions"]);
  revalidateEntityTag("products", organizationId);
  return { success: true as const, error: undefined };
}

// ─── Evaluate cart promotions (checkout) ───────────────────────────────────

export type EvaluatedPromotion = {
  promotion_id: string;
  promotion_name: string;
  promotion_type: string;
  reward_type: string;
  reward_amount: number;
  reward_product_id: string | null;
  stackable: boolean;
};

export type EvaluateCartResult = {
  promotions: EvaluatedPromotion[];
  total_discount: number;
  error?: string;
};

export async function evaluateCartPromotions(
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    category_id?: string;
  }>,
  subtotal: number,
): Promise<EvaluateCartResult> {
  const ctx = await requireWriteAction("sales.create");
  if ("error" in ctx) {
    return { promotions: [], total_discount: 0, error: ctx.error };
  }
  const { supabase, organizationId } = ctx;

  const { data, error } = await withDbCapture(
    "promotions: evaluate",
    supabase.rpc("evaluate_promotions", {
      p_org_id: organizationId,
      p_items: JSON.parse(
        JSON.stringify(
          items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            category_id: item.category_id ?? null,
          })),
        ),
      ),
      p_subtotal: subtotal,
    }),
  );

  if (error) {
    capture(error, { context: "evaluateCartPromotions: rpc" });
    return {
      promotions: [],
      total_discount: 0,
      error: `Сурталчилгаа үнэлэхэд алдаа гарлаа: ${error && typeof error === "object" && "message" in error ? String(error.message) : String(error)}`,
    };
  }

  // RPC returns: {"promotions": [...], "count": N}
  let evaluated: EvaluatedPromotion[] = [];

  try {
    const parsed: Record<string, unknown> =
      typeof data === "string"
        ? JSON.parse(data)
        : (data as Record<string, unknown>);
    const promoArr = parsed?.promotions;
    evaluated = (
      Array.isArray(promoArr) ? promoArr : []
    ) as EvaluatedPromotion[];
  } catch {
    capture({ data }, { context: "evaluateCartPromotions: parse result" });
    return {
      promotions: [],
      total_discount: 0,
      error: "Сурталчилгааны үр дүнг боловсруулахад алдаа гарлаа.",
    };
  }

  const totalDiscount = evaluated.reduce(
    (sum, p) => sum + Number(p.reward_amount),
    0,
  );

  return {
    promotions: evaluated,
    total_discount: totalDiscount,
  };
}
