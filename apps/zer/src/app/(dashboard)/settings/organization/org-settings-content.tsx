"use client";

import { useQuery } from "@tanstack/react-query";
import { withDbCapture } from "@zuiio/capture";
import { PageShell } from "@/components/erp/page-shell";
import { ReportEmailSettings } from "@/components/settings/report-email-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCompanyTypeLabel } from "@/lib/constants";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";

const SUPERADMIN_EMAIL = "zerone.offical@gmail.com";

export function OrgSettingsContent() {
  const { organizationId } = useOrgSettings();

  const { data, isLoading } = useQuery({
    queryKey: ["org-settings", organizationId],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await withDbCapture(
        "page:organization",
        supabase
          .from("profiles")
          .select(
            "full_name, role, organizations(name, company_type, currency)",
          )
          .eq("id", user.id)
          .single(),
      );

      if (!profile) return null;

      const isSuperadmin = user.email === SUPERADMIN_EMAIL;

      let reportEmailEnabled = false;
      let reportEmailTime: string | null = null;
      let reportEmailRecipient: string | null = null;

      if (isSuperadmin) {
        const { data: org } = await withDbCapture(
          "page:organization",
          supabase
            .from("organizations")
            .select(
              "report_email_enabled, report_email_time, report_email_recipient",
            )
            .eq("id", organizationId)
            .single(),
        );
        reportEmailEnabled = org?.report_email_enabled ?? false;
        reportEmailTime = org?.report_email_time ?? null;
        reportEmailRecipient = org?.report_email_recipient ?? null;
      }

      return {
        profile,
        isSuperadmin,
        reportEmailEnabled,
        reportEmailTime,
        reportEmailRecipient,
      };
    },
    enabled: !!organizationId,
  });

  return (
    <PageShell
      title="Байгууллагын тохиргоо"
      description="Одоогийн байгууллагын үндсэн мэдээлэл."
    >
      {isLoading ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ерөнхий мэдээлэл</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Skeleton className="mb-1 h-3 w-16" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div>
                <Skeleton className="mb-1 h-3 w-16" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div>
                <Skeleton className="mb-1 h-3 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div>
                <Skeleton className="mb-1 h-3 w-16" />
                <Skeleton className="h-5 w-36" />
              </div>
              <div>
                <Skeleton className="mb-1 h-3 w-24" />
                <Skeleton className="h-5 w-44" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : data ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ерөнхий мэдээлэл</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Нэр</p>
                <p className="text-sm font-medium">
                  {data.profile.organizations?.name ?? "Тодорхойгүй"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Төрөл</p>
                <p className="text-sm font-medium">
                  {getCompanyTypeLabel(
                    data.profile.organizations?.company_type ?? "",
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Валют</p>
                <p className="text-sm font-medium">
                  {data.profile.organizations?.currency ?? "MNT"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Таны эрх</p>
                <p className="text-sm font-medium">
                  {data.profile.role ?? "staff"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Хариуцсан хэрэглэгч
                </p>
                <p className="text-sm font-medium">
                  {data.profile.full_name ?? "Хэрэглэгч"}
                </p>
              </div>
            </CardContent>
          </Card>

          {data.isSuperadmin && (
            <ReportEmailSettings
              enabled={data.reportEmailEnabled}
              time={data.reportEmailTime}
              recipient={data.reportEmailRecipient}
            />
          )}
        </div>
      ) : null}
    </PageShell>
  );
}
