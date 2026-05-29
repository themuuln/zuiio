"use client";

import { useTranslations } from "next-intl";
import { Dot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useDiagnosisLabels } from "@/lib/queries/use-diagnosis-labels";
import { useWizardContext } from "./wizard-context";

export function ComplaintSection() {
  const ctx = useWizardContext();
  const t = useTranslations("workOrderWizard");
  const org = useCurrentOrg();
  const { data: labels } = useDiagnosisLabels(org.data?.orgId);

  const activeLabels = labels?.filter((l) => l.is_active) ?? [];
  const selectedLabel =
    activeLabels.find((l) => l.id === ctx.diagnosisLabelId) ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("complaint")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Textarea
          placeholder={t("complaintPlaceholder")}
          value={ctx.complaint}
          onChange={(e) => ctx.setComplaint(e.target.value)}
          className="min-h-[80px]"
        />
        <div>
          <Combobox
            items={activeLabels}
            value={selectedLabel}
            onValueChange={(label) => {
              ctx.setDiagnosisLabelId(label?.id ?? "");
            }}
            isItemEqualToValue={(a, b) => a.id === b.id}
          >
            <ComboboxInput
              placeholder={t("diagnosisLabelPlaceholder")}
              showTrigger
              className="h-11"
            >
              <ComboboxValue>
                {selectedLabel
                  ? (selectedLabel.name_mn ?? selectedLabel.name)
                  : t("diagnosisLabelPlaceholder")}
              </ComboboxValue>
            </ComboboxInput>
            <ComboboxContent>
              <ComboboxList>
                {(label: (typeof activeLabels)[number]) => (
                  <ComboboxItem key={label.id} value={label}>
                    <span className="flex items-center gap-2">
                      {label.color ? (
                        <span
                          className="inline-block size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: label.color }}
                        />
                      ) : (
                        <Dot className="size-4 text-muted-foreground/30" />
                      )}
                      <span>{label.name_mn ?? label.name}</span>
                    </span>
                  </ComboboxItem>
                )}
              </ComboboxList>
              <ComboboxEmpty>{t("diagnosisLabelPlaceholder")}</ComboboxEmpty>
            </ComboboxContent>
          </Combobox>
        </div>
      </CardContent>
    </Card>
  );
}
