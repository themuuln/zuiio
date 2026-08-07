/**
 * PUT /admin/api/news/[id] — update news (cmd_update_news, org admin required)
 * DELETE /admin/api/news/[id] — remove news (cmd_delete_news, org admin required)
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/supabase/admin-route";

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().max(500).optional(),
  body: z.string().trim().min(1),
  cover_image_url: z.string().trim().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published"]).optional(),
  published: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(async (supabase) => {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 },
      );
    }

    const values = parsed.data;
    const published =
      typeof values.published === "boolean"
        ? values.published
        : values.status === "published";

    const { data, error } = await supabase.rpc("cmd_update_news", {
      p_id: id,
      p_title: values.title,
      p_excerpt: values.excerpt ?? "",
      p_body: values.body,
      p_cover_image_url: values.cover_image_url ?? "",
      p_published: published,
    });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(
      toNewsRow((data as Record<string, unknown>) ?? {}),
    ) as never;
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(async (supabase) => {
    const { id } = await params;

    const { error } = await supabase.rpc("cmd_delete_news", { p_id: id });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true }) as never;
  });
}

/** Map a DB row to the admin row shape (adds derived `status`). */
function toNewsRow(row: Record<string, unknown>): Record<string, unknown> {
  return { ...row, status: row.published ? "published" : "draft" };
}
