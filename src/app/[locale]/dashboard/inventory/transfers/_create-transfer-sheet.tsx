"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  Field,
  FieldContent,
  FieldError,
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
import { Textarea } from "@/components/ui/textarea";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { usePartsCatalog } from "@/lib/queries/use-inventory";
import { useCreateTransfer } from "@/lib/queries/use-transfers";
import type { Branch, CreateTransferParams } from "@/lib/types";

const transferSchema = z.object({
  to_branch_id: z.string().min(1, "Destination branch is required"),
  from_branch_id: z.string().optional(),
  notes: z.string().optional(),
});

type TransferFormValues = z.infer<typeof transferSchema>;

interface TransferItem {
  part_id: string;
  part_name: string;
  quantity: number;
  unit_cost: string;
}

interface CreateTransferSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  branches: Branch[];
  currentBranchId: string | null;
}

export function CreateTransferSheet({
  open,
  onOpenChange,
  orgId,
  branches,
  currentBranchId,
}: CreateTransferSheetProps) {
  const t = useTranslations("inventory");
  const createTransfer = useCreateTransfer(orgId);
  const { data: parts = [] } = usePartsCatalog(orgId);

  const [items, setItems] = useState<TransferItem[]>([]);
  const [partSearch, setPartSearch] = useState("");

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      to_branch_id: "",
      from_branch_id: currentBranchId ?? "",
      notes: "",
    },
  });

  const activeBranches = branches.filter((b) => b.is_active !== false);

  const addItem = (partId: string, partName: string) => {
    if (items.some((i) => i.part_id === partId)) return;
    setItems((prev) => [
      ...prev,
      { part_id: partId, part_name: partName, quantity: 1, unit_cost: "" },
    ]);
    setPartSearch("");
  };

  const removeItem = (partId: string) => {
    setItems((prev) => prev.filter((i) => i.part_id !== partId));
  };

  const updateItem = (
    partId: string,
    field: keyof TransferItem,
    value: string | number,
  ) => {
    setItems((prev) =>
      prev.map((i) => (i.part_id === partId ? { ...i, [field]: value } : i)),
    );
  };

  const filteredParts = parts.filter(
    (p) =>
      p.is_active &&
      !items.some((i) => i.part_id === p.id) &&
      (p.name.toLowerCase().includes(partSearch.toLowerCase()) ||
        (p.part_number ?? "").toLowerCase().includes(partSearch.toLowerCase())),
  );

  const onSubmit = form.handleSubmit(async (data) => {
    if (items.length === 0) return;

    const params: CreateTransferParams = {
      from_branch_id: data.from_branch_id || undefined,
      to_branch_id: data.to_branch_id,
      notes: data.notes,
      items: items.map((i) => ({
        part_id: i.part_id,
        quantity: i.quantity,
        unit_cost: i.unit_cost ? Number(i.unit_cost) : undefined,
      })),
    };

    await createTransfer.mutateAsync(params);
    form.reset();
    setItems([]);
    onOpenChange(false);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          form.reset();
          setItems([]);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("newTransfer")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {/* Branch selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>{t("transferFromBranch")}</FieldLabel>
              <FieldContent>
                <Select
                  value={form.watch("from_branch_id") ?? ""}
                  onValueChange={(v) =>
                    form.setValue("from_branch_id", v ?? "", {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("transferAnyBranch")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {t("transferAnyBranch")}
                    </SelectItem>
                    {activeBranches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>
                {t("transferToBranch")}{" "}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Select
                  value={form.watch("to_branch_id")}
                  onValueChange={(v) =>
                    form.setValue("to_branch_id", v ?? "", {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectBranch")} />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBranches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError
                  errors={
                    form.formState.errors.to_branch_id?.message
                      ? [
                          {
                            message: form.formState.errors.to_branch_id.message,
                          },
                        ]
                      : undefined
                  }
                />
              </FieldContent>
            </Field>
          </div>

          {/* Part search + add */}
          <Field>
            <FieldLabel>{t("transferAddPart")}</FieldLabel>
            <FieldContent>
              <div className="relative">
                <Input
                  value={partSearch}
                  onChange={(e) => setPartSearch(e.target.value)}
                  placeholder={t("searchParts")}
                />
                {partSearch && filteredParts.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
                    {filteredParts.slice(0, 10).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addItem(p.id, p.name)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                      >
                        <span className="font-medium">{p.name}</span>
                        {p.part_number && (
                          <span className="text-muted-foreground text-xs">
                            {p.part_number}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </FieldContent>
          </Field>

          {/* Items list */}
          {items.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">{t("transferItems")}</span>
              <div className="rounded-md border divide-y divide-border">
                {items.map((item) => (
                  <div
                    key={item.part_id}
                    className="flex items-center gap-2 p-3"
                  >
                    <span className="text-sm font-medium flex-1 min-w-0 truncate">
                      {item.part_name}
                    </span>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          item.part_id,
                          "quantity",
                          Math.max(1, Number(e.target.value)),
                        )
                      }
                      className="w-20 text-center"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={t("transferUnitCost")}
                      value={item.unit_cost}
                      onChange={(e) =>
                        updateItem(item.part_id, "unit_cost", e.target.value)
                      }
                      className="w-24"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.part_id)}
                      className="shrink-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <Field>
            <FieldLabel>{t("transferNotes")}</FieldLabel>
            <FieldContent>
              <Textarea
                {...form.register("notes")}
                placeholder={t("transferNotesPlaceholder")}
                rows={2}
              />
            </FieldContent>
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={items.length === 0 || createTransfer.isPending}
            >
              {createTransfer.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Plus className="mr-2 size-4" />
              )}
              {t("createTransfer")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
