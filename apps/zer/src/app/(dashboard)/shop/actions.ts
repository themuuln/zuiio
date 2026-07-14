"use server";
import { capture } from "@zuiio/capture";

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

  // --- Step 1: Validate stock for all items ---
  const productIds = items.map((i) => i.productId);
  const productMap = await fetchProductsForStock(
    supabase,
    organizationId,
    productIds,
  );

  // Collect variant IDs and validate variant stock
  const variantIds = items.filter((i) => i.variantId).map((i) => i.variantId!);

  const variantMap =
    variantIds.length > 0
      ? await fetchVariantsForStock(supabase, variantIds)
      : new Map();

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

  // --- Step 2: Handle customer ---
  let contactId: string | null = null;
  const customerName = getString(formData, "customer_name");
  let createdContact = false;

  if (customerName) {
    const phone = getString(formData, "customer_phone");
    const result = await findOrCreateContact(
      supabase,
      organizationId,
      "customer",
      customerName,
      phone,
    );
    if ("error" in result) return result;
    contactId = result.id;
    createdContact = true;
  }

  // --- Step 3: Insert sale ---
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      organization_id: organizationId,
      branch_id: branchId!,
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

  // Auto-generate invoice as receipt (fire-and-forget)
  await createInvoiceFromSale(
    supabase,
    organizationId,
    userId,
    saleId,
    contactId,
    branchId!,
  );

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
