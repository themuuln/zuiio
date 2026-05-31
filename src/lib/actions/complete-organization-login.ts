"use server";

import { AppError, UnauthorizedError } from "@/lib/errors";
import type { ActionState } from "@/lib/form-validation";
import { flattenFieldErrors } from "@/lib/form-validation";
import { activateOrganizationAccess } from "@/lib/services/organization-access-service";
import { createClient } from "@/lib/supabase/server";
import { organizationPinSchema } from "@/lib/validation/auth-schemas";

export type CompleteOrganizationLoginState = ActionState & {
  redirectTo?: string;
};

export async function completeOrganizationLogin(
  _prevState: CompleteOrganizationLoginState,
  formData: FormData,
): Promise<CompleteOrganizationLoginState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError();

  const raw = {
    organizationId: String(formData.get("organizationId") ?? ""),
    pin: String(formData.get("pin") ?? ""),
    confirmPin: String(formData.get("confirmPin") ?? ""),
  };

  const parsed = organizationPinSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flattenFieldErrors(parsed.error.issues) };
  }

  try {
    await activateOrganizationAccess({
      organizationId: parsed.data.organizationId,
      pin: parsed.data.pin,
      confirmPin: parsed.data.confirmPin || "",
    });
  } catch (error) {
    if (error instanceof AppError) {
      return { formError: error.message };
    }
    return { formError: "Unable to verify organization access" };
  }

  const redirectToUrl = formData.get("redirectTo") as string | null;
  return { redirectTo: redirectToUrl || "/dashboard/bay-view" };
}
