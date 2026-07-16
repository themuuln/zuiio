import { NextResponse } from "next/server";
import { withDbCapture } from "@zuiio/capture";
import { requireAppContext } from "@/lib/erp";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const { supabase, organizationId } = await requireAppContext();
    const db = supabase as unknown as SupabaseClient;
    const { data: channels } = await withDbCapture("notification_channels_list", db.from("notification_channels").select("*").eq("organization_id", organizationId).order("type"));
    const { data: templates } = await withDbCapture("message_templates_list", db.from("message_templates").select("*").eq("organization_id", organizationId).order("name"));
    return NextResponse.json({ channels: channels ?? [], templates: templates ?? [] });
  } catch {
    return NextResponse.json({ error: "Мэдэгдлийн тохиргоо авахад алдаа гарлаа." }, { status: 500 });
  }
}
