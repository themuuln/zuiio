"use server";

import { AppError, UnauthorizedError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { activateOrganizationAccess } from "@/lib/services/organization-access-service";

export interface CompleteOrganizationLoginState {
  error?: string;
  redirectTo?: string;
}

export async function completeOrganizationLogin(
  _prevState: CompleteOrganizationLoginState,
  formData: FormData,
): Promise<CompleteOrganizationLoginState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError();

  try {
    await activateOrganizationAccess({
      organizationId: String(formData.get("organizationId") ?? ""),
      pin: String(formData.get("pin") ?? ""),
      confirmPin: String(formData.get("confirmPin") ?? ""),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return { error: error.message };
    }

    return { error: "Unable to verify organization access" };
  }

  const redirectToUrl = formData.get("redirectTo") as string | null;
  return { redirectTo: redirectToUrl || "/dashboard/bay-view" };
}
