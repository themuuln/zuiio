"use server";
import { capture, withDbCapture } from "@zuiio/capture";

import { requireAppContext, requireWriteAction } from "@/lib/action-utils";
import { calculateCommission } from "@/lib/commissions";
import { findOrCreateContact } from "@/lib/contact-utils";
import { createInvoiceFromSale } from "@/lib/invoicing";
import { revalidateEntity } from "@/lib/revalidate";
import {
  createStockMovements,
  fetchProductsForStock,
  fetchVariantsForStock,
} from "@/lib/stock-utils";
import type { CartItemData } from "@/lib/types";
import { getString } from "@/lib/validation";

export async function createShopSale(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("sales.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId, branchId } = ctx;

  // Parse items from JSON
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

  // --- Resolve salesperson ---
  const salespersonId = getString(formData, "salesperson_id") || userId;

  // Validate cross-org salesperson override
  if (salespersonId !== userId) {
    const { data: salesperson, error: salespersonError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", salespersonId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (salespersonError) {
      capture(salespersonError, {
        context: "createShopSale: validate salesperson",
      });
      return { error: "Борлуулагч шалгахад алдаа гарлаа." };
    }

    if (!salesperson) {
      return {
        error: "Сонгосон борлуулагч танай байгууллагад хамаарахгүй байна.",
      };
    }
  }

  const paymentMethod = getString(formData, "payment_method") || "cash";
  const paidAmount = Number(formData.get("paid_amount") ?? 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  // --- Step 1: Validate stock + handle customer (parallel) ---
  const productIds = items.map((i) => i.productId);
  const variantIds = items
    .filter((i) => i.variantId)
    .map((i) => i.variantId as string);
  const customerName = getString(formData, "customer_name");
  const customerPhone = customerName
    ? getString(formData, "customer_phone")
    : null;

  // Run all independent reads in parallel to save ~2 round-trips
  const [productMap, variantMap, contactResult] = await Promise.all([
    fetchProductsForStock(supabase, organizationId, productIds),
    variantIds.length > 0
      ? fetchVariantsForStock(supabase, variantIds)
      : new Map(),
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

  // Check each item's stock
  for (const item of items) {
    if (item.variantId) {
      const variant = variantMap.get(item.variantId);
      if (!variant) {
        return {
          error: `Вариант олдсонгүй: "${item.name}".`,
        };
      }
      const currentStock = Number(variant.current_stock ?? 0);
      if (currentStock < item.quantity) {
        return {
          error: `"${item.name}" вариантын үлдэгдэл хүрэлцэхгүй байна. (Үлдэгдэл: ${currentStock}, хэрэгтэй: ${item.quantity})`,
        };
      }
    } else {
      const product = productMap.get(item.productId);
      if (!product) {
        return {
          error: `Бүтээгдэхүүн "${item.name}" олдсонгүй.`,
        };
      }
      const currentStock = Number(product.current_stock ?? 0);
      if (currentStock < item.quantity) {
        return {
          error: `"${product.name}" бүтээгдэхүүний үлдэгдэл хүрэлцэхгүй байна. (Үлдэгдэл: ${currentStock}, хэрэгтэй: ${item.quantity})`,
        };
      }
    }
  }

  // Handle customer result from parallel batch
  let contactId: string | null = null;
  let createdContact = false;

  if (contactResult) {
    if ("error" in contactResult) return contactResult;
    contactId = contactResult.id;
    createdContact = true;
  }

  // --- Step 3: Insert sale ---
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      organization_id: organizationId,
      branch_id: branchId as string,
      contact_id: contactId,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      payment_method: paymentMethod,
      status: "completed",
      created_by: userId,
      salesperson_id: salespersonId,
    })
    .select("id")
    .single();

  if (saleError) {
    capture(saleError, { context: "createShopSale: insert sale" });
    // Rollback contact creation if we created one
    if (createdContact && contactId) {
      await supabase.from("contacts").delete().eq("id", contactId);
    }
    return {
      error: `Борлуулалт үүсгэхэд алдаа гарлаа: ${saleError.message}`,
    };
  }

  const saleId = sale.id;

  // --- Step 4: Insert sale_items ---
  const saleItems = items.map((item) => {
    const totalPrice = item.unitPrice * item.quantity;
    return {
      sale_id: saleId,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: totalPrice,
      commission_amount: calculateCommission(totalPrice),
      variant_id: item.variantId ?? null,
    };
  });

  const { error: itemsError } = await supabase
    .from("sale_items")
    .insert(saleItems);

  if (itemsError) {
    capture(itemsError, { context: "createShopSale: insert sale_items" });
    // Rollback
    await supabase.from("sales").delete().eq("id", saleId);
    if (createdContact && contactId) {
      await supabase.from("contacts").delete().eq("id", contactId);
    }
    return {
      error: `Борлуулалтын мөрүүд үүсгэхэд алдаа гарлаа: ${itemsError.message}`,
    };
  }

  // --- Step 5: Insert stock_movements ---
  const stockResult = await createStockMovements(supabase, {
    organizationId,
    branchId,
    type: "out",
    reference: `sale:${saleId}`,
    createdBy: userId,
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.unitPrice,
      variantId: item.variantId,
    })),
  });

  if (stockResult.error) {
    capture(stockResult.error, { context: "createShopSale: stock_movements" });
    await supabase.from("sale_items").delete().eq("sale_id", saleId);
    await supabase.from("sales").delete().eq("id", saleId);
    if (createdContact && contactId) {
      await supabase.from("contacts").delete().eq("id", contactId);
    }
    return { error: stockResult.error };
  }

  // --- Step 6: Atomic stock decrement via RPC ---
  const { data: stockDecResult, error: stockDecError } = await supabase.rpc(
    "process_sale_stock_decrement",
    {
      p_org_id: organizationId,
      p_items: items.map((item) => ({
        product_id: item.productId,
        variant_id: item.variantId ?? "",
        quantity: item.quantity,
      })),
    },
  );

  if (
    stockDecError ||
    !stockDecResult ||
    typeof stockDecResult !== "object" ||
    !("success" in stockDecResult)
  ) {
    await supabase
      .from("stock_movements")
      .delete()
      .eq("reference", `sale:${saleId}`);
    await supabase.from("sale_items").delete().eq("sale_id", saleId);
    await supabase.from("sales").delete().eq("id", saleId);
    if (createdContact && contactId) {
      await supabase.from("contacts").delete().eq("id", contactId);
    }
    const rpcError =
      stockDecResult &&
      typeof stockDecResult === "object" &&
      "error" in stockDecResult
        ? String(stockDecResult.error)
        : null;
    const errorMsg =
      stockDecError?.message ?? rpcError ?? "Үлдэгдэл хүрэлцэхгүй байна.";
    capture(new Error(errorMsg), {
      context: "createShopSale: process_sale_stock_decrement",
    });
    return { error: errorMsg };
  }

  // --- Success ---

  // Auto-generate invoice as receipt (fire-and-forget — errors captured inside createInvoiceFromSale)
  // Intentionally NOT awaited: invoice creation is ~500-800ms of 5 sequential DB calls
  // that the customer doesn't need to wait for. The sale + stock are already committed.
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
  return { saleId };
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
