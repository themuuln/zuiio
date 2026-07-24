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
  WebhookEventRow,
} from "@/lib/supabase/types";
import type {
  Db,
  OrderCreateInput,
  OrderDetail,
  PackageInsert,
  PricingRuleInsert,
} from "./types";

/**
 * In-memory dev backend, mirroring supabase/migrations seed data.
 * State lives on globalThis so it survives Next.js dev hot reloads.
 * Selected automatically when SUPABASE_SERVICE_ROLE_KEY is unset.
 */

interface MemoryState {
  regions: RegionRow[];
  packages: PackageRow[];
  fxRates: FxRateRow[];
  pricingRules: PricingRuleRow[];
  settings: Map<string, unknown>;
  customers: CustomerRow[];
  orders: OrderRow[];
  orderItems: OrderItemRow[];
  esims: EsimRow[];
  payments: PaymentRow[];
  jobs: ProvisioningJobRow[];
  webhookEvents: WebhookEventRow[];
  admins: Set<string>;
  seq: number;
}

const GLOBAL_KEY = "__zim_memory_db__";

function uuid(state: MemoryState): string {
  state.seq += 1;
  const n = String(state.seq).padStart(12, "0");
  return `00000000-0000-4000-8000-${n}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function seedState(): MemoryState {
  const state: MemoryState = {
    regions: [],
    packages: [],
    fxRates: [],
    pricingRules: [],
    settings: new Map<string, unknown>([
      ["min_margin_percent", 10],
      ["rounding", { mode: "ceil_to", step: 500 }],
      ["order_ttl_minutes", 30],
    ]),
    customers: [],
    orders: [],
    orderItems: [],
    esims: [],
    payments: [],
    jobs: [],
    webhookEvents: [],
    admins: new Set(),
    seq: 0,
  };

  const regionSeed: [
    string,
    string,
    string,
    RegionRow["kind"],
    string | null,
    number,
  ][] = [
    ["china", "China", "Хятад", "country", "CN", 10],
    ["japan", "Japan", "Япон", "country", "JP", 20],
    ["south-korea", "South Korea", "Өмнөд Солонгос", "country", "KR", 30],
    ["thailand", "Thailand", "Тайланд", "country", "TH", 40],
    ["vietnam", "Vietnam", "Вьетнам", "country", "VN", 50],
    ["singapore", "Singapore", "Сингапур", "country", "SG", 60],
    ["turkey", "Turkey", "Турк", "country", "TR", 70],
    ["asia", "Asia (regional)", "Ази (бүсийн)", "regional", null, 80],
    ["europe", "Europe (regional)", "Европ (бүсийн)", "regional", null, 90],
    ["global", "Global", "Глобал", "global", null, 100],
  ];
  for (const [slug, nameEn, nameMn, kind, cc, sort] of regionSeed) {
    state.regions.push({
      id: uuid(state),
      slug,
      name_en: nameEn,
      name_mn: nameMn,
      kind,
      country_code: cc,
      sort_order: sort,
      is_active: true,
      created_at: nowIso(),
    });
  }

  state.pricingRules.push({
    id: uuid(state),
    scope: "global",
    region_id: null,
    package_id: null,
    markup_percent: 20,
    is_active: true,
    note: "Default global markup",
    created_at: nowIso(),
  });

  state.fxRates.push({
    id: uuid(state),
    pair: "USD_MNT",
    rate: 3450,
    source: "manual",
    created_by: null,
    created_at: nowIso(),
  });

  return state;
}

function getState(): MemoryState {
  const holder = globalThis as Record<string, unknown>;
  if (!holder[GLOBAL_KEY]) {
    holder[GLOBAL_KEY] = seedState();
  }
  return holder[GLOBAL_KEY] as MemoryState;
}

/** Test/dev helper — reset the store. */
export function resetMemoryDb(): void {
  const holder = globalThis as Record<string, unknown>;
  delete holder[GLOBAL_KEY];
}

export class MemoryDb implements Db {
  readonly backend = "memory" as const;

  async listRegions(activeOnly = true): Promise<RegionRow[]> {
    const state = getState();
    return state.regions
      .filter((r) => !activeOnly || r.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  async getRegionBySlug(slug: string): Promise<RegionRow | null> {
    return getState().regions.find((r) => r.slug === slug) ?? null;
  }

  async listEnabledPackagesByRegion(regionId: string): Promise<PackageRow[]> {
    return getState().packages.filter(
      (p) => p.region_id === regionId && p.is_enabled && !p.is_archived,
    );
  }

  async listPackages(provider?: string): Promise<PackageRow[]> {
    return getState().packages.filter(
      (p) => !provider || p.provider === provider,
    );
  }

  async getPackageById(id: string): Promise<PackageRow | null> {
    return getState().packages.find((p) => p.id === id) ?? null;
  }

  async insertPackage(data: PackageInsert): Promise<PackageRow> {
    const state = getState();
    const row: PackageRow = {
      id: uuid(state),
      ...data,
      is_enabled: false,
      is_archived: false,
      needs_repricing: false,
      created_at: nowIso(),
    };
    state.packages.push(row);
    return row;
  }

  async updatePackage(id: string, patch: Partial<PackageRow>): Promise<void> {
    const state = getState();
    const idx = state.packages.findIndex((p) => p.id === id);
    if (idx >= 0) state.packages[idx] = { ...state.packages[idx], ...patch };
  }

  async getLatestFxRate(pair: string): Promise<FxRateRow | null> {
    const rates = getState()
      .fxRates.filter((r) => r.pair === pair)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return rates[0] ?? null;
  }

  async listFxRates(pair: string, limit: number): Promise<FxRateRow[]> {
    return getState()
      .fxRates.filter((r) => r.pair === pair)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }

  async insertFxRate(data: {
    pair: string;
    rate: number;
    source: "manual" | "auto";
    created_by?: string | null;
  }): Promise<FxRateRow> {
    const state = getState();
    const row: FxRateRow = {
      id: uuid(state),
      pair: data.pair,
      rate: data.rate,
      source: data.source,
      created_by: data.created_by ?? null,
      created_at: nowIso(),
    };
    state.fxRates.push(row);
    return row;
  }

  async listPricingRules(activeOnly = false): Promise<PricingRuleRow[]> {
    return getState().pricingRules.filter((r) => !activeOnly || r.is_active);
  }

  async insertPricingRule(data: PricingRuleInsert): Promise<PricingRuleRow> {
    const state = getState();
    // Mirror the partial unique indexes: deactivate the previous rule
    // for the same scope target.
    for (const rule of state.pricingRules) {
      if (!rule.is_active || rule.scope !== data.scope) continue;
      const sameTarget =
        data.scope === "global" ||
        (data.scope === "region" && rule.region_id === data.region_id) ||
        (data.scope === "package" && rule.package_id === data.package_id);
      if (sameTarget) rule.is_active = false;
    }
    const row: PricingRuleRow = {
      id: uuid(state),
      scope: data.scope,
      region_id: data.region_id,
      package_id: data.package_id,
      markup_percent: data.markup_percent,
      is_active: true,
      note: data.note,
      created_at: nowIso(),
    };
    state.pricingRules.push(row);
    return row;
  }

  async updatePricingRule(
    id: string,
    patch: Partial<
      Pick<PricingRuleRow, "markup_percent" | "is_active" | "note">
    >,
  ): Promise<void> {
    const state = getState();
    const rule = state.pricingRules.find((r) => r.id === id);
    if (rule) Object.assign(rule, patch);
  }

  async getSettings(keys: string[]): Promise<Map<string, unknown>> {
    const state = getState();
    const out = new Map<string, unknown>();
    for (const key of keys) {
      if (state.settings.has(key)) out.set(key, state.settings.get(key));
    }
    return out;
  }

  async setSetting(key: string, value: unknown): Promise<void> {
    getState().settings.set(key, value);
  }

  async upsertCustomer(email: string, phone: string): Promise<CustomerRow> {
    const state = getState();
    const existing = state.customers.find(
      (c) => c.email === email && c.phone === phone,
    );
    if (existing) return existing;
    const row: CustomerRow = {
      id: uuid(state),
      email,
      phone,
      auth_user_id: null,
      created_at: nowIso(),
    };
    state.customers.push(row);
    return row;
  }

  async linkCustomerToAuthUser(
    customerId: string,
    authUserId: string,
  ): Promise<void> {
    const customer = getState().customers.find((c) => c.id === customerId);
    if (customer) customer.auth_user_id = authUserId;
  }

  async createOrder(input: OrderCreateInput): Promise<OrderRow> {
    const state = getState();
    const order: OrderRow = {
      id: uuid(state),
      order_code: input.order_code,
      customer_id: input.customer_id,
      email: input.email,
      phone: input.phone,
      locale: input.locale,
      status: "pending_payment",
      total_mnt: input.total_mnt,
      expires_at: input.expires_at,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    state.orders.push(order);

    const item: OrderItemRow = {
      id: uuid(state),
      order_id: order.id,
      ...input.item,
    };
    state.orderItems.push(item);

    for (let i = 0; i < input.item.quantity; i++) {
      state.esims.push({
        id: uuid(state),
        order_item_id: item.id,
        order_id: order.id,
        provider: input.esim_provider,
        provider_esim_id: null,
        provider_order_id: null,
        iccid: null,
        lpa_string: null,
        activation_code: null,
        smdp_address: null,
        qr_payload: null,
        status: "pending",
        provider_status_raw: null,
        delivered_at: null,
        activated_at: null,
        created_at: nowIso(),
        updated_at: nowIso(),
      });
    }

    return order;
  }

  async getOrderByCode(orderCode: string): Promise<OrderRow | null> {
    return getState().orders.find((o) => o.order_code === orderCode) ?? null;
  }

  async getOrderById(orderId: string): Promise<OrderRow | null> {
    return getState().orders.find((o) => o.id === orderId) ?? null;
  }

  async getOrderDetail(orderCode: string): Promise<OrderDetail | null> {
    const state = getState();
    const order = state.orders.find((o) => o.order_code === orderCode);
    if (!order) return null;
    return {
      order,
      items: state.orderItems.filter((i) => i.order_id === order.id),
      esims: state.esims.filter((e) => e.order_id === order.id),
      payment: state.payments.find((p) => p.order_id === order.id) ?? null,
    };
  }

  async listOrders(filter?: {
    status?: OrderStatus;
    limit?: number;
  }): Promise<OrderRow[]> {
    let orders = [...getState().orders].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
    if (filter?.status)
      orders = orders.filter((o) => o.status === filter.status);
    return orders.slice(0, filter?.limit ?? 100);
  }

  async listOrdersByAuthUser(authUserId: string): Promise<OrderRow[]> {
    const state = getState();
    const customerIds = new Set(
      state.customers
        .filter((c) => c.auth_user_id === authUserId)
        .map((c) => c.id),
    );
    return state.orders
      .filter((o) => customerIds.has(o.customer_id))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async listOrderItemsSince(sinceIso: string): Promise<OrderItemRow[]> {
    const state = getState();
    const orderById = new Map(state.orders.map((o) => [o.id, o]));
    return state.orderItems.filter((item) => {
      const order = orderById.get(item.order_id);
      return (
        order &&
        order.created_at >= sinceIso &&
        !["pending_payment", "expired", "cancelled"].includes(order.status)
      );
    });
  }

  async transitionOrder(
    orderId: string,
    from: OrderStatus | OrderStatus[],
    to: OrderStatus,
  ): Promise<boolean> {
    const state = getState();
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return false;
    const fromList = Array.isArray(from) ? from : [from];
    if (!fromList.includes(order.status)) return false;
    order.status = to;
    order.updated_at = nowIso();
    return true;
  }

  async expireStaleOrders(nowIsoParam: string): Promise<number> {
    const state = getState();
    let count = 0;
    for (const order of state.orders) {
      if (
        order.status === "pending_payment" &&
        order.expires_at < nowIsoParam
      ) {
        order.status = "expired";
        order.updated_at = nowIso();
        const payment = state.payments.find((p) => p.order_id === order.id);
        if (payment && payment.status === "created") payment.status = "expired";
        count++;
      }
    }
    return count;
  }

  async createPayment(data: {
    order_id: string;
    invoice_id: string | null;
    sender_invoice_no: string;
    amount_mnt: number;
    raw?: unknown;
  }): Promise<PaymentRow> {
    const state = getState();
    const row: PaymentRow = {
      id: uuid(state),
      order_id: data.order_id,
      provider: "qpay",
      invoice_id: data.invoice_id,
      sender_invoice_no: data.sender_invoice_no,
      amount_mnt: data.amount_mnt,
      status: "created",
      qpay_payment_id: null,
      paid_at: null,
      raw: data.raw ?? null,
      created_at: nowIso(),
    };
    state.payments.push(row);
    return row;
  }

  async getPaymentByOrderId(orderId: string): Promise<PaymentRow | null> {
    return getState().payments.find((p) => p.order_id === orderId) ?? null;
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
    const payment = getState().payments.find((p) => p.id === id);
    if (payment) Object.assign(payment, patch);
  }

  async listEsimsByOrder(orderId: string): Promise<EsimRow[]> {
    return getState().esims.filter((e) => e.order_id === orderId);
  }

  async getEsimById(id: string): Promise<EsimRow | null> {
    return getState().esims.find((e) => e.id === id) ?? null;
  }

  async findEsimsByProviderOrderId(
    providerOrderId: string,
  ): Promise<EsimRow[]> {
    return getState().esims.filter(
      (e) => e.provider_order_id === providerOrderId,
    );
  }

  async updateEsim(id: string, patch: Partial<EsimRow>): Promise<void> {
    const esim = getState().esims.find((e) => e.id === id);
    if (esim) Object.assign(esim, { ...patch, updated_at: nowIso() });
  }

  async enqueueProvisioningJob(
    orderId: string,
    esimId?: string | null,
  ): Promise<void> {
    const state = getState();
    const existing = state.jobs.find(
      (j) => j.order_id === orderId && j.status !== "succeeded",
    );
    if (existing) return;
    state.jobs.push({
      id: uuid(state),
      order_id: orderId,
      esim_id: esimId ?? null,
      status: "queued",
      attempts: 0,
      max_attempts: 5,
      next_retry_at: nowIso(),
      last_error: null,
      created_at: nowIso(),
    });
  }

  async getJobByOrderId(orderId: string): Promise<ProvisioningJobRow | null> {
    const jobs = getState()
      .jobs.filter((j) => j.order_id === orderId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return jobs[0] ?? null;
  }

  async claimDueJobs(
    nowIsoParam: string,
    limit: number,
  ): Promise<ProvisioningJobRow[]> {
    const state = getState();
    const due = state.jobs
      .filter((j) => j.status === "queued" && j.next_retry_at <= nowIsoParam)
      .slice(0, limit);
    for (const job of due) job.status = "running";
    return due.map((j) => ({ ...j }));
  }

  async updateJob(
    id: string,
    patch: Partial<ProvisioningJobRow>,
  ): Promise<void> {
    const job = getState().jobs.find((j) => j.id === id);
    if (job) Object.assign(job, patch);
  }

  async requeueJob(orderId: string): Promise<void> {
    const state = getState();
    const job = state.jobs
      .filter((j) => j.order_id === orderId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    if (job) {
      job.status = "queued";
      job.next_retry_at = nowIso();
      job.attempts = 0;
    } else {
      await this.enqueueProvisioningJob(orderId);
    }
  }

  async insertWebhookEvent(
    provider: string,
    eventId: string,
    payload: unknown,
  ): Promise<boolean> {
    const state = getState();
    const exists = state.webhookEvents.some(
      (e) => e.provider === provider && e.event_id === eventId,
    );
    if (exists) return false;
    state.webhookEvents.push({
      id: uuid(state),
      provider,
      event_id: eventId,
      payload,
      processed_at: null,
      created_at: nowIso(),
    });
    return true;
  }

  async markWebhookProcessed(provider: string, eventId: string): Promise<void> {
    const event = getState().webhookEvents.find(
      (e) => e.provider === provider && e.event_id === eventId,
    );
    if (event) event.processed_at = nowIso();
  }

  async isAdmin(userId: string): Promise<boolean> {
    // Dev backend: everyone with a session is an admin.
    return Boolean(userId) || getState().admins.has(userId);
  }
}
