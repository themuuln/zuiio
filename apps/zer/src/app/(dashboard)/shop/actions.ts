"use server";
import * as Sentry from "@sentry/nextjs";
import { capture, withDbCapture } from "@zuiio/capture";

import { requireAppContext, requireWriteAction } from "@/lib/action-utils";
import { findOrCreateContact } from "@/lib/contact-utils";
import { createInvoiceFromSale } from "@/lib/invoicing";
import { revalidateEntity, revalidateEntityTag } from "@/lib/revalidate";
import type { CartItemData } from "@/lib/types";
import { getString } from "@/lib/validation";

export async function createShopSale(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  return Sentry.startSpan(
    { name: "createShopSale", op: "shop.checkout" },
    async (span) => {
      const t0 = performance.now();
      const timing = (phase: string, ms: number) =>
        span.setAttribute(`shop.${phase}_ms`, Math.round(ms));

      // --- Phase 1: Auth ---
      const authStart = performance.now();
      const ctx = await requireWriteAction("sales.create");
      if ("error" in ctx) return ctx;
      const { supabase, organizationId, userId, branchId } = ctx;
      timing("auth", performance.now() - authStart);
      span.setAttributes({
        "shop.org_id": organizationId,
        "shop.user_id": userId,
      });

      // --- Phase 2: Parse ---
      const itemsRaw = formData.get("items");
      if (!itemsRaw) {
        return { error: "Сагсанд бүтээгдэхүүн байхгүй байна." };
      }

      let items: CartItemData[];
      try {
        items = JSON.parse(itemsRaw.toString()) as CartItemData[];
      } catch (e) {
        capture(e, { context: "shop: parse cart items" });
        return { error: "Сагсны мэдээлэл буруу байна." };
      }

      if (!Array.isArray(items) || items.length === 0) {
        return { error: "Сагсанд бүтээгдэхүүн байхгүй байна." };
      }
      span.setAttribute("shop.item_count", items.length);

      const salespersonId = getString(formData, "salesperson_id") || userId;
      const paymentMethod = getString(formData, "payment_method") || "cash";
      const paidAmount = Number(formData.get("paid_amount") ?? 0);
      const totalAmount = items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );

      const currencyCode = getString(formData, "currency_code") || "MNT";
      const currencySymbol = getString(formData, "currency_symbol") || "₮";
      const exchangeRate = Number(formData.get("exchange_rate") ?? 1.0);

      const customerName = getString(formData, "customer_name");
      const customerPhone = customerName
        ? getString(formData, "customer_phone")
        : null;

      // --- Phase 3: Pre-sale parallel ---
      const preSaleStart = performance.now();
      const [salespersonOk, contactResult] = await Promise.all([
        // Salesperson validation (skip if self)
        salespersonId === userId
          ? (true as const)
          : supabase
              .from("profiles")
              .select("id")
              .eq("id", salespersonId)
              .eq("organization_id", organizationId)
              .maybeSingle()
              .then(({ data, error }) => {
                if (error) {
                  capture(error, {
                    context: "createShopSale: validate salesperson",
                  });
                  return {
                    error: "Борлуулагч шалгахад алдаа гарлаа.",
                  } as const;
                }
                if (!data) {
                  return {
                    error:
                      "Сонгосон борлуулагч танай байгууллагад хамаарахгүй байна.",
                  } as const;
                }
                return true as const;
              }),
        // Contact creation
        customerName
          ? findOrCreateContact(
              supabase,
              organizationId,
              "customer",
              customerName,
              customerPhone,
            )
          : null,
      ]);
      timing("pre_sale", performance.now() - preSaleStart);

      if (typeof salespersonOk === "object" && "error" in salespersonOk) {
        return salespersonOk;
      }

      let contactId: string | null = null;
      let createdContact = false;
      if (contactResult) {
        if ("error" in contactResult) return contactResult;
        contactId = contactResult.id;
        createdContact = true;
      }

      // --- Phase 4: Atomic RPC ---
      const rpcStart = performance.now();
      const { data: result, error: rpcError } = await supabase.rpc(
        "process_shop_sale",
        {
          p_org_id: organizationId,
          p_branch_id: branchId,
          p_user_id: userId,
          p_contact_id: contactId,
          p_total_amount: totalAmount,
          p_paid_amount: paidAmount,
          p_payment_method: paymentMethod,
          p_salesperson_id: salespersonId,
          p_items: items.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.unitPrice * item.quantity,
            commission_amount:
              Math.round(item.unitPrice * item.quantity * 0.1 * 100) / 100,
            variant_id: item.variantId ?? "",
          })),
          p_movements: items.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
            unit_cost: item.unitPrice,
            variant_id: item.variantId ?? "",
          })),
          p_currency_code: currencyCode,
          p_currency_symbol: currencySymbol,
          p_exchange_rate: exchangeRate,
        },
      );
      timing("rpc", performance.now() - rpcStart);

      if (
        rpcError ||
        !result ||
        typeof result !== "object" ||
        !("success" in result)
      ) {
        span.setStatus({ code: 2, message: "error" });
        if (createdContact && contactId) {
          await supabase.from("contacts").delete().eq("id", contactId);
        }
        const rpcErrResult =
          result && typeof result === "object" && "error" in result
            ? result
            : null;
        const errorMsg =
          rpcError?.message ??
          (rpcErrResult ? String(rpcErrResult.error) : null) ??
          "Үлдэгдэл хүрэлцэхгүй байна.";
        capture(new Error(errorMsg), {
          context: "createShopSale: process_shop_sale",
        });
        return { error: errorMsg };
      }

      const saleId = String(result.sale_id);
      span.setAttribute("shop.sale_id", saleId);

      // --- Phase 5: Post-sale (fire-and-forget) ---
      createInvoiceFromSale(
        supabase,
        organizationId,
        userId,
        saleId,
        contactId,
        branchId as string,
      ).catch((e) => {
        capture(e, { context: "createShopSale: fire-and-forget invoice" });
      });

      revalidateEntity("shop");
      revalidateEntityTag("sales", organizationId);
      revalidateEntityTag("products", organizationId);
      if (createdContact) {
        revalidateEntityTag("customers", organizationId);
      }

      timing("total", performance.now() - t0);
      span.setStatus({ code: 1 });

      return { saleId };
    },
  );
}

/**
 * Returns all profiles in the current organization and the current user's ID.
 * Used by the StaffPicker component for salesperson selection.
 */
export async function getStaffList() {
  const { supabase, organizationId, userId } = await requireAppContext();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("organization_id", organizationId)
    .order("full_name");

  if (error) {
    return { error: "Борлуулагчдын жагсаалт авахад алдаа гарлаа." };
  }

  return { profiles: profiles ?? [], currentUserId: userId };
}

const PRODUCTS_PAGE_SIZE = 50;

/**
 * Fetch a page of products for the catalog (infinite scroll).
 * Returns products + whether more pages exist.
 */
export async function fetchProductsPage(offset: number): Promise<{
  products: {
    id: string;
    name: string;
    sku: string | null;
    barcode: string | null;
    unit: string | null;
    sale_price: number | null;
    current_stock: number | null;
    category_id: string | null;
    image_url: string | null;
    brand_name: string | null;
    brand_logo_url: string | null;
  }[];
  hasMore: boolean;
}> {
  const { supabase, organizationId } = await requireAppContext();

  const { data: products } = await withDbCapture(
    "shop_products_page",
    supabase
      .from("products")
      .select(
        "id, name, sku, barcode, unit, sale_price, current_stock, category_id, image_url, brands(name, logo_url)",
      )
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .range(offset, offset + PRODUCTS_PAGE_SIZE - 1),
  );

  const productList = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    unit: p.unit,
    sale_price: p.sale_price,
    current_stock: p.current_stock,
    category_id: p.category_id,
    image_url: p.image_url,
    brand_name:
      (p.brands as { name: string; logo_url: string | null } | null)?.name ??
      null,
    brand_logo_url:
      (p.brands as { name: string; logo_url: string | null } | null)
        ?.logo_url ?? null,
  }));

  return {
    products: productList,
    hasMore: productList.length === PRODUCTS_PAGE_SIZE,
  };
}
