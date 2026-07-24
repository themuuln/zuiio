"use server";
import { capture, withDbCapture } from "@zuiio/capture";

import { requireWriteAction } from "@/lib/action-utils";
import { validateContactInput } from "@/lib/domain-rules";
import { revalidateEntities, revalidateEntityTag } from "@/lib/revalidate";
import { getString } from "@/lib/validation";

export async function createContact(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("contacts.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

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
  const { data: existing, error: queryError } = await withDbCapture(
    "contacts: check duplicate",
    supabase
      .from("contacts")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("name", name)
      .eq("type", type)
      .maybeSingle(),
  );
  if (queryError) {
    capture(queryError, {
      context: "customers: createContact check duplicate",
    });
  }

  if (existing) {
    return {
      error: `Ийм нэртэй ${type === "customer" ? "харилцагч" : "нийлүүлэгч"} аль хэдийн бүртгэгдсэн байна.`,
    };
  }

  const { error } = await withDbCapture(
    "contacts: create",
    supabase.from("contacts").insert({
      organization_id: organizationId,
      name,
      phone: phone || null,
      email: email || null,
      address: address || null,
      type,
    }),
  );

  if (error) {
    capture(error, { context: "customers: createContact" });
    return {
      error: error.message ?? "Холбоо барих мэдээлэл хадгалахад алдаа гарлаа.",
    };
  }

  revalidateEntities(["customers"]);
  revalidateEntityTag("customers", organizationId);
  return { success: true as const, error: undefined };
}

export async function updateContact(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("contacts.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

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
  const { data: current, error: currentError } = await withDbCapture(
    "contacts: get current for update",
    supabase
      .from("contacts")
      .select("type")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle(),
  );
  if (currentError) {
    capture(currentError, { context: "customers: updateContact get current" });
  }

  if (!current) {
    return { error: "Холбоо барих мэдээлэл олдсонгүй." };
  }

  // Check for duplicate name (exclude current contact)
  const { data: existing, error: dupError } = await withDbCapture(
    "contacts: check duplicate for update",
    supabase
      .from("contacts")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("name", name)
      .eq("type", current.type)
      .neq("id", id)
      .maybeSingle(),
  );
  if (dupError) {
    capture(dupError, { context: "customers: updateContact check duplicate" });
  }

  if (existing) {
    return {
      error: `Ийм нэртэй ${current.type === "customer" ? "харилцагч" : "нийлүүлэгч"} аль хэдийн бүртгэгдсэн байна.`,
    };
  }

  const { error } = await withDbCapture(
    "contacts: update",
    supabase
      .from("contacts")
      .update({
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
      })
      .eq("id", id)
      .eq("organization_id", organizationId),
  );

  if (error) {
    capture(error, { context: "customers: updateContact" });
    return {
      error: error.message ?? "Холбоо барих мэдээлэл хадгалахад алдаа гарлаа.",
    };
  }

  revalidateEntities(["customers"]);
  revalidateEntityTag("customers", organizationId);
  return { success: true as const, error: undefined };
}
