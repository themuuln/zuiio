"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface ProfileUpdateState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  success?: boolean;
}

export async function updateProfile(
  _previous: ProfileUpdateState | undefined,
  formData: FormData,
): Promise<ProfileUpdateState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();

  const fieldErrors: Record<string, string[]> = {};

  if (!fullName || fullName.length > 80) {
    fieldErrors.fullName = ["Нэр 1-80 тэмдэгт байх ёстой."];
  }

  if (username.length < 3 || username.length > 32) {
    fieldErrors.username = ["Нэр 3-32 тэмдэгт байх ёстой."];
  } else if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(username)) {
    fieldErrors.username = [
      "Нэр латин үсэг, тоо, . _ - тэмдэгтээс бүрдэх ёстой.",
    ];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, username })
    .eq("id", user.id);

  if (error) {
    if (error.message.includes("duplicate") || error.code === "23505") {
      return { formError: "Энэ нэр аль хэдийн ашиглагдаж байна." };
    }
    return { formError: "Шинэчлэхэд алдаа гарлаа." };
  }

  return { success: true };
}
