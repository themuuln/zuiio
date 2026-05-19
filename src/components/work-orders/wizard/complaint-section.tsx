"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useDiagnosisLabels } from "@/lib/queries/use-diagnosis-labels";
import { useWizardContext } from "./wizard-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ComplaintSection() {
  const ctx = useWizardContext();
  const t = useTranslations("workOrderWizard");
  const org = useCurrentOrg();
  const { data: labels } = useDiagnosisLabels(
    org.data?.orgId,
  );

  const activeLabels =
    labels?.filter((l) => l.is_active) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("complaint")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder={t("complaintPlaceholder")}
          value={ctx.complaint}
          onChange={(e) => ctx.setComplaint(e.target.value)}
          className="min-h-[80px]"
        />
        <div>
          <Select
            value={ctx.diagnosisLabelId}
            onValueChange={ctx.setDiagnosisLabelId}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder={t("diagnosisLabelPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {activeLabels.map((label) => (
                <SelectItem key={label.id} value={label.id}>
                  <span className="flex items-center gap-2">
                    {label.color && (
                      <span
                        className="inline-block size-2.5 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                    )}
                    {label.name_mn ?? label.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
