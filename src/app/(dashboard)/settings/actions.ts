"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/erp";

export async function updateOrganization(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { supabase, organizationId } = await requireAppContext();

  const name = formData.get("name");
  const slug = formData.get("slug");

  if (typeof name !== "string" || !name.trim()) {
    return { error: "Байгууллагын нэр шаардлагатай." };
  }

  if (typeof slug !== "string" || !slug.trim()) {
    return { error: "Байгууллагын холбоос шаардлагатай." };
  }

  if (slug.length < 3) {
    return { error: "Холбоос хамгийн багадаа 3 тэмдэгттэй байна." };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: "Холбоос зөвхөн англи үсэг, тоо, зураас агуулсан байна." };
  }

  const { error } = await supabase
    .from("organizations")
    .update({
      name: name.trim(),
      slug: slug.trim(),
    })
    .eq("id", organizationId);

  if (error) {
    return { error: `Шинэчлэхэд алдаа гарлаа: ${error.message}` };
  }

  revalidatePath("/settings");
  return { success: true as const };
}

export async function updateProfile(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { supabase, userId } = await requireAppContext();

  const fullName = formData.get("full_name");

  if (typeof fullName !== "string" || !fullName.trim()) {
    return { error: "Нэр шаардлагатай." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName.trim() })
    .eq("id", userId);

  if (error) {
    return { error: `Профайл шинэчлэхэд алдаа гарлаа: ${error.message}` };
  }

  revalidatePath("/settings");
  return { success: true as const };
}
