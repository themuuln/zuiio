"use client";

import { useOrgMutation } from "@zuiio/query";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inventoryKeys } from "@/lib/queries/keys";

interface ReturnToSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  branchId: string | null;
  preselectedPartId?: string;
}

const RETURN_REASONS = [
  { value: "defective", label: "Defective" },
  { value: "wrong_part", label: "Wrong Part" },
  { value: "customer_return", label: "Customer Return" },
  { value: "other", label: "Other" },
] as const;

export function ReturnToSupplierDialog({
  open,
  onOpenChange,
  orgId,
  branchId,
  preselectedPartId,
}: ReturnToSupplierDialogProps) {
  const t = useTranslations("inventory") as (key: string, values?: Record<string, string | number>) => string;

  const [partId, setPartId] = useState(preselectedPartId ?? "");
  const [supplierId, setSupplierId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const createMovement = useOrgMutation<
    unknown,
    {
      part_id: string;
      quantity: number;
      unit_cost: number;
      type: string;
      notes: string;
      branch_id: string | null;
    }
  >({
    endpoint: `/api/organizations/${orgId}/inventory/movements`,
    method: "POST",
    queryKey: inventoryKeys.all(orgId),
    onSuccess: () => {
      toast.success(t("returnRecorded"));
      onOpenChange(false);
      setPartId(preselectedPartId ?? "");
      setSupplierId("");
      setQuantity("");
      setUnitCost("");
      setReason("");
      setNotes("");
    },
  });

  const handleSubmit = async () => {
    if (!partId || !quantity || Number(quantity) <= 0) return;

    const reasonLabel =
      RETURN_REASONS.find((r) => r.value === reason)?.label ?? reason;

    await createMovement.mutateAsync({
      part_id: partId,
      quantity: Number(quantity),
      unit_cost: unitCost ? Number(unitCost) : 0,
      type: "return",
      notes: [reasonLabel ? `Reason: ${reasonLabel}` : "", notes || ""]
        .filter(Boolean)
        .join(" | "),
      branch_id: branchId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="size-4" />
            {t("returnToSupplier")}
          </DialogTitle>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel>
              {t("partId")} <span className="text-destructive">*</span>
            </FieldLabel>
            <FieldContent>
              <Input
                value={partId}
                onChange={(e) => setPartId(e.target.value)}
                placeholder={t("enterPartId")}
                disabled={!!preselectedPartId}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>{t("supplierId")}</FieldLabel>
            <FieldContent>
              <Input
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                placeholder={t("enterSupplierId")}
              />
            </FieldContent>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>
                {t("quantity")} <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="1"
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>{t("unitCost")} (₮)</FieldLabel>
              <FieldContent>
                <CurrencyInput
                  value={unitCost ? Number(unitCost) : 0}
                  onChange={(val) => setUnitCost(String(val))}
                  min={0}
                  placeholder="0"
                />
              </FieldContent>
            </Field>
          </div>

          <Field>
            <FieldLabel>{t("reason")}</FieldLabel>
            <FieldContent>
              <Select value={reason} onValueChange={(v) => setReason(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectReason")} />
                </SelectTrigger>
                <SelectContent>
                  {RETURN_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>{t("notes")}</FieldLabel>
            <FieldContent>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("optionalNotes")}
              />
            </FieldContent>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              createMovement.isPending ||
              !partId ||
              !quantity ||
              Number(quantity) <= 0
            }
          >
            {createMovement.isPending ? t("saving") : t("recordReturn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
