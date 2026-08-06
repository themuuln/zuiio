"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  useAddSupplierPart,
  usePartsCatalog,
} from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { reportServerError } from "@/lib/sentry-report-server";

interface SupplierAddPartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
}

export function SupplierAddPartDrawer({
  open,
  onOpenChange,
  supplierId,
}: SupplierAddPartDrawerProps) {
  const t = useTranslations("inventory");
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const { data: parts = [] } = usePartsCatalog(orgId);
  const addSupplierPart = useAddSupplierPart(orgId);

  const [selectedPartId, setSelectedPartId] = useState("");
  const [supplierPartNumber, setSupplierPartNumber] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredParts = searchQuery
    ? parts.filter(
        (p) =>
          (p.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.part_number ?? "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      )
    : parts;

  const handleSubmit = async () => {
    if (!selectedPartId || !orgId) return;

    try {
      await addSupplierPart.mutateAsync({
        supplierId,
        part_id: selectedPartId,
        supplier_part_number: supplierPartNumber || null,
        unit_cost: unitCost ? Number(unitCost) : null,
      });
      toast.dismiss();
      toast.success(t("supplierPartAdded"));
      setSelectedPartId("");
      setSupplierPartNumber("");
      setUnitCost("");
      setSearchQuery("");
      onOpenChange(false);
    } catch (err) {
      reportServerError("Unexpected error", err);
      toast.error(err instanceof Error ? err.message : "Failed to add part");
    }
  };

  const selectedPart = parts.find((p) => p.id === selectedPartId);

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange}>
      <DetailDrawer.Header>
        <DetailDrawer.Title>{t("supplierAddPart")}</DetailDrawer.Title>
        <DetailDrawer.Description>
          {t("supplierAddPartDescription")}
        </DetailDrawer.Description>
      </DetailDrawer.Header>

      <DetailDrawer.Body>
        <div className="flex flex-col gap-4">
          {/* Part Search */}
          <Field>
            <FieldLabel>{t("part")}</FieldLabel>
            <FieldContent>
              <div className="flex flex-col gap-2">
                <Input
                  placeholder={t("searchParts")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="max-h-48 overflow-y-auto rounded-lg border border-input">
                  {filteredParts.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">
                      {t("noParts")}
                    </p>
                  ) : (
                    <div className="flex flex-col">
                      {filteredParts.slice(0, 50).map((part) => (
                        <button
                          key={part.id}
                          type="button"
                          className={`flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                            selectedPartId === part.id
                              ? "bg-accent font-medium"
                              : ""
                          }`}
                          onClick={() => {
                            setSelectedPartId(part.id);
                            setSearchQuery("");
                          }}
                        >
                          <span className="font-medium">
                            {part.name ?? "—"}
                          </span>
                          {part.part_number && (
                            <span className="text-muted-foreground">
                              #{part.part_number}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </FieldContent>
          </Field>

          {/* Selected Part Info */}
          {selectedPart && (
            <div className="rounded-lg border border-input bg-muted/30 p-3 text-sm">
              <span className="font-medium">{selectedPart.name}</span>
              {selectedPart.part_number && (
                <span className="ml-2 text-muted-foreground">
                  #{selectedPart.part_number}
                </span>
              )}
            </div>
          )}

          {/* Supplier Part Number */}
          <Field>
            <FieldLabel>{t("supplierPartNumber")}</FieldLabel>
            <FieldContent>
              <Input
                placeholder={t("supplierPartNumberPlaceholder")}
                value={supplierPartNumber}
                onChange={(e) => setSupplierPartNumber(e.target.value)}
              />
            </FieldContent>
          </Field>

          {/* Unit Cost */}
          <Field>
            <FieldLabel>{t("unitCost")}</FieldLabel>
            <FieldContent>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
              />
            </FieldContent>
          </Field>
        </div>
      </DetailDrawer.Body>

      <DetailDrawer.Footer>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {t("cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedPartId || addSupplierPart.isPending}
        >
          {addSupplierPart.isPending ? t("saving") : t("addPart")}
        </Button>
      </DetailDrawer.Footer>
    </DetailDrawer>
  );
}
