"use server";

import { inviteToOrganization } from "@/lib/organizations";
import { createClient } from "@/lib/supabase/server";

export interface InviteState {
  formError?: string;
  success?: boolean;
}

export async function inviteMember(
  _previous: InviteState | undefined,
  formData: FormData,
): Promise<InviteState> {
  const orgId = String(formData.get("orgId") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "member");

  if (!orgId) {
    return { formError: "Байгууллага сонгоно уу." };
  }

  if (!email?.includes("@")) {
    return { formError: "Зөв имэйл хаяг оруулна уу." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { formError: "Нэвтрэх шаардлагатай." };
  }

  try {
    await inviteToOrganization(orgId, email, role, user.id);
    return { success: true };
  } catch (err) {
    return {
      formError:
        err instanceof Error ? err.message : "Урилга илгээхэд алдаа гарлаа.",
    };
  }
}
