"use server";

import { capture, withDbCapture } from "@zuiio/capture";
import { after } from "next/server";
import { requireAppContext, requireWriteAction } from "@/lib/action-utils";
import { logAuditEventWithClient } from "@/lib/audit";
import { revalidateEntities } from "@/lib/revalidate";
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

/** Parse a JSON string array (product_ids / category_ids) from the form. */
function getJSONArray(formData: FormData, key: string): string[] {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw === "") return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

// ─── Create ────────────────────────────────────────────────────────────────

export async function createCoupon(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("coupons.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const code = getString(formData, "code");
  const discountType = getString(formData, "discount_type") as
    | "percentage"
    | "fixed_amount";
  const discountValue = parseFloatSafe(formData.get("discount_value"));
  const minPurchaseAmount = parseFloatSafe(formData.get("min_purchase_amount"));
  const maxDiscountAmountRaw = formData.get("max_discount_amount");
  const maxDiscountAmount =
    typeof maxDiscountAmountRaw === "string" && maxDiscountAmountRaw !== ""
      ? Number.parseFloat(maxDiscountAmountRaw)
      : null;
  const validFrom = getString(formData, "valid_from");
  const validUntil = getString(formData, "valid_until");
  const usageLimit = parseIntSafe(formData.get("usage_limit"));
  const perCustomerLimitRaw = formData.get("per_customer_limit");
  const perCustomerLimit =
    typeof perCustomerLimitRaw === "string" && perCustomerLimitRaw !== ""
      ? Number.parseInt(perCustomerLimitRaw, 10)
      : 1;
  const appliesTo = getString(formData, "applies_to") as
    | "all"
    | "selected_products"
    | "selected_categories";
  const isActive = formData.get("is_active") === "true";
  const description = getString(formData, "description");

  // Validate
  if (!code) {
    return { error: "Код шаардлагатай." };
  }

  if (!/^[A-Za-z0-9_-]+$/.test(code)) {
    return {
      error: "Код зөвхөн үсэг, тоо, зураас, доогуур зураас агуулж болно.",
    };
  }

  if (discountValue <= 0) {
    return { error: "Хөнгөлөлтийн утга 0-ээс их байх ёстой." };
  }

  if (discountType === "percentage" && discountValue > 100) {
    return { error: "Хувийн хөнгөлөлт 100-аас хэтрэхгүй байх ёстой." };
  }

  if (!validFrom) {
    return { error: "Хүчинтэй эхлэх огноо шаардлагатай." };
  }

  const productIds = getJSONArray(formData, "product_ids");
  const categoryIds = getJSONArray(formData, "category_ids");

  if (appliesTo === "selected_products" && productIds.length === 0) {
    return { error: "Дор хаяж нэг бараа сонгоно уу." };
  }
  if (appliesTo === "selected_categories" && categoryIds.length === 0) {
    return { error: "Дор хаяж нэг ангилал сонгоно уу." };
  }

  // Check for duplicate code within organization
  const { data: existing } = await withDbCapture(
    "coupons: check duplicate code",
    supabase
      .from("coupons")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("code", code)
      .maybeSingle(),
  );

  if (existing) {
    return { error: `"${code}" кодтой купон аль хэдийн бүртгэгдсэн байна.` };
  }

  const { data: coupon, error: couponError } = await withDbCapture(
    "coupons: create",
    supabase
      .from("coupons")
      .insert({
        organization_id: organizationId,
        code,
        discount_type: discountType,
        discount_value: discountValue,
        min_purchase_amount: minPurchaseAmount,
        max_discount_amount: Number.isFinite(maxDiscountAmount)
          ? maxDiscountAmount
          : null,
        valid_from: validFrom,
        valid_until: validUntil || null,
        usage_limit: usageLimit,
        per_customer_limit: perCustomerLimit,
        applies_to: appliesTo,
        is_active: isActive,
        description: description || null,
      })
      .select("id")
      .single(),
  );

  if (couponError) {
    return {
      error: `Купон үүсгэхэд алдаа гарлаа: ${couponError.message}`,
    };
  }

  if (appliesTo === "selected_products") {
    const { error: scopeError } = await withDbCapture(
      "coupons: insert product scope",
      supabase.from("coupon_product_scope").insert(
        productIds.map((productId) => ({
          organization_id: organizationId,
          coupon_id: coupon.id,
          product_id: productId,
        })),
      ),
    );
    if (scopeError) {
      capture(scopeError, { context: "createCoupon: insert product scope" });
      return { error: "Сонгосон бараануудыг хадгалахад алдаа гарлаа." };
    }
  } else if (appliesTo === "selected_categories") {
    const { error: scopeError } = await withDbCapture(
      "coupons: insert category scope",
      supabase.from("coupon_category_scope").insert(
        categoryIds.map((categoryId) => ({
          organization_id: organizationId,
          coupon_id: coupon.id,
          category_id: categoryId,
        })),
      ),
    );
    if (scopeError) {
      capture(scopeError, { context: "createCoupon: insert category scope" });
      return { error: "Сонгосон ангилалуудыг хадгалахад алдаа гарлаа." };
    }
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "created",
      "coupon",
      coupon.id,
      undefined,
      `Купон "${code}" үүсгэсэн`,
    ),
  );

  revalidateEntities(["coupons"]);
  return { success: true as const, error: undefined };
}

// ─── Update ────────────────────────────────────────────────────────────────

export async function updateCoupon(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("coupons.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const couponId = getString(formData, "id");
  if (!couponId) {
    return { error: "Купоны ID олдсонгүй." };
  }

  const code = getString(formData, "code");
  const discountType = getString(formData, "discount_type") as
    | "percentage"
    | "fixed_amount";
  const discountValue = parseFloatSafe(formData.get("discount_value"));
  const minPurchaseAmount = parseFloatSafe(formData.get("min_purchase_amount"));
  const maxDiscountAmountRaw = formData.get("max_discount_amount");
  const maxDiscountAmount =
    typeof maxDiscountAmountRaw === "string" && maxDiscountAmountRaw !== ""
      ? Number.parseFloat(maxDiscountAmountRaw)
      : null;
  const validFrom = getString(formData, "valid_from");
  const validUntil = getString(formData, "valid_until");
  const usageLimit = parseIntSafe(formData.get("usage_limit"));
  const perCustomerLimitRaw = formData.get("per_customer_limit");
  const perCustomerLimit =
    typeof perCustomerLimitRaw === "string" && perCustomerLimitRaw !== ""
      ? Number.parseInt(perCustomerLimitRaw, 10)
      : 1;
  const appliesTo = getString(formData, "applies_to") as
    | "all"
    | "selected_products"
    | "selected_categories";
  const isActive = formData.get("is_active") === "true";
  const description = getString(formData, "description");

  // Validate
  if (!code) {
    return { error: "Код шаардлагатай." };
  }

  if (!/^[A-Za-z0-9_-]+$/.test(code)) {
    return {
      error: "Код зөвхөн үсэг, тоо, зураас, доогуур зураас агуулж болно.",
    };
  }

  if (discountValue <= 0) {
    return { error: "Хөнгөлөлтийн утга 0-ээс их байх ёстой." };
  }

  if (discountType === "percentage" && discountValue > 100) {
    return { error: "Хувийн хөнгөлөлт 100-аас хэтрэхгүй байх ёстой." };
  }

  if (!validFrom) {
    return { error: "Хүчинтэй эхлэх огноо шаардлагатай." };
  }

  const productIds = getJSONArray(formData, "product_ids");
  const categoryIds = getJSONArray(formData, "category_ids");

  if (appliesTo === "selected_products" && productIds.length === 0) {
    return { error: "Дор хаяж нэг бараа сонгоно уу." };
  }
  if (appliesTo === "selected_categories" && categoryIds.length === 0) {
    return { error: "Дор хаяж нэг ангилал сонгоно уу." };
  }

  // Check for duplicate code within organization (exclude current coupon)
  const { data: existing } = await withDbCapture(
    "coupons: check duplicate code on update",
    supabase
      .from("coupons")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("code", code)
      .neq("id", couponId)
      .maybeSingle(),
  );

  if (existing) {
    return { error: `"${code}" кодтой купон аль хэдийн бүртгэгдсэн байна.` };
  }

  const { error: couponError } = await withDbCapture(
    "coupons: update",
    supabase
      .from("coupons")
      .update({
        code,
        discount_type: discountType,
        discount_value: discountValue,
        min_purchase_amount: minPurchaseAmount,
        max_discount_amount: Number.isFinite(maxDiscountAmount)
          ? maxDiscountAmount
          : null,
        valid_from: validFrom,
        valid_until: validUntil || null,
        usage_limit: usageLimit,
        per_customer_limit: perCustomerLimit,
        applies_to: appliesTo,
        is_active: isActive,
        description: description || null,
      })
      .eq("id", couponId)
      .eq("organization_id", organizationId),
  );

  if (couponError) {
    return {
      error: `Купон шинэчлэхэд алдаа гарлаа: ${couponError.message}`,
    };
  }

  // Replace scope rows: applies_to may have changed between all /
  // selected_products / selected_categories, so clear BOTH scope tables
  // first (delete + insert like the promotions actions), then persist the
  // selection for the current scope type.
  const { error: delProductScopeError } = await withDbCapture(
    "coupons: delete old product scope",
    supabase.from("coupon_product_scope").delete().eq("coupon_id", couponId),
  );
  if (delProductScopeError) {
    capture(delProductScopeError, {
      context: "updateCoupon: delete product scope",
    });
    return { error: "Сонгосон бараануудыг шинэчлэхэд алдаа гарлаа." };
  }

  const { error: delCategoryScopeError } = await withDbCapture(
    "coupons: delete old category scope",
    supabase.from("coupon_category_scope").delete().eq("coupon_id", couponId),
  );
  if (delCategoryScopeError) {
    capture(delCategoryScopeError, {
      context: "updateCoupon: delete category scope",
    });
    return { error: "Сонгосон ангилалуудыг шинэчлэхэд алдаа гарлаа." };
  }

  if (appliesTo === "selected_products" && productIds.length > 0) {
    const { error: scopeError } = await withDbCapture(
      "coupons: insert product scope",
      supabase.from("coupon_product_scope").insert(
        productIds.map((productId) => ({
          organization_id: organizationId,
          coupon_id: couponId,
          product_id: productId,
        })),
      ),
    );
    if (scopeError) {
      capture(scopeError, { context: "updateCoupon: insert product scope" });
      return { error: "Сонгосон бараануудыг хадгалахад алдаа гарлаа." };
    }
  } else if (appliesTo === "selected_categories" && categoryIds.length > 0) {
    const { error: scopeError } = await withDbCapture(
      "coupons: insert category scope",
      supabase.from("coupon_category_scope").insert(
        categoryIds.map((categoryId) => ({
          organization_id: organizationId,
          coupon_id: couponId,
          category_id: categoryId,
        })),
      ),
    );
    if (scopeError) {
      capture(scopeError, { context: "updateCoupon: insert category scope" });
      return { error: "Сонгосон ангилалуудыг хадгалахад алдаа гарлаа." };
    }
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "updated",
      "coupon",
      couponId,
      undefined,
      `Купон "${code}" шинэчилсэн`,
    ),
  );

  revalidateEntities(["coupons"]);
  return { success: true as const, error: undefined };
}

// ─── Toggle active ─────────────────────────────────────────────────────────

export async function toggleCouponActive(couponId: string, isActive: boolean) {
  const ctx = await requireWriteAction("coupons.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const { data: coupon, error: fetchError } = await withDbCapture(
    "coupons: fetch for toggle",
    supabase
      .from("coupons")
      .select("code")
      .eq("id", couponId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !coupon) {
    return { error: "Купон олдсонгүй." };
  }

  const { error } = await withDbCapture(
    "coupons: toggle active",
    supabase
      .from("coupons")
      .update({ is_active: isActive })
      .eq("id", couponId)
      .eq("organization_id", organizationId),
  );

  if (error) {
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
      "coupon",
      couponId,
      { is_active: { old: !isActive, new: isActive } },
      `Купон "${coupon.code}" ${action}`,
    ),
  );

  revalidateEntities(["coupons"]);
  return { success: true as const, error: undefined };
}

// ─── Delete ────────────────────────────────────────────────────────────────

export async function deleteCoupon(couponId: string) {
  const ctx = await requireWriteAction("coupons.delete");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  // Fetch coupon details for audit before deleting
  const { data: coupon, error: fetchError } = await withDbCapture(
    "coupons: fetch for delete",
    supabase
      .from("coupons")
      .select("code")
      .eq("id", couponId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !coupon) {
    return { error: "Купон олдсонгүй." };
  }

  const { error } = await withDbCapture(
    "coupons: delete",
    supabase
      .from("coupons")
      .delete()
      .eq("id", couponId)
      .eq("organization_id", organizationId),
  );

  if (error) {
    capture(error, { context: "deleteCoupon: delete" });
    return { error: `Купон устгахад алдаа гарлаа: ${error.message}` };
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "deleted",
      "coupon",
      couponId,
      undefined,
      `Купон "${coupon.code}" устгасан`,
    ),
  );

  revalidateEntities(["coupons"]);
  return { success: true as const, error: undefined };
}

// ─── Public validation (checkout) ──────────────────────────────────────────

export type CouponValidationResult = {
  valid: boolean;
  discount_amount: number;
  coupon_id: string;
  coupon_code: string;
  error?: string;
};

export async function validateCouponCode(
  code: string,
  organizationId: string,
  contactId?: string,
  cartTotal?: number,
  productIds?: string[],
): Promise<CouponValidationResult> {
  const ctx = await requireAppContext();
  const { supabase } = ctx;

  if (!code) {
    return {
      valid: false,
      discount_amount: 0,
      coupon_id: "",
      coupon_code: code,
      error: "Купон код шаардлагатай.",
    };
  }

  if (!organizationId) {
    return {
      valid: false,
      discount_amount: 0,
      coupon_id: "",
      coupon_code: code,
      error: "Байгууллага олдсонгүй.",
    };
  }

  // Fetch coupon
  const { data: coupon, error: couponError } = await withDbCapture(
    "coupons: validate fetch",
    supabase
      .from("coupons")
      .select(
        "id, code, discount_type, discount_value, max_discount_amount, min_purchase_amount, valid_from, valid_until, usage_limit, used_count, per_customer_limit, is_active",
      )
      .eq("code", code)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (couponError || !coupon) {
    return {
      valid: false,
      discount_amount: 0,
      coupon_id: "",
      coupon_code: code,
      error: "Купон олдсонгүй.",
    };
  }

  // Validate: is_active
  if (!coupon.is_active) {
    return {
      valid: false,
      discount_amount: 0,
      coupon_id: coupon.id,
      coupon_code: coupon.code,
      error: "Купон идэвхгүй байна.",
    };
  }

  // Validate: not expired
  const now = new Date();
  const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
  const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

  if (validFrom && now < validFrom) {
    return {
      valid: false,
      discount_amount: 0,
      coupon_id: coupon.id,
      coupon_code: coupon.code,
      error: "Купоны хугацаа эхлээгүй байна.",
    };
  }

  if (validUntil && now > validUntil) {
    return {
      valid: false,
      discount_amount: 0,
      coupon_id: coupon.id,
      coupon_code: coupon.code,
      error: "Купоны хугацаа дууссан.",
    };
  }

  // Validate: global usage limit
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    return {
      valid: false,
      discount_amount: 0,
      coupon_id: coupon.id,
      coupon_code: coupon.code,
      error: "Купоны ашиглах хязгаар дууссан.",
    };
  }

  // Validate: per-customer usage limit
  if (contactId && coupon.per_customer_limit !== null) {
    const { count: usageCount, error: countError } = await withDbCapture(
      "coupons: check per-customer usage",
      supabase
        .from("coupon_usage")
        .select("*", { count: "exact", head: true })
        .eq("coupon_id", coupon.id)
        .eq("contact_id", contactId),
    );

    if (countError) {
      capture(countError, {
        context: "validateCouponCode: per-customer usage count",
      });
    }

    if (usageCount !== null && usageCount >= (coupon.per_customer_limit ?? 1)) {
      return {
        valid: false,
        discount_amount: 0,
        coupon_id: coupon.id,
        coupon_code: coupon.code,
        error: "Та энэ купоныг хамгийн ихдээ ашигласан байна.",
      };
    }
  }

  // Validate: minimum purchase amount
  const total = cartTotal ?? 0;
  if (total < coupon.min_purchase_amount) {
    return {
      valid: false,
      discount_amount: 0,
      coupon_id: coupon.id,
      coupon_code: coupon.code,
      error: `Хамгийн бага захиалгын дүн: ${Number(coupon.min_purchase_amount).toLocaleString()}₮`,
    };
  }

  // Calculate discount amount
  let discountAmount: number;
  if (coupon.discount_type === "percentage") {
    discountAmount = total * (coupon.discount_value / 100);
    // Apply max_discount_amount cap if set
    if (coupon.max_discount_amount !== null) {
      discountAmount = Math.min(
        discountAmount,
        Number(coupon.max_discount_amount),
      );
    }
  } else {
    // fixed_amount — cannot exceed cart total
    discountAmount = Math.min(Number(coupon.discount_value), total);
  }

  return {
    valid: true,
    discount_amount: discountAmount,
    coupon_id: coupon.id,
    coupon_code: coupon.code,
  };
}
