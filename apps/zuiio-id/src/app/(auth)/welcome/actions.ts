"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/lib/auth/action-state";

export async function completeWelcome(
  _previous: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();

  const fieldErrors: Record<string, string[]> = {};

  if (!fullName || fullName.length > 80) {
    fieldErrors.fullName = ["Нэр 1-80 тэмдэгт байх ёстой."];
  }

  if (!username || username.length < 3 || username.length > 32) {
    fieldErrors.username = ["Хэрэглэгчийн нэр 3-32 тэмдэгт байх ёстой."];
  } else if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(username)) {
    fieldErrors.username = [
      "Латин үсэг, тоо, . _ - тэмдэгтээс бүрдэх ёстой.",
    ];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, username })
    .eq("id", user.id);

  if (error) {
    if (error.message.includes("duplicate") || error.code === "23505") {
      return {
        formError: "Энэ хэрэглэгчийн нэр аль хэдийн ашиглагдаж байна.",
      };
    }
    return { formError: "Хадгалахад алдаа гарлаа." };
  }

  return { redirectTo: "/account" };
}
