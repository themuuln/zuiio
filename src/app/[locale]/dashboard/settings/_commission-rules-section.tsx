"use client";

import { Percent, Pencil, Plus, Trash2, Loader2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  useCommissionRules,
  useCreateCommissionRule,
  useUpdateCommissionRule,
  useDeleteCommissionRule,
} from "@/lib/queries/use-commission-rules";
import type { MechanicCommissionRule } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { Typography } from "@/components/ui/typography";

const COMMISSION_TYPES = [
  { value: "percentage_of_labor", label: "% of Labor" },
  { value: "percentage_of_parts", label: "% of Parts" },
  { value: "percentage_of_revenue", label: "% of Revenue" },
  { value: "fixed_per_work_order", label: "Fixed per WO" },
] as const;

function getCommissionTypeLabel(type: string): string {
  return COMMISSION_TYPES.find((t) => t.value === type)?.label ?? type;
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
  const createRule = useCreateCommissionRule(orgId);
  const updateRule = useUpdateCommissionRule(orgId);
  const isEditing = !!editingRule;

  const [name, setName] = useState(editingRule?.name ?? "");
  const [mechanicId, setMechanicId] = useState(editingRule?.mechanic_id ?? "");
  const [commissionType, setCommissionType] = useState<MechanicCommissionRule['commission_type']>(
    editingRule?.commission_type ?? "percentage_of_labor",
  );
  const [commissionValue, setCommissionValue] = useState(
    String(editingRule?.commission_value ?? ""),
  );
  const [minCommission, setMinCommission] = useState(
    editingRule?.min_commission ? String(editingRule.min_commission) : "",
  );
  const [maxCommission, setMaxCommission] = useState(
    editingRule?.max_commission ? String(editingRule.max_commission) : "",
  );
  const [isActive, setIsActive] = useState(editingRule?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setName("");
    setMechanicId("");
    setCommissionType("percentage_of_labor");
    setCommissionValue("");
    setMinCommission("");
    setMaxCommission("");
    setIsActive(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !commissionValue) {
      toast.error("Name and commission value are required");
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        mechanic_id: mechanicId || null,
        commission_type: commissionType as MechanicCommissionRule['commission_type'],
        commission_value: parseFloat(commissionValue),
        min_commission: minCommission ? parseFloat(minCommission) : null,
        max_commission: maxCommission ? parseFloat(maxCommission) : null,
        is_active: isActive,
      };

      if (isEditing && editingRule) {
        await updateRule.mutateAsync({ id: editingRule.id, body });
        toast.success("Commission rule updated");
      } else {
        await createRule.mutateAsync(body);
        toast.success("Commission rule created");
      }

      onOpenChange(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save rule");
    } finally {
      setSaving(false);
    }
  }

  const selectedMechanic = mechanics.find((m) => m.id === mechanicId) ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Commission Rule" : "Add Commission Rule"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
          <Field>
            <FieldLabel htmlFor="rule-name">Rule Name</FieldLabel>
            <Input
              id="rule-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard Labor Commission"
              required
            />
          </Field>

          <Field>
            <FieldLabel>Mechanic</FieldLabel>
            {mechanicsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Combobox
                items={mechanics}
                value={selectedMechanic}
                onValueChange={(m) => setMechanicId(m?.id ?? "")}
              >
                <ComboboxInput
                  placeholder="All Mechanics (default rule)"
                  showTrigger
                  showClear={!!mechanicId}
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
                  <ComboboxEmpty>No mechanics found</ComboboxEmpty>
                </ComboboxContent>
              </Combobox>
            )}
            <Typography.Muted className="text-xs text-muted-foreground">
              Leave empty to apply to all mechanics
            </Typography.Muted>
          </Field>

          <Field>
            <FieldLabel htmlFor="commission-type">Commission Type</FieldLabel>
            <select
              id="commission-type"
              value={commissionType}
              onChange={(e) => setCommissionType(e.target.value as MechanicCommissionRule['commission_type'])}
              className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {COMMISSION_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>
                  {ct.label}
                </option>
              ))}
            </select>
          </Field>

          <Field>
            <FieldLabel htmlFor="commission-value">
              {commissionType === "fixed_per_work_order"
                ? "Fixed Amount"
                : "Commission Percentage"}
            </FieldLabel>
            <div className="relative">
              <Input
                id="commission-value"
                type="number"
                step="0.01"
                min="0"
                value={commissionValue}
                onChange={(e) => setCommissionValue(e.target.value)}
                placeholder={commissionType === "fixed_per_work_order" ? "0.00" : "0"}
                required
                className={commissionType !== "fixed_per_work_order" ? "pr-8" : ""}
              />
              {commissionType !== "fixed_per_work_order" && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              )}
            </div>
          </Field>

          <FieldGroup className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="min-commission">Min Commission</FieldLabel>
              <Input
                id="min-commission"
                type="number"
                step="0.01"
                min="0"
                value={minCommission}
                onChange={(e) => setMinCommission(e.target.value)}
                placeholder="Optional"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="max-commission">Max Commission</FieldLabel>
              <Input
                id="max-commission"
                type="number"
                step="0.01"
                min="0"
                value={maxCommission}
                onChange={(e) => setMaxCommission(e.target.value)}
                placeholder="Optional"
              />
            </Field>
          </FieldGroup>
          </FieldGroup>

          <div className="flex items-center gap-3">
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label className="cursor-pointer">Active</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? "Update" : "Create"}
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
  const { data: rules, isLoading, error } = useCommissionRules(orgId);
  const deleteRule = useDeleteCommissionRule(orgId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<MechanicCommissionRule | null>(null);
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
      const res = await fetch(`/api/organizations/${orgId}/reports?type=mechanics`);
      const json = await res.json();
      setMechanics(json.data ?? []);
    } catch {
      // Silently fail - mechanics list is optional UX
    } finally {
      setMechanicsLoading(false);
    }
  }

  async function handleDelete(ruleId: string) {
    if (!confirm("Are you sure you want to delete this commission rule?")) return;
    try {
      await deleteRule.mutateAsync(ruleId);
      toast.success("Commission rule deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete rule");
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
    return (
      <Card className="border-destructive/20">
        <CardContent className="py-6">
          <Typography.Text className="text-sm text-destructive">Failed to load commission rules</Typography.Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex mt-4 flex-col gap-4">
        <div className="flex items-center justify-between">
          <Typography.Muted className="text-sm text-muted-foreground">
            Configure how mechanics earn commissions on completed work orders.
          </Typography.Muted>
          <Button onClick={openAddDialog} size="sm">
            <Plus className="mr-1.5 size-4" />
            Add Rule
          </Button>
        </div>

        {!rules || rules.length === 0 ? (
          <Card>
            <CardContent>
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Percent />
                  </EmptyMedia>
                  <EmptyTitle>No commission rules yet</EmptyTitle>
                  <EmptyDescription>
                    Add a rule to start calculating mechanic commissions.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="px-4 py-3 font-medium">Name</TableHead>
                    <TableHead className="px-4 py-3 font-medium">Mechanic</TableHead>
                    <TableHead className="px-4 py-3 font-medium">Type</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-right">Value</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-right">Min/Max</TableHead>
                    <TableHead className="px-4 py-3 font-medium">Status</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id} className="border-b border-border">
                      <TableCell className="px-4 py-3 font-medium">
                        {rule.name}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {(rule as any).mechanic_name ?? "All Mechanics"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {getCommissionTypeLabel(rule.commission_type)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums">
                        {getCommissionValueDisplay(rule)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {rule.min_commission != null ? formatCurrency(rule.min_commission) : "—"}
                        {" / "}
                        {rule.max_commission != null ? formatCurrency(rule.max_commission) : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          variant={rule.is_active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {rule.is_active ? "Active" : "Inactive"}
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
            </CardContent>
          </Card>
        )}
      </div>

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
