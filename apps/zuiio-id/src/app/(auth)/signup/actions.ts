"use server";

import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/lib/auth/action-state";
import { signContinuation } from "@/lib/auth/continuation";
import { getSsoProduct, type ProductId } from "@config/sso-products";

/**
 * Server Action: register a new central identity.
 *
 * Validates username (optional, format-checked), email, password,
 * and creates the user via Supabase Auth. The `handle_new_user`
 * trigger on auth.users will create the profile row.
 *
 * If `product` and `return_to` are provided, signs a continuation
 * token so the callback can redirect back to the product after
 * identity creation.
 */
export async function signup(
  _previous: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const product = formData.get("product") as string | null;
  const returnTo = formData.get("return_to") as string | null;

  const fieldErrors: Record<string, string[]> = {};

  if (!fullName || fullName.length > 80) {
    fieldErrors.fullName = ["Нэр 1-80 тэмдэгт байх ёстой."];
  }

  if (username) {
    if (username.length < 3 || username.length > 32) {
      fieldErrors.username = ["Нэр 3-32 тэмдэгт байх ёстой."];
    } else if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(username)) {
      fieldErrors.username = [
        "Нэр латин үсэг, тоо, . _ - тэмдэгтээс бүрдэх ёстой.",
      ];
    } else if (
      [
        "admin",
        "api",
        "auth",
        "login",
        "root",
        "signup",
        "support",
        "system",
        "zuiio",
      ].includes(username)
    ) {
      fieldErrors.username = ["Энэ нэрийг ашиглах боломжгүй."];
    }
  }

  if (!email || !email.includes("@")) {
    fieldErrors.email = ["Зөв имэйл хаяг оруулна уу."];
  }

  if (password.length < 8) {
    fieldErrors.password = ["Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой."];
  }

  if (password !== confirmPassword) {
    fieldErrors.confirmPassword = ["Нууц үг таарахгүй байна."];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        ...(username ? { username } : {}),
      },
    },
  });

  if (error) {
    if (error.message.includes("already")) {
      return { formError: "Энэ имэйл аль хэдийн бүртгэлтэй." };
    }
    return { formError: "Бүртгүүлэхэд алдаа гарлаа. Дахин оролдоно уу." };
  }

  // If product continuation is present, sign and redirect back
  if (product && returnTo) {
    const ssoProduct = getSsoProduct(product as ProductId);
    if (ssoProduct) {
      const { token } = signContinuation(product as ProductId, returnTo);
      return {
        redirectTo: `/auth/callback?continuation=${token}`,
      };
    }
  }

  return { redirectTo: "/account" };
}
