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
  PricingRuleScope,
  ProvisioningJobRow,
  RegionRow,
} from "@/lib/supabase/types";

export interface PackageInsert {
  provider: string;
  provider_package_id: string;
  region_id: string;
  name: string;
  data_mb: number | null;
  is_unlimited: boolean;
  validity_days: number;
  coverage_countries: string[];
  cost_usd: number;
  provider_meta: Record<string, unknown>;
  synced_at: string;
}

export interface OrderItemInsert {
  package_id: string;
  quantity: number;
  package_name: string;
  cost_usd: number;
  fx_rate: number;
  fx_rate_id: string | null;
  markup_percent: number;
  pricing_rule_id: string | null;
  min_margin_applied: boolean;
  unit_retail_mnt: number;
  unit_cost_mnt: number;
}

export interface OrderCreateInput {
  order_code: string;
  customer_id: string;
  email: string;
  phone: string;
  locale: string;
  total_mnt: number;
  expires_at: string;
  item: OrderItemInsert;
  esim_provider: string;
}

export interface OrderDetail {
  order: OrderRow;
  items: OrderItemRow[];
  esims: EsimRow[];
  payment: PaymentRow | null;
}

export interface PricingRuleInsert {
  scope: PricingRuleScope;
  region_id: string | null;
  package_id: string | null;
  markup_percent: number;
  note: string | null;
}

/**
 * Narrow repository interface with two backends:
 * memory (dev, no credentials needed) and supabase (production).
 */
export interface Db {
  readonly backend: "memory" | "supabase";

  // catalog
  listRegions(activeOnly?: boolean): Promise<RegionRow[]>;
  getRegionBySlug(slug: string): Promise<RegionRow | null>;
  listEnabledPackagesByRegion(regionId: string): Promise<PackageRow[]>;
  listPackages(provider?: string): Promise<PackageRow[]>;
  getPackageById(id: string): Promise<PackageRow | null>;
  insertPackage(data: PackageInsert): Promise<PackageRow>;
  updatePackage(id: string, patch: Partial<PackageRow>): Promise<void>;

  // pricing
  getLatestFxRate(pair: string): Promise<FxRateRow | null>;
  listFxRates(pair: string, limit: number): Promise<FxRateRow[]>;
  insertFxRate(data: {
    pair: string;
    rate: number;
    source: "manual" | "auto";
    created_by?: string | null;
  }): Promise<FxRateRow>;
  listPricingRules(activeOnly?: boolean): Promise<PricingRuleRow[]>;
  insertPricingRule(data: PricingRuleInsert): Promise<PricingRuleRow>;
  updatePricingRule(
    id: string,
    patch: Partial<
      Pick<PricingRuleRow, "markup_percent" | "is_active" | "note">
    >,
  ): Promise<void>;
  getSettings(keys: string[]): Promise<Map<string, unknown>>;
  setSetting(key: string, value: unknown): Promise<void>;

  // customers / orders
  upsertCustomer(email: string, phone: string): Promise<CustomerRow>;
  linkCustomerToAuthUser(customerId: string, authUserId: string): Promise<void>;
  createOrder(input: OrderCreateInput): Promise<OrderRow>;
  getOrderByCode(orderCode: string): Promise<OrderRow | null>;
  getOrderById(orderId: string): Promise<OrderRow | null>;
  getOrderDetail(orderCode: string): Promise<OrderDetail | null>;
  listOrders(filter?: {
    status?: OrderStatus;
    limit?: number;
  }): Promise<OrderRow[]>;
  listOrdersByAuthUser(authUserId: string): Promise<OrderRow[]>;
  listOrderItemsSince(sinceIso: string): Promise<OrderItemRow[]>;
  /**
   * Conditional transition — returns false when the order was not in
   * `from` (someone else won the race).
   */
  transitionOrder(
    orderId: string,
    from: OrderStatus | OrderStatus[],
    to: OrderStatus,
  ): Promise<boolean>;
  expireStaleOrders(nowIso: string): Promise<number>;

  // payments
  createPayment(data: {
    order_id: string;
    invoice_id: string | null;
    sender_invoice_no: string;
    amount_mnt: number;
    raw?: unknown;
  }): Promise<PaymentRow>;
  getPaymentByOrderId(orderId: string): Promise<PaymentRow | null>;
  updatePayment(
    id: string,
    patch: Partial<
      Pick<
        PaymentRow,
        "status" | "qpay_payment_id" | "paid_at" | "raw" | "invoice_id"
      >
    >,
  ): Promise<void>;

  // esims
  listEsimsByOrder(orderId: string): Promise<EsimRow[]>;
  getEsimById(id: string): Promise<EsimRow | null>;
  findEsimsByProviderOrderId(providerOrderId: string): Promise<EsimRow[]>;
  updateEsim(id: string, patch: Partial<EsimRow>): Promise<void>;

  // provisioning jobs
  enqueueProvisioningJob(
    orderId: string,
    esimId?: string | null,
  ): Promise<void>;
  getJobByOrderId(orderId: string): Promise<ProvisioningJobRow | null>;
  /** Atomically claims due queued jobs (marks them running). */
  claimDueJobs(nowIso: string, limit: number): Promise<ProvisioningJobRow[]>;
  updateJob(id: string, patch: Partial<ProvisioningJobRow>): Promise<void>;
  requeueJob(orderId: string): Promise<void>;

  // webhook idempotency — returns false when (provider, eventId) was seen
  insertWebhookEvent(
    provider: string,
    eventId: string,
    payload: unknown,
  ): Promise<boolean>;
  markWebhookProcessed(provider: string, eventId: string): Promise<void>;

  // admin
  isAdmin(userId: string): Promise<boolean>;
}
