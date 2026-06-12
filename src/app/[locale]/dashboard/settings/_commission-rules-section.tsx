"use client";

import { Loader2, Pencil, Percent, Plus, Trash2, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import {
  useCommissionRules,
  useCreateCommissionRule,
  useDeleteCommissionRule,
  useUpdateCommissionRule,
} from "@/lib/queries/use-commission-rules";
import type { MechanicCommissionRule } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  SettingsBlock,
  SettingsError,
  SettingsTableFrame,
} from "./_settings-layout";

const COMMISSION_TYPE_VALUES = [
  "percentage_of_labor",
  "percentage_of_parts",
  "percentage_of_revenue",
  "fixed_per_work_order",
] as const;

function getCommissionTypeLabel(
  type: string,
  t: (key: string) => string,
): string {
  const labels: Record<string, string> = {
    percentage_of_labor: t("typePercentLabor"),
    percentage_of_parts: t("typePercentParts"),
    percentage_of_revenue: t("typePercentRevenue"),
    fixed_per_work_order: t("typeFixedPerWo"),
  };
  return labels[type] ?? type;
}

function getCommissionValueDisplay(rule: MechanicCommissionRule): string {
  if (rule.commission_type === "fixed_per_work_order") {
    return formatCurrency(rule.commission_value);
  }
  return `${rule.commission_value}%`;
}

interface MechanicOption {
  id: string;
  full_name: string | null;
}

// ── Zod Schema ──────────────────────────────────────────────

const commissionRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  mechanicId: z.string().optional(),
  commissionType: z.enum([
    "percentage_of_labor",
    "percentage_of_parts",
    "percentage_of_revenue",
    "fixed_per_work_order",
  ]),
  commissionValue: z
    .string()
    .min(1, "Commission value is required")
    .refine((val) => {
      const num = Number(val);
      return !Number.isNaN(num) && num > 0;
    }, "Must be a positive number"),
  minCommission: z.string().optional(),
  maxCommission: z.string().optional(),
  isActive: z.boolean(),
});

type CommissionRuleValues = z.infer<typeof commissionRuleSchema>;

function CommissionFormDialog({
  open,
  onOpenChange,
  orgId,
  editingRule,
  mechanics,
  mechanicsLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  editingRule: MechanicCommissionRule | null;
  mechanics: MechanicOption[];
  mechanicsLoading: boolean;
}) {
  const t = useTranslations("settings");
  const createRule = useCreateCommissionRule(orgId);
  const updateRule = useUpdateCommissionRule(orgId);
  const isEditing = !!editingRule;

  const form = useForm<CommissionRuleValues>({
    resolver: zodResolver(commissionRuleSchema),
    defaultValues: {
      name: editingRule?.name ?? "",
      mechanicId: editingRule?.mechanic_id ?? "",
      commissionType: editingRule?.commission_type ?? "percentage_of_labor",
      commissionValue: editingRule ? String(editingRule.commission_value) : "",
      minCommission: editingRule?.min_commission
        ? String(editingRule.min_commission)
        : "",
      maxCommission: editingRule?.max_commission
        ? String(editingRule.max_commission)
        : "",
      isActive: editingRule?.is_active ?? true,
    },
  });

  const watchedCommissionType = form.watch("commissionType");

  const selectedMechanic =
    mechanics.find((m) => m.id === form.watch("mechanicId")) ?? null;

  async function onSubmit(data: CommissionRuleValues) {
    try {
      const body = {
        name: data.name.trim(),
        mechanic_id: data.mechanicId || null,
        commission_type:
          data.commissionType as MechanicCommissionRule["commission_type"],
        commission_value: parseFloat(data.commissionValue),
        min_commission: data.minCommission
          ? parseFloat(data.minCommission)
          : null,
        max_commission: data.maxCommission
          ? parseFloat(data.maxCommission)
          : null,
        is_active: data.isActive,
      };

      if (isEditing && editingRule) {
        await updateRule.mutateAsync({ id: editingRule.id, body });
        toast.success(t("commissionRuleUpdated"));
      } else {
        await createRule.mutateAsync(body);
        toast.success(t("commissionRuleCreated"));
      }

      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToSaveRule"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editCommissionRule") : t("createCommissionRule")}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor="rule-name">{t("ruleName")}</FieldLabel>
              <FieldContent>
                <Input
                  id="rule-name"
                  placeholder={t("ruleNamePlaceholder")}
                  aria-invalid={!!form.formState.errors.name}
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <FieldError>{form.formState.errors.name.message}</FieldError>
                )}
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>{t("mechanicField")}</FieldLabel>
              <FieldContent>
                {mechanicsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Combobox
                    items={mechanics}
                    value={selectedMechanic}
                    onValueChange={(m) =>
                      form.setValue("mechanicId", m?.id ?? "")
                    }
                  >
                    <ComboboxInput
                      placeholder={t("mechanicPlaceholder")}
                      showTrigger
                      showClear={!!form.watch("mechanicId")}
                      className="h-11 text-sm"
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {(mechanic: MechanicOption) => (
                          <ComboboxItem key={mechanic.id} value={mechanic}>
                            <User className="size-4 shrink-0 text-muted-foreground" />
                            <span>{mechanic.full_name ?? "Unknown"}</span>
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                      <ComboboxEmpty>{t("noMechanicsFound")}</ComboboxEmpty>
                    </ComboboxContent>
                  </Combobox>
                )}
                <Typography.Muted className="text-xs text-muted-foreground">
                  {t("mechanicHint")}
                </Typography.Muted>
              </FieldContent>
            </Field>

            <Field data-invalid={!!form.formState.errors.commissionType}>
              <FieldLabel htmlFor="commission-type">
                {t("commissionType")}
              </FieldLabel>
              <FieldContent>
                <select
                  id="commission-type"
                  value={form.watch("commissionType")}
                  onChange={(e) =>
                    form.setValue(
                      "commissionType",
                      e.target.value as CommissionRuleValues["commissionType"],
                    )
                  }
                  className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {COMMISSION_TYPE_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {getCommissionTypeLabel(value, t)}
                    </option>
                  ))}
                </select>
                {form.formState.errors.commissionType && (
                  <FieldError>
                    {form.formState.errors.commissionType.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>

            <Field data-invalid={!!form.formState.errors.commissionValue}>
              <FieldLabel htmlFor="commission-value">
                {watchedCommissionType === "fixed_per_work_order"
                  ? t("fixedAmount")
                  : t("commissionPercent")}
              </FieldLabel>
              <FieldContent>
                <div className="relative">
                  <Input
                    id="commission-value"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={
                      watchedCommissionType === "fixed_per_work_order"
                        ? "0.00"
                        : "0"
                    }
                    aria-invalid={!!form.formState.errors.commissionValue}
                    className={
                      watchedCommissionType !== "fixed_per_work_order"
                        ? "pr-8"
                        : ""
                    }
                    {...form.register("commissionValue")}
                  />
                  {watchedCommissionType !== "fixed_per_work_order" && (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  )}
                </div>
                {form.formState.errors.commissionValue && (
                  <FieldError>
                    {form.formState.errors.commissionValue.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>

            <FieldGroup className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!form.formState.errors.minCommission}>
                <FieldLabel htmlFor="min-commission">
                  {t("minCommission")}
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="min-commission"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={t("optional")}
                    {...form.register("minCommission")}
                  />
                </FieldContent>
              </Field>
              <Field data-invalid={!!form.formState.errors.maxCommission}>
                <FieldLabel htmlFor="max-commission">
                  {t("maxCommission")}
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="max-commission"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={t("optional")}
                    {...form.register("maxCommission")}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>
          </FieldGroup>

          <div className="flex items-center gap-3">
            <Switch
              checked={form.watch("isActive")}
              onCheckedChange={(v) => form.setValue("isActive", v)}
            />
            <Label className="cursor-pointer">{t("active")}</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {isEditing ? t("updateRule") : t("createRule")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface CommissionRulesSectionProps {
  orgId: string;
}

export function CommissionRulesSection({ orgId }: CommissionRulesSectionProps) {
  const t = useTranslations("settings");
  const { data: rules, isLoading, error } = useCommissionRules(orgId);
  const deleteRule = useDeleteCommissionRule(orgId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<MechanicCommissionRule | null>(
    null,
  );
  const [mechanics, setMechanics] = useState<MechanicOption[]>([]);
  const [mechanicsLoading, setMechanicsLoading] = useState(false);

  function openAddDialog() {
    setEditingRule(null);
    fetchMechanics();
    setDialogOpen(true);
  }

  function openEditDialog(rule: MechanicCommissionRule) {
    setEditingRule(rule);
    fetchMechanics();
    setDialogOpen(true);
  }

  async function fetchMechanics() {
    setMechanicsLoading(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/reports?type=mechanics`,
      );
      const json = await res.json();
      setMechanics(json.data ?? []);
    } catch {
      // Silently fail - mechanics list is optional UX
    } finally {
      setMechanicsLoading(false);
    }
  }

  async function handleDelete(ruleId: string) {
    if (!confirm(t("confirmDeleteMessage"))) return;
    try {
      await deleteRule.mutateAsync(ruleId);
      toast.success(t("commissionRuleDeleted"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToDeleteRule"));
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={`skel-${i}`} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return <SettingsError message={t("failedToLoadRules")} />;
  }

  return (
    <>
      <SettingsBlock>
        <div className="flex items-center justify-between">
          <Typography.Muted className="text-sm text-muted-foreground">
            {t("commissionRulesDesc")}
          </Typography.Muted>
          <Button onClick={openAddDialog} size="sm">
            <Plus className="mr-1.5 size-4" />
            {t("addCommissionRule")}
          </Button>
        </div>

        {!rules || rules.length === 0 ? (
          <Empty className="border border-dashed py-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Percent />
              </EmptyMedia>
              <EmptyTitle>{t("noCommissionRulesYet")}</EmptyTitle>
              <EmptyDescription>{t("noCommissionRulesDesc")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <SettingsTableFrame>
            <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="px-4 py-3 font-medium">
                      {t("tableName")}
                    </TableHead>
                    <TableHead className="px-4 py-3 font-medium">
                      {t("tableMechanic")}
                    </TableHead>
                    <TableHead className="px-4 py-3 font-medium">
                      {t("tableType")}
                    </TableHead>
                    <TableHead className="px-4 py-3 font-medium text-right">
                      {t("tableValue")}
                    </TableHead>
                    <TableHead className="px-4 py-3 font-medium text-right">
                      {t("tableMinMax")}
                    </TableHead>
                    <TableHead className="px-4 py-3 font-medium">
                      {t("tableStatus")}
                    </TableHead>
                    <TableHead className="px-4 py-3 font-medium text-right">
                      {t("tableActions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id} className="border-b border-border">
                      <TableCell className="px-4 py-3 font-medium">
                        {rule.name}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {"mechanic_name" in rule
                          ? ((rule.mechanic_name as string) ??
                            t("allMechanics"))
                          : t("allMechanics")}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {getCommissionTypeLabel(rule.commission_type, t)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums">
                        {getCommissionValueDisplay(rule)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {rule.min_commission != null
                          ? formatCurrency(rule.min_commission)
                          : "—"}
                        {" / "}
                        {rule.max_commission != null
                          ? formatCurrency(rule.max_commission)
                          : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          variant={rule.is_active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {rule.is_active ? t("active") : t("inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEditDialog(rule)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(rule.id)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          </SettingsTableFrame>
        )}
      </SettingsBlock>

      <CommissionFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingRule(null);
        }}
        orgId={orgId}
        editingRule={editingRule}
        mechanics={mechanics}
        mechanicsLoading={mechanicsLoading}
      />
    </>
  );
}
