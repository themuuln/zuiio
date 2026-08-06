"use server";

import { capture } from "@zuiio/capture";
import { after } from "next/server";
import { postSaleToJournal } from "@/lib/accounting";
import { requireWriteAction } from "@/lib/action-utils";
import { logAuditEventWithClient } from "@/lib/audit";
import { calculateCommission } from "@/lib/commissions";
import { findOrCreateContact } from "@/lib/contact-utils";
import { parseAmount } from "@/lib/erp";
import { formatCurrency, formatRouteDate } from "@/lib/format";
import { createInvoiceFromSale } from "@/lib/invoicing";
import {
  checkLowStockAndNotify,
  notifyWebPushEvent,
  sendTelegramNotification,
} from "@/lib/notification";
import { revalidateEntities } from "@/lib/revalidate";
import {
  createStockMovements,
  fetchProductsForStock,
  fetchVariantsForStock,
} from "@/lib/stock-utils";
import type { Json } from "@/lib/supabase/types";
import { getString } from "@/lib/validation";

type LineItemData = {
  productId: string;
  quantity: number;
  unitPrice: number;
  variantId?: string;
};

export async function createSale(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("sales.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId, branchId } = ctx;

  // --- Resolve salesperson ---
  const salespersonId = getString(formData, "salesperson_id") || userId;

  // Validate cross-org salesperson override
  if (salespersonId !== userId) {
    const { error: salespersonError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", salespersonId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (salespersonError) {
      capture(salespersonError, { context: "sales/new: validate salesperson" });
    }
  }

  const paymentMethod = getString(formData, "payment_method") || "cash";
  const paymentSplitsRaw = formData.get("payment_splits");
  let paymentSplits: Json | null = null;
  if (paymentSplitsRaw) {
    try {
      paymentSplits = JSON.parse(paymentSplitsRaw.toString()) as Json;
    } catch (e) {
      capture(e, { context: "sales/new: parse payment splits" });
    }
  }
  const status = getString(formData, "status") || "completed";

  // --- Parse items from JSON ---
  const itemsRaw = formData.get("items");
  if (!itemsRaw) {
    return { error: "Бүтээгдэхүүн сонгоно уу." };
  }

  let items: LineItemData[];
  try {
    items = JSON.parse(itemsRaw.toString()) as LineItemData[];
  } catch (e) {
    capture(e, { context: "sales/new: parse items" });
    return { error: "Бүтээгдэхүүний мэдээлэл буруу байна." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Дор хаяж нэг мөр оруулна уу." };
  }

  // Validate each item
  for (const item of items) {
    if (!item.productId || item.quantity <= 0 || item.unitPrice < 0) {
      return {
        error: "Бүтээгдэхүүн, тоо хэмжээ, үнэ зөв бөглөгдөх ёстой.",
      };
    }
  }

  // --- Aggregate quantities by productId for duplicate products ---
  const productQuantities = new Map<string, number>();
  for (const item of items) {
    productQuantities.set(
      item.productId,
      (productQuantities.get(item.productId) ?? 0) + item.quantity,
    );
  }
  const uniqueProductIds = [...productQuantities.keys()];

  // --- Step 1: Validate stock for all unique products ---
  const productMap = await fetchProductsForStock(
    supabase,
    organizationId,
    uniqueProductIds,
  );

  if (productMap.size === 0 && uniqueProductIds.length > 0) {
    return { error: "Бүтээгдэхүүний мэдээлэл уншихад алдаа гарлаа." };
  }

  // --- Pre-compute variant data for use in both validation and decrement ---
  const variantItems = items.filter((i) => i.variantId);
  let variantStockMap = new Map<string, { current_stock: number | null }>();
  if (variantItems.length > 0) {
    const variantIds = [...new Set(variantItems.map((i) => i.variantId!))];
    const variants = await fetchVariantsForStock(supabase, variantIds);
    variantStockMap = variants as Map<string, { current_stock: number | null }>;
  }

  // --- Validate variant stock ---
  if (status !== "cancelled") {
    for (const item of variantItems) {
      const variant = variantStockMap.get(item.variantId!);
      if (!variant) {
        return { error: "Сонгосон вариант олдсонгүй." };
      }
      const currentStock = Number(variant.current_stock ?? 0);
      if (currentStock < item.quantity) {
        return {
          error: `Вариантын үлдэгдэл хүрэлцэхгүй байна. (Үлдэгдэл: ${currentStock}, хэрэгтэй: ${item.quantity})`,
        };
      }
    }
  }

  // --- Validate product stock for non-variant items ---
  if (status !== "cancelled") {
    const nonVariantProductQuantities = new Map<string, number>();
    for (const item of items) {
      if (!item.variantId) {
        nonVariantProductQuantities.set(
          item.productId,
          (nonVariantProductQuantities.get(item.productId) ?? 0) +
            item.quantity,
        );
      }
    }
    for (const [productId, totalQty] of nonVariantProductQuantities) {
      const product = productMap.get(productId);
      if (!product) {
        return { error: "Сонгосон бүтээгдэхүүн олдсонгүй." };
      }
      const currentStock = Number(product.current_stock ?? 0);
      if (currentStock < totalQty) {
        return {
          error: `"${product.name}" бүтээгдэхүүний үлдэгдэл хүрэлцэхгүй байна. (Үлдэгдэл: ${currentStock}, хэрэгтэй: ${totalQty})`,
        };
      }
    }
  }

  // --- Calculate total amount ---
  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const paidAmount = parseAmount(formData.get("paid_amount")) || totalAmount;
  const customerName = getString(formData, "customer_name");

  // --- Step 2: Handle customer ---
  let contactId: string | null = null;
  let createdContactId: string | null = null;
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
    createdContactId = result.id;
  }

  // --- Step 3: Insert sale (idempotency-aware) ---
  // The offline queue stamps every queued action with a client-generated
  // idempotency key; a replay retried after a process death must return the
  // sale created by the first attempt, never create a duplicate. The unique
  // (organization_id, dedupe_key) index makes the claim atomic.
  const dedupeKey = getString(formData, "idempotency_key") || null;
  const saleRow = {
    organization_id: organizationId,
    branch_id: branchId!,
    contact_id: contactId,
    sale_date: getString(formData, "sale_date") || formatRouteDate(),
    total_amount: totalAmount,
    paid_amount: paidAmount,
    payment_method: paymentMethod,
    payment_splits: paymentSplits,
    status,
    notes: getString(formData, "notes") || null,
    created_by: userId,
    salesperson_id: salespersonId,
    ...(dedupeKey ? { dedupe_key: dedupeKey } : {}),
  };

  let sale: { id: string } | null = null;

  if (dedupeKey) {
    const { data: claimed, error: claimError } = await supabase
      .from("sales")
      .upsert(saleRow, {
        onConflict: "organization_id,dedupe_key",
        ignoreDuplicates: true,
      })
      .select("id")
      .maybeSingle();

    if (claimError) {
      if (createdContactId) {
        await supabase.from("contacts").delete().eq("id", createdContactId);
      }
      capture(claimError, { context: "createSale: claim dedupe key" });
      return { error: claimError.message };
    }

    if (claimed) {
      sale = claimed;
    } else {
      // Key already claimed: either a complete sale exists (return it) or a
      // crashed attempt left a partial sale with no items (repair + re-run).
      const { data: existing } = await supabase
        .from("sales")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("dedupe_key", dedupeKey)
        .maybeSingle();

      if (!existing) {
        capture(new Error("dedupe key claimed but no sale row"), {
          context: "createSale: dedupe",
        });
        return { error: "Захиалга үүсгэхэд алдаа гарлаа. Дахин оролдоно уу." };
      }

      const { data: existingItems } = await supabase
        .from("sale_items")
        .select("id")
        .eq("sale_id", existing.id)
        .limit(1);

      if (existingItems && existingItems.length > 0) {
        // First attempt completed the sale — idempotent success, and the
        // side effects (invoice, journal, notifications) ran there.
        return {
          success: true as const,
          error: undefined,
          sale: {
            id: existing.id,
            total_amount: totalAmount,
            customer_name: customerName ?? null,
          },
        };
      }

      // Partial attempt (crash between insert and sale_items) — drop it and
      // re-run the creation so the retry converges on one complete sale.
      await supabase.from("sales").delete().eq("id", existing.id);
      const { data: fresh, error: freshError } = await supabase
        .from("sales")
        .insert(saleRow)
        .select("id")
        .single();
      if (freshError) {
        if (createdContactId) {
          await supabase.from("contacts").delete().eq("id", createdContactId);
        }
        capture(freshError, { context: "createSale: insert sale (retry)" });
        return { error: freshError.message };
      }
      sale = fresh;
    }
  } else {
    const { data, error: saleError } = await supabase
      .from("sales")
      .insert(saleRow)
      .select("id")
      .single();

    if (saleError) {
      if (createdContactId) {
        await supabase.from("contacts").delete().eq("id", createdContactId);
      }
      capture(saleError, { context: "createSale: insert sale" });
      return { error: saleError.message };
    }
    sale = data;
  }

  if (!sale) {
    return { error: "Захиалга үүсгэхэд алдаа гарлаа. Дахин оролдоно уу." };
  }

  // --- Step 4: Insert sale_items ---
  const saleItems = items.map((item) => {
    const totalPrice = item.quantity * item.unitPrice;
    return {
      sale_id: sale.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: totalPrice,
      commission_amount:
        status === "cancelled" ? 0 : calculateCommission(totalPrice),
      variant_id: item.variantId ?? null,
    };
  });

  const { error: itemsError } = await supabase
    .from("sale_items")
    .insert(saleItems);

  if (itemsError) {
    await supabase.from("sales").delete().eq("id", sale.id);
    if (createdContactId) {
      await supabase.from("contacts").delete().eq("id", createdContactId);
    }
    capture(itemsError, { context: "createSale: insert sale_items" });
    return { error: itemsError.message };
  }

  // --- Step 5: Insert stock_movements and decrement stock ---
  if (status !== "cancelled") {
    const stockResult = await createStockMovements(supabase, {
      organizationId,
      branchId,
      type: "out",
      reference: `sale:${sale.id}`,
      createdBy: userId,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitPrice,
        variantId: item.variantId,
      })),
    });

    if (stockResult.error) {
      await supabase.from("sale_items").delete().eq("sale_id", sale.id);
      await supabase.from("sales").delete().eq("id", sale.id);
      if (createdContactId) {
        await supabase.from("contacts").delete().eq("id", createdContactId);
      }
      capture(stockResult.error, { context: "createSale: stock_movements" });
      return { error: stockResult.error };
    }

    // --- Step 5b: Atomic stock decrement via RPC ---
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
        .eq("reference", `sale:${sale.id}`);
      await supabase.from("sale_items").delete().eq("sale_id", sale.id);
      await supabase.from("sales").delete().eq("id", sale.id);
      if (createdContactId) {
        await supabase.from("contacts").delete().eq("id", createdContactId);
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
        context: "createSale: process_sale_stock_decrement",
      });
      return { error: errorMsg };
    }
  }

  // --- Success: side effects ---

  // Auto-generate invoice as receipt (fire-and-forget)
  if (status !== "cancelled") {
    await createInvoiceFromSale(
      supabase,
      organizationId,
      userId,
      sale.id,
      contactId,
      branchId!,
    );
  }

  // Post to general ledger (fire-and-forget)
  if (status !== "cancelled") {
    postSaleToJournal(
      supabase,
      organizationId,
      userId,
      branchId!,
      sale.id,
      {
        total_amount: totalAmount,
        paid_amount: paidAmount,
        sale_date: getString(formData, "sale_date") || formatRouteDate(),
      },
      items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        variant_id: item.variantId ?? null,
      })),
    ).catch((err) => capture(err, { context: "post_sale_to_journal" }));
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "created",
      "sale",
      sale.id,
      { total_amount: { old: 0, new: totalAmount } },
      `Борлуулалт ${formatRouteDate()} - ${formatCurrency(totalAmount)}`,
    ),
  );

  // Fire-and-forget notifications
  if (status !== "cancelled") {
    const productNames = items
      .map((item) => {
        const product = productMap.get(item.productId);
        return product?.name ?? "Бүтээгдэхүүн";
      })
      .join(", ");

    sendTelegramNotification(
      organizationId,
      "new_sale",
      `🛒 Шинэ борлуулалт`,
      `*${productNames}*\n\n` +
        `Нийт дүн: ${formatCurrency(totalAmount)}\n` +
        `Төлөв: Дууссан`,
    );

    notifyWebPushEvent(
      supabase,
      organizationId,
      "new_sale",
      "Шинэ борлуулалт",
      `${productNames}\nНийт дүн: ${formatCurrency(totalAmount)}`,
      "/sales",
    );

    // Check low stock for each unique product
    for (const productId of uniqueProductIds) {
      const { data: updatedProduct, error: productError } = await supabase
        .from("products")
        .select("current_stock, min_stock, name")
        .eq("id", productId)
        .single();

      if (productError) {
        capture(productError, { context: "createSale: check low stock" });
      }

      if (updatedProduct) {
        checkLowStockAndNotify(
          organizationId,
          updatedProduct.name,
          updatedProduct.current_stock ?? 0,
          updatedProduct.min_stock ?? 0,
        );
      }
    }
  }

  revalidateEntities(["sales", "inventory", "products"]);
  return {
    success: true as const,
    error: undefined,
    sale: {
      id: sale.id,
      total_amount: totalAmount,
      customer_name: customerName ?? null,
    },
  };
}
