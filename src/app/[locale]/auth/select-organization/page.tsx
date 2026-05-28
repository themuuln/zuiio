import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { NewUserSetup } from "@/components/auth/new-user-setup";
import { OrganizationSelectionForm } from "@/components/auth/organization-selection-form";
import { completeOrganizationLogin } from "@/lib/actions/complete-organization-login";
import { UnauthorizedError } from "@/lib/errors";
import { listUserOrganizations } from "@/lib/services/organization-access-service";
import { createClient } from "@/lib/supabase/server";
import { finalizeSignup } from "@/lib/services/signup-service";

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
  const t = await getTranslations("auth.selectOrganization");
  const setupT = await getTranslations("auth.setup");
  const { redirectTo } = await searchParams;

  try {
    let organizations = await listUserOrganizations();

    // Auto-create org from user metadata if none exist
    if (organizations.length === 0) {
      try {
        const supabase = await createClient();
        await finalizeSignup(supabase);
        organizations = await listUserOrganizations();
      } catch (setupError) {
        console.error("Auto organization setup failed:", setupError);
      }
    }

    if (organizations.length === 0) {
      return (
        <NewUserSetup
          copy={{
            title: setupT("title"),
            subtitle: setupT("subtitle"),
            error: setupT("error"),
            retry: setupT("retry"),
          }}
        />
      );
    }

    const isSingleOrg = organizations.length === 1;
    const singleOrgHasPin = organizations[0]?.hasBayViewPin ?? false;

    // Determine contextual title/subtitle based on user state
    let title: string;
    let subtitle: string;
    if (isSingleOrg && !singleOrgHasPin) {
      // New user, single org — "Set up your PIN"
      title = t("setupTitle");
      subtitle = t("setupSubtitle");
    } else if (isSingleOrg && singleOrgHasPin) {
      // Returning user, single org — "Enter your PIN"
      title = t("verifyTitle");
      subtitle = t("verifySubtitle");
    } else {
      // Multi-org — show chooser
      title = t("title");
      subtitle = t("subtitle");
    }

    return (
      <OrganizationSelectionForm
        organizations={organizations}
        action={completeOrganizationLogin}
        redirectTo={redirectTo}
        singleOrgMode={isSingleOrg}
        copy={{
          title,
          subtitle,
          pinExplanation: t("pinExplanation"),
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
