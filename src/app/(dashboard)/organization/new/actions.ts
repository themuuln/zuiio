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

  // Use the DB function which handles org creation + role seeding in a transaction
  const { data: result, error: rpcError } = await supabase.rpc(
    "create_organization",
    {
      org_name: name,
      org_slug: slug,
      org_type: companyType,
    },
  );

  if (rpcError) {
    return {
      error: `Байгууллага үүсгэхэд алдаа гарлаа: ${rpcError.message}`,
    };
  }

  if (typeof result === "object" && result !== null && "error" in result) {
    return { error: (result as { error: string }).error };
  }

  revalidatePath("/");
  redirect("/");
}
