"use client";

import {
  Cube,
  GearSix,
  Layout,
  MapPinArea,
  TelegramLogo,
  Truck,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { capture, withDbCapture } from "@zuiio/capture";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/erp/theme-toggle";
import type { RolePermission } from "@/components/roles/roles-client";
import { BankAccountsSettings } from "@/components/settings/bank-accounts-settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { type BrandConfig, DEFAULT_BRAND_CONFIG } from "@/lib/branding";
import { DASHBOARD_TEMPLATES } from "@/lib/dashboard-templates";
import { useI18n } from "@/lib/i18n";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";
import { BrandingDrawer } from "./branding-drawer";
import { applyDashboardTemplate } from "./dashboard-template/actions";
import { FacebookLinkCard } from "./facebook-link-card";
import { LeaveOrganizationDialog } from "./leave-org-dialog";
import { LinkCodeDisplay } from "./link-code-display";
import { NotificationSettings } from "./notification-settings";
import { OrgFeatureSettings } from "./org-feature-settings";
import { OrgInfoForm } from "./org-info-form";
import { OrgLogoUploader } from "./org-logo-uploader";
import { ProfileForm } from "./profile-form";
import { ReportEmailSettings } from "./report-email-settings";
import { RolesDrawer } from "./roles-drawer";
import { SettingsShell } from "./settings-shell";
import { ShopPosSettings } from "./shop-pos-settings";
import { SmtpSettings } from "./smtp-settings";
import { getTelegramLinkCode } from "./telegram-actions";

const SUPERADMIN_EMAIL = "zerone.offical@gmail.com";

const GATEWAY_URL =
  (typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_AGENT_GATEWAY_URL
    : undefined) ?? "";
const BOT_USERNAME =
  (typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
    : undefined) ?? "zuiio_bot";

interface OrgRow {
  name: string | null;
  slug: string | null;
  company_type: string | null;
  dashboard_template: string | null;
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
  has_delivery_tracking: boolean | null;
  has_coupons: boolean | null;
  has_gift_cards: boolean | null;
  has_promotions: boolean | null;
}

interface PosRow {
  has_checkout_customer: boolean | null;
  has_checkout_quick_amounts: boolean | null;
  has_receipt_drawer: boolean | null;
  has_track_stock: boolean | null;
  has_receipt_printer: boolean | null;
  shop_default_payment_method: string | null;
}

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  hierarchy_level: number;
  is_system_role: boolean;
}

interface LinkedTelegramAccount {
  telegram_username: string | null;
  linked_at: string | null;
}

interface LinkCode {
  formatted: string;
}

interface SettingsData {
  org: OrgRow | null;
  posSettings: {
    has_checkout_customer: boolean;
    has_checkout_quick_amounts: boolean;
    has_receipt_drawer: boolean;
    has_track_stock: boolean;
    has_receipt_printer: boolean;
    shop_default_payment_method: string;
  };
  userId: string;
  userEmail: string | undefined;
  permissions: string[];
  smtpCount: number;
  roles: RoleRow[];
  rolePermissions: RolePermission[];
  telegramLink: LinkedTelegramAccount | null;
  profile: { full_name: string | null } | null;
}

function DashboardTemplateCard({ current }: { current: string }) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(
    applyDashboardTemplate,
    undefined,
  );
  const [selected, setSelected] = useState(current);
  const [saved, setSaved] = useState(current);

  useEffect(() => {
    if (!state?.success) return;
    setSaved(selected);
    toast.success(t("dashboardTemplate.saved"));
  }, [state, t, selected]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layout className="size-5" />
          {t("dashboardTemplate.title")}
        </CardTitle>
        <CardDescription>{t("dashboardTemplate.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <RadioGroup
            value={selected}
            onValueChange={setSelected}
            className="grid gap-2 sm:grid-cols-2"
          >
            {DASHBOARD_TEMPLATES.map((template) => (
              <Label
                key={template.id}
                htmlFor={`dt-${template.id}`}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm has-[data-checked]:border-primary has-[data-checked]:bg-primary/5"
              >
                <RadioGroupItem
                  value={template.id}
                  id={`dt-${template.id}`}
                  className="mt-0.5"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium">{t(template.labelKey)}</span>
                  <span className="text-xs text-muted-foreground">
                    {t(template.descriptionKey)}
                  </span>
                </span>
              </Label>
            ))}
          </RadioGroup>
          <input type="hidden" name="dashboard_template" value={selected} />
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending || selected === saved}>
              {isPending ? "Хадгалж байна…" : t("common.save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function SettingsContent() {
  const { organizationId, hasBrands, hasDeliveryTracking, hasEmailReports } =
    useOrgSettings();

  const { data, isLoading } = useQuery({
    queryKey: ["settings:overview", organizationId],
    queryFn: async (): Promise<SettingsData> => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const permissionsResult = await supabase.rpc("get_user_permissions");
      const permissions = (permissionsResult.data ?? []) as string[];

      const canManageRoles = permissions.includes("roles.manage");

      const [orgResult, profileResult, posResult, smtpResult, telegramResult] =
        await Promise.all([
          withDbCapture(
            "settings:overview:org",
            supabase
              .from("organizations")
              .select(
                "name, slug, company_type, dashboard_template, currency, brand_config, has_suppliers, has_inventory, has_customer_credit, has_multi_branch, has_variants, has_brands, has_categories, has_email_reports, has_audit_log, has_delivery_tracking, has_hr, has_coupons, has_gift_cards, has_promotions",
              )
              .eq("id", organizationId)
              .single(),
          ),
          withDbCapture(
            "settings:overview:profile",
            supabase
              .from("profiles")
              .select("full_name")
              .eq("id", user.id)
              .single(),
          ),
          withDbCapture(
            "settings:overview:pos",
            supabase
              .from("organizations" as never)
              .select(
                "has_checkout_customer, has_checkout_quick_amounts, has_receipt_drawer, has_track_stock, has_receipt_printer, shop_default_payment_method",
              )
              .eq("id" as never, organizationId)
              .single(),
          ),
          withDbCapture(
            "settings:overview:smtp",
            supabase
              .from("smtp_configs")
              .select("*", { count: "exact", head: true }),
          ),
          // telegram_links not in generated Database types — cast to untyped SupabaseClient
          withDbCapture(
            "settings:overview:telegram",
            (supabase as unknown as SupabaseClient)
              .from("telegram_links")
              .select("telegram_username, linked_at")
              .eq("organization_id", organizationId)
              .eq("user_id", user.id)
              .eq("product_type", "zer")
              .eq("is_active", true)
              .order("linked_at", { ascending: false })
              .limit(1),
          ),
        ]);
      const org = orgResult.data as OrgRow | null;
      const profile = profileResult.data as { full_name: string | null } | null;
      const posRow = posResult.data as PosRow | null;

      const posSettings = {
        has_checkout_customer: posRow?.has_checkout_customer !== false,
        has_checkout_quick_amounts:
          posRow?.has_checkout_quick_amounts !== false,
        has_receipt_drawer: posRow?.has_receipt_drawer !== false,
        has_track_stock: posRow?.has_track_stock !== false,
        has_receipt_printer: posRow?.has_receipt_printer === true,
        shop_default_payment_method:
          posRow?.shop_default_payment_method ?? "cash",
      };

      const smtpCount = smtpResult.count ?? 0;
      const telegramLink =
        (telegramResult.data?.[0] as LinkedTelegramAccount | undefined) ?? null;

      // Fetch roles if the user can manage them
      let roles: RoleRow[] = [];
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

      return {
        org,
        profile,
        posSettings,
        userId: user.id,
        userEmail: user.email,
        permissions,
        smtpCount,
        roles,
        rolePermissions,
        telegramLink,
      };
    },
    enabled: !!organizationId,
  });

  // Service-role presets check (optional — may fail client-side)
  const [hasPresets, setHasPresets] = useState(false);
  useEffect(() => {
    if (!hasBrands) return;
    let cancelled = false;
    const check = async () => {
      try {
        const supabase = createClient();
        const { count } = await supabase
          .from("product_presets")
          .select("*", { count: "exact", head: true });
        if (!cancelled) {
          setHasPresets((count ?? 0) > 0);
        }
      } catch (e) {
        capture(e, { context: "settings: check product presets" });
        // Service role key not available in dev — skip preset check
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [hasBrands]);

  // Telegram link code generation — proxied through a server action because
  // /api/link/code is x-api-key protected (server-to-server only; the shared
  // secret must never reach the browser).
  const [linkCode, setLinkCode] = useState<LinkCode | null>(null);
  const [linkCodeLoading, setLinkCodeLoading] = useState(false);
  useEffect(() => {
    if (GATEWAY_URL && !data?.telegramLink && data?.userId) {
      setLinkCodeLoading(true);
      let cancelled = false;
      const fetchCode = async () => {
        try {
          const code = await getTelegramLinkCode();
          if (!cancelled && code) {
            setLinkCode({ formatted: code.formatted });
          }
        } catch (e) {
          capture(e, { context: "telegram: fetch link code" });
        } finally {
          if (!cancelled) setLinkCodeLoading(false);
        }
      };
      fetchCode();
      return () => {
        cancelled = true;
      };
    }
  }, [data?.telegramLink, data?.userId]);

  // ───── Loading state ─────
  if (isLoading || !data) {
    return (
      <SettingsShell>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Тохиргоо</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Байгууллага, хэрэглэгчийн тохиргоо
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Байгууллагын мэдээлэл</CardTitle>
            <CardDescription>...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-3/4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-48" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-48" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-52" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-48" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-48" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </SettingsShell>
    );
  }

  // ───── Data ready ─────
  const {
    org,
    profile,
    posSettings,
    userId,
    userEmail,
    permissions,
    smtpCount,
    roles,
    rolePermissions,
    telegramLink,
  } = data;

  const isSuperAdmin = userEmail === SUPERADMIN_EMAIL;
  const canManageRoles = permissions.includes("roles.manage");
  const canManageEmail = isSuperAdmin || permissions.includes("emails.manage");

  const brandConfig = (org?.brand_config ?? {}) as BrandConfig;

  // Telegram link card content
  let telegramContent: React.ReactNode;
  if (telegramLink) {
    telegramContent = (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            ✅ Холбогдсон
          </span>
          {telegramLink.telegram_username && (
            <span className="text-muted-foreground">
              @{telegramLink.telegram_username}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Та @{BOT_USERNAME} бот руу мессеж бичиж өгөгдлөө харах боломжтой.
          <br />
          Холбогдсон:{" "}
          {telegramLink.linked_at
            ? new Date(telegramLink.linked_at).toLocaleDateString()
            : ""}
        </p>
        <Button variant="outline" size="sm" asChild>
          <a
            href={`https://t.me/${BOT_USERNAME}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            @{BOT_USERNAME} нээх
          </a>
        </Button>
      </div>
    );
  } else if (linkCode) {
    telegramContent = (
      <LinkCodeDisplay
        code={linkCode.formatted}
        expiresInMinutes={10}
        botUsername={BOT_USERNAME}
      />
    );
  } else if (linkCodeLoading) {
    telegramContent = (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  } else {
    telegramContent = (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Код үүсгэх боломжгүй байна. Хуудсыг дахин ачааллаад оролдоно уу.
        </p>
        <Button variant="outline" size="sm" asChild>
          <a
            href={`https://t.me/${BOT_USERNAME}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <TelegramLogo className="size-4" weight="fill" />@{BOT_USERNAME}{" "}
            нээх
          </a>
        </Button>
      </div>
    );
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
      <OrgFeatureSettings
        initial={{
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
          has_delivery_tracking: org?.has_delivery_tracking === true,
          has_coupons: org?.has_coupons !== false,
          has_gift_cards: org?.has_gift_cards !== false,
          has_promotions: org?.has_promotions !== false,
        }}
      />

      {/* Shop / POS checkout settings */}
      <ShopPosSettings initial={posSettings} />

      {/* Dashboard template preset */}
      <DashboardTemplateCard current={org?.dashboard_template ?? "default"} />
      {/* Bank Accounts */}
      <Card>
        <CardContent className="pt-6">
          <BankAccountsSettings />
        </CardContent>
      </Card>

      {/* Product Brand Presets */}
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

      {/* Delivery Zones */}
      {hasDeliveryTracking ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinArea className="size-5" />
              Хүргэлтийн бүсүүд
            </CardTitle>
            <CardDescription>Хүргэлтийн үнийн бүс, тохиргоо</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/settings/delivery-zones">
                <MapPinArea className="size-4" />
                Бүсүүд удирдах
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings/delivery-providers">
                <Truck className="size-4" />
                Үйлчилгээ
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

      {/* Telegram Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sky-600">
            <TelegramLogo className="size-5" weight="fill" />
            Telegram холболт
          </CardTitle>
          <CardDescription>
            Telegram боттой холбогдон өгөгдлөө натурал хэлээр асуух
          </CardDescription>
        </CardHeader>
        <CardContent>{telegramContent}</CardContent>
      </Card>

      {/* Facebook / Instagram Link */}
      <FacebookLinkCard />

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

      {isSuperAdmin && (
        <NotificationSettings
          isSuperAdmin
          organizationId={organizationId}
          userId={userId}
        />
      )}

      {isSuperAdmin && hasEmailReports && (
        <SmtpSettings
          isSuperAdmin={isSuperAdmin}
          organizationId={organizationId}
          userId={userId}
        />
      )}

      {hasEmailReports && canManageEmail && smtpCount > 0 && (
        <ReportEmailSettings organizationId={organizationId} userId={userId} />
      )}

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Брэндинг</CardTitle>
          <CardDescription>
            Байгууллагын өнгө, загвар, лого — нийтийн хуудас болон самбарт
            хэрэгжинэ
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
