import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { OrganizationSetupForm } from "@/components/auth/organization-setup-form";
import { UnauthorizedError } from "@/lib/errors";
import { reportServerError } from "@/lib/sentry-report-server";
import { getPendingInvitesForEmail } from "@/lib/services/invite-service";
import { listUserOrganizations } from "@/lib/services/organization-access-service";
import { createClient } from "@/lib/supabase/server";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "auth.setupOrganization",
  });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function SetupOrganizationPage() {
  const [t, inviteT] = await Promise.all([
    getTranslations("auth.setupOrganization"),
    getTranslations("invite"),
  ]);

  try {
    const supabase = await createClient();
    const { data: authUser } = await supabase.auth.getUser();

    if (!authUser?.user) {
      redirect("/auth/login");
    }

    // If user already has organizations, redirect to select-organization
    const organizations = await listUserOrganizations(supabase);
    if (organizations.length > 0) {
      redirect("/auth/select-organization");
    }

    // Check for pending invites
    let pendingInvites: Array<{
      token: string;
      organization_name: string;
      inviter_name: string | null;
    }> = [];

    const authEmail = authUser.user.email;
    if (authEmail) {
      try {
        const invites = await getPendingInvitesForEmail(authEmail);
        pendingInvites = invites.map((inv) => ({
          token: inv.token,
          organization_name: inv.organization_name,
          inviter_name: inv.inviter_name,
        }));
      } catch (err) {
        reportServerError("Failed to check pending invites:", err);
      }
    }

    // If no invites found by email, also try phone
    if (pendingInvites.length === 0 && authUser.user.id) {
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

    return (
      <OrganizationSetupForm
        pendingInvites={pendingInvites}
        copy={{
          title: t("title"),
          subtitle: t("subtitle"),
          orgNameLabel: t("orgNameLabel"),
          orgNamePlaceholder: t("orgNamePlaceholder"),
          createOrgButton: t("createOrgButton"),
          inviteSectionTitle: t("inviteSectionTitle"),
          inviteSectionDesc: t("inviteSectionDesc"),
          acceptInvite: inviteT("acceptButton"),
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
