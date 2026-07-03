"use server";

import {
  createContact as baseCreateContact,
  updateContact as baseUpdateContact,
} from "@/app/(dashboard)/customers/actions";

export async function createSupplier(
  prevState: { error?: string } | undefined,
  formData: FormData,
) {
  // Ensure type is always set to supplier
  formData.set("type", "supplier");
  return baseCreateContact(prevState, formData);
}

export async function updateSupplier(
  prevState: { error?: string } | undefined,
  formData: FormData,
) {
  return baseUpdateContact(prevState, formData);
}
