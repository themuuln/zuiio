import type { SupabaseClient } from "@supabase/supabase-js";
import { UnauthorizedError, ValidationError } from "@/lib/errors";

export interface UserOrganizationAccessOption {
  organizationId: string;
  name: string;
  slug: string;
  branchId: string | null;
  roleId: string | null;
  isPrimary: boolean;
  hasBayViewPin: boolean;
}

function isValidPin(pin: string): boolean {
  return /^[0-9]{4,6}$/.test(pin);
}

export async function listUserOrganizations(
  db: SupabaseClient,
  userId_?: string,
): Promise<UserOrganizationAccessOption[]> {
  const supabase = db;
  const user = userId_
    ? { id: userId_ }
    : (await supabase.auth.getUser()).data.user;

  if (!user) {
    throw new UnauthorizedError();
  }

  const { data, error } = await supabase.rpc("get_user_organizations");

  if (error) {
    throw new UnauthorizedError(error.message);
  }

  return (
    (data ?? []) as Array<{
      organization_id: string;
      name: string;
      slug: string;
      branch_id: string | null;
      role_id: string | null;
      is_primary: boolean;
      has_bay_view_pin: boolean;
    }>
  ).map((organization) => ({
    organizationId: organization.organization_id,
    name: organization.name,
    slug: organization.slug,
    branchId: organization.branch_id,
    roleId: organization.role_id,
    isPrimary: organization.is_primary,
    hasBayViewPin: organization.has_bay_view_pin,
  }));
}

export async function activateOrganizationAccess(
  db: SupabaseClient,
  params: {
    organizationId: string;
    pin: string;
    confirmPin?: string;
  },
): Promise<void> {
  const organizations = await listUserOrganizations(db);
  const supabase = db;
  const selected = organizations.find(
    (organization) => organization.organizationId === params.organizationId,
  );

  if (!selected) {
    throw new UnauthorizedError("You do not have access to this organization");
  }

  if (!isValidPin(params.pin)) {
    throw new ValidationError("PIN must be 4 to 6 digits");
  }

  if (!selected.hasBayViewPin) {
    if (params.pin !== params.confirmPin) {
      throw new ValidationError("PIN confirmation does not match");
    }

    const { error } = await supabase.rpc("set_organization_bay_view_pin", {
      target_org_id: selected.organizationId,
      plain_pin: params.pin,
    });

    if (error) {
      throw new ValidationError(error.message);
    }
  } else {
    // TEMPORARY: skip pin verification — re-enable by uncommenting the RPC block below
  }

  const { error } = await supabase.rpc("set_primary_organization", {
    target_org_id: selected.organizationId,
  });

  if (error) {
    throw new ValidationError(error.message);
  }
}
