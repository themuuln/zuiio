import { GearSix, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ThemeToggle } from "@/components/erp/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAppContext } from "@/lib/erp";
import { BrandPresetsCard } from "./brand-presets-card";
import { NotificationSettings } from "./notification-settings";
import { OrgInfoForm } from "./org-info-form";
import { ProfileForm } from "./profile-form";
import { SmtpSettings } from "./smtp-settings";
import { ReportEmailSettings } from "./report-email-settings";

const TEMPLATE_TYPES = ["gym", "fitness", "retail"];

const SUPERADMIN_EMAIL = "zerone.offical@gmail.com";

export default async function SettingsPage() {
  const { supabase, organizationId, userId, user, permissions } =
    await requireAppContext();
  const isSuperAdmin = user.email === SUPERADMIN_EMAIL;
  const canManageRoles = permissions.includes("roles.manage");

  const [orgResult, profileResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("name, slug, company_type, currency")
      .eq("id", organizationId)
      .single(),
    supabase.from("profiles").select("full_name").eq("id", userId).single(),
  ]);

  const org = orgResult.data;
  const profile = profileResult.data;
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
    isSuperAdmin ||
    (permissions as string[]).includes("emails.manage");

  return (
    <div className="flex flex-1 flex-col gap-8">
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
      {showTemplates && presetsData?.data ? (
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
            <Link
              href="/settings/roles"
              className={buttonVariants({ variant: "outline" })}
            >
              Үүрэг, эрхүүд удирдах
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Notifications (superadmin only) */}
      {isSuperAdmin && <NotificationSettings isSuperAdmin />}

      {/* SMTP Settings (superadmin or emails.manage) */}
      {canManageEmail && <SmtpSettings isSuperAdmin={isSuperAdmin} />}

      {/* Report Email Settings (visible when SMTP is configured) */}
      {canManageEmail && hasSmtpConfig && <ReportEmailSettings />}

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
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Энэ хэсэг удахгүй нэмэгдэх болно.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
