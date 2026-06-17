"use server";

import { revalidatePath } from "next/cache";
import { validateContactInput } from "@/lib/domain-rules";
import { checkPermission, requireAppContext } from "@/lib/erp";
import { getString } from "@/lib/validation";

export async function createContact(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { supabase, organizationId, permissions } = await requireAppContext();
  const permError = checkPermission(permissions, "contacts.create");
  if (permError) return { error: permError };

  const name = getString(formData, "name");
  const phone = getString(formData, "phone");
  const email = getString(formData, "email");
  const address = getString(formData, "address");
  const type = getString(formData, "type") || "customer";

  const validationError = validateContactInput({ name });
  if (validationError) {
    return { error: validationError };
  }

  // Check for duplicate name in the same org
  const { data: existing } = await supabase
    .from("contacts")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("name", name)
    .eq("type", type)
    .maybeSingle();

  if (existing) {
    return {
      error: `Ийм нэртэй ${type === "customer" ? "харилцагч" : "нийлүүлэгч"} аль хэдийн бүртгэгдсэн байна.`,
    };
  }

  const { error } = await supabase.from("contacts").insert({
    organization_id: organizationId,
    name,
    phone: phone || null,
    email: email || null,
    address: address || null,
    type,
  });

  if (error) {
    return {
      error: error.message ?? "Холбоо барих мэдээлэл хадгалахад алдаа гарлаа.",
    };
  }

  revalidatePath("/customers");
  revalidatePath("/suppliers");
  revalidatePath("/sales/new");
  return { success: true as const };
}

export async function updateContact(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { supabase, organizationId, permissions } = await requireAppContext();
  const permError = checkPermission(permissions, "contacts.update");
  if (permError) return { error: permError };

  const id = getString(formData, "id");
  const name = getString(formData, "name");
  const phone = getString(formData, "phone");
  const email = getString(formData, "email");
  const address = getString(formData, "address");

  if (!id) {
    return { error: "Холбоо барих мэдээллийн ID олдсонгүй." };
  }

  const validationError = validateContactInput({ name });
  if (validationError) {
    return { error: validationError };
  }

  // Get current contact to check type and verify ownership
  const { data: current } = await supabase
    .from("contacts")
    .select("type")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!current) {
    return { error: "Холбоо барих мэдээлэл олдсонгүй." };
  }

  // Check for duplicate name (exclude current contact)
  const { data: existing } = await supabase
    .from("contacts")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("name", name)
    .eq("type", current.type)
    .neq("id", id)
    .maybeSingle();

  if (existing) {
    return {
      error: `Ийм нэртэй ${current.type === "customer" ? "харилцагч" : "нийлүүлэгч"} аль хэдийн бүртгэгдсэн байна.`,
    };
  }

  const { error } = await supabase
    .from("contacts")
    .update({
      name,
      phone: phone || null,
      email: email || null,
      address: address || null,
    })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    return {
      error: error.message ?? "Холбоо барих мэдээлэл хадгалахад алдаа гарлаа.",
    };
  }

  revalidatePath("/customers");
  revalidatePath("/suppliers");
  revalidatePath("/sales/new");
  return { success: true as const };
}
