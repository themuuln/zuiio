"use server";

import { revalidatePath } from "next/cache";
import { calculateCommission } from "@/lib/commissions";
import { checkPermission, requireAppContext } from "@/lib/erp";
import { createInvoiceFromSale } from "@/lib/invoicing";
import { getString, normalizePhone } from "@/lib/validation";
import type { Database } from "@/lib/supabase/types";

type CartItemData = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  variantId?: string;
};

export async function createShopSale(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { supabase, organizationId, userId, branchId, permissions } =
    await requireAppContext();
  const permError = checkPermission(permissions, "sales.create");
  if (permError) return { error: permError };

  // Parse items from JSON
  const itemsRaw = formData.get("items");
  if (!itemsRaw) {
    return { error: "Сагсанд бүтээгдэхүүн байхгүй байна." };
  }

  let items: CartItemData[];
  try {
    items = JSON.parse(itemsRaw.toString()) as CartItemData[];
  } catch {
    return { error: "Сагсны мэдээлэл буруу байна." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Сагсанд бүтээгдэхүүн байхгүй байна." };
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
  const paidAmount = Number(formData.get("paid_amount") ?? 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  // --- Step 1: Validate stock for all items ---
  const productIds = items.map((i) => i.productId);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, current_stock, unit")
    .eq("organization_id", organizationId)
    .in("id", productIds);

  if (productsError) {
    return { error: "Бүтээгдэхүүний мэдээлэл уншихад алдаа гарлаа." };
  }

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  // Collect variant IDs and validate variant stock
  const variantIds = items
    .filter((i) => i.variantId)
    .map((i) => i.variantId!);

  let variantMap = new Map<string, { id: string; current_stock: number | null; product_id: string }>();
  if (variantIds.length > 0) {
    const { data: variants, error: variantsError } = await supabase
      .from("product_variants")
      .select("id, current_stock, product_id")
      .in("id", variantIds);

    if (variantsError) {
      return { error: "Вариантын мэдээлэл уншихад алдаа гарлаа." };
    }

    variantMap = new Map((variants ?? []).map((v) => [v.id, v]));
  }

  // Check each item's stock
  for (const item of items) {
    if (item.variantId) {
      // Stock check against variant
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
      // Stock check against product
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
  const customerPhone = normalizePhone(getString(formData, "customer_phone"));
  let createdContact = false;

  if (customerName) {
    // Check if contact already exists
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("type", "customer")
      .eq("name", customerName)
      .maybeSingle();

    if (existingContact) {
      contactId = existingContact.id;
    } else {
      // Create new contact
      const { data: newContact, error: contactError } = await supabase
        .from("contacts")
        .insert({
          organization_id: organizationId,
          type: "customer",
          name: customerName,
          phone: customerPhone || null,
        })
        .select("id")
        .single();

      if (contactError) {
        return {
          error: `Хэрэглэгч үүсгэхэд алдаа гарлаа: ${contactError.message}`,
        };
      }
      contactId = newContact.id;
      createdContact = true;
    }
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
    } satisfies Database["public"]["Tables"]["sale_items"]["Insert"];
  });

  const { error: itemsError } = await supabase
    .from("sale_items")
    .insert(saleItems);

  if (itemsError) {
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
  const stockMovements = items.map((item) => {
    const movement: {
      organization_id: string;
      branch_id: string;
      product_id: string;
      type: string;
      quantity: number;
      unit_cost: number;
      reference: string;
      created_by: string;
      variant_id?: string;
    } = {
      organization_id: organizationId,
      branch_id: branchId!,
      product_id: item.productId,
      type: "out",
      quantity: item.quantity,
      unit_cost: item.unitPrice,
      reference: `sale:${saleId}`,
      created_by: userId,
    };
    if (item.variantId) {
      movement.variant_id = item.variantId;
    }
    return movement;
  });

  const { error: movementError } = await supabase
    .from("stock_movements")
    .insert(stockMovements);

  if (movementError) {
    // Rollback
    await supabase.from("sale_items").delete().eq("sale_id", saleId);
    await supabase.from("sales").delete().eq("id", saleId);
    if (createdContact && contactId) {
      await supabase.from("contacts").delete().eq("id", contactId);
    }
    return {
      error: `Агуулахын хөдөлгөөн үүсгэхэд алдаа гарлаа: ${movementError.message}`,
    };
  }

  // --- Step 6: Atomic decrement of current_stock ---
  // For variant items, decrement variant stock. For non-variant items, decrement product stock.
  // Uses .gte("current_stock", item.quantity) filter so the UPDATE only affects
  // rows that still have sufficient stock at statement execution time, eliminating
  // the read-then-write race window. Checks affected row count via .maybeSingle()
  // to detect insufficient stock.
  for (const item of items) {
    if (item.variantId) {
      // Decrement variant stock
      const variant = variantMap.get(item.variantId);
      if (!variant) continue;

      const { data: updatedVariant, error: stockUpdateError } = await supabase
        .from("product_variants")
        .update({
          current_stock: Number(variant.current_stock ?? 0) - item.quantity,
        })
        .eq("id", item.variantId)
        .gte("current_stock", item.quantity)
        .select("id")
        .maybeSingle();

      if (stockUpdateError) {
        // Actual error (network, permission, etc.) — full rollback
        await supabase
          .from("stock_movements")
          .delete()
          .eq("reference", `sale:${saleId}`);
        await supabase.from("sale_items").delete().eq("sale_id", saleId);
        await supabase.from("sales").delete().eq("id", saleId);
        if (createdContact && contactId) {
          await supabase.from("contacts").delete().eq("id", contactId);
        }
        return {
          error: `Үлдэгдэл хасахад алдаа гарлаа: ${stockUpdateError.message}`,
        };
      }

      if (!updatedVariant) {
        // No row matched — stock was consumed between Step 1 check and this UPDATE
        await supabase
          .from("stock_movements")
          .delete()
          .eq("reference", `sale:${saleId}`);
        await supabase.from("sale_items").delete().eq("sale_id", saleId);
        await supabase.from("sales").delete().eq("id", saleId);
        if (createdContact && contactId) {
          await supabase.from("contacts").delete().eq("id", contactId);
        }
        return {
          error: `"${item.name}" вариантын үлдэгдэл хүрэлцэхгүй байна.`,
        };
      }
    } else {
      // Decrement product stock
      const product = productMap.get(item.productId);
      if (!product) continue;

      const { data: updatedProduct, error: stockUpdateError } = await supabase
        .from("products")
        .update({
          current_stock: Number(product.current_stock ?? 0) - item.quantity,
        })
        .eq("organization_id", organizationId)
        .eq("id", item.productId)
        .gte("current_stock", item.quantity)
        .select("id")
        .maybeSingle();

      if (stockUpdateError) {
        // Actual error (network, permission, etc.) — full rollback
        await supabase
          .from("stock_movements")
          .delete()
          .eq("reference", `sale:${saleId}`);
        await supabase.from("sale_items").delete().eq("sale_id", saleId);
        await supabase.from("sales").delete().eq("id", saleId);
        if (createdContact && contactId) {
          await supabase.from("contacts").delete().eq("id", contactId);
        }
        return {
          error: `Үлдэгдэл хасахад алдаа гарлаа: ${stockUpdateError.message}`,
        };
      }

      if (!updatedProduct) {
        // No row matched — stock was consumed between Step 1 check and this UPDATE
        await supabase
          .from("stock_movements")
          .delete()
          .eq("reference", `sale:${saleId}`);
        await supabase.from("sale_items").delete().eq("sale_id", saleId);
        await supabase.from("sales").delete().eq("id", saleId);
        if (createdContact && contactId) {
          await supabase.from("contacts").delete().eq("id", contactId);
        }
        return {
          error: `"${item.name}" бүтээгдэхүүний үлдэгдэл хүрэлцэхгүй байна.`,
        };
      }
    }
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

  revalidatePath("/shop");
  revalidatePath("/shop/history");
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
