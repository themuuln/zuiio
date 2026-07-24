import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { PriceRule } from "@/lib/types";

export type { PriceRule } from "@/lib/types";

export interface PriceRuleCondition {
  /** Vehicle makes to match, e.g. ["Lexus", "Toyota"] */
  makes?: string[];
  /** Specific models to match, e.g. ["RX", "Harrier"] */
  models?: string[];
  /** Vehicle class to match: luxury, standard, economy, performance */
  classes?: string[];
  /** Body types to match: suv, sedan, crossover, etc. */
  body_types?: string[];
  /** Fuel types: gasoline, hybrid, diesel, electric, etc. */
  fuel_types?: string[];
  /** Year range */
  years?: { start?: number; end?: number };
}

export type RuleOperator =
  | "multiply"
  | "add_fixed"
  | "set_fixed"
  | "percentage_add"
  | "percentage_sub";

export interface CreatePriceRuleParams {
  name: string;
  description?: string;
  apply_to: "part" | "service" | "both";
  conditions: PriceRuleCondition;
  conditions_description?: string;
  operator: RuleOperator;
  value: number;
  priority?: number;
  part_category?: string;
  service_category?: string;
  part_name_pattern?: string;
  service_name_pattern?: string;
}

export interface PriceResolutionInput {
  /** The base price to start from (e.g. default_price) */
  basePrice: number;
  /** Vehicle context */
  vehicle?: {
    make: string;
    model: string;
    year?: number;
    body_type?: string;
    fuel_type?: string;
  };
  /** Vehicle model's class from vehicle_models */
  vehicleClass?: string | null;
  /** Part context */
  part?: {
    name: string;
    category?: string;
  };
  /** Service context */
  service?: {
    name: string;
    category?: string;
  };
  /** Whether to resolve for part or service */
  type: "part" | "service";
}

export interface PriceResolutionResult {
  /** The resolved price after applying the best matching rule */
  price: number;
  /** Which source in the fallback chain was used */
  source: "specific_price" | "price_rule" | "price_history" | "default_price";
  /** The rule that was applied (if from price_rule) */
  rule?: PriceRule;
  /** Explanation for display */
  explanation: string;
}

// ── CRUD ────────────────────────────────────────────────────────

export async function getPriceRules(
  db: SupabaseClient,
  orgId: string,
): Promise<PriceRule[]> {
  const supabase = db;

  const { data, error } = await supabase
    .from("price_rules")
    .select(
      "id, organization_id, name, description, apply_to, conditions, conditions_description, operator, value, priority, part_category, service_category, part_name_pattern, service_name_pattern, is_active, created_at, updated_at, deleted_at, created_by, updated_by",
    )
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("priority")
    .order("name");

  if (error) throw new Error(error.message ?? "Failed to fetch price rules");
  return (data ?? []) as PriceRule[];
}

export async function getActivePriceRules(
  db: SupabaseClient,
  orgId: string,
): Promise<PriceRule[]> {
  const supabase = db;

  const { data, error } = await supabase
    .from("price_rules")
    .select(
      "id, organization_id, name, description, apply_to, conditions, conditions_description, operator, value, priority, part_category, service_category, part_name_pattern, service_name_pattern, is_active, created_at, updated_at, deleted_at, created_by, updated_by",
    )
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("priority")
    .order("name");

  if (error)
    throw new Error(error.message ?? "Failed to fetch active price rules");
  return (data ?? []) as PriceRule[];
}

export async function getPriceRule(
  db: SupabaseClient,
  id: string,
): Promise<PriceRule> {
  const supabase = db;

  const { data, error } = await supabase
    .from("price_rules")
    .select(
      "id, organization_id, name, description, apply_to, conditions, conditions_description, operator, value, priority, part_category, service_category, part_name_pattern, service_name_pattern, is_active, created_at, updated_at, deleted_at, created_by, updated_by",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) throw new NotFoundError("Price rule not found");
  return data as PriceRule;
}

export async function createPriceRule(
  db: SupabaseClient,
  orgId: string,
  params: CreatePriceRuleParams,
  userId?: string | null,
): Promise<PriceRule> {
  if (!params.name?.trim()) throw new ValidationError("Name is required");
  if (!params.operator) throw new ValidationError("Operator is required");
  if (params.value == null) throw new ValidationError("Value is required");

  const supabase = db;

  const { data, error } = await supabase
    .from("price_rules")
    .insert({
      organization_id: orgId,
      name: params.name.trim(),
      description: params.description?.trim() ?? null,
      apply_to: params.apply_to,
      conditions: JSON.parse(JSON.stringify(params.conditions)),
      conditions_description: params.conditions_description?.trim() ?? null,
      operator: params.operator,
      value: params.value,
      priority: params.priority ?? 100,
      part_category: params.part_category?.trim() ?? null,
      service_category: params.service_category?.trim() ?? null,
      part_name_pattern: params.part_name_pattern?.trim() ?? null,
      service_name_pattern: params.service_name_pattern?.trim() ?? null,
      created_by: userId ?? null,
      updated_by: userId ?? null,
    })
    .select(
      "id, organization_id, name, description, apply_to, conditions, conditions_description, operator, value, priority, part_category, service_category, part_name_pattern, service_name_pattern, is_active, created_at, updated_at, deleted_at, created_by, updated_by",
    )
    .single();

  if (error || !data)
    throw new Error(error?.message ?? "Failed to create price rule");

  logAuditAfter({
    supabase,
    action: "create",
    table_name: "price_rules",
    record_id: data.id,
    user_id: userId ?? undefined,
    organization_id: orgId,
    new_data: data as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.priceRules(orgId), "max");

  return data as PriceRule;
}

export async function updatePriceRule(
  db: SupabaseClient,
  id: string,
  orgId: string,
  params: Partial<CreatePriceRuleParams> & { is_active?: boolean },
  userId?: string | null,
): Promise<PriceRule> {
  const supabase = db;

  const updates: Record<string, unknown> = { updated_by: userId ?? null };
  if (params.name !== undefined) updates.name = params.name.trim();
  if (params.description !== undefined)
    updates.description = params.description?.trim() ?? null;
  if (params.apply_to !== undefined) updates.apply_to = params.apply_to;
  if (params.conditions !== undefined) updates.conditions = params.conditions;
  if (params.conditions_description !== undefined)
    updates.conditions_description =
      params.conditions_description?.trim() ?? null;
  if (params.operator !== undefined) updates.operator = params.operator;
  if (params.value !== undefined) updates.value = params.value;
  if (params.priority !== undefined) updates.priority = params.priority;
  if (params.part_category !== undefined)
    updates.part_category = params.part_category?.trim() ?? null;
  if (params.service_category !== undefined)
    updates.service_category = params.service_category?.trim() ?? null;
  if (params.part_name_pattern !== undefined)
    updates.part_name_pattern = params.part_name_pattern?.trim() ?? null;
  if (params.service_name_pattern !== undefined)
    updates.service_name_pattern = params.service_name_pattern?.trim() ?? null;
  if (params.is_active !== undefined) updates.is_active = params.is_active;

  const { data, error } = await supabase
    .from("price_rules")
    // biome-ignore lint/suspicious/noExplicitAny: dynamic update object
    .update(updates as any)
    .eq("id", id)
    .eq("organization_id", orgId)
    .select(
      "id, organization_id, name, description, apply_to, conditions, conditions_description, operator, value, priority, part_category, service_category, part_name_pattern, service_name_pattern, is_active, created_at, updated_at, deleted_at, created_by, updated_by",
    )
    .single();

  if (error || !data) throw new NotFoundError("Price rule not found");

  logAuditAfter({
    supabase,
    action: "update",
    table_name: "price_rules",
    record_id: data.id,
    user_id: userId ?? undefined,
    organization_id: orgId,
    new_data: data as unknown as Record<string, unknown>,
  });

  revalidateTag(cacheTags.priceRules(orgId), "max");

  return data as PriceRule;
}

export async function deletePriceRule(
  db: SupabaseClient,
  id: string,
  orgId: string,
): Promise<void> {
  const supabase = db;

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("price_rules")
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: currentUser?.id ?? null,
    })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message ?? "Failed to delete price rule");

  logAuditAfter({
    supabase,
    action: "soft_delete",
    table_name: "price_rules",
    record_id: id,
    user_id: currentUser?.id,
    organization_id: orgId,
  });

  revalidateTag(cacheTags.priceRules(orgId), "max");
}

// ── Conditions Matcher ──────────────────────────────────────────

/**
 * Check if a vehicle matches a rule's conditions.
 * All present condition fields must match (AND logic within a rule).
 */
function vehicleMatchesCondition(
  condition: PriceRuleCondition,
  vehicle?: PriceResolutionInput["vehicle"],
  vehicleClass?: string | null,
): boolean {
  if (!vehicle) {
    // If rule has ANY vehicle filter but no vehicle context, it doesn't match
    return (
      !condition.makes &&
      !condition.models &&
      !condition.classes &&
      !condition.body_types &&
      !condition.fuel_types &&
      !condition.years
    );
  }

  if (condition.classes && condition.classes.length > 0) {
    if (!vehicleClass || !condition.classes.includes(vehicleClass))
      return false;
  }

  if (condition.makes && condition.makes.length > 0) {
    const makeLower = vehicle.make.toLowerCase();
    if (!condition.makes.some((m) => m.toLowerCase() === makeLower))
      return false;
  }

  if (condition.models && condition.models.length > 0) {
    const modelLower = vehicle.model.toLowerCase();
    if (!condition.models.some((m) => m.toLowerCase() === modelLower))
      return false;
  }

  if (condition.body_types && condition.body_types.length > 0) {
    if (!vehicle.body_type) return false;
    const btLower = vehicle.body_type.toLowerCase();
    if (!condition.body_types.some((bt) => bt.toLowerCase() === btLower))
      return false;
  }

  if (condition.fuel_types && condition.fuel_types.length > 0) {
    if (!vehicle.fuel_type) return false;
    const ftLower = vehicle.fuel_type.toLowerCase();
    if (!condition.fuel_types.some((ft) => ft.toLowerCase() === ftLower))
      return false;
  }

  if (condition.years && vehicle.year) {
    const { start, end } = condition.years;
    if (start && vehicle.year < start) return false;
    if (end && vehicle.year > end) return false;
  }

  return true;
}

/**
 * Check if a part name matches a rule's part_name_pattern (ilike match).
 */
function nameMatchesPattern(name: string, pattern: string): boolean {
  if (!pattern) return true;
  const nameLower = name.toLowerCase();
  const patLower = pattern.toLowerCase();
  // Support simple * wildcards
  const regex = new RegExp(
    `^${patLower.replace(/%/g, ".*").replace(/\*/g, ".*")}$`,
  );
  return regex.test(nameLower);
}

// ── Price Application ──────────────────────────────────────────

function applyRule(basePrice: number, rule: PriceRule): number {
  const value = Number(rule.value);
  switch (rule.operator) {
    case "multiply":
      return basePrice * value;
    case "add_fixed":
      return basePrice + value;
    case "set_fixed":
      return value;
    case "percentage_add":
      return basePrice * (1 + value / 100);
    case "percentage_sub":
      return basePrice * (1 - value / 100);
    default:
      return basePrice;
  }
}

// ── Price Resolution Engine ────────────────────────────────────

/**
 * Resolve the best price for a part or service given a vehicle context.
 *
 * Fallback chain:
 *   1. vehicle_model_parts.specific_price (parts only)
 *   2. First matching price_rule (sorted by priority ASC)
 *   3. Last price from part_price_history / service_price_history
 *   4. parts_catalog.default_price / service_catalog.default_price
 */
export async function resolvePrice(
  db: SupabaseClient,
  orgId: string,
  input: PriceResolutionInput,
): Promise<PriceResolutionResult> {
  const supabase = db;

  // ═══ Step 1: specific_price (parts only) ═══
  if (input.type === "part" && input.part?.name) {
    // Look up the part to get its UUID and default_price
    const { data: catalogPart } = await supabase
      .from("parts_catalog")
      .select("id, default_price")
      .eq("organization_id", orgId)
      .ilike("name", input.part.name)
      .is("deleted_at", null)
      .maybeSingle();

    if (catalogPart) {
      input.basePrice = Number(catalogPart.default_price ?? 0);

      if (input.vehicle) {
        const { data: models } = await supabase
          .from("vehicle_models")
          .select("id")
          .eq("organization_id", orgId)
          .eq("make", input.vehicle.make)
          .eq("model", input.vehicle.model)
          .is("deleted_at", null)
          .limit(1);

        if (models?.length) {
          const { data: vmp } = await supabase
            .from("vehicle_model_parts")
            .select("specific_price")
            .eq("organization_id", orgId)
            .eq("vehicle_model_id", models[0].id)
            .eq("part_id", catalogPart.id)
            .maybeSingle();

          if (vmp?.specific_price != null) {
            return {
              price: Number(vmp.specific_price),
              source: "specific_price",
              explanation: `${input.vehicle.make} ${input.vehicle.model} specific price`,
            };
          }
        }
      }
    }
  }

  // ═══ Step 2: Price Rules ═══
  const rules = await getActivePriceRules(db, orgId);
  const matchingRules = rules.filter((rule) => {
    // Check apply_to
    if (rule.apply_to !== "both" && rule.apply_to !== input.type) return false;

    // Check part/service category filter
    if (input.type === "part" && rule.part_category && input.part?.category) {
      if (input.part.category !== rule.part_category) return false;
    }
    if (
      input.type === "service" &&
      rule.service_category &&
      input.service?.category
    ) {
      if (input.service.category !== rule.service_category) return false;
    }

    // Check part/service name pattern
    if (input.type === "part" && rule.part_name_pattern && input.part?.name) {
      if (!nameMatchesPattern(input.part.name, rule.part_name_pattern))
        return false;
    }
    if (
      input.type === "service" &&
      rule.service_name_pattern &&
      input.service?.name
    ) {
      if (!nameMatchesPattern(input.service.name, rule.service_name_pattern))
        return false;
    }

    // Check vehicle conditions
    const condition = rule.conditions as unknown as PriceRuleCondition;
    return vehicleMatchesCondition(
      condition,
      input.vehicle,
      input.vehicleClass,
    );
  });

  if (matchingRules.length > 0) {
    const bestRule = matchingRules[0];
    const calculatedPrice = applyRule(input.basePrice, bestRule);

    // For set_fixed, return exactly the fixed value
    if (bestRule.operator === "set_fixed") {
      return {
        price: calculatedPrice,
        source: "price_rule",
        rule: bestRule,
        explanation: `Fixed price: ${bestRule.name}`,
      };
    }

    return {
      price: Math.round(calculatedPrice * 100) / 100,
      source: "price_rule",
      rule: bestRule,
      explanation: `${bestRule.name} (${bestRule.operator}: ${bestRule.value})`,
    };
  }

  // ═══ Step 3: Price History ═══
  if (input.vehicle) {
    if (input.type === "part" && input.part) {
      const { data: history } = await supabase
        .from("part_price_history")
        .select("unit_price")
        .eq("organization_id", orgId)
        .ilike("part_name", input.part.name)
        .eq("vehicle_make", input.vehicle.make)
        .eq("vehicle_model", input.vehicle.model)
        .order("created_at", { ascending: false })
        .limit(1);

      if (history && history.length > 0 && history[0].unit_price != null) {
        return {
          price: Number(history[0].unit_price),
          source: "price_history",
          explanation: `Last price for ${input.vehicle.make} ${input.vehicle.model}`,
        };
      }
    }

    if (input.type === "service" && input.service) {
      const { data: history } = await supabase
        .from("service_price_history")
        .select("unit_price")
        .eq("organization_id", orgId)
        .eq("vehicle_make", input.vehicle.make)
        .eq("vehicle_model", input.vehicle.model)
        .order("created_at", { ascending: false })
        .limit(1);

      if (history && history.length > 0 && history[0].unit_price != null) {
        return {
          price: Number(history[0].unit_price),
          source: "price_history",
          explanation: `Last price for ${input.vehicle.make} ${input.vehicle.model}`,
        };
      }
    }
  }

  // ═══ Step 4: Default price ═══
  return {
    price: input.basePrice,
    source: "default_price",
    explanation: "Catalog default price",
  };
}
