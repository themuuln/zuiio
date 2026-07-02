"use server";

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
  sendTelegramNotification,
} from "@/lib/notification";
import { revalidateEntities } from "@/lib/revalidate";
import {
  createStockMovements,
  decrementProductStock,
  decrementVariantStock,
  fetchProductsForStock,
  fetchVariantsForStock,
} from "@/lib/stock-utils";
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
    const { data: salesperson } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", salespersonId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!salesperson) {
      return {
        error: "Сонгосон борлуулагч танай байгууллагад хамаарахгүй байна.",
      };
    }
  }

  const paymentMethod = getString(formData, "payment_method") || "cash";
  const paymentSplitsRaw = formData.get("payment_splits");
  let paymentSplits = null;
  if (paymentSplitsRaw) {
    try {
      paymentSplits = JSON.parse(paymentSplitsRaw.toString());
    } catch {
      // ignore invalid JSON
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
  } catch {
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
    supabase as any,
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
    const variants = await fetchVariantsForStock(supabase as any, variantIds);
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
      supabase as any,
      organizationId,
      "customer",
      customerName,
      phone,
    );
    if ("error" in result) return result;
    contactId = result.id;
    createdContactId = result.id;
  }

  // --- Step 3: Insert sale ---
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
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
    } as any)
    .select("id")
    .single();

  if (saleError) {
    if (createdContactId) {
      await supabase.from("contacts").delete().eq("id", createdContactId);
    }
    return { error: saleError.message };
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
    return { error: itemsError.message };
  }

  // --- Step 5: Insert stock_movements and decrement stock ---
  if (status !== "cancelled") {
    const stockResult = await createStockMovements(supabase as any, {
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
      return { error: stockResult.error };
    }

    // --- Atomic product stock decrement for non-variant items ---
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
      if (!product) continue;

      const updatedProduct = await decrementProductStock(
        supabase as any,
        organizationId,
        productId,
        totalQty,
      );

      if (!updatedProduct) {
        // Rollback
        await supabase
          .from("stock_movements")
          .delete()
          .eq("reference", `sale:${sale.id}`);
        await supabase.from("sale_items").delete().eq("sale_id", sale.id);
        await supabase.from("sales").delete().eq("id", sale.id);
        if (createdContactId) {
          await supabase.from("contacts").delete().eq("id", createdContactId);
        }
        return {
          error: `"${product.name}" бүтээгдэхүүний үлдэгдэл хүрэлцэхгүй байна.`,
        };
      }
    }

    // --- Atomic variant stock decrement for variant items ---
    for (const item of variantItems) {
      const success = await decrementVariantStock(
        supabase as any,
        item.variantId!,
        item.quantity,
      );

      if (!success) {
        // Rollback
        await supabase
          .from("stock_movements")
          .delete()
          .eq("reference", `sale:${sale.id}`);
        await supabase.from("sale_items").delete().eq("sale_id", sale.id);
        await supabase.from("sales").delete().eq("id", sale.id);
        if (createdContactId) {
          await supabase.from("contacts").delete().eq("id", createdContactId);
        }
        return {
          error: "Вариантын үлдэгдэл хүрэлцэхгүй байна.",
        };
      }
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
    ).catch(console.error);
  }

  await logAuditEventWithClient(
    supabase,
    organizationId,
    userId,
    "created",
    "sale",
    sale.id,
    { total_amount: { old: 0, new: totalAmount } },
    `Борлуулалт ${formatRouteDate()} - ${formatCurrency(totalAmount)}`,
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

    // Check low stock for each unique product
    for (const productId of uniqueProductIds) {
      const { data: updatedProduct } = await supabase
        .from("products")
        .select("current_stock, min_stock, name")
        .eq("id", productId)
        .single();

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
