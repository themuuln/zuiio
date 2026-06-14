"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateOrganizationInput } from "@/lib/domain-rules";
import { slugify } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getString } from "@/lib/validation";

export async function createOrganization(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const supabase = await createClient();

  const name = getString(formData, "name");
  const slug = slugify(getString(formData, "slug"));
  const orgType = getString(formData, "company_type") || "retail";

  const validationError = validateOrganizationInput({ name, slug });
  if (validationError) {
    return { error: validationError };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Нэвтрэх шаардлагатай" };
  }

  const { data: result, error: rpcError } = await supabase.rpc(
    "create_organization",
    { org_name: name, org_slug: slug, org_type: orgType },
  );

  if (rpcError) {
    if (rpcError.message?.includes("23505") || rpcError.code === "23505") {
      return { error: "Энэ холбоос аль хэдийн бүртгэгдсэн байна" };
    }
    return { error: rpcError.message };
  }

  const rpcResult = result as { error?: string; id?: string } | null;
  if (rpcResult?.error) {
    if (rpcResult.error === "User already has an organization") {
      redirect("/");
    }
    return { error: rpcResult.error };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
