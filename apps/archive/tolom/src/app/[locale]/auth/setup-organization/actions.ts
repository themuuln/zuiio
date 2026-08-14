"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/form-validation";
import { flattenFieldErrors } from "@/lib/form-validation";
import { reportServerError } from "@/lib/sentry-report-server";
import { finalizeSignup } from "@/lib/services/signup-service";
import { createClient } from "@/lib/supabase/server";
import { createOrganizationSchema } from "@/lib/validation/auth-schemas";

type CreateOrgState = ActionState<{
  organizationName: string;
}>;

export async function createOrganization(
  _prevState: CreateOrgState,
  formData: FormData,
): Promise<CreateOrgState> {
  const raw = {
    organizationName:
      (formData.get("organizationName") as string)?.trim() || "",
    businessType: (formData.get("businessType") as string) || "",
    enablePartSuggestions:
      (formData.get("enablePartSuggestions") as string) || "on",
  };

  const parsed = createOrganizationSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      values: { organizationName: raw.organizationName },
      fieldErrors: flattenFieldErrors(parsed.error.issues),
    };
  }

  const { organizationName, businessType, enablePartSuggestions } = parsed.data;

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData?.user) {
      return {
        values: { organizationName: raw.organizationName },
        formError: "You must be signed in to create an organization.",
      };
    }

    await finalizeSignup(supabase, {
      orgName: organizationName,
      businessType,
      enablePartSuggestions,
    });
  } catch (error) {
    reportServerError("Failed to create organization:", error);
    return {
      values: { organizationName: raw.organizationName },
      formError: "Failed to create organization. Please try again.",
    };
  }

  // Redirect to select-organization for PIN setup
  redirect("/auth/select-organization");
}
