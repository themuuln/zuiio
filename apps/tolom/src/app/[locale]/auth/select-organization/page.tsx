import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { OrganizationSelectionForm } from "@/components/auth/organization-selection-form";
import { PendingInvitesCards } from "@/components/auth/pending-invites-cards";
import { completeOrganizationLogin } from "@/lib/actions/complete-organization-login";
import { UnauthorizedError } from "@/lib/errors";
import { reportServerError } from "@/lib/sentry-report-server";
import { getPendingInvitesForEmail } from "@/lib/services/invite-service";
import { listUserOrganizations } from "@/lib/services/organization-access-service";
import { createClient } from "@/lib/supabase/server";

// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

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
  const [t, inviteT] = await Promise.all([
    getTranslations("auth.selectOrganization"),
    getTranslations("invite"),
  ]);
  const { redirectTo } = await searchParams;

  try {
    const supabase = await createClient();

    // ── Check for pending invites ─────────────────────────
    let pendingInvites: Array<{
      token: string;
      organization_name: string;
      inviter_name: string | null;
    }> = [];

    const { data: authUser } = await supabase.auth.getUser();
    const authEmail = authUser?.user?.email;

    if (authEmail) {
      // Try by auth email (works for email-signup users)
      try {
        const invites = await getPendingInvitesForEmail(authEmail);
        pendingInvites = invites.map((inv) => ({
          token: inv.token,
          organization_name: inv.organization_name,
          inviter_name: inv.inviter_name,
        }));
      } catch (err) {
    reportServerError("Failed to check pending invites by email:", err);
      }
    }

    // If no invite found by email and user has a phone (phone-signup),
    // also check by phone — the invite email often contains the phone number
    // (e.g. "90409040@gmail.com")
    if (pendingInvites.length === 0 && authUser?.user?.id) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("phone")
          .eq("id", authUser.user.id)
          .maybeSingle();

        if (profile?.phone) {
          const invites = await getPendingInvitesForEmail(profile.phone);
          if (invites.length > 0) {
            pendingInvites = invites.map((inv) => ({
              token: inv.token,
              organization_name: inv.organization_name,
              inviter_name: inv.inviter_name,
            }));
          }
        }
      } catch (err) {
    reportServerError("Failed to check pending invites by phone:", err);
      }
    }

    const organizations = await listUserOrganizations(supabase);
    if (organizations.length === 0) {
      redirect("/auth/setup-organization");
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
      <div className="flex flex-col gap-6">
        {pendingInvites.length > 0 && (
          <PendingInvitesCards
            invites={pendingInvites}
            copy={{
              title: inviteT("pendingForYou"),
              description: inviteT("pendingDescription"), // reuse existing key
              accept: inviteT("acceptButton"),
            }}
          />
        )}

        {organizations.length > 0 && (
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
              noOrganizations: t("noOrganizations"),
            }}
          />
        )}
      </div>
    );
  } catch (error) {
    reportServerError("Unexpected error", error);
    if (!(error instanceof UnauthorizedError)) {
      throw error;
    }
  }
  redirect("/auth/login");
}
