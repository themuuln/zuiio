import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlers, withAuth } from "@/lib/supabase/admin-route";
import { createClient } from "@/lib/supabase/server";

const productsRoute = createRouteHandlers("products", {
  select: "*",
});

export const GET = productsRoute.list();

export const POST = productsRoute.create((body) => {
  const { name, slug, price_mnt } = body;
  if (!name) return { insert: body, validate: "name is required" };
  if (!slug) return { insert: body, validate: "slug is required" };
  if (!price_mnt || typeof price_mnt !== "number" || price_mnt <= 0) {
    return { insert: body, validate: "price_mnt must be a positive number" };
  }
  return {
    name,
    slug,
    price_mnt,
    name_en: body.name_en ?? null,
    description: body.description ?? null,
    images: body.images ?? [],
    category: body.category ?? null,
    variants: body.variants ?? [],
    is_available: body.is_available ?? true,
  };
});

export async function PATCH(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  });
}

export async function DELETE(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  });
}
