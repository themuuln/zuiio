"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Controller, type Resolver } from "react-hook-form";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
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
import { createOrgQuery } from "@/lib/queries/factory";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
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

const priceRuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  apply_to: z.enum(["part", "service", "both"]),
  conditions_type: z.enum([
    "class",
    "make",
    "make_model",
    "fuel",
    "body_type",
    "all",
  ]),
  conditions_makes: z.string(),
  conditions_models: z.string(),
  conditions_classes: z.string(),
  conditions_fuel_types: z.string(),
  conditions_body_types: z.string(),
  conditions_description: z.string(),
  operator: z.enum([
    "multiply",
    "add_fixed",
    "set_fixed",
    "percentage_add",
    "percentage_sub",
  ]),
  value: z.string().min(1, "Value is required"),
  priority: z.string().min(1, "Priority is required"),
  part_category: z.string(),
  service_category: z.string(),
  part_name_pattern: z.string(),
  service_name_pattern: z.string(),
}).superRefine((data, ctx) => {
  // At least one brand condition required for non-"all" types
  if (data.conditions_type !== "all") {
    const relevantField =
      data.conditions_type === "class"
        ? "conditions_classes"
        : data.conditions_type === "make" ||
            data.conditions_type === "make_model"
          ? "conditions_makes"
          : data.conditions_type === "fuel"
            ? "conditions_fuel_types"
            : data.conditions_type === "body_type"
              ? "conditions_body_types"
              : null;
    if (relevantField && !data[relevantField as keyof typeof data]?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `At least one condition value is required for this type`,
        path: [relevantField],
      });
    }
  }
});

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

const fetchPriceRules = createOrgQuery<PriceRule[]>("/price-rules");

function buildPriceRuleBody(form: RuleForm) {
  const { conditions, description } = buildConditions(
    form.conditions_type,
    form,
  );
  return {
    name: form.name,
    description: form.description,
    apply_to: form.apply_to,
    conditions,
    conditions_description: description,
    operator: form.operator,
    value: Number(form.value),
    priority: Number(form.priority),
    part_category: form.part_category || null,
    service_category: form.service_category || null,
    part_name_pattern: form.part_name_pattern || null,
    service_name_pattern: form.service_name_pattern || null,
  };
}

export function PricingRulesSection({ orgId }: { orgId: string }) {
  const t = useTranslations("settings") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PriceRule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const formId = useId();
  const form = useForm<RuleForm>({
    resolver: zodResolver(priceRuleSchema) as unknown as Resolver<RuleForm>,
    defaultValues: DEFAULT_FORM,
    mode: "onSubmit",
  });

  const formDefaults = useMemo(() => {
    if (!editingRule) return DEFAULT_FORM;
    const cond = (editingRule.conditions ?? {}) as Record<string, unknown>;
    let conditionsType = "all";
    if (cond.classes) conditionsType = "class";
    else if (cond.makes && cond.models) conditionsType = "make_model";
    else if (cond.makes) conditionsType = "make";
    else if (cond.fuel_types) conditionsType = "fuel";
    else if (cond.body_types) conditionsType = "body_type";
    return {
      name: editingRule.name,
      description: editingRule.description ?? "",
      apply_to: editingRule.apply_to as "part" | "service" | "both",
      conditions_type: conditionsType as RuleForm["conditions_type"],
      conditions_makes: ((cond.makes as string[]) ?? []).join(", "),
      conditions_models: ((cond.models as string[]) ?? []).join(", "),
      conditions_classes: ((cond.classes as string[]) ?? []).join(", "),
      conditions_fuel_types: ((cond.fuel_types as string[]) ?? []).join(", "),
      conditions_body_types: ((cond.body_types as string[]) ?? []).join(", "),
      conditions_description: editingRule.conditions_description ?? "",
      operator: editingRule.operator,
      value: String(editingRule.value),
      priority: String(editingRule.priority),
      part_category: editingRule.part_category ?? "",
      service_category: editingRule.service_category ?? "",
      part_name_pattern: editingRule.part_name_pattern ?? "",
      service_name_pattern: editingRule.service_name_pattern ?? "",
    };
  }, [editingRule]);

  // Reset form when drawer opens
  useEffect(() => {
    if (dialogOpen) {
      form.reset(formDefaults);
    }
  }, [dialogOpen, formDefaults, form]);

  const { data: rules, isPending } = useQuery({
    queryKey: priceRuleKeys.all(orgId),
    queryFn: () => fetchPriceRules(orgId),
    enabled: !!orgId,
  });

  const createPriceRule = useOrgMutation<PriceRule, RuleForm>({
    endpoint: `/api/organizations/${orgId}/price-rules`,
    method: "POST",
    queryKey: priceRuleKeys.all(orgId),
    bodyFn: (form) => buildPriceRuleBody(form),
    successMessage: t("savePriceRule"),
    onSuccess: () => {
      setDialogOpen(false);
      setEditingRule(null);
    },
  });

  const updatePriceRule = useOrgMutation<
    PriceRule,
    { id: string; form: RuleForm }
  >({
    endpoint: (vars) => `/api/organizations/${orgId}/price-rules?id=${vars.id}`,
    method: "PATCH",
    queryKey: priceRuleKeys.all(orgId),
    bodyFn: (vars) => buildPriceRuleBody(vars.form),
    successMessage: t("savePriceRule"),
    onSuccess: () => {
      setDialogOpen(false);
      setEditingRule(null);
    },
  });

  const deletePriceRule = useOrgMutation<unknown, string>({
    endpoint: (id) => `/api/organizations/${orgId}/price-rules?id=${id}`,
    method: "DELETE",
    queryKey: priceRuleKeys.all(orgId),
    successMessage: t("deletePriceRule"),
    onSuccess: () => {
      setDeleteConfirm(null);
    },
  });

  const togglePriceRule = useOrgMutation<
    unknown,
    { id: string; is_active: boolean }
  >({
    endpoint: (vars) => `/api/organizations/${orgId}/price-rules?id=${vars.id}`,
    method: "PATCH",
    queryKey: priceRuleKeys.all(orgId),
    bodyFn: (vars) => ({ is_active: vars.is_active }),
  });

  const openNew = useCallback(() => {
    setEditingRule(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((rule: PriceRule) => {
    setEditingRule(rule);
    setDialogOpen(true);
  }, []);

  const sortedRules = useMemo(() => {
    if (!rules) return [];
    return [...rules].sort((a, b) => a.priority - b.priority);
  }, [rules]);

  if (isPending) {
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
                    togglePriceRule.mutate({ id: rule.id, is_active: checked })
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
      <DetailDrawer open={dialogOpen} onOpenChange={setDialogOpen}>
        <DetailDrawer.Header>
          <DetailDrawer.Title>
            {editingRule ? t("editPriceRule") : t("createPriceRule")}
          </DetailDrawer.Title>
        </DetailDrawer.Header>

        <DetailDrawer.Body>
          <form
            id={formId}
            onSubmit={form.handleSubmit((data) => {
              if (editingRule) {
                updatePriceRule.mutate({ id: editingRule.id, form: data });
              } else {
                createPriceRule.mutate(data);
              }
            })}
            className="flex flex-col gap-4"
          >
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel>{t("ruleName")}</FieldLabel>
              <FieldContent>
                <Input
                  {...form.register("name")}
                  placeholder={t("ruleNamePlaceholder")}
                />
                {form.formState.errors.name && (
                  <FieldError>
                    {form.formState.errors.name.message}
                  </FieldError>
                )}
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>{t("description")}</FieldLabel>
              <FieldContent>
                <Textarea
                  {...form.register("description")}
                  placeholder={t("descriptionPlaceholder")}
                  rows={2}
                />
              </FieldContent>
            </Field>

            <Separator />

            <Controller
              control={form.control}
              name="apply_to"
              render={({ field }) => (
                <Field data-invalid={!!form.formState.errors.apply_to}>
                  <FieldLabel>{t("appliesTo")}</FieldLabel>
                  <FieldContent>
                    <Select
                      value={field.value || null}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">
                          {t("appliesBoth")}
                        </SelectItem>
                        <SelectItem value="part">
                          {t("appliesParts")}
                        </SelectItem>
                        <SelectItem value="service">
                          {t("appliesServices")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
              )}
            />

            <Separator />

            <Controller
              control={form.control}
              name="conditions_type"
              render={({ field }) => (
                <Field data-invalid={!!form.formState.errors.conditions_type}>
                  <FieldLabel>{t("vehicleCondition")}</FieldLabel>
                  <FieldContent>
                    <Select
                      value={field.value || null}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(getConditionLabels(t)).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.conditions_type && (
                      <FieldError>
                        {form.formState.errors.conditions_type.message}
                      </FieldError>
                    )}
                  </FieldContent>
                </Field>
              )}
            />

            {form.watch("conditions_type") === "class" && (
              <Field data-invalid={!!form.formState.errors.conditions_classes}>
                <FieldLabel>{t("vehicleClasses")}</FieldLabel>
                <FieldContent>
                  <Input
                    {...form.register("conditions_classes")}
                    placeholder={t("vehicleClassesPlaceholder")}
                  />
                  {form.formState.errors.conditions_classes && (
                    <FieldError>
                      {form.formState.errors.conditions_classes.message}
                    </FieldError>
                  )}
                </FieldContent>
              </Field>
            )}

            {(form.watch("conditions_type") === "make" ||
              form.watch("conditions_type") === "make_model") && (
              <Field data-invalid={!!form.formState.errors.conditions_makes}>
                <FieldLabel>{t("makesLabel")}</FieldLabel>
                <FieldContent>
                  <Input
                    {...form.register("conditions_makes")}
                    placeholder={t("makesPlaceholder")}
                  />
                  {form.formState.errors.conditions_makes && (
                    <FieldError>
                      {form.formState.errors.conditions_makes.message}
                    </FieldError>
                  )}
                </FieldContent>
              </Field>
            )}

            {form.watch("conditions_type") === "make_model" && (
              <Field data-invalid={!!form.formState.errors.conditions_models}>
                <FieldLabel>{t("modelsLabel")}</FieldLabel>
                <FieldContent>
                  <Input
                    {...form.register("conditions_models")}
                    placeholder={t("modelsPlaceholder")}
                  />
                  {form.formState.errors.conditions_models && (
                    <FieldError>
                      {form.formState.errors.conditions_models.message}
                    </FieldError>
                  )}
                </FieldContent>
              </Field>
            )}

            {form.watch("conditions_type") === "fuel" && (
              <Field
                data-invalid={!!form.formState.errors.conditions_fuel_types}
              >
                <FieldLabel>{t("fuelTypes")}</FieldLabel>
                <FieldContent>
                  <Input
                    {...form.register("conditions_fuel_types")}
                    placeholder={t("fuelTypesPlaceholder")}
                  />
                  {form.formState.errors.conditions_fuel_types && (
                    <FieldError>
                      {form.formState.errors.conditions_fuel_types.message}
                    </FieldError>
                  )}
                </FieldContent>
              </Field>
            )}

            {form.watch("conditions_type") === "body_type" && (
              <Field
                data-invalid={!!form.formState.errors.conditions_body_types}
              >
                <FieldLabel>{t("bodyTypesLabel")}</FieldLabel>
                <FieldContent>
                  <Input
                    {...form.register("conditions_body_types")}
                    placeholder={t("bodyTypesPlaceholder")}
                  />
                  {form.formState.errors.conditions_body_types && (
                    <FieldError>
                      {form.formState.errors.conditions_body_types.message}
                    </FieldError>
                  )}
                </FieldContent>
              </Field>
            )}

            <Field>
              <FieldLabel>{t("conditionDisplay")}</FieldLabel>
              <FieldContent>
                <Input
                  {...form.register("conditions_description")}
                  placeholder={t("conditionDisplayPlaceholder")}
                />
              </FieldContent>
            </Field>

            <Separator />

            <Controller
              control={form.control}
              name="operator"
              render={({ field }) => (
                <Field data-invalid={!!form.formState.errors.operator}>
                  <FieldLabel>{t("operator")}</FieldLabel>
                  <FieldContent>
                    <Select
                      value={field.value || null}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(getOperatorLabels(t)).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="value"
              render={({ field }) => (
                <Field data-invalid={!!form.formState.errors.value}>
                  <FieldLabel>{t("value")}</FieldLabel>
                  <FieldContent>
                    <NumericInput
                      step={0.01}
                      value={Number(field.value) || 0}
                      onChange={(v) => field.onChange(String(v))}
                      placeholder={
                        form.watch("operator") === "multiply"
                          ? "1.25"
                          : form.watch("operator") === "add_fixed"
                            ? "20000"
                            : "100"
                      }
                    />
                    {form.formState.errors.value && (
                      <FieldError>
                        {form.formState.errors.value.message}
                      </FieldError>
                    )}
                  </FieldContent>
                  <Typography.Muted className="text-[11px] text-muted-foreground">
                    {form.watch("operator") === "multiply" &&
                      t("valueMultiplyHint")}
                    {form.watch("operator") === "add_fixed" &&
                      t("valueAddFixedHint")}
                    {form.watch("operator") === "set_fixed" &&
                      t("valueSetFixedHint")}
                    {form.watch("operator") === "percentage_add" &&
                      t("valuePercentAddHint")}
                    {form.watch("operator") === "percentage_sub" &&
                      t("valuePercentSubHint")}
                  </Typography.Muted>
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="priority"
              render={({ field }) => (
                <Field data-invalid={!!form.formState.errors.priority}>
                  <FieldLabel>{t("priorityLabel")}</FieldLabel>
                  <FieldContent>
                    <NumericInput
                      value={Number(field.value) || 0}
                      onChange={(v) => field.onChange(String(v))}
                      placeholder="100"
                    />
                    {form.formState.errors.priority && (
                      <FieldError>
                        {form.formState.errors.priority.message}
                      </FieldError>
                    )}
                  </FieldContent>
                  <Typography.Muted className="text-[11px] text-muted-foreground">
                    {t("priorityHint")}
                  </Typography.Muted>
                </Field>
              )}
            />

            <Separator />

            <div className="flex flex-col gap-2">
              <Label>{t("categoryFilter")}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("partCategory")}
                  </Label>
                  <Input
                    {...form.register("part_category")}
                    placeholder={t("partCategoryPlaceholder")}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t("serviceCategory")}
                  </Label>
                  <Input
                    {...form.register("service_category")}
                    placeholder={t("serviceCategoryPlaceholder")}
                  />
                </div>
              </div>
            </div>
          </form>
        </DetailDrawer.Body>

        <DetailDrawer.Footer>
          <DetailDrawer.FooterActions>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              form={formId}
              size="lg"
              disabled={
                createPriceRule.isPending || updatePriceRule.isPending
              }
            >
              {createPriceRule.isPending || updatePriceRule.isPending
                ? t("saving")
                : editingRule
                  ? t("updateRule")
                  : t("createRule")}
            </Button>
          </DetailDrawer.FooterActions>
        </DetailDrawer.Footer>
      </DetailDrawer>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deletePriceRuleTitle")}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            {t("deletePriceRuleDesc")}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteConfirm(null)}
            >
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteConfirm)
                  deletePriceRule.mutate(deleteConfirm);
              }}
              disabled={deletePriceRule.isPending}
            >
              {deletePriceRule.isPending ? t("saving") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
