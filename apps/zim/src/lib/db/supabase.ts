import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CustomerRow,
  EsimRow,
  FxRateRow,
  OrderItemRow,
  OrderRow,
  OrderStatus,
  PackageRow,
  PaymentRow,
  PricingRuleRow,
  ProvisioningJobRow,
  RegionRow,
} from "@/lib/supabase/types";
import type {
  Db,
  OrderCreateInput,
  OrderDetail,
  PackageInsert,
  PricingRuleInsert,
} from "./types";

/**
 * Production backend using the service-role Supabase client.
 * RLS still protects direct client access; this layer runs server-side
 * only and applies its own explicit checks.
 */

function throwIf(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export class SupabaseDb implements Db {
  readonly backend = "supabase" as const;

  private client() {
    return createAdminClient();
  }

  async listRegions(activeOnly = true): Promise<RegionRow[]> {
    let query = this.client().from("regions").select("*").order("sort_order");
    if (activeOnly) query = query.eq("is_active", true);
    const { data, error } = await query;
    throwIf(error);
    return (data ?? []) as RegionRow[];
  }

  async getRegionBySlug(slug: string): Promise<RegionRow | null> {
    const { data, error } = await this.client()
      .from("regions")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    throwIf(error);
    return data as RegionRow | null;
  }

  async listEnabledPackagesByRegion(regionId: string): Promise<PackageRow[]> {
    const { data, error } = await this.client()
      .from("packages")
      .select("*")
      .eq("region_id", regionId)
      .eq("is_enabled", true)
      .eq("is_archived", false);
    throwIf(error);
    return (data ?? []) as PackageRow[];
  }

  async listPackages(provider?: string): Promise<PackageRow[]> {
    let query = this.client().from("packages").select("*");
    if (provider) query = query.eq("provider", provider);
    const { data, error } = await query;
    throwIf(error);
    return (data ?? []) as PackageRow[];
  }

  async getPackageById(id: string): Promise<PackageRow | null> {
    const { data, error } = await this.client()
      .from("packages")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    throwIf(error);
    return data as PackageRow | null;
  }

  async insertPackage(data: PackageInsert): Promise<PackageRow> {
    const { data: row, error } = await this.client()
      .from("packages")
      .insert(data)
      .select("*")
      .single();
    throwIf(error);
    return row as PackageRow;
  }

  async updatePackage(id: string, patch: Partial<PackageRow>): Promise<void> {
    const { error } = await this.client()
      .from("packages")
      .update(patch)
      .eq("id", id);
    throwIf(error);
  }

  async getLatestFxRate(pair: string): Promise<FxRateRow | null> {
    const { data, error } = await this.client()
      .from("fx_rates")
      .select("*")
      .eq("pair", pair)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    throwIf(error);
    return data as FxRateRow | null;
  }

  async listFxRates(pair: string, limit: number): Promise<FxRateRow[]> {
    const { data, error } = await this.client()
      .from("fx_rates")
      .select("*")
      .eq("pair", pair)
      .order("created_at", { ascending: false })
      .limit(limit);
    throwIf(error);
    return (data ?? []) as FxRateRow[];
  }

  async insertFxRate(data: {
    pair: string;
    rate: number;
    source: "manual" | "auto";
    created_by?: string | null;
  }): Promise<FxRateRow> {
    const { data: row, error } = await this.client()
      .from("fx_rates")
      .insert(data)
      .select("*")
      .single();
    throwIf(error);
    return row as FxRateRow;
  }

  async listPricingRules(activeOnly = false): Promise<PricingRuleRow[]> {
    let query = this.client().from("pricing_rules").select("*");
    if (activeOnly) query = query.eq("is_active", true);
    const { data, error } = await query;
    throwIf(error);
    return (data ?? []) as PricingRuleRow[];
  }

  async insertPricingRule(data: PricingRuleInsert): Promise<PricingRuleRow> {
    const client = this.client();
    // Deactivate the previous active rule for the same target so the
    // partial unique index doesn't reject the insert.
    let deactivate = client
      .from("pricing_rules")
      .update({ is_active: false })
      .eq("scope", data.scope)
      .eq("is_active", true);
    if (data.scope === "region") {
      deactivate = deactivate.eq("region_id", data.region_id as string);
    } else if (data.scope === "package") {
      deactivate = deactivate.eq("package_id", data.package_id as string);
    }
    throwIf((await deactivate).error);

    const { data: row, error } = await client
      .from("pricing_rules")
      .insert({ ...data, is_active: true })
      .select("*")
      .single();
    throwIf(error);
    return row as PricingRuleRow;
  }

  async updatePricingRule(
    id: string,
    patch: Partial<
      Pick<PricingRuleRow, "markup_percent" | "is_active" | "note">
    >,
  ): Promise<void> {
    const { error } = await this.client()
      .from("pricing_rules")
      .update(patch)
      .eq("id", id);
    throwIf(error);
  }

  async getSettings(keys: string[]): Promise<Map<string, unknown>> {
    const { data, error } = await this.client()
      .from("app_settings")
      .select("*")
      .in("key", keys);
    throwIf(error);
    return new Map((data ?? []).map((row) => [row.key, row.value]));
  }

  async setSetting(key: string, value: unknown): Promise<void> {
    const { error } = await this.client()
      .from("app_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    throwIf(error);
  }

  async upsertCustomer(email: string, phone: string): Promise<CustomerRow> {
    const client = this.client();
    const { data: existing, error: findError } = await client
      .from("customers")
      .select("*")
      .eq("email", email)
      .eq("phone", phone)
      .maybeSingle();
    throwIf(findError);
    if (existing) return existing as CustomerRow;

    const { data, error } = await client
      .from("customers")
      .insert({ email, phone })
      .select("*")
      .single();
    throwIf(error);
    return data as CustomerRow;
  }

  async linkCustomerToAuthUser(
    customerId: string,
    authUserId: string,
  ): Promise<void> {
    const { error } = await this.client()
      .from("customers")
      .update({ auth_user_id: authUserId })
      .eq("id", customerId);
    throwIf(error);
  }

  async createOrder(input: OrderCreateInput): Promise<OrderRow> {
    const client = this.client();

    const { data: order, error: orderError } = await client
      .from("orders")
      .insert({
        order_code: input.order_code,
        customer_id: input.customer_id,
        email: input.email,
        phone: input.phone,
        locale: input.locale,
        total_mnt: input.total_mnt,
        expires_at: input.expires_at,
      })
      .select("*")
      .single();
    throwIf(orderError);
    const orderRow = order as OrderRow;

    const { data: item, error: itemError } = await client
      .from("order_items")
      .insert({ order_id: orderRow.id, ...input.item })
      .select("*")
      .single();
    throwIf(itemError);
    const itemRow = item as OrderItemRow;

    const esimRows = Array.from({ length: input.item.quantity }, () => ({
      order_item_id: itemRow.id,
      order_id: orderRow.id,
      provider: input.esim_provider,
    }));
    const { error: esimError } = await client.from("esims").insert(esimRows);
    throwIf(esimError);

    return orderRow;
  }

  async getOrderByCode(orderCode: string): Promise<OrderRow | null> {
    const { data, error } = await this.client()
      .from("orders")
      .select("*")
      .eq("order_code", orderCode)
      .maybeSingle();
    throwIf(error);
    return data as OrderRow | null;
  }

  async getOrderById(orderId: string): Promise<OrderRow | null> {
    const { data, error } = await this.client()
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();
    throwIf(error);
    return data as OrderRow | null;
  }

  async getOrderDetail(orderCode: string): Promise<OrderDetail | null> {
    const order = await this.getOrderByCode(orderCode);
    if (!order) return null;
    const client = this.client();
    const [itemsRes, esimsRes, paymentRes] = await Promise.all([
      client.from("order_items").select("*").eq("order_id", order.id),
      client.from("esims").select("*").eq("order_id", order.id),
      client
        .from("payments")
        .select("*")
        .eq("order_id", order.id)
        .maybeSingle(),
    ]);
    throwIf(itemsRes.error);
    throwIf(esimsRes.error);
    throwIf(paymentRes.error);
    return {
      order,
      items: (itemsRes.data ?? []) as OrderItemRow[],
      esims: (esimsRes.data ?? []) as EsimRow[],
      payment: paymentRes.data as PaymentRow | null,
    };
  }

  async listOrders(filter?: {
    status?: OrderStatus;
    limit?: number;
  }): Promise<OrderRow[]> {
    let query = this.client()
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(filter?.limit ?? 100);
    if (filter?.status) query = query.eq("status", filter.status);
    const { data, error } = await query;
    throwIf(error);
    return (data ?? []) as OrderRow[];
  }

  async listOrdersByAuthUser(authUserId: string): Promise<OrderRow[]> {
    const client = this.client();
    const { data: customers, error: customersError } = await client
      .from("customers")
      .select("id")
      .eq("auth_user_id", authUserId);
    throwIf(customersError);
    const ids = (customers ?? []).map((c) => c.id);
    if (ids.length === 0) return [];
    const { data, error } = await client
      .from("orders")
      .select("*")
      .in("customer_id", ids)
      .order("created_at", { ascending: false });
    throwIf(error);
    return (data ?? []) as OrderRow[];
  }

  async listOrderItemsSince(sinceIso: string): Promise<OrderItemRow[]> {
    const client = this.client();
    const { data: orders, error: ordersError } = await client
      .from("orders")
      .select("id")
      .gte("created_at", sinceIso)
      .not("status", "in", "(pending_payment,expired,cancelled)");
    throwIf(ordersError);
    const ids = (orders ?? []).map((o) => o.id);
    if (ids.length === 0) return [];
    const { data, error } = await client
      .from("order_items")
      .select("*")
      .in("order_id", ids);
    throwIf(error);
    return (data ?? []) as OrderItemRow[];
  }

  async transitionOrder(
    orderId: string,
    from: OrderStatus | OrderStatus[],
    to: OrderStatus,
  ): Promise<boolean> {
    const fromList = Array.isArray(from) ? from : [from];
    const { data, error } = await this.client()
      .from("orders")
      .update({ status: to })
      .eq("id", orderId)
      .in("status", fromList)
      .select("id");
    throwIf(error);
    return (data ?? []).length > 0;
  }

  async expireStaleOrders(nowIso: string): Promise<number> {
    const client = this.client();
    const { data, error } = await client
      .from("orders")
      .update({ status: "expired" })
      .eq("status", "pending_payment")
      .lt("expires_at", nowIso)
      .select("id");
    throwIf(error);
    const ids = (data ?? []).map((o) => o.id);
    if (ids.length > 0) {
      const { error: paymentError } = await client
        .from("payments")
        .update({ status: "expired" })
        .in("order_id", ids)
        .eq("status", "created");
      throwIf(paymentError);
    }
    return ids.length;
  }

  async createPayment(data: {
    order_id: string;
    invoice_id: string | null;
    sender_invoice_no: string;
    amount_mnt: number;
    raw?: unknown;
  }): Promise<PaymentRow> {
    const { data: row, error } = await this.client()
      .from("payments")
      .insert(data)
      .select("*")
      .single();
    throwIf(error);
    return row as PaymentRow;
  }

  async getPaymentByOrderId(orderId: string): Promise<PaymentRow | null> {
    const { data, error } = await this.client()
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();
    throwIf(error);
    return data as PaymentRow | null;
  }

  async updatePayment(
    id: string,
    patch: Partial<
      Pick<
        PaymentRow,
        "status" | "qpay_payment_id" | "paid_at" | "raw" | "invoice_id"
      >
    >,
  ): Promise<void> {
    const { error } = await this.client()
      .from("payments")
      .update(patch)
      .eq("id", id);
    throwIf(error);
  }

  async listEsimsByOrder(orderId: string): Promise<EsimRow[]> {
    const { data, error } = await this.client()
      .from("esims")
      .select("*")
      .eq("order_id", orderId);
    throwIf(error);
    return (data ?? []) as EsimRow[];
  }

  async getEsimById(id: string): Promise<EsimRow | null> {
    const { data, error } = await this.client()
      .from("esims")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    throwIf(error);
    return data as EsimRow | null;
  }

  async findEsimsByProviderOrderId(
    providerOrderId: string,
  ): Promise<EsimRow[]> {
    const { data, error } = await this.client()
      .from("esims")
      .select("*")
      .eq("provider_order_id", providerOrderId);
    throwIf(error);
    return (data ?? []) as EsimRow[];
  }

  async updateEsim(id: string, patch: Partial<EsimRow>): Promise<void> {
    const { error } = await this.client()
      .from("esims")
      .update(patch)
      .eq("id", id);
    throwIf(error);
  }

  async enqueueProvisioningJob(
    orderId: string,
    esimId?: string | null,
  ): Promise<void> {
    const client = this.client();
    const { data: existing, error: findError } = await client
      .from("provisioning_jobs")
      .select("id")
      .eq("order_id", orderId)
      .neq("status", "succeeded")
      .limit(1);
    throwIf(findError);
    if ((existing ?? []).length > 0) return;
    const { error } = await client
      .from("provisioning_jobs")
      .insert({ order_id: orderId, esim_id: esimId ?? null });
    throwIf(error);
  }

  async getJobByOrderId(orderId: string): Promise<ProvisioningJobRow | null> {
    const { data, error } = await this.client()
      .from("provisioning_jobs")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    throwIf(error);
    return data as ProvisioningJobRow | null;
  }

  async claimDueJobs(
    nowIso: string,
    limit: number,
  ): Promise<ProvisioningJobRow[]> {
    const client = this.client();
    const { data: due, error: dueError } = await client
      .from("provisioning_jobs")
      .select("id")
      .eq("status", "queued")
      .lte("next_retry_at", nowIso)
      .limit(limit);
    throwIf(dueError);

    const claimed: ProvisioningJobRow[] = [];
    for (const { id } of due ?? []) {
      // Conditional update — only one worker wins each job.
      const { data, error } = await client
        .from("provisioning_jobs")
        .update({ status: "running" })
        .eq("id", id)
        .eq("status", "queued")
        .select("*");
      throwIf(error);
      if ((data ?? []).length > 0)
        claimed.push(data?.[0] as ProvisioningJobRow);
    }
    return claimed;
  }

  async updateJob(
    id: string,
    patch: Partial<ProvisioningJobRow>,
  ): Promise<void> {
    const { error } = await this.client()
      .from("provisioning_jobs")
      .update(patch)
      .eq("id", id);
    throwIf(error);
  }

  async requeueJob(orderId: string): Promise<void> {
    const job = await this.getJobByOrderId(orderId);
    if (job) {
      await this.updateJob(job.id, {
        status: "queued",
        next_retry_at: new Date().toISOString(),
        attempts: 0,
      });
    } else {
      await this.enqueueProvisioningJob(orderId);
    }
  }

  async insertWebhookEvent(
    provider: string,
    eventId: string,
    payload: unknown,
  ): Promise<boolean> {
    const { data, error } = await this.client()
      .from("webhook_events")
      .upsert(
        { provider, event_id: eventId, payload },
        { onConflict: "provider,event_id", ignoreDuplicates: true },
      )
      .select("id");
    throwIf(error);
    return (data ?? []).length > 0;
  }

  async markWebhookProcessed(provider: string, eventId: string): Promise<void> {
    const { error } = await this.client()
      .from("webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("provider", provider)
      .eq("event_id", eventId);
    throwIf(error);
  }

  async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await this.client()
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    throwIf(error);
    return data !== null;
  }
}
