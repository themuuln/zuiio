"use server";

import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
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

  // Use service client for profile upsert (bypasses RLS)
  const serviceClient = createServiceClient();

  // Create or update profile (database trigger may auto-create on signup)
  const { error: profileError } = await serviceClient
    .from("profiles")
    .upsert({ id: user.id, full_name: fullName.trim() }, { onConflict: "id" });

  if (profileError) {
    return { error: `Профайл үүсгэхэд алдаа гарлаа: ${profileError.message}` };
  }

  // Create a default organization via RPC
  const defaultOrgName = `${fullName.trim()} - Байгууллага`;
  const slugBase = email
    .trim()
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-");
  const defaultSlug = `${slugBase}-org`;

  // Use the user's access token for RPC (requires auth context for auth.uid())
  const accessToken = authData.session?.access_token;
  let rpcError: { message: string } | null = null;
  if (accessToken) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    const userClient = createSupabaseJsClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const result = await userClient.rpc("create_organization", {
      org_name: defaultOrgName,
      org_slug: defaultSlug,
      org_type: "retail",
    });
    rpcError = result.error;
  } else {
    // Fallback: try with service client (may fail if RPC checks auth.uid())
    const result = await serviceClient.rpc("create_organization", {
      org_name: defaultOrgName,
      org_slug: defaultSlug,
      org_type: "retail",
    });
    rpcError = result.error;
  }

  if (rpcError) {
    return {
      error: `Байгууллага үүсгэхэд алдаа гарлаа: ${rpcError.message}`,
    };
  }

  redirect("/organization/new");
}
