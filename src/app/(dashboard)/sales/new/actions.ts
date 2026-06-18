"use server";

import { revalidatePath } from "next/cache";
import { logAuditEventWithClient } from "@/lib/audit";
import { postSaleToJournal } from "@/lib/accounting";
import { calculateCommission } from "@/lib/commissions";
import { checkPermission, parseAmount, requireAppContext } from "@/lib/erp";
import { formatCurrency, formatRouteDate } from "@/lib/format";
import { createInvoiceFromSale } from "@/lib/invoicing";
import {
  checkLowStockAndNotify,
  sendTelegramNotification,
} from "@/lib/notification";
import { getString, normalizePhone } from "@/lib/validation";

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
  const { supabase, organizationId, userId, branchId, isBranchScoped, permissions } =
    await requireAppContext();
  const permError = checkPermission(permissions, "sales.create");
  if (permError) return { error: permError };

  // Scoped users must have a branch
  if (isBranchScoped && !branchId) {
    return { error: "Салбар тодорхойгүй байна." };
  }

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
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, current_stock, unit")
    .eq("organization_id", organizationId)
    .in("id", uniqueProductIds);

  if (productsError) {
    return { error: "Бүтээгдэхүүний мэдээлэл уншихад алдаа гарлаа." };
  }

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  // --- Pre-compute variant data for use in both validation and decrement ---
  const variantItems = items.filter((i) => i.variantId);
  let variantStockMap = new Map<string, { current_stock: number | null }>();

  if (variantItems.length > 0) {
    const variantIds = [...new Set(variantItems.map((i) => i.variantId!))];
    const { data: variants, error: variantsError } = await supabase
      .from("product_variants")
      .select("id, current_stock")
      .in("id", variantIds);

    if (variantsError) {
      return { error: "Вариантын мэдээлэл уншихад алдаа гарлаа." };
    }

    variantStockMap = new Map((variants ?? []).map((v) => [v.id, v]));
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
          (nonVariantProductQuantities.get(item.productId) ?? 0) + item.quantity,
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
  let createdContactId: string | null = null;

  // --- Step 2: Handle customer ---
  let contactId: string | null = null;
  if (customerName) {
    const phone = normalizePhone(getString(formData, "customer_phone"));
    const { data: existingContact, error: existingContactError } =
      await supabase
        .from("contacts")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("type", "customer")
        .eq("name", customerName)
        .maybeSingle();

    if (existingContactError) {
      return { error: existingContactError.message };
    }

    if (existingContact) {
      contactId = existingContact.id;
    } else {
      const { data: contact, error: contactError } = await supabase
        .from("contacts")
        .insert({
          organization_id: organizationId,
          type: "customer",
          name: customerName,
          phone,
        })
        .select("id")
        .single();

      if (contactError) {
        return { error: contactError.message };
      }
      contactId = contact.id;
      createdContactId = contact.id;
    }
  }

  // --- Step 3: Insert sale ---
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      organization_id: organizationId,
      branch_id: branchId ?? undefined,
      contact_id: contactId,
      sale_date: getString(formData, "sale_date") || formatRouteDate(),
      total_amount: totalAmount,
      paid_amount: paidAmount,
      payment_method: paymentMethod,
      status,
      notes: getString(formData, "notes") || null,
      created_by: userId,
      salesperson_id: salespersonId,
    })
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

  // --- Step 5: Insert stock_movements ---
  if (status !== "cancelled") {
    const stockMovements = items.map((item) => ({
      organization_id: organizationId,
      product_id: item.productId,
      type: "out",
      quantity: item.quantity,
      unit_cost: item.unitPrice,
      reference: `sale:${sale.id}`,
      created_by: userId,
      variant_id: item.variantId ?? null,
    }));

    const { error: movementError } = await supabase
      .from("stock_movements")
      .insert(stockMovements);

    if (movementError) {
      await supabase.from("sale_items").delete().eq("sale_id", sale.id);
      await supabase.from("sales").delete().eq("id", sale.id);
      if (createdContactId) {
        await supabase.from("contacts").delete().eq("id", createdContactId);
      }
      return { error: movementError.message };
    }
  }

  // --- Step 6a: Atomic product stock decrement for non-variant items ---
  if (status !== "cancelled") {
    const nonVariantProductQuantities = new Map<string, number>();
    for (const item of items) {
      if (!item.variantId) {
        nonVariantProductQuantities.set(
          item.productId,
          (nonVariantProductQuantities.get(item.productId) ?? 0) + item.quantity,
        );
      }
    }
    for (const [productId, totalQty] of nonVariantProductQuantities) {
      const product = productMap.get(productId);
      if (!product) continue;

      const { data: updatedProduct, error: stockUpdateError } = await supabase
        .from("products")
        .update({
          current_stock: Number(product.current_stock ?? 0) - totalQty,
        })
        .eq("organization_id", organizationId)
        .eq("id", productId)
        .gte("current_stock", totalQty)
        .select("id")
        .maybeSingle();

      if (stockUpdateError) {
        // Actual error — full rollback
        await supabase
          .from("stock_movements")
          .delete()
          .eq("reference", `sale:${sale.id}`);
        await supabase.from("sale_items").delete().eq("sale_id", sale.id);
        await supabase.from("sales").delete().eq("id", sale.id);
        if (createdContactId) {
          await supabase.from("contacts").delete().eq("id", createdContactId);
        }
        return { error: stockUpdateError.message };
      }

      if (!updatedProduct) {
        // .gte() condition failed — stock was consumed concurrently
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
  }

  // --- Step 6b: Atomic variant stock decrement for variant items ---
  if (status !== "cancelled") {
    for (const item of variantItems) {
      const variant = variantStockMap.get(item.variantId!);
      const { data: updatedVariant, error: stockUpdateError } = await supabase
        .from("product_variants")
        .update({
          current_stock: Number(variant?.current_stock ?? 0) - item.quantity,
        })
        .eq("id", item.variantId)
        .gte("current_stock", item.quantity)
        .select("id")
        .maybeSingle();

      if (stockUpdateError) {
        // Actual error — full rollback
        await supabase
          .from("stock_movements")
          .delete()
          .eq("reference", `sale:${sale.id}`);
        await supabase.from("sale_items").delete().eq("sale_id", sale.id);
        await supabase.from("sales").delete().eq("id", sale.id);
        if (createdContactId) {
          await supabase.from("contacts").delete().eq("id", createdContactId);
        }
        return { error: stockUpdateError.message };
      }

      if (!updatedVariant) {
        // .gte() condition failed — stock was consumed concurrently
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
    );
  }

  // Post to general ledger (fire-and-forget)
  if (status !== "cancelled") {
    postSaleToJournal(
      supabase,
      organizationId,
      userId,
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

  revalidatePath("/");
  revalidatePath("/sales");
  revalidatePath("/inventory");
  revalidatePath("/products");
  return {
    success: true as const,
    sale: {
      id: sale.id,
      total_amount: totalAmount,
      customer_name: customerName ?? null,
    },
  };
}
