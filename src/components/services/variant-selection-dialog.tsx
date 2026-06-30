"use client";

import { Loader2, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { useItemVariants } from "@/lib/queries/use-catalog-variants";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { VariantPicker, type VariantSelection } from "./variant-picker";

interface VariantSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: "service" | "part";
  entityId: string;
  entityName: string;
  defaultPrice: number;
  onConfirm: (selection: VariantSelection | null) => void;
  onSkip: () => void;
}

/**
 * Dialog that shows the VariantPicker when a catalog item has variants.
 * The user can select a variant or skip to use the default price.
 */
export function VariantSelectionDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityName,
  defaultPrice,
  onConfirm,
  onSkip,
}: VariantSelectionDialogProps) {
  const t = useTranslations("services");
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;

  const { data: variants = [], isLoading } = useItemVariants(
    orgId,
    entityType,
    entityId,
  );

  const [selection, setSelection] = useState<VariantSelection | null>(null);

  const handleConfirm = () => {
    if (selection) {
      onConfirm(selection);
    } else {
      onSkip();
    }
    setSelection(null);
    onOpenChange(false);
  };

  const handleSkip = () => {
    setSelection(null);
    onSkip();
    onOpenChange(false);
  };

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange} size="lg">
      <DetailDrawer.Header>
        <DetailDrawer.Title className="flex items-center gap-2">
          <Wrench className="size-5 text-muted-foreground" />
          {entityName} — {t("selectVariant")}
        </DetailDrawer.Title>
        <DetailDrawer.Description>
          {t("selectVariantDescription")}
        </DetailDrawer.Description>
      </DetailDrawer.Header>

      <DetailDrawer.Body>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : variants.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("noVariantsFound")}
          </p>
        ) : (
          <VariantPicker
            entityType={entityType}
            entityId={entityId}
            entityName={entityName}
            defaultPrice={defaultPrice}
            value={selection}
            onChange={setSelection}
          />
        )}
      </DetailDrawer.Body>
      <DetailDrawer.Footer className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={handleSkip} className="flex-1">
          {t("addWithoutVariant")}
        </Button>
        <Button
          onClick={handleConfirm}
          className="flex-1"
          disabled={!selection}
        >
          {selection
            ? `${t("addVariant")}: ${selection.label}`
            : t("selectAVariant")}
        </Button>
      </DetailDrawer.Footer>
    </DetailDrawer>
  );
}
