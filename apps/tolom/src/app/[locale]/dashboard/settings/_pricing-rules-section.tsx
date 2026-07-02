"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { priceRuleKeys } from "@/lib/queries/keys";
import { SettingsBlock, SettingsListItem } from "./_settings-layout";

interface PriceRule {
  id: string;
  name: string;
  description: string | null;
  apply_to: string;
  conditions: Record<string, unknown>;
  conditions_description: string | null;
  operator: string;
  value: number;
  priority: number;
  part_category: string | null;
  service_category: string | null;
  part_name_pattern: string | null;
  service_name_pattern: string | null;
  is_active: boolean;
  created_at: string;
}

interface RuleForm {
  name: string;
  description: string;
  apply_to: "part" | "service" | "both";
  conditions_type:
    | "class"
    | "make"
    | "make_model"
    | "fuel"
    | "body_type"
    | "all";
  conditions_makes: string;
  conditions_models: string;
  conditions_classes: string;
  conditions_fuel_types: string;
  conditions_body_types: string;
  conditions_description: string;
  operator: string;
  value: string;
  priority: string;
  part_category: string;
  service_category: string;
  part_name_pattern: string;
  service_name_pattern: string;
}

const DEFAULT_FORM: RuleForm = {
  name: "",
  description: "",
  apply_to: "both",
  conditions_type: "class",
  conditions_makes: "",
  conditions_models: "",
  conditions_classes: "luxury",
  conditions_fuel_types: "",
  conditions_body_types: "",
  conditions_description: "",
  operator: "multiply",
  value: "1.25",
  priority: "100",
  part_category: "",
  service_category: "",
  part_name_pattern: "",
  service_name_pattern: "",
};

function getOperatorLabels(t: (key: string) => string): Record<string, string> {
  return {
    multiply: t("operatorMultiply"),
    add_fixed: t("operatorAddFixed"),
    set_fixed: t("operatorSetFixed"),
    percentage_add: t("operatorPercentAdd"),
    percentage_sub: t("operatorPercentSub"),
  };
}

function getConditionLabels(
  t: (key: string) => string,
): Record<string, string> {
  return {
    class: t("conditionClass"),
    make: t("conditionMake"),
    make_model: t("conditionMakeModel"),
    fuel: t("conditionFuel"),
    body_type: t("conditionBodyType"),
    all: t("conditionAll"),
  };
}

function buildConditions(
  type: string,
  form: RuleForm,
): { conditions: Record<string, unknown>; description: string } {
  switch (type) {
    case "class":
      return {
        conditions: {
          classes: form.conditions_classes
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
        description:
          form.conditions_description ||
          `Vehicle class: ${form.conditions_classes}`,
      };
    case "make":
      return {
        conditions: {
          makes: form.conditions_makes
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
        description:
          form.conditions_description || `Make: ${form.conditions_makes}`,
      };
    case "make_model":
      return {
        conditions: {
          makes: form.conditions_makes
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          models: form.conditions_models
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
        description:
          form.conditions_description ||
          `${form.conditions_makes} ${form.conditions_models}`,
      };
    case "fuel":
      return {
        conditions: {
          fuel_types: form.conditions_fuel_types
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
        description:
          form.conditions_description || `Fuel: ${form.conditions_fuel_types}`,
      };
    case "body_type":
      return {
        conditions: {
          body_types: form.conditions_body_types
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
        description:
          form.conditions_description || `Body: ${form.conditions_body_types}`,
      };
    case "all":
      return {
        conditions: {},
        description: form.conditions_description || "All vehicles",
      };
    default:
      return { conditions: {}, description: "" };
  }
}

function operatorDescription(op: string, value: number): string {
  switch (op) {
    case "multiply":
      return `× ${value}`;
    case "add_fixed":
      return `+ ${value.toLocaleString()}₮`;
    case "set_fixed":
      return `${value.toLocaleString()}₮ fixed`;
    case "percentage_add":
      return `+${value}%`;
    case "percentage_sub":
      return `-${value}%`;
    default:
      return `${op} ${value}`;
  }
}

export function PricingRulesSection({ orgId }: { orgId: string }) {
  const t = useTranslations("settings");
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PriceRule | null>(null);
  const [form, setForm] = useState<RuleForm>(DEFAULT_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: rules, isLoading } = useQuery({
    queryKey: priceRuleKeys.all(orgId),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/price-rules`);
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return (json.data ?? []) as PriceRule[];
    },
    enabled: !!orgId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { id?: string; form: RuleForm }) => {
      const { conditions, description } = buildConditions(
        data.form.conditions_type,
        data.form,
      );
      const body = {
        name: data.form.name,
        description: data.form.description,
        apply_to: data.form.apply_to,
        conditions,
        conditions_description: description,
        operator: data.form.operator,
        value: Number(data.form.value),
        priority: Number(data.form.priority),
        part_category: data.form.part_category || null,
        service_category: data.form.service_category || null,
        part_name_pattern: data.form.part_name_pattern || null,
        service_name_pattern: data.form.service_name_pattern || null,
      };

      if (data.id) {
        const res = await fetch(
          `/api/organizations/${orgId}/price-rules?id=${data.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.data;
      } else {
        const res = await fetch(`/api/organizations/${orgId}/price-rules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        return json.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceRuleKeys.all(orgId) });
      setDialogOpen(false);
      setEditingRule(null);
      setForm(DEFAULT_FORM);
      toast.success(t("savePriceRule"));
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(
        `/api/organizations/${orgId}/price-rules?id=${id}`,
        {
          method: "DELETE",
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceRuleKeys.all(orgId) });
      setDeleteConfirm(null);
      toast.success(t("deletePriceRule"));
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({
      id,
      is_active,
    }: {
      id: string;
      is_active: boolean;
    }) => {
      const res = await fetch(
        `/api/organizations/${orgId}/price-rules?id=${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active }),
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceRuleKeys.all(orgId) });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const openNew = useCallback(() => {
    setEditingRule(null);
    setForm(DEFAULT_FORM);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((rule: PriceRule) => {
    setEditingRule(rule);
    const cond = (rule.conditions ?? {}) as Record<string, unknown>;
    let conditionsType = "all";
    if (cond.classes) conditionsType = "class";
    else if (cond.makes && cond.models) conditionsType = "make_model";
    else if (cond.makes) conditionsType = "make";
    else if (cond.fuel_types) conditionsType = "fuel";
    else if (cond.body_types) conditionsType = "body_type";

    setForm({
      name: rule.name,
      description: rule.description ?? "",
      apply_to: rule.apply_to as "part" | "service" | "both",
      conditions_type: conditionsType as RuleForm["conditions_type"],
      conditions_makes: ((cond.makes as string[]) ?? []).join(", "),
      conditions_models: ((cond.models as string[]) ?? []).join(", "),
      conditions_classes: ((cond.classes as string[]) ?? []).join(", "),
      conditions_fuel_types: ((cond.fuel_types as string[]) ?? []).join(", "),
      conditions_body_types: ((cond.body_types as string[]) ?? []).join(", "),
      conditions_description: rule.conditions_description ?? "",
      operator: rule.operator,
      value: String(rule.value),
      priority: String(rule.priority),
      part_category: rule.part_category ?? "",
      service_category: rule.service_category ?? "",
      part_name_pattern: rule.part_name_pattern ?? "",
      service_name_pattern: rule.service_name_pattern ?? "",
    });
    setDialogOpen(true);
  }, []);

  const sortedRules = useMemo(() => {
    if (!rules) return [];
    return [...rules].sort((a, b) => a.priority - b.priority);
  }, [rules]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <Typography.Text className="text-sm text-muted-foreground">
            {t("rulesConfigured", { count: rules?.length ?? 0 })}
          </Typography.Text>
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="mr-1 size-4" />
          {t("addRule")}
        </Button>
      </div>

      {(!rules || rules.length === 0) && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8">
          <Tags className="size-8 text-muted-foreground/40" />
          <div className="text-center">
            <Typography.Text className="text-sm font-medium">
              {t("noPricingRulesYet")}
            </Typography.Text>
            <Typography.Muted className="text-xs text-muted-foreground">
              {t("noPricingRulesDesc")}
            </Typography.Muted>
          </div>
          <Button onClick={openNew} variant="outline" size="sm">
            <Plus className="mr-1 size-4" />
            {t("createFirstRule")}
          </Button>
        </div>
      )}

      {sortedRules.length > 0 && (
        <SettingsBlock className="gap-2">
          {sortedRules.map((rule) => (
            <SettingsListItem key={rule.id} inactive={!rule.is_active}>
              <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <Typography.Text className="text-sm font-medium">
                    {rule.name}
                  </Typography.Text>
                  <Badge
                    variant={rule.is_active ? "default" : "secondary"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {rule.is_active ? t("active") : t("inactive")}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {rule.apply_to === "both"
                      ? t("appliesBoth")
                      : rule.apply_to === "part"
                        ? t("appliesParts")
                        : t("appliesServices")}
                  </Badge>
                </div>
                {rule.description && (
                  <Typography.Muted className="text-xs text-muted-foreground">
                    {rule.description}
                  </Typography.Muted>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                    {t("priority")} {rule.priority}
                  </span>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                    {operatorDescription(rule.operator, rule.value)}
                  </span>
                  {rule.conditions_description && (
                    <span className="text-muted-foreground/70">
                      → {rule.conditions_description}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Switch
                  checked={rule.is_active}
                  onCheckedChange={(checked) =>
                    toggleMutation.mutate({ id: rule.id, is_active: checked })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => openEdit(rule)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive"
                  onClick={() => setDeleteConfirm(rule.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </SettingsListItem>
          ))}
        </SettingsBlock>
      )}

      {/* Edit/Create Dialog */}
      <DetailDrawer open={dialogOpen} onOpenChange={setDialogOpen} size="lg">
        <DetailDrawer.Header>
          <DetailDrawer.Title>
            {editingRule ? t("editPriceRule") : t("createPriceRule")}
          </DetailDrawer.Title>
        </DetailDrawer.Header>

        <DetailDrawer.Body>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>{t("ruleName")}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("ruleNamePlaceholder")}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("description")}</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder={t("descriptionPlaceholder")}
                rows={2}
              />
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <Label>{t("appliesTo")}</Label>
              <Select
                value={form.apply_to || null}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    apply_to: (v ?? "both") as "part" | "service" | "both",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">{t("appliesBoth")}</SelectItem>
                  <SelectItem value="part">{t("appliesParts")}</SelectItem>
                  <SelectItem value="service">
                    {t("appliesServices")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <Label>{t("vehicleCondition")}</Label>
              <Select
                value={form.conditions_type || null}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    conditions_type: (v ??
                      "class") as RuleForm["conditions_type"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(getConditionLabels(t)).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.conditions_type === "class" && (
              <div className="flex flex-col gap-2">
                <Label>{t("vehicleClasses")}</Label>
                <Input
                  value={form.conditions_classes}
                  onChange={(e) =>
                    setForm({ ...form, conditions_classes: e.target.value })
                  }
                  placeholder={t("vehicleClassesPlaceholder")}
                />
              </div>
            )}

            {(form.conditions_type === "make" ||
              form.conditions_type === "make_model") && (
              <div className="flex flex-col gap-2">
                <Label>{t("makesLabel")}</Label>
                <Input
                  value={form.conditions_makes}
                  onChange={(e) =>
                    setForm({ ...form, conditions_makes: e.target.value })
                  }
                  placeholder={t("makesPlaceholder")}
                />
              </div>
            )}

            {form.conditions_type === "make_model" && (
              <div className="flex flex-col gap-2">
                <Label>{t("modelsLabel")}</Label>
                <Input
                  value={form.conditions_models}
                  onChange={(e) =>
                    setForm({ ...form, conditions_models: e.target.value })
                  }
                  placeholder={t("modelsPlaceholder")}
                />
              </div>
            )}

            {form.conditions_type === "fuel" && (
              <div className="flex flex-col gap-2">
                <Label>{t("fuelTypes")}</Label>
                <Input
                  value={form.conditions_fuel_types}
                  onChange={(e) =>
                    setForm({ ...form, conditions_fuel_types: e.target.value })
                  }
                  placeholder={t("fuelTypesPlaceholder")}
                />
              </div>
            )}

            {form.conditions_type === "body_type" && (
              <div className="flex flex-col gap-2">
                <Label>{t("bodyTypesLabel")}</Label>
                <Input
                  value={form.conditions_body_types}
                  onChange={(e) =>
                    setForm({ ...form, conditions_body_types: e.target.value })
                  }
                  placeholder={t("bodyTypesPlaceholder")}
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label>{t("conditionDisplay")}</Label>
              <Input
                value={form.conditions_description}
                onChange={(e) =>
                  setForm({ ...form, conditions_description: e.target.value })
                }
                placeholder={t("conditionDisplayPlaceholder")}
              />
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <Label>{t("operator")}</Label>
              <Select
                value={form.operator || null}
                onValueChange={(v) =>
                  setForm({ ...form, operator: v ?? "multiply" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(getOperatorLabels(t)).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("value")}</Label>
              <Input
                type="number"
                step="0.01"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={
                  form.operator === "multiply"
                    ? "1.25"
                    : form.operator === "add_fixed"
                      ? "20000"
                      : "100"
                }
              />
              <Typography.Muted className="text-[11px] text-muted-foreground">
                {form.operator === "multiply" && t("valueMultiplyHint")}
                {form.operator === "add_fixed" && t("valueAddFixedHint")}
                {form.operator === "set_fixed" && t("valueSetFixedHint")}
                {form.operator === "percentage_add" && t("valuePercentAddHint")}
                {form.operator === "percentage_sub" && t("valuePercentSubHint")}
              </Typography.Muted>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("priorityLabel")}</Label>
              <Input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                placeholder="100"
              />
              <Typography.Muted className="text-[11px] text-muted-foreground">
                {t("priorityHint")}
              </Typography.Muted>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <Label>{t("categoryFilter")}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("partCategory")}
                  </Label>
                  <Input
                    value={form.part_category}
                    onChange={(e) =>
                      setForm({ ...form, part_category: e.target.value })
                    }
                    placeholder={t("partCategoryPlaceholder")}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("serviceCategory")}
                  </Label>
                  <Input
                    value={form.service_category}
                    onChange={(e) =>
                      setForm({ ...form, service_category: e.target.value })
                    }
                    placeholder={t("serviceCategoryPlaceholder")}
                  />
                </div>
              </div>
            </div>
          </div>
        </DetailDrawer.Body>

        <DetailDrawer.Footer>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => saveMutation.mutate({ id: editingRule?.id, form })}
            disabled={!form.name || saveMutation.isPending}
          >
            {saveMutation.isPending
              ? t("saving")
              : editingRule
                ? t("updateRule")
                : t("createRule")}
          </Button>
        </DetailDrawer.Footer>
      </DetailDrawer>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("deletePriceRuleTitle")}</DialogTitle>
          </DialogHeader>
          <Typography.Muted className="text-sm text-muted-foreground">
            {t("deletePriceRuleDesc")}
          </Typography.Muted>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirm) deleteMutation.mutate(deleteConfirm);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t("saving") : t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
