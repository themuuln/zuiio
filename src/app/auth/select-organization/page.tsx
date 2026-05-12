import { redirect } from "next/navigation";
import { OrganizationSelectionForm } from "@/components/auth/organization-selection-form";
import { completeOrganizationLogin } from "@/lib/actions/complete-organization-login";
import { UnauthorizedError } from "@/lib/errors";
import { listUserOrganizations } from "@/lib/services/organization-access-service";

export default async function SelectOrganizationPage() {
  try {
    const organizations = await listUserOrganizations();

    return (
      <OrganizationSelectionForm
        organizations={organizations}
        action={completeOrganizationLogin}
        copy={{
          title: "Choose organization",
          subtitle:
            "Select the organization for this session and verify its PIN.",
          organizationLabel: "Organization",
          organizationPlaceholder: "Select organization",
          pinLabel: "Organization PIN",
          pinPlaceholder: "Enter 4-6 digits",
          confirmPinLabel: "Confirm organization PIN",
          continueLabel: "Verify and continue",
          setupLabel: "Set PIN and continue",
          setupHint:
            "This organization does not have a PIN yet. Create one now.",
          verifyHint: "Enter the 4-6 digit PIN for this organization.",
          noOrganizations:
            "No organizations are linked to this account yet. Ask an admin to add you first.",
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
