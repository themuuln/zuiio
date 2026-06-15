"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server-service";

export async function register(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const supabase = await createClient();

  const fullName = formData.get("full_name");
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof fullName !== "string" || !fullName.trim()) {
    return { error: "Нэр шаардлагатай." };
  }

  if (typeof email !== "string" || !email.trim()) {
    return { error: "И-мэйл хаяг шаардлагатай." };
  }

  if (typeof password !== "string" || !password) {
    return { error: "Нууц үг шаардлагатай." };
  }

  if (password.length < 8) {
    return { error: "Нууц үг хамгийн багадаа 8 тэмдэгттэй байна." };
  }

  // Create auth user via Supabase Auth
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });

  if (signUpError) {
    return { error: `Бүртгүүлэхэд алдаа гарлаа: ${signUpError.message}` };
  }

  const user = authData.user;
  if (!user) {
    return { error: "Хэрэглэгч үүсгэхэд алдаа гарлаа." };
  }

  // Use service client for admin operations (bypasses RLS)
  const serviceClient = createServiceClient();

  // Create profile
  const { error: profileError } = await serviceClient.from("profiles").insert({
    id: user.id,
    full_name: fullName.trim(),
  });

  if (profileError) {
    return { error: `Профайл үүсгэхэд алдаа гарлаа: ${profileError.message}` };
  }

  // Create a default organization via RPC
  const defaultOrgName = `${fullName.trim()} - Байгууллага`;
  const slugBase = email.trim().split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
  const defaultSlug = `${slugBase}-org`;

  const { error: rpcError } = await serviceClient.rpc("create_organization", {
    org_name: defaultOrgName,
    org_slug: defaultSlug,
    org_type: "retail",
  });

  if (rpcError) {
    return {
      error: `Байгууллага үүсгэхэд алдаа гарлаа: ${rpcError.message}`,
    };
  }

  redirect("/organization/new");
}
