"use server";

import { revalidatePath } from "next/cache";
import { validateSaleInput } from "@/lib/domain-rules";
import {
  isValidPositiveNumber,
  parseAmount,
  requireAppContext,
} from "@/lib/erp";
import { formatRouteDate } from "@/lib/format";
import { getString, normalizePhone } from "@/lib/validation";

export async function createSale(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { supabase, organizationId, userId } = await requireAppContext();

  const productId = getString(formData, "product_id");
  const quantity = parseAmount(formData.get("quantity"));
  const unitPrice = parseAmount(formData.get("unit_price"));
  const paymentMethod = getString(formData, "payment_method") || "cash";
  const status = getString(formData, "status") || "completed";

  if (
    !productId ||
    !isValidPositiveNumber(quantity) ||
    !isValidPositiveNumber(unitPrice) ||
    quantity <= 0
  ) {
    return { error: "Бүтээгдэхүүн, тоо хэмжээ, үнэ зөв бөглөгдөх ёстой." };
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, current_stock, name")
    .eq("organization_id", organizationId)
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return { error: "Сонгосон бүтээгдэхүүн олдсонгүй." };
  }

  if (Number(product.current_stock ?? 0) < quantity && status !== "cancelled") {
    return { error: "Үлдэгдэл хүрэлцэхгүй байна." };
  }

  const totalAmount = quantity * unitPrice;
  const paidAmount = parseAmount(formData.get("paid_amount")) || totalAmount;
  const customerName = getString(formData, "customer_name");
  let createdContactId: string | null = null;

  const validationError = validateSaleInput({
    productId,
    quantity,
    unitPrice,
    paidAmount,
    totalAmount,
  });
  if (validationError) {
    return { error: validationError };
  }

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

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      organization_id: organizationId,
      contact_id: contactId,
      sale_date: getString(formData, "sale_date") || formatRouteDate(),
      total_amount: totalAmount,
      paid_amount: paidAmount,
      payment_method: paymentMethod,
      status,
      notes: getString(formData, "notes") || null,
      created_by: userId,
    })
    .select("id")
    .single();

  if (saleError) {
    if (createdContactId) {
      await supabase.from("contacts").delete().eq("id", createdContactId);
    }
    return { error: saleError.message };
  }

  const { error: itemError } = await supabase.from("sale_items").insert({
    sale_id: sale.id,
    product_id: productId,
    quantity,
    unit_price: unitPrice,
    total_price: totalAmount,
  });

  if (itemError) {
    await supabase.from("sales").delete().eq("id", sale.id);
    if (createdContactId) {
      await supabase.from("contacts").delete().eq("id", createdContactId);
    }
    return { error: itemError.message };
  }

  const movementPayload =
    status === "cancelled"
      ? null
      : {
          organization_id: organizationId,
          product_id: productId,
          type: "out",
          quantity,
          unit_cost: unitPrice,
          reference: `sale:${sale.id}`,
          created_by: userId,
        };

  const { error: movementError } = movementPayload
    ? await supabase.from("stock_movements").insert(movementPayload)
    : { error: null };

  if (movementError) {
    await supabase.from("sale_items").delete().eq("sale_id", sale.id);
    await supabase.from("sales").delete().eq("id", sale.id);
    if (createdContactId) {
      await supabase.from("contacts").delete().eq("id", createdContactId);
    }
    return { error: movementError.message };
  }

  if (status !== "cancelled") {
    // Atomic stock decrement: .gte("current_stock", quantity) ensures the
    // UPDATE only affects rows with sufficient stock at statement execution
    // time, preventing lost updates from concurrent requests. This matches
    // the pattern already used in createShopSale (shop/actions.ts).
    const { data: updatedProduct, error: stockUpdateError } = await supabase
      .from("products")
      .update({
        current_stock: Number(product.current_stock ?? 0) - quantity,
      })
      .eq("organization_id", organizationId)
      .eq("id", productId)
      .gte("current_stock", quantity)
      .select("id")
      .maybeSingle();

    if (stockUpdateError) {
      // Actual error (network, permission, etc.) — full rollback
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
      // .gte() condition failed: stock was consumed between the initial
      // stock check and this atomic UPDATE by a concurrent request.
      await supabase
        .from("stock_movements")
        .delete()
        .eq("reference", `sale:${sale.id}`);
      await supabase.from("sale_items").delete().eq("sale_id", sale.id);
      await supabase.from("sales").delete().eq("id", sale.id);
      if (createdContactId) {
        await supabase.from("contacts").delete().eq("id", createdContactId);
      }
      return { error: "Үлдэгдэл хүрэлцэхгүй байна." };
    }
  }

  revalidatePath("/");
  revalidatePath("/sales");
  revalidatePath("/inventory");
  revalidatePath("/products");
  return { success: true as const };
}
