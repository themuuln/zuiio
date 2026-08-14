import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";
import type { Database } from "@/lib/supabase/types";
import { normalizePhone } from "@/lib/validation";

export type SupabaseDb = SupabaseClient<Database>;

/**
 * Find an existing contact by name and type, or create a new one.
 *
 * Always normalizes the phone number before insert.
 * Returns `{ id: string }` on success, `{ error: string }` on failure.
 */
export async function findOrCreateContact(
  supabase: SupabaseDb,
  organizationId: string,
  type: "customer" | "supplier",
  name: string,
  phone?: string | null,
): Promise<{ id: string } | { error: string }> {
  const normalizedPhone = phone ? normalizePhone(phone) : null;

  // Check if contact already exists
  const { data: existing, error: existingError } = await supabase
    .from("contacts")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("type", type)
    .eq("name", name)
    .maybeSingle();

  if (existingError) {
    capture(existingError, { context: "contact-utils: findOrCreateContact" });
  }

  if (existing) {
    return { id: existing.id };
  }

  // Create new contact
  const { data: contact, error } = await supabase
    .from("contacts")
    .insert({
      organization_id: organizationId,
      type,
      name,
      phone: normalizedPhone || null,
    })
    .select("id")
    .single();

  if (error) {
    capture(error, { context: "contact-utils: findOrCreateContact" });
    return {
      error: `Харилцагч үүсгэхэд алдаа гарлаа: ${error.message}`,
    };
  }

  return { id: contact.id };
}
