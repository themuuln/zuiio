import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { NewUserSetup } from "@/components/auth/new-user-setup";
import { OrganizationSelectionForm } from "@/components/auth/organization-selection-form";
import { completeOrganizationLogin } from "@/lib/actions/complete-organization-login";
import { UnauthorizedError } from "@/lib/errors";
import { listUserOrganizations } from "@/lib/services/organization-access-service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "auth.selectOrganization",
  });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function SelectOrganizationPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const [t, setupT] = await Promise.all([
    getTranslations("auth.selectOrganization"),
    getTranslations("auth.setup"),
  ]);
  const { redirectTo } = await searchParams;

  try {
    const organizations = await listUserOrganizations();

    if (organizations.length === 0) {
      return (
        <NewUserSetup
          copy={{
            title: setupT("title"),
            subtitle: setupT("subtitle"),
            error: setupT("error"),
            retry: setupT("retry"),
            manualSetup: setupT("manualSetup"),
            orgNameLabel: setupT("orgNameLabel"),
            orgNamePlaceholder: setupT("orgNamePlaceholder"),
            createOrg: setupT("createOrg"),
            manualError: setupT("manualError"),
          }}
        />
      );
    }

    return (
      <OrganizationSelectionForm
        organizations={organizations}
        action={completeOrganizationLogin}
        redirectTo={redirectTo}
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
          noOrganizations: setupT("subtitle"),
        }}
      />
    );
  } catch (error) {
    if (!(error instanceof UnauthorizedError)) {
      throw error;
    }
  }
  redirect("/auth/login");
}
