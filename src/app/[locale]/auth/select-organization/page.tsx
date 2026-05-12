import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { OrganizationSelectionForm } from "@/components/auth/organization-selection-form";
import { completeOrganizationLogin } from "@/lib/actions/complete-organization-login";
import { UnauthorizedError } from "@/lib/errors";
import { listUserOrganizations } from "@/lib/services/organization-access-service";

export default async function SelectOrganizationPage() {
  const t = await getTranslations("auth.selectOrganization");
  try {
    const organizations = await listUserOrganizations();

    return (
      <OrganizationSelectionForm
        organizations={organizations}
        action={completeOrganizationLogin}
        copy={{
          title: t("title"),
          subtitle: t("subtitle"),
          organizationLabel: t("organizationLabel"),
          organizationPlaceholder: t("organizationPlaceholder"),
          pinLabel: t("pinLabel"),
          pinPlaceholder: t("pinPlaceholder"),
          confirmPinLabel: t("confirmPinLabel"),
          continueLabel: t("continueLabel"),
          setupLabel: t("setupLabel"),
          setupHint: t("setupHint"),
          verifyHint: t("verifyHint"),
          noOrganizations: t("noOrganizations"),
        }}
      />
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/auth/login");
    }

    throw error;
  }
}
