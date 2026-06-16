"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export async function createOrganization(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Нэвтрэх шаардлагатай." };
  }

  const nameRaw = formData.get("name");
  const companyTypeRaw = formData.get("company_type");

  if (typeof nameRaw !== "string" || !nameRaw.trim()) {
    return { error: "Байгууллагын нэр шаардлагатай." };
  }

  const name = nameRaw.trim();
  const companyType =
    typeof companyTypeRaw === "string" ? companyTypeRaw : "retail";

  const slugRaw = formData.get("slug");
  const slug =
    typeof slugRaw === "string" && slugRaw.trim()
      ? slugRaw.trim()
      : slugify(name);

  // Create organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name,
      slug,
      company_type: companyType,
    })
    .select("id")
    .single();

  if (orgError) {
    return { error: `Байгууллага үүсгэхэд алдаа гарлаа: ${orgError.message}` };
  }

  // Update user's profile with organization
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ organization_id: org.id })
    .eq("id", user.id);

  if (profileError) {
    return {
      error: `Профайл шинэчлэхэд алдаа гарлаа: ${profileError.message}`,
    };
  }

  revalidatePath("/");
  redirect("/");
}
