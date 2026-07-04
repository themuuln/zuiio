import { Cube, GearSix, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ThemeToggle } from "@/components/erp/theme-toggle";
import type { RolePermission } from "@/components/roles/roles-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { type BrandConfig, DEFAULT_BRAND_CONFIG } from "@/lib/branding";
import { requireAppContext } from "@/lib/erp";
import { createServiceClient } from "@/lib/supabase/server-service";
import { BrandingDrawer } from "./branding-drawer";
import { LeaveOrganizationDialog } from "./leave-org-dialog";
import { NotificationSettings } from "./notification-settings";
import { OrgFeatureSettings } from "./org-feature-settings";
import { OrgInfoForm } from "./org-info-form";
import { OrgLogoUploader } from "./org-logo-uploader";
import { ProfileForm } from "./profile-form";
import { ReportEmailSettings } from "./report-email-settings";
import { RolesDrawer } from "./roles-drawer";
import { SettingsShell } from "./settings-shell";
import { SmtpSettings } from "./smtp-settings";
import { TelegramLink } from "./telegram-link";

const SUPERADMIN_EMAIL = "zerone.offical@gmail.com";

export default async function SettingsPage() {
  const { supabase, organizationId, userId, user, permissions } =
    await requireAppContext();
  const isSuperAdmin = user.email === SUPERADMIN_EMAIL;
  const canManageRoles = permissions.includes("roles.manage");

  const [orgResult, profileResult] = await Promise.all([
    supabase
      .from("organizations")
      .select(
        "name, slug, company_type, currency, brand_config, has_suppliers, has_inventory, has_customer_credit, has_multi_branch, has_variants, has_brands, has_categories, has_email_reports, has_audit_log",
      )
      .eq("id", organizationId)
      .single(),
    // Profile full_name — separate from requireAppContext's minimal profile query
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single(),
  ]);

  const org = orgResult.data as {
    name: string | null;
    slug: string | null;
    company_type: string | null;
    currency: string | null;
    brand_config: unknown;
    has_suppliers: boolean | null;
    has_inventory: boolean | null;
    has_customer_credit: boolean | null;
    has_multi_branch: boolean | null;
    has_variants: boolean | null;
    has_brands: boolean | null;
    has_categories: boolean | null;
    has_email_reports: boolean | null;
    has_audit_log: boolean | null;
    has_hr: boolean | null;
  } | null;
  const profile = profileResult.data;
  const brandConfig = (org?.brand_config ?? {}) as BrandConfig;
  const featureSettings = {
    has_suppliers: org?.has_suppliers !== false,
    has_inventory: org?.has_inventory !== false,
    has_customer_credit: org?.has_customer_credit !== false,
    has_multi_branch: org?.has_multi_branch === true,
    has_variants: org?.has_variants !== false,
    has_brands: org?.has_brands !== false,
    has_categories: org?.has_categories !== false,
    has_email_reports: org?.has_email_reports !== false,
    has_audit_log: org?.has_audit_log !== false,
    has_hr: org?.has_hr === true,
  };
  const hasEmailReports =
    (org as { has_email_reports: boolean } | null)?.has_email_reports !== false;
  const hasBrands =
    (org as { has_brands: boolean } | null)?.has_brands !== false;

  let hasPresets = false;
  try {
    const serviceSupabase = createServiceClient();
    const presetsData = await serviceSupabase
      .from("product_presets")
      .select("*", { count: "exact", head: true });
    hasPresets = (presetsData.count ?? 0) > 0;
  } catch {
    // Service role key not available in dev — skip preset check
  }

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
        <CardContent className="space-y-6">
          <OrgInfoForm
            initialName={org?.name ?? ""}
            initialSlug={org?.slug ?? ""}
            initialCompanyType={org?.company_type ?? undefined}
          />
          <Separator />
          <OrgLogoUploader
            logoUrl={brandConfig.logo_url ?? null}
            organizationName={org?.name ?? ""}
          />
        </CardContent>
      </Card>

      {/* Organization Feature Settings */}
      <OrgFeatureSettings initial={featureSettings} />

      {/* Product Brand Presets — available brands with products to import */}
      {hasBrands && hasPresets ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cube className="size-5" />
              Брэнд, бүтээгдэхүүний сан
            </CardTitle>
            <CardDescription>
              Бэлэн брэнд, бүтээгдэхүүний загваруудаас сонгон импортлох
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/settings/presets">
                <Cube className="size-4" />
                Брэнд сан нээх
              </Link>
            </Button>
          </CardContent>
        </Card>
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

      {/* Telegram Integration */}
      <TelegramLink
        organizationId={organizationId}
        userId={userId}
        supabase={supabase}
      />

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
      {isSuperAdmin && hasEmailReports && (
        <SmtpSettings isSuperAdmin={isSuperAdmin} />
      )}

      {/* Report Email Settings (org owners with emails.manage) */}
      {hasEmailReports && canManageEmail && hasSmtpConfig && (
        <ReportEmailSettings />
      )}

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
