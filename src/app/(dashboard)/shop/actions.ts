"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/erp";
import { getString, normalizePhone } from "@/lib/validation";

type CartItemData = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  unit: string;
};

export async function createShopSale(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { supabase, organizationId, userId } = await requireAppContext();

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

  // Check each item's stock
  for (const item of items) {
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
      contact_id: contactId,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      payment_method: paymentMethod,
      status: "completed",
      created_by: userId,
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
  const saleItems = items.map((item) => ({
    sale_id: saleId,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total_price: item.unitPrice * item.quantity,
  }));

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
  const stockMovements = items.map((item) => ({
    organization_id: organizationId,
    product_id: item.productId,
    type: "out",
    quantity: item.quantity,
    unit_cost: item.unitPrice,
    reference: `sale:${saleId}`,
    created_by: userId,
  }));

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

  // --- Step 6: Decrement current_stock for each product ---
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) continue;
    const nextStock = Number(product.current_stock ?? 0) - item.quantity;

    const { error: stockUpdateError } = await supabase
      .from("products")
      .update({ current_stock: nextStock })
      .eq("organization_id", organizationId)
      .eq("id", item.productId);

    if (stockUpdateError) {
      // Partial rollback — best-effort restore stock movements
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
  }

  // --- Success ---
  revalidatePath("/shop");
  revalidatePath("/shop/history");
  redirect(`/shop/receipt/${saleId}`);
}
