"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ShareLinkState = {
  token?: string;
  error?: string;
};

export async function createShareLink(
  _prevState: ShareLinkState | undefined,
  formData: FormData,
): Promise<ShareLinkState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return { error: "Байгууллага олдсонгүй." };
  }

  const dateFrom = formData.get("date_from") as string;
  const dateTo = formData.get("date_to") as string;

  if (!dateFrom || !dateTo) {
    return { error: "Огнооны хүрээ олдсонгүй." };
  }

  // Generate cryptographically random 32-byte hex token
  const token = randomBytes(32).toString("hex");

  // Upsert: one share link per organization + date range
  const { data: existing } = await supabase
    .from("shared_reports")
    .select("id")
    .eq("organization_id", profile.organization_id)
    .eq("date_from", dateFrom)
    .eq("date_to", dateTo)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await supabase
      .from("shared_reports")
      .update({ token, created_by: user.id })
      .eq("id", existing.id);

    if (updateError) {
      return { error: "Хуваалцах холбоос шинэчлэхэд алдаа гарлаа." };
    }
  } else {
    const { error: insertError } = await supabase
      .from("shared_reports")
      .insert({
        organization_id: profile.organization_id,
        token,
        date_from: dateFrom,
        date_to: dateTo,
        created_by: user.id,
      });

    if (insertError) {
      return { error: "Хуваалцах холбоос үүсгэхэд алдаа гарлаа." };
    }
  }

  return { token };
}

export async function deleteShareLink(shareId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify the share link belongs to the user's organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return { error: "Байгууллага олдсонгүй." };
  }

  const { error } = await supabase
    .from("shared_reports")
    .delete()
    .eq("id", shareId)
    .eq("organization_id", profile.organization_id);

  if (error) {
    console.error("Failed to delete share link:", error);
  }
}
