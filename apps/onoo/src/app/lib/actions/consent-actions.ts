"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Sign a consent template as the current guardian.
 * Validates guardian authority server-side via cmd_sign_consent RPC.
 */
export async function signConsentAction(
  templateId: string,
  studentId: string,
  signedText?: string,
): Promise<{ record_id: string; status: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("cmd_sign_consent", {
    p_template_id: templateId,
    p_student_id: studentId,
    p_signed_text: signedText ?? null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/guardian/children/${studentId}`);
  return data as unknown as { record_id: string; status: string };
}

/**
 * Withdraw a previously-signed consent record.
 * Validates guardian authority server-side via cmd_withdraw_consent RPC.
 */
export async function withdrawConsentAction(
  recordId: string,
  studentId: string,
): Promise<{ record_id: string; status: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("cmd_withdraw_consent", {
    p_record_id: recordId,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/guardian/children/${studentId}`);
  return data as unknown as { record_id: string; status: string };
}
