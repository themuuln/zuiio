"use server";

import { capture } from "@zuiio/capture";
import { requireActionContext } from "@/lib/action-utils";
import { PRESET_CATEGORIES } from "@/lib/constants";
import { validateCategoryInput } from "@/lib/domain-rules";
import { revalidateEntity } from "@/lib/revalidate";
import { getString } from "@/lib/validation";

export async function createCategory(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireActionContext("categories.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const name = getString(formData, "name");

  const validationError = validateCategoryInput({ name });
  if (validationError) {
    return { error: validationError };
  }

  // Check for duplicate name
  const { data: existing, error: queryError } = await supabase
    .from("categories")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("name", name)
    .maybeSingle();
  if (queryError) {
    capture(queryError, {
      context: "categories: createCategory check duplicate",
    });
  }

  if (existing) {
    return { error: "Ийм нэртэй ангилал аль хэдийн бүртгэгдсэн байна." };
  }

  const { error } = await supabase.from("categories").insert({
    organization_id: organizationId,
    name,
    slug: "",
  });

  if (error) {
    capture(error, { context: "categories: createCategory" });
    return { error: error.message ?? "Ангилал үүсгэхэд алдаа гарлаа." };
  }

  revalidateEntity("categories");
  return { success: true as const };
}

export async function updateCategory(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireActionContext("categories.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const id = getString(formData, "id");
  const name = getString(formData, "name");

  if (!id) {
    return { error: "Ангиллын ID олдсонгүй." };
  }

  const validationError = validateCategoryInput({ name });
  if (validationError) {
    return { error: validationError };
  }

  // Check for duplicate name (exclude current category)
  const { data: existing, error: queryError } = await supabase
    .from("categories")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("name", name)
    .neq("id", id)
    .maybeSingle();
  if (queryError) {
    capture(queryError, {
      context: "categories: updateCategory check duplicate",
    });
  }

  if (existing) {
    return { error: "Ийм нэртэй ангилал аль хэдийн бүртгэгдсэн байна." };
  }

  const { error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    capture(error, { context: "categories: updateCategory" });
    return { error: error.message ?? "Ангилал хадгалахад алдаа гарлаа." };
  }

  revalidateEntity("categories");
  return { success: true as const };
}

export async function deleteCategory(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireActionContext("categories.delete");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const id = getString(formData, "id");

  if (!id) {
    return { error: "Ангиллын ID олдсонгүй." };
  }

  // Check that no products reference this category
  const { data: products, error: countError } = await supabase
    .from("products")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("category_id", id);

  if (countError) {
    capture(countError, { context: "categories: deleteCategory count" });
    return { error: countError.message };
  }

  if (products && products.length > 0) {
    return {
      error: `Энэ ангилалд ${products.length} бүтээгдэхүүн байгаа тул устгах боломжгүй.`,
    };
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    capture(error, { context: "categories: deleteCategory" });
    return { error: error.message ?? "Ангилал устгахад алдаа гарлаа." };
  }

  revalidateEntity("categories");
  return { success: true as const };
}

/**
 * Seed preset categories for the org's company type.
 * Skips names that already exist. Returns the number of categories created.
 */
export async function seedPresetCategories(): Promise<{
  seeded?: number;
  error?: string;
}> {
  const ctx = await requireActionContext("categories.create");
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, organizationId } = ctx;

  // Read the org's company type
  const { data: org } = await supabase
    .from("organizations")
    .select("company_type")
    .eq("id", organizationId)
    .single();

  const companyType = (org?.company_type as string) ?? "other";
  const presetNames =
    PRESET_CATEGORIES[companyType] ?? PRESET_CATEGORIES.other ?? [];

  if (presetNames.length === 0) return { seeded: 0 };

  // Fetch existing categories to avoid duplicates
  const { data: existingCats } = await supabase
    .from("categories")
    .select("name")
    .eq("organization_id", organizationId);

  const existingNames = new Set(existingCats?.map((c) => c.name) ?? []);
  const newCategories = presetNames
    .filter((name) => !existingNames.has(name))
    .map((name) => ({
      name,
      organization_id: organizationId,
      slug: "",
    }));

  if (newCategories.length === 0) return { seeded: 0 };

  const { error } = await supabase.from("categories").insert(newCategories);

  if (error) {
    capture(error, { context: "categories: seedPresetCategories" });
    return { error: error.message ?? "Ангилал үүсгэхэд алдаа гарлаа." };
  }

  revalidateEntity("categories");
  return { seeded: newCategories.length };
}
