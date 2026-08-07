/**
 * GET /admin/api/news — list all news (drafts + published) with creator info
 * POST /admin/api/news — create news (cmd_create_news, org admin required)
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/supabase/admin-route";

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().max(500).optional(),
  body: z.string().trim().min(1),
  cover_image_url: z.string().trim().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published"]).optional(),
  published: z.boolean().optional(),
});

/** Map a DB row to the admin row shape (adds derived `status`). */
function toNewsRow(row: Record<string, unknown>): Record<string, unknown> {
  return { ...row, status: row.published ? "published" : "draft" };
}

export async function GET() {
  return withAuth(async (supabase) => {
    const { data, error } = await supabase
      .from("news")
      .select("*, users!created_by(email)")
      .order("created_at", { ascending: false });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(
      (data ?? []).map((row) => toNewsRow(row as Record<string, unknown>)),
    ) as never;
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
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

    const { data, error } = await supabase.rpc("cmd_create_news", {
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
