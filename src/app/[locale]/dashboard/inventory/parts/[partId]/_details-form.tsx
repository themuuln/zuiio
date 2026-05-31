"use client";

import { useTranslations } from "next-intl";
import { PartForm } from "@/components/inventory/part-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PartsCatalogItem } from "@/lib/types";

interface DetailsFormProps {
  part: PartsCatalogItem;
  onSuccess?: () => void;
}

export function DetailsForm({ part, onSuccess }: DetailsFormProps) {
  const t = useTranslations("inventory");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          {t("editPartDetails")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <PartForm
          partId={part.id}
          initialData={{
            name: part.name,
            name_mn: part.name_mn ?? undefined,
            part_number: part.part_number ?? undefined,
            category: part.category ?? undefined,
            description: part.description ?? undefined,
            unit: part.unit ?? undefined,
            default_price: part.default_price ?? undefined,
          }}
          onSuccess={onSuccess}
          onCancel={undefined}
        />
      </CardContent>
    </Card>
  );
}
