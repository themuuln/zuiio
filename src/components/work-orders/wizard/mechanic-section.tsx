"use client";

import { useTranslations } from "next-intl";
import { MechanicSelect } from "@/components/mechanic-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWizardContext } from "./wizard-context";

export function MechanicSection() {
  const ctx = useWizardContext();
  const t = useTranslations("workOrderWizard");

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("mechanic")}</CardTitle>
        </CardHeader>
        <CardContent>
          <MechanicSelect
            value={ctx.selectedMechanic}
            onChange={ctx.setSelectedMechanic}
            mechanics={ctx.mechanics}
            size="lg"
            showJobCount
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("notes")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder={t("descriptionOrNotes")}
            value={ctx.description}
            onChange={(e) => ctx.setDescription(e.target.value)}
            className="h-11"
          />
        </CardContent>
      </Card>
    </div>
  );
}
