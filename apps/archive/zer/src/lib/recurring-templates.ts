import type { SupabaseClient } from "@supabase/supabase-js";
import { withDbCapture } from "@zuiio/capture";
import { calculateSalePricing } from "@/lib/pricing";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface RecurringDraft {
  templateId: string;
  templateName: string;
  contactId: string | null;
  contactName: string | null;
  items: {
    productId: string;
    productName: string;
    variantId: string | null;
    quantity: number;
    currentStock: number;
    finalUnitPrice: number;
    inStock: boolean;
  }[];
  totalAmount: number;
  generatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Recurring Template Processing                                      */
/* ------------------------------------------------------------------ */

/**
 * Find templates due for processing and generate reviewable drafts.
 * Called by a cron job. Never charges or decrements stock.
 */
export async function processRecurringTemplates(
  supabase: SupabaseClient,
): Promise<{ processed: number; drafts: RecurringDraft[] }> {
  const today = new Date().toISOString().split("T")[0];

  // Find templates due for processing
  const { data: templates, error } = await withDbCapture(
    "recurring:find_due",
    supabase
      .from("order_templates")
      .select("id, name, contact_id, organization_id, schedule_interval_days")
      .eq("is_active", true)
      .not("schedule_interval_days", "is", null)
      .lte("next_run_date", today),
  );

  if (error || !templates || templates.length === 0) {
    return { processed: 0, drafts: [] };
  }

  const drafts: RecurringDraft[] = [];

  for (const template of templates) {
    try {
      const draft = await generateDraft(supabase, template);
      if (draft) drafts.push(draft);

      // Advance next_run_date
      const nextDate = new Date(today);
      nextDate.setDate(
        nextDate.getDate() + (template.schedule_interval_days ?? 30),
      );

      await withDbCapture(
        "recurring:advance_date",
        supabase
          .from("order_templates")
          .update({ next_run_date: nextDate.toISOString().split("T")[0] })
          .eq("id", template.id),
      );
    } catch (e) {
      // Log but don't fail the whole batch
      const { capture } = await import("@zuiio/capture");
      capture(e, { context: `recurring:process template ${template.id}` });
    }
  }

  return { processed: templates.length, drafts };
}

async function generateDraft(
  supabase: SupabaseClient,
  template: {
    id: string;
    name: string;
    contact_id: string | null;
    organization_id: string;
  },
): Promise<RecurringDraft | null> {
  // Fetch template items with product info
  const { data: items } = await withDbCapture(
    "recurring:fetch_items",
    supabase
      .from("order_template_items")
      .select(
        "product_id, variant_id, quantity, products!inner(id, name, current_stock, sale_price, category_id)",
      )
      .eq("template_id", template.id)
      .eq("organization_id", template.organization_id),
  );

  if (!items || items.length === 0) return null;

  // Resolve contact name
  let contactName: string | null = null;
  if (template.contact_id) {
    const { data: contact } = await withDbCapture(
      "recurring:fetch_contact",
      supabase
        .from("contacts")
        .select("name")
        .eq("id", template.contact_id)
        .maybeSingle(),
    );
    contactName = contact?.name ?? null;
  }

  // Get current prices via server pricing
  const saleItems = items.map((item) => {
    const product = item.products as unknown as {
      id: string;
      current_stock: number;
      sale_price: number;
    };
    return {
      productId: item.product_id,
      variantId: item.variant_id,
      quantity: item.quantity,
      unitPrice: product.sale_price ?? 0,
    };
  });

  const pricedItems = await calculateSalePricing(
    supabase,
    template.organization_id,
    template.contact_id,
    saleItems,
  );

  // Build draft items with stock status
  const draftItems = pricedItems.map((item, i) => {
    const product = items[i]?.products as unknown as {
      id: string;
      name: string;
      current_stock: number;
    };
    return {
      productId: item.productId,
      productName: product?.name ?? "Unknown",
      variantId: item.variantId ?? null,
      quantity: item.quantity,
      currentStock: Number(product?.current_stock ?? 0),
      finalUnitPrice: item.finalUnitPrice,
      inStock: Number(product?.current_stock ?? 0) >= item.quantity,
    };
  });

  const totalAmount = draftItems.reduce(
    (sum, item) => sum + item.finalUnitPrice * item.quantity,
    0,
  );

  return {
    templateId: template.id,
    templateName: template.name,
    contactId: template.contact_id,
    contactName,
    items: draftItems,
    totalAmount,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Pause a recurring schedule when template/customer/org is inactive.
 */
export async function pauseRecurringTemplate(
  supabase: SupabaseClient,
  templateId: string,
  organizationId: string,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await withDbCapture(
    "recurring:pause",
    supabase
      .from("order_templates")
      .update({ schedule_interval_days: null, next_run_date: null })
      .eq("id", templateId)
      .eq("organization_id", organizationId),
  );

  if (error) {
    const { capture } = await import("@zuiio/capture");
    capture(error, { context: "recurring:pause" });
    return { success: false, error: "Хуваарийг зогсооход алдаа гарлаа." };
  }

  return { success: true };
}
