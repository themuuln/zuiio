"use server";

import { requireActionContext } from "@/lib/action-utils";
import { revalidateEntity } from "@/lib/revalidate";
import { createServiceClient } from "@/lib/supabase/server-service";
import { capture } from "@zuiio/capture";

export async function inviteMember(formData: FormData) {
  const ctx = await requireActionContext("members.invite");
  if ("error" in ctx) return ctx;

  const email = formData.get("email") as string;
  if (!email?.trim()) {
    return { error: "И-мэйл хаяг шаардлагатай." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { error: "Зөв и-мэйл хаяг оруулна уу." };
  }

  const serviceClient = createServiceClient();

  // Check if user already exists in auth
  const { data: existingUsers } = await serviceClient.auth.admin.listUsers();
  const existingUser = existingUsers?.users.find(
    (u) => u.email === email.trim(),
  );

  if (existingUser) {
    // Check if user already belongs to another org
    const { data: existingProfile } = await ctx.supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("id", existingUser.id)
      .maybeSingle();

    if (existingProfile?.organization_id === ctx.organizationId) {
      return { error: "Энэ хэрэглэгч аль хэдийн байгууллагад байна." };
    }

    if (existingProfile?.organization_id) {
      return {
        error:
          "Энэ хэрэглэгч өөр байгууллагад бүртгэлтэй байна. Тэр байгууллагаас гарсны дараа урих боломжтой.",
      };
    }

    // User exists but has no org — add them
    const { error: updateError } = await ctx.supabase
      .from("profiles")
      .update({
        organization_id: ctx.organizationId,
        role: "staff",
      })
      .eq("id", existingUser.id);

  if (updateError) {
    capture(updateError, { context: "users: inviteMember updateProfile" });
    return { error: `Урилга илгээхэд алдаа гарлаа: ${updateError.message}` };
  }
  } else {
    // Create new auth user via invite
    const { data, error: inviteError } =
      await serviceClient.auth.admin.inviteUserByEmail(email.trim(), {
        data: { invited_by: ctx.userId },
      });

    if (inviteError) {
      return {
        error: `Урилга илгээхэд алдаа гарлаа: ${inviteError.message}`,
      };
    }

    if (!data?.user) {
      return { error: "Хэрэглэгч үүсгэхэд алдаа гарлаа." };
    }

    // Create profile with org membership
    const { error: profileError } = await ctx.supabase.from("profiles").insert({
      id: data.user.id,
      organization_id: ctx.organizationId,
      full_name: null,
    });

    if (profileError) {
      return {
        error: `Профайл үүсгэхэд алдаа гарлаа: ${profileError.message}`,
      };
    }
  }

  revalidateEntity("users");
  return { success: true };
}

export async function removeMember(formData: FormData) {
  const ctx = await requireActionContext("members.remove");
  if ("error" in ctx) return ctx;

  const profileId = formData.get("profile_id") as string;
  if (!profileId) {
    return { error: "Хэрэглэгч тодорхойгүй байна." };
  }

  // Cannot remove yourself
  if (profileId === ctx.userId) {
    return { error: "Та өөрийгөө хасах боломжгүй." };
  }

  const { error } = await ctx.supabase
    .from("profiles")
    .update({
      organization_id: null,
      role: null,
      role_id: null,
    })
    .eq("id", profileId)
    .eq("organization_id", ctx.organizationId);
  if (error) {
    capture(error, { context: "users: removeUser" });
    return { error: `Хасахад алдаа гарлаа: ${error.message}` };
  }

  revalidateEntity("users");
  return { success: true };
}

export async function getAuthUsers(): Promise<
  Array<{ id: string; email: string }>
> {
  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient.auth.admin.listUsers();
  if (error) {
    capture(error, { context: "settings users: getAuthUsers" });
    return [];
  }
  return data?.users?.map((u) => ({ id: u.id, email: u.email ?? "" })) ?? [];
}
