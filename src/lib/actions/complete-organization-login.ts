"use server";

import { redirect } from "next/navigation";
import { AppError } from "@/lib/errors";
import { activateOrganizationAccess } from "@/lib/services/organization-access-service";

export interface CompleteOrganizationLoginState {
  error?: string;
}

export async function completeOrganizationLogin(
  _prevState: CompleteOrganizationLoginState,
  formData: FormData,
): Promise<CompleteOrganizationLoginState> {
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

  redirect("/dashboard/bay-view");
}
