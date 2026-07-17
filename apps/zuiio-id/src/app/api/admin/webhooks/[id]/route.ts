import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

/**
 * DELETE /api/admin/webhooks/:id
 * Delete a webhook subscription.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай." }, { status: 401 });
  }

  // Check admin role
  const admin = await createAdminClient();
  const { data: membership } = await admin
    .from("org_memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("roles.name", "admin")
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Зөвшөөрөлгүй." }, { status: 403 });
  }

  const { id } = await params;

  const { error } = await admin
    .from("webhook_subscriptions")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
