"use server";

import { revalidatePath } from "next/cache";
import { logAuditEventWithClient } from "@/lib/audit";
import { withBranchFilter } from "@/lib/branches";
import { checkPermission, requireAppContext } from "@/lib/erp";
import { getString } from "@/lib/validation";

function parseFloatSafe(value: FormDataEntryValue | null): number {
  if (typeof value !== "string") return 0;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function parseIntSafe(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function createDiscount(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const {
    supabase,
    organizationId,
    userId,
    branchId,
    isBranchScoped,
    permissions,
  } = await requireAppContext();
  const permError = checkPermission(permissions, "discounts.create");
  if (permError) return { error: permError };

  // Scoped users must have a branch
  if (isBranchScoped && !branchId) {
    return { error: "Салбар тодорхойгүй байна." };
  }

  const name = getString(formData, "name");
  const description = getString(formData, "description");
  const type = getString(formData, "type") as "percentage" | "fixed_amount";
  const value = parseFloatSafe(formData.get("value"));
  const appliesTo = getString(formData, "applies_to") as
    | "all"
    | "selected_products"
    | "selected_categories";
  const minPurchaseAmount = parseFloatSafe(formData.get("min_purchase_amount"));
  const validFrom = getString(formData, "valid_from");
  const validUntil = getString(formData, "valid_until");
  const isActive = formData.get("is_active") === "true";
  const usageLimit = parseIntSafe(formData.get("usage_limit"));
  const conditionsRaw = getString(formData, "conditions");

  // Validate
  if (!name) {
    return { error: "Нэр шаардлагатай." };
  }

  if (value <= 0) {
    return { error: "Утга 0-ээс их байх ёстой." };
  }

  if (type === "percentage" && value > 100) {
    return { error: "Хувийн хямдрал 100-аас хэтрэхгүй байх ёстой." };
  }

  if (!validFrom) {
    return { error: "Хүчинтэй эхлэх огноо шаардлагатай." };
  }

  if (!branchId) {
    return { error: "Салбар олдсонгүй." };
  }

  // Insert discount
  const { data: discount, error: discountError } = await supabase
    .from("discounts")
    .insert({
      organization_id: organizationId,
      branch_id: branchId,
      name,
      description: description || null,
      type,
      value,
      applies_to: appliesTo,
      min_purchase_amount: minPurchaseAmount,
      valid_from: validFrom,
      valid_until: validUntil || null,
      is_active: isActive,
      usage_limit: usageLimit,
      used_count: 0,
    })
    .select("id")
    .single();

  if (discountError) {
    return {
      error: `Хямдрал үүсгэхэд алдаа гарлаа: ${discountError.message}`,
    };
  }

  // Insert conditions if applies_to is selected_products or selected_categories
  if (
    (appliesTo === "selected_products" ||
      appliesTo === "selected_categories") &&
    conditionsRaw
  ) {
    let conditions: Array<{
      condition_type: string;
      condition_value: string;
    }> = [];
    try {
      conditions = JSON.parse(conditionsRaw);
    } catch {
      return { error: "Нөхцөлийн мэдээлэл буруу байна." };
    }

    if (conditions.length > 0) {
      const conditionRows = conditions.map((c) => ({
        discount_id: discount.id,
        condition_type: c.condition_type,
        condition_value: c.condition_value,
      }));

      const { error: condError } = await supabase
        .from("discount_conditions")
        .insert(conditionRows);

      if (condError) {
        // Clean up the discount
        await supabase.from("discounts").delete().eq("id", discount.id);
        return {
          error: `Нөхцөл хадгалахад алдаа гарлаа: ${condError.message}`,
        };
      }
    }
  }

  await logAuditEventWithClient(
    supabase,
    organizationId,
    userId,
    "created",
    "discount",
    discount.id,
    undefined,
    `Хямдрал "${name}" үүсгэсэн`,
  );

  revalidatePath("/discounts");
  revalidatePath("/");
  return { success: true as const };
}

export async function updateDiscount(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const {
    supabase,
    organizationId,
    userId,
    branchId,
    isBranchScoped,
    permissions,
  } = await requireAppContext();
  const permError = checkPermission(permissions, "discounts.update");
  if (permError) return { error: permError };

  const discountId = getString(formData, "id");
  if (!discountId) {
    return { error: "Хямдралын ID олдсонгүй." };
  }

  const name = getString(formData, "name");
  const description = getString(formData, "description");
  const type = getString(formData, "type") as "percentage" | "fixed_amount";
  const value = parseFloatSafe(formData.get("value"));
  const appliesTo = getString(formData, "applies_to") as
    | "all"
    | "selected_products"
    | "selected_categories";
  const minPurchaseAmount = parseFloatSafe(formData.get("min_purchase_amount"));
  const validFrom = getString(formData, "valid_from");
  const validUntil = getString(formData, "valid_until");
  const isActive = formData.get("is_active") === "true";
  const usageLimit = parseIntSafe(formData.get("usage_limit"));
  const conditionsRaw = getString(formData, "conditions");

  // Validate
  if (!name) {
    return { error: "Нэр шаардлагатай." };
  }

  if (value <= 0) {
    return { error: "Утга 0-ээс их байх ёстой." };
  }

  if (!validFrom) {
    return { error: "Хүчинтэй эхлэх огноо шаардлагатай." };
  }

  // Update discount — enforce branch access if scoped
  let query = supabase
    .from("discounts")
    .update({
      name,
      description: description || null,
      type,
      value,
      applies_to: appliesTo,
      min_purchase_amount: minPurchaseAmount,
      valid_from: validFrom,
      valid_until: validUntil || null,
      is_active: isActive,
      usage_limit: usageLimit,
    })
    .eq("id", discountId)
    .eq("organization_id", organizationId);

  if (isBranchScoped && branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { error: discountError } = await query;

  if (discountError) {
    return {
      error: `Хямдрал шинэчлэхэд алдаа гарлаа: ${discountError.message}`,
    };
  }

  // Replace conditions
  if (
    appliesTo === "selected_products" ||
    appliesTo === "selected_categories"
  ) {
    // Delete existing conditions
    await supabase
      .from("discount_conditions")
      .delete()
      .eq("discount_id", discountId);

    // Insert new conditions
    if (conditionsRaw) {
      let conditions: Array<{
        condition_type: string;
        condition_value: string;
      }> = [];
      try {
        conditions = JSON.parse(conditionsRaw);
      } catch {
        return { error: "Нөхцөлийн мэдээлэл буруу байна." };
      }

      if (conditions.length > 0) {
        const conditionRows = conditions.map((c) => ({
          discount_id: discountId,
          condition_type: c.condition_type,
          condition_value: c.condition_value,
        }));

        const { error: condError } = await supabase
          .from("discount_conditions")
          .insert(conditionRows);

        if (condError) {
          return {
            error: `Нөхцөл хадгалахад алдаа гарлаа: ${condError.message}`,
          };
        }
      }
    }
  } else {
    // "all" — delete any existing conditions
    await supabase
      .from("discount_conditions")
      .delete()
      .eq("discount_id", discountId);
  }

  await logAuditEventWithClient(
    supabase,
    organizationId,
    userId,
    "updated",
    "discount",
    discountId,
    undefined,
    `Хямдрал "${name}" шинэчилсэн`,
  );

  revalidatePath("/discounts");
  revalidatePath("/");
  return { success: true as const };
}

export async function toggleDiscountActive(
  discountId: string,
  isActive: boolean,
) {
  const {
    supabase,
    organizationId,
    userId,
    branchId,
    isBranchScoped,
    permissions,
  } = await requireAppContext();
  const permError = checkPermission(permissions, "discounts.update");
  if (permError) return { error: permError };

  // Enforce branch access when fetching the record
  let fetchQuery = supabase
    .from("discounts")
    .select("name, branch_id")
    .eq("id", discountId)
    .eq("organization_id", organizationId);

  if (isBranchScoped && branchId) {
    fetchQuery = fetchQuery.eq("branch_id", branchId);
  }

  const { data: discount, error: fetchError } = await fetchQuery.single();

  if (fetchError || !discount) {
    return { error: "Хямдрал олдсонгүй." };
  }

  let updateQuery = supabase
    .from("discounts")
    .update({ is_active: isActive })
    .eq("id", discountId)
    .eq("organization_id", organizationId);

  if (isBranchScoped && branchId) {
    updateQuery = updateQuery.eq("branch_id", branchId);
  }

  const { error } = await updateQuery;

  if (error) {
    return {
      error: `Төлөв шинэчлэхэд алдаа гарлаа: ${error.message}`,
    };
  }

  const action = isActive ? "Идэвхжүүлсэн" : "Идэвхгүйжүүлсэн";

  await logAuditEventWithClient(
    supabase,
    organizationId,
    userId,
    isActive ? "activated" : "deactivated",
    "discount",
    discountId,
    { is_active: { old: !isActive, new: isActive } },
    `Хямдрал "${discount.name}" ${action}`,
  );

  revalidatePath("/discounts");
  revalidatePath("/");
  return { success: true as const };
}

export async function applyDiscount(formData: FormData) {
  const { supabase, organizationId, branchId, isBranchScoped } =
    await requireAppContext();

  const discountId = getString(formData, "discount_id");
  const cartTotal = parseFloatSafe(formData.get("cart_total"));

  if (!discountId) {
    return { error: "Хямдралын ID олдсонгүй." };
  }

  if (cartTotal <= 0) {
    return { error: "Сагсны дүн буруу байна." };
  }

  // Fetch discount
  let fetchQuery = supabase
    .from("discounts")
    .select("*")
    .eq("id", discountId)
    .eq("organization_id", organizationId);

  fetchQuery = withBranchFilter(fetchQuery, branchId, isBranchScoped);

  const { data: discount, error: discountError } = await fetchQuery.single();

  if (discountError || !discount) {
    return { error: "Хямдрал олдсонгүй." };
  }

  // Validate: is_active
  if (!discount.is_active) {
    return { error: "Хямдрал идэвхгүй байна." };
  }

  // Validate: within valid dates
  const today = new Date().toISOString().slice(0, 10);
  if (discount.valid_from && today < discount.valid_from) {
    return { error: "Хямдралын хугацаа эхлээгүй байна." };
  }
  if (discount.valid_until && today > discount.valid_until) {
    return { error: "Хямдралын хугацаа дууссан." };
  }

  // Validate: usage limit
  if (
    discount.usage_limit !== null &&
    discount.used_count >= discount.usage_limit
  ) {
    return { error: "Хямдралын ашиглах хязгаар дууссан." };
  }

  // Validate: min purchase amount
  if (cartTotal < discount.min_purchase_amount) {
    return {
      error: `Хамгийн бага худалдан авалтын дүн: ${discount.min_purchase_amount.toLocaleString()}₮`,
    };
  }

  // Calculate discount amount
  let discountAmount: number;
  if (discount.type === "percentage") {
    discountAmount = cartTotal * (discount.value / 100);
  } else {
    // fixed_amount — cannot exceed cart total
    discountAmount = Math.min(discount.value, cartTotal);
  }

  const totalAfterDiscount = Math.max(0, cartTotal - discountAmount);

  // Increment used_count
  await supabase
    .from("discounts")
    .update({ used_count: discount.used_count + 1 })
    .eq("id", discountId);

  return {
    discountAmount,
    totalAfterDiscount,
    discount: {
      id: discount.id,
      name: discount.name,
      description: discount.description,
      type: discount.type,
      value: discount.value,
    },
  };
}
