import { ok, created } from "@/lib/api-response";
import { createRouteHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";

export const GET = createRouteHandler(
  async ({ orgId, supabase }) => {
    const { data, error } = await supabase
      .from("mechanic_commission_rules")
      .select(
        "id, organization_id, mechanic_id, name, commission_type, commission_value, min_commission, max_commission, is_active, priority, created_at, updated_at",
      )
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .order("priority", { ascending: false });

    if (error) throw error;

    const rules = data ?? [];
    const mechanicIds = rules.flatMap((r) =>
      r.mechanic_id ? [r.mechanic_id] : [],
    ) as string[];

    const profileMap = new Map<string, string>();
    if (mechanicIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", mechanicIds);
      for (const p of profiles ?? []) {
        profileMap.set(p.id, p.full_name ?? "Unknown");
      }
    }

    const enriched = rules.map((r) => ({
      ...r,
      mechanic_name: r.mechanic_id
        ? (profileMap.get(r.mechanic_id) ?? "Unknown")
        : null,
    }));

    return ok(enriched);
  },
  { requiredPermission: { resource: "commission_rules", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const body = await request.json();

    if (
      !body.name ||
      !body.commission_type ||
      body.commission_value === undefined
    ) {
      throw new ValidationError(
        "Name, commission_type, and commission_value are required",
      );
    }

    const validTypes = [
      "percentage_of_labor",
      "percentage_of_parts",
      "percentage_of_revenue",
      "fixed_per_work_order",
    ];
    if (!validTypes.includes(body.commission_type)) {
      throw new ValidationError("Invalid commission_type");
    }

    const { data, error } = await supabase
      .from("mechanic_commission_rules")
      .insert({
        organization_id: orgId,
        mechanic_id: body.mechanic_id ?? null,
        name: body.name,
        commission_type: body.commission_type,
        commission_value: body.commission_value,
        min_commission: body.min_commission ?? null,
        max_commission: body.max_commission ?? null,
        is_active: body.is_active ?? true,
        priority: body.priority ?? 0,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return created(data);
  },
  { requiredPermission: { resource: "commission_rules", action: "create" } },
);
