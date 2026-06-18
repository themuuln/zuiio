"use server";

import { revalidatePath } from "next/cache";
import { checkPermission, requireAppContext } from "@/lib/erp";
import { getString } from "@/lib/validation";

export async function createReturn(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const {
    supabase,
    organizationId,
    userId,
    branchId,
    isBranchScoped,
    permissions,
  } = await requireAppContext();
  const permError = checkPermission(permissions, "returns.create");
  if (permError) return { error: permError };

  // Scoped users must have a branch
  if (isBranchScoped && !branchId) {
    return { error: "Салбар тодорхойгүй байна." };
  }

  const type = getString(formData, "type");
  const referenceType = getString(formData, "reference_type") || null;
  const referenceId = getString(formData, "reference_id") || null;
  const contactId = getString(formData, "contact_id") || null;
  const returnDate = getString(formData, "return_date");
  const reason = getString(formData, "reason") || null;
  const itemsJson = getString(formData, "items");

  if (!type || !["sales_return", "purchase_return"].includes(type)) {
    return { error: "Буцаалтын төрөл сонгоно уу." };
  }

  if (!itemsJson) {
    return { error: "Барааны мэдээлэл шаардлагатай." };
  }

  const items = JSON.parse(itemsJson) as Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    reason?: string;
    variant_id?: string;
  }>;

  if (!items.length) {
    return { error: "Дор хаяж нэг бараа оруулна уу." };
  }

  // Validate reference exists
  if (referenceId) {
    if (type === "sales_return") {
      const { data: sale } = await supabase
        .from("sales")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("id", referenceId)
        .single();

      if (!sale) {
        return { error: "Сонгосон борлуулалт олдсонгүй." };
      }
    } else if (
      type === "purchase_return" &&
      referenceType === "purchase_order"
    ) {
      const { data: po } = await supabase
        .from("purchase_orders")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("id", referenceId)
        .single();

      if (!po) {
        return { error: "Сонгосон захиалга олдсонгүй." };
      }
    }
  }

  // Generate return number
  const { data: returnNum } = await supabase.rpc("generate_return_number");
  const returnNumber = returnNum as string;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );

  // Insert return header
  const { data: returnRecord, error: returnError } = await supabase
    .from("returns")
    .insert({
      organization_id: organizationId,
      branch_id: branchId!,
      return_number: returnNumber,
      return_date: returnDate || new Date().toISOString().slice(0, 10),
      type,
      reference_type: referenceType,
      reference_id: referenceId,
      contact_id: contactId,
      status: "draft",
      total_amount: totalAmount,
      reason,
      created_by: userId,
    })
    .select("id")
    .single();

  if (returnError) {
    return { error: `Буцаалт үүсгэхэд алдаа гарлаа: ${returnError.message}` };
  }

  // Insert return items
  const returnItems = items.map((item) => ({
    return_id: returnRecord.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.quantity * item.unit_price,
    reason: item.reason || null,
    variant_id: item.variant_id ?? null,
  }));

  const { error: itemsError } = await supabase
    .from("return_items")
    .insert(returnItems);

  if (itemsError) {
    // Rollback
    await supabase.from("returns").delete().eq("id", returnRecord.id);
    return {
      error: `Барааны мэдээлэл хадгалахад алдаа гарлаа: ${itemsError.message}`,
    };
  }

  revalidatePath("/returns");
  return { success: true as const };
}

export async function completeReturn(returnId: string) {
  const {
    supabase,
    organizationId,
    userId,
    branchId,
    isBranchScoped,
    permissions,
  } = await requireAppContext();
  const permError = checkPermission(permissions, "returns.update");
  if (permError) return { error: permError };

  // Fetch the return with items — enforce branch access if scoped
  let fetchQuery = supabase
    .from("returns")
    .select("*, return_items(*)")
    .eq("organization_id", organizationId)
    .eq("id", returnId);

  if (isBranchScoped && branchId) {
    fetchQuery = fetchQuery.eq("branch_id", branchId);
  }

  const { data: returnRecord, error: returnError } = await fetchQuery.single();

  if (returnError || !returnRecord) {
    return { error: "Буцаалт олдсонгүй." };
  }

  if (returnRecord.status !== "draft") {
    return { error: "Зөвхөн ноорог төлөвтэй буцаалтыг гүйцэтгэх боломжтой." };
  }

  const items = returnRecord.return_items as Array<{
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
  }>;

  if (!items.length) {
    return { error: "Буцаалтад бараа ороогүй байна." };
  }

  const errors: string[] = [];

  for (const item of items) {
    // Create reverse stock movement
    // sales_return → stock in (add stock back)
    // purchase_return → stock out (return to supplier)
    const movementType = returnRecord.type === "sales_return" ? "in" : "out";
    const movementQuantity =
      returnRecord.type === "sales_return"
        ? item.quantity
        : -Math.abs(item.quantity);

    const { error: movementError } = await supabase
      .from("stock_movements")
      .insert({
        organization_id: organizationId,
        branch_id: branchId!,
        product_id: item.product_id,
        type: movementType,
        quantity: movementQuantity,
        unit_cost: item.unit_price,
        reference: `return:${returnId}`,
        notes:
          returnRecord.type === "sales_return"
            ? "Борлуулалтын буцаалт - агуулах руу буцах"
            : "Худалдан авалтын буцаалт - нийлүүлэгч рүү буцах",
        created_by: userId,
      });

    if (movementError) {
      errors.push(
        `Барааны хөдөлгөөн бүртгэхэд алдаа: ${movementError.message}`,
      );
      continue;
    }

    // Update product current_stock
    if (returnRecord.type === "sales_return") {
      // Add stock back (sales return)
      const { data: product } = await supabase
        .from("products")
        .select("current_stock")
        .eq("organization_id", organizationId)
        .eq("id", item.product_id)
        .single();

      if (product) {
        const { error: stockError } = await supabase
          .from("products")
          .update({
            current_stock: Number(product.current_stock ?? 0) + item.quantity,
          })
          .eq("organization_id", organizationId)
          .eq("id", item.product_id);

        if (stockError) {
          errors.push(`Үлдэгдэл шинэчлэхэд алдаа: ${stockError.message}`);
        }
      }
    }

    // If purchase return with reference to purchase order, update received_quantity
    if (
      returnRecord.type === "purchase_return" &&
      returnRecord.reference_type === "purchase_order" &&
      returnRecord.reference_id
    ) {
      const { data: poItem } = await supabase
        .from("purchase_order_items")
        .select("id, received_quantity")
        .eq("purchase_order_id", returnRecord.reference_id)
        .eq("product_id", item.product_id)
        .maybeSingle();

      if (poItem) {
        const { error: poUpdateError } = await supabase
          .from("purchase_order_items")
          .update({
            received_quantity: Math.max(
              0,
              Number(poItem.received_quantity ?? 0) - item.quantity,
            ),
          })
          .eq("id", poItem.id);

        if (poUpdateError) {
          errors.push(
            `Захиалгын хүлээн авсан тоо шинэчлэхэд алдаа: ${poUpdateError.message}`,
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    return { error: errors.join("; ") };
  }

  // Update return status to completed — enforce branch access if scoped
  let completeQuery = supabase
    .from("returns")
    .update({ status: "completed" })
    .eq("id", returnId)
    .eq("organization_id", organizationId);

  if (isBranchScoped && branchId) {
    completeQuery = completeQuery.eq("branch_id", branchId);
  }

  const { error: updateError } = await completeQuery;

  if (updateError) {
    return { error: `Төлөв шинэчлэхэд алдаа гарлаа: ${updateError.message}` };
  }

  revalidatePath("/returns");
  revalidatePath("/inventory");
  revalidatePath("/products");
  return { success: true as const };
}

export async function cancelReturn(returnId: string) {
  const { supabase, organizationId, branchId, isBranchScoped, permissions } =
    await requireAppContext();
  const permError = checkPermission(permissions, "returns.update");
  if (permError) return { error: permError };

  let query = supabase
    .from("returns")
    .update({ status: "cancelled" })
    .eq("organization_id", organizationId)
    .eq("id", returnId);

  if (isBranchScoped && branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { error } = await query;

  if (error) {
    return { error: `Цуцлахад алдаа гарлаа: ${error.message}` };
  }

  revalidatePath("/returns");
  return { success: true as const };
}
