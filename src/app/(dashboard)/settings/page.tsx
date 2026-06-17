import { GearSix, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { ThemeToggle } from "@/components/erp/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAppContext } from "@/lib/erp";
import { DEFAULT_BRAND_CONFIG, type BrandConfig } from "@/lib/branding";
import type { RolePermission } from "@/components/roles/roles-client";
import { BrandPresetsCard } from "./brand-presets-card";
import { BrandingDrawer } from "./branding-drawer";
import { LeaveOrganizationDialog } from "./leave-org-dialog";
import { NotificationSettings } from "./notification-settings";
import { OrgInfoForm } from "./org-info-form";
import { ProfileForm } from "./profile-form";
import { RolesDrawer } from "./roles-drawer";
import { SmtpSettings } from "./smtp-settings";
import { ReportEmailSettings } from "./report-email-settings";
import { SettingsShell } from "./settings-shell";

export const unstable_instant = { prefetch: "static" };

const TEMPLATE_TYPES = ["gym", "fitness", "retail"];

const SUPERADMIN_EMAIL = "zerone.offical@gmail.com";

export default async function SettingsPage() {
  const { supabase, organizationId, userId, user, permissions } =
    await requireAppContext();
  const isSuperAdmin = user.email === SUPERADMIN_EMAIL;
  const canManageRoles = permissions.includes("roles.manage");

  const [orgResult, profileResult, brandConfigResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("name, slug, company_type, currency")
      .eq("id", organizationId)
      .single(),
    supabase.from("profiles").select("full_name").eq("id", userId).single(),
    supabase
      .from("organizations")
      .select("brand_config")
      .eq("id", organizationId)
      .single(),
  ]);

  const org = orgResult.data;
  const profile = profileResult.data;
  const brandConfig = (brandConfigResult.data?.brand_config ??
    {}) as BrandConfig;
  const showTemplates =
    org?.company_type && TEMPLATE_TYPES.includes(org.company_type);

  const presetsData = showTemplates
    ? await supabase.from("product_presets").select("*").order("sort_order")
    : undefined;

  // Check if SMTP is configured (for conditional rendering)
  const { count: smtpCount } = await supabase
    .from("smtp_configs")
    .select("*", { count: "exact", head: true });

  const hasSmtpConfig = (smtpCount ?? 0) > 0;
  const canManageEmail =
    isSuperAdmin || (permissions as string[]).includes("emails.manage");

  // Fetch roles data for the drawer
  let roles: Array<{
    id: string;
    name: string;
    description: string | null;
    hierarchy_level: number;
    is_system_role: boolean;
  }> = [];
  let rolePermissions: RolePermission[] = [];
  if (canManageRoles) {
    const { data: r } = await supabase
      .from("roles")
      .select("id, name, description, hierarchy_level, is_system_role")
      .eq("organization_id", organizationId)
      .order("hierarchy_level", { ascending: true });
    roles = r ?? [];
    if (roles.length > 0) {
      const { data: rp } = await supabase
        .from("role_permissions")
        .select("id, role_id, permission")
        .in(
          "role_id",
          roles.map((r) => r.id),
        );
      rolePermissions = rp ?? [];
    }
  }

  return (
    <SettingsShell>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Тохиргоо</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Байгууллага, хэрэглэгчийн тохиргоо
        </p>
      </div>

      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle>Байгууллагын мэдээлэл</CardTitle>
          <CardDescription>
            Байгууллагын нэр болон холбоосыг өөрчлөх
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrgInfoForm
            initialName={org?.name ?? ""}
            initialSlug={org?.slug ?? ""}
          />
        </CardContent>
      </Card>

      {/* Brand Templates (gym / fitness only) */}
      {showTemplates && presetsData?.data?.length ? (
        <BrandPresetsCard presets={presetsData.data} />
      ) : null}

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Хэрэглэгчийн мэдээлэл</CardTitle>
          <CardDescription>Таны нэрийг өөрчлөх</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initialFullName={profile?.full_name ?? ""} />
        </CardContent>
      </Card>

      {/* Roles & Permissions */}
      {canManageRoles && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GearSix className="size-5" />
              Үүрэг, эрхүүд
            </CardTitle>
            <CardDescription>
              Байгууллагын гишүүдийн үүрэг болон эрхүүдийг тохируулах
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RolesDrawer roles={roles} rolePermissions={rolePermissions} />
          </CardContent>
        </Card>
      )}

      {/* Notifications (superadmin only) */}
      {isSuperAdmin && <NotificationSettings isSuperAdmin />}

      {/* SMTP Settings (superadmin only — technical config) */}
      {isSuperAdmin && <SmtpSettings isSuperAdmin={isSuperAdmin} />}

      {/* Report Email Settings (org owners with emails.manage) */}
      {canManageEmail && hasSmtpConfig && <ReportEmailSettings />}

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Брэндинг</CardTitle>
          <CardDescription>
            Байгууллагын өнгө, загвар, лого тохируулах
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrandingDrawer
            initialConfig={{
              theme: brandConfig.theme ?? DEFAULT_BRAND_CONFIG.theme,
              radius: brandConfig.radius ?? DEFAULT_BRAND_CONFIG.radius,
              logo_url: brandConfig.logo_url ?? null,
              custom_colors: brandConfig.custom_colors,
              font_body: brandConfig.font_body,
              font_heading: brandConfig.font_heading,
            }}
          />
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Гадаад байдал</CardTitle>
          <CardDescription>
            Гэрэлтэй эсвэл харанхуй горим сонгох
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">
              Гэрэлтэй / Харанхуй горим
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <WarningCircle className="size-5" />
            Аюултай бүс
          </CardTitle>
          <CardDescription>
            Энд хийх үйлдлүүд эргэлт буцалтгүй байж болно
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Байгууллагаас гарах</p>
              <p className="text-xs text-muted-foreground">
                Та энэ байгууллагын өгөгдөлд хандах боломжгүй болно. Шинэ
                байгууллага үүсгэх боломжтой.
              </p>
            </div>
            {org?.name && <LeaveOrganizationDialog orgName={org.name} />}
          </div>
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
