import { PageShell } from "@/components/erp/page-shell";
import { ReportEmailSettings } from "@/components/settings/report-email-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCompanyTypeLabel } from "@/lib/constants";
import { requireAppContext } from "@/lib/erp";
import { getSuperadminEmail } from "@/lib/superadmin";

export default async function OrganizationSettingsPage() {
  const { supabase, profile, organizationId } = await requireAppContext();
  const isSuperadmin = await getSuperadminEmail();

  let reportEmailEnabled = false;
  let reportEmailTime: string | null = null;
  let reportEmailRecipient: string | null = null;

  if (isSuperadmin) {
    const { data: org } = await supabase
      .from("organizations")
      .select("report_email_enabled, report_email_time, report_email_recipient")
      .eq("id", organizationId)
      .single();
    reportEmailEnabled = org?.report_email_enabled ?? false;
    reportEmailTime = org?.report_email_time ?? null;
    reportEmailRecipient = org?.report_email_recipient ?? null;
  }

  return (
    <PageShell
      title="Байгууллагын тохиргоо"
      description="Одоогийн байгууллагын үндсэн мэдээлэл."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ерөнхий мэдээлэл</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Нэр</p>
              <p className="text-sm font-medium">
                {profile.organizations?.name ?? "Тодорхойгүй"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Төрөл</p>
              <p className="text-sm font-medium">
                {getCompanyTypeLabel(profile.organizations?.company_type ?? "")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Валют</p>
              <p className="text-sm font-medium">
                {profile.organizations?.currency ?? "MNT"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Таны эрх</p>
              <p className="text-sm font-medium">{profile.role ?? "staff"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Хариуцсан хэрэглэгч
              </p>
              <p className="text-sm font-medium">
                {profile.full_name ?? "Хэрэглэгч"}
              </p>
            </div>
          </CardContent>
        </Card>

        {isSuperadmin && (
          <ReportEmailSettings
            enabled={reportEmailEnabled}
            time={reportEmailTime}
            recipient={reportEmailRecipient}
          />
        )}
      </div>
    </PageShell>
  );
}
