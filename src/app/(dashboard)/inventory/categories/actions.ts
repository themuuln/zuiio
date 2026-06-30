"use server";

import { requireActionContext } from "@/lib/action-utils";
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
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("name", name)
    .maybeSingle();

  if (existing) {
    return { error: "Ийм нэртэй ангилал аль хэдийн бүртгэгдсэн байна." };
  }

  const { error } = await supabase.from("categories").insert({
    organization_id: organizationId,
    name,
  });

  if (error) {
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
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("name", name)
    .neq("id", id)
    .maybeSingle();

  if (existing) {
    return { error: "Ийм нэртэй ангилал аль хэдийн бүртгэгдсэн байна." };
  }

  const { error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
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
    return { error: error.message ?? "Ангилал устгахад алдаа гарлаа." };
  }

  revalidateEntity("categories");
  return { success: true as const };
}
