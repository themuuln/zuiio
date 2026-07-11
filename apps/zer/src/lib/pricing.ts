import type { SupabaseClient } from "@supabase/supabase-js";
import { withDbCapture } from "@zuiio/capture";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SaleItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
  /** Client-submitted price — IGNORED by server pricing */
  unitPrice?: number;
}

export interface PricedSaleItem extends SaleItemInput {
  baseUnitPrice: number;
  finalUnitPrice: number;
  priceListRuleId: string | null;
}

/* ------------------------------------------------------------------ */
/*  Server Pricing Function                                            */
/* ------------------------------------------------------------------ */

/**
 * Resolves server-authoritative pricing for a set of sale items.
 *
 * Precedence:
 * 1. Product-specific rules over category rules
 * 2. Highest satisfied minimum quantity
 * 3. Segment-linked lists over default lists
 * 4. Lowest numeric priority wins
 * 5. Fixed price over percentage within the winning rule
 */
export async function calculateSalePricing(
  supabase: SupabaseClient,
  organizationId: string,
  contactId: string | null,
  items: SaleItemInput[],
): Promise<PricedSaleItem[]> {
  // 1. Resolve contact's segment
  let segmentId: string | null = null;
  if (contactId) {
    const { data: contact } = await withDbCapture(
      "pricing:resolve_contact_segment",
      supabase
        .from("contacts")
        .select("customer_segment_id")
        .eq("id", contactId)
        .eq("organization_id", organizationId)
        .maybeSingle(),
    );
    segmentId = contact?.customer_segment_id ?? null;
  }

  // 2. Fetch catalog prices for all items
  const productIds = [...new Set(items.map((i) => i.productId))];
  const { data: products } = await withDbCapture(
    "pricing:fetch_catalog",
    supabase
      .from("products")
      .select("id, sale_price, category_id")
      .in("id", productIds)
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
  );

  const productMap = new Map(
    (products ?? []).map((p) => [
      p.id,
      { salePrice: p.sale_price ?? 0, categoryId: p.category_id },
    ]),
  );

  // 3. Fetch active price lists
  const today = formatInUB(new Date(), "yyyy-MM-dd");
  const { data: lists } = await withDbCapture(
    "pricing:fetch_lists",
    supabase
      .from("price_lists")
      .select("id, priority, valid_from, valid_until")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .or(`valid_from.is.null,valid_from.lte.${today}`)
      .or(`valid_until.is.null,valid_until.gte.${today}`)
      .order("priority"),
  );

  if (!lists || lists.length === 0) {
    // No price lists — use catalog prices
    return items.map((item) => {
      const catalog = productMap.get(item.productId);
      const base = catalog?.salePrice ?? 0;
      return {
        ...item,
        baseUnitPrice: base,
        finalUnitPrice: base,
        priceListRuleId: null,
      };
    });
  }

  // 4. Determine which lists apply to this segment
  const listIds = lists.map((l) => l.id);

  let segmentListIds: Set<string> = new Set();
  let defaultListIds: Set<string> = new Set(listIds);

  if (segmentId) {
    const { data: segLinks } = await withDbCapture(
      "pricing:fetch_segment_links",
      supabase
        .from("price_list_segments")
        .select("price_list_id")
        .in("price_list_id", listIds)
        .eq("customer_segment_id", segmentId),
    );
    segmentListIds = new Set((segLinks ?? []).map((l) => l.price_list_id));
    // Default lists = those NOT linked to any segment
    defaultListIds = new Set(listIds.filter((id) => !segmentListIds.has(id)));
  }

  // 5. Fetch all rules for applicable lists
  const applicableListIds = [...segmentListIds, ...defaultListIds];
  const { data: rules } = await withDbCapture(
    "pricing:fetch_rules",
    supabase
      .from("price_list_rules")
      .select(
        "id, price_list_id, product_id, category_id, min_quantity, unit_price, percentage_adjustment",
      )
      .in("price_list_id", applicableListIds)
      .eq("organization_id", organizationId),
  );

  if (!rules || rules.length === 0) {
    return items.map((item) => {
      const catalog = productMap.get(item.productId);
      const base = catalog?.salePrice ?? 0;
      return {
        ...item,
        baseUnitPrice: base,
        finalUnitPrice: base,
        priceListRuleId: null,
      };
    });
  }

  // Build list priority map
  const listPriority = new Map(lists.map((l) => [l.id, l.priority ?? 0]));
  const isSegmentList = (id: string) => segmentListIds.has(id);

  // 6. Resolve pricing per item
  return items.map((item) => {
    const catalog = productMap.get(item.productId);
    const base = catalog?.salePrice ?? 0;
    const categoryId = catalog?.categoryId;

    // Find matching rules for this product
    const matchingRules = rules.filter((r) => {
      if (r.product_id === item.productId) return true;
      if (r.category_id && r.category_id === categoryId) return true;
      return false;
    });

    if (matchingRules.length === 0) {
      return {
        ...item,
        baseUnitPrice: base,
        finalUnitPrice: base,
        priceListRuleId: null,
      };
    }

    // Sort by precedence:
    // 1. Product-specific > category
    // 2. Highest min_quantity that's satisfied
    // 3. Segment-linked > default
    // 4. Lowest priority number
    // 5. Fixed price > percentage
    const scored = matchingRules
      .filter((r) => item.quantity >= (r.min_quantity ?? 1))
      .map((r) => ({
        rule: r,
        score: {
          productSpecific: r.product_id === item.productId ? 1 : 0,
          minQuantity: r.min_quantity ?? 1,
          isSegment: isSegmentList(r.price_list_id) ? 1 : 0,
          priority: -(listPriority.get(r.price_list_id) ?? 0),
          hasFixed: r.unit_price != null ? 1 : 0,
        },
      }))
      .sort((a, b) => {
        if (a.score.productSpecific !== b.score.productSpecific)
          return b.score.productSpecific - a.score.productSpecific;
        if (a.score.minQuantity !== b.score.minQuantity)
          return b.score.minQuantity - a.score.minQuantity;
        if (a.score.isSegment !== b.score.isSegment)
          return b.score.isSegment - a.score.isSegment;
        if (a.score.priority !== b.score.priority)
          return b.score.priority - a.score.priority;
        return b.score.hasFixed - a.score.hasFixed;
      });

    if (scored.length === 0) {
      return {
        ...item,
        baseUnitPrice: base,
        finalUnitPrice: base,
        priceListRuleId: null,
      };
    }

    const winner = scored[0].rule;
    let finalPrice = base;

    if (winner.unit_price != null) {
      finalPrice = winner.unit_price;
    } else if (winner.percentage_adjustment != null) {
      finalPrice = base * (1 + winner.percentage_adjustment / 100);
    }

    return {
      ...item,
      baseUnitPrice: base,
      finalUnitPrice: Math.max(0, Math.round(finalPrice)),
      priceListRuleId: winner.id,
    };
  });
}
