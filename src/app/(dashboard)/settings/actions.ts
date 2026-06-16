"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/erp";

export async function updateOrganization(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { supabase, organizationId } = await requireAppContext();

  const name = formData.get("name");
  const slug = formData.get("slug");

  if (typeof name !== "string" || !name.trim()) {
    return { error: "Байгууллагын нэр шаардлагатай." };
  }

  if (typeof slug !== "string" || !slug.trim()) {
    return { error: "Байгууллагын холбоос шаардлагатай." };
  }

  if (slug.length < 3) {
    return { error: "Холбоос хамгийн багадаа 3 тэмдэгттэй байна." };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: "Холбоос зөвхөн англи үсэг, тоо, зураас агуулсан байна." };
  }

  const { error } = await supabase
    .from("organizations")
    .update({
      name: name.trim(),
      slug: slug.trim(),
    })
    .eq("id", organizationId);

  if (error) {
    return { error: `Шинэчлэхэд алдаа гарлаа: ${error.message}` };
  }

  revalidatePath("/settings");
  return { success: true as const };
}

export async function importBrandPresets(formData: FormData) {
  const { supabase, organizationId } = await requireAppContext();

  const brandName = formData.get("brand_name")?.toString();
  if (!brandName) return { error: "Брэндийн нэр шаардлагатай." };

  const { data: presets, error: fetchError }: { data: any; error: any } =
    await (supabase as any)
      .from("product_presets")
      .select("*")
      .eq("brand_name", brandName)
      .order("sort_order");

  if (fetchError) return { error: fetchError.message };
  if (!presets?.length) return { error: "Загварууд олдсонгүй." };

  // Upsert brand in user's org
  const { data: existingBrand } = await supabase
    .from("brands")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("name", brandName)
    .maybeSingle();

  let brandId: string;
  if (existingBrand) {
    brandId = existingBrand.id;
  } else {
    const { data: newBrand, error: brandErr } = await supabase
      .from("brands")
      .insert({
        name: brandName,
        logo_url: presets[0].brand_logo_url,
        organization_id: organizationId,
      })
      .select("id")
      .single();
    if (brandErr) return { error: brandErr.message };
    brandId = newBrand.id;
  }

  // Find or create categories, then insert products
  const categoryCache: Record<string, string | null> = {};
  let importedCount = 0;

  for (const preset of presets) {
    let categoryId: string | null = null;

    if (preset.category_name) {
      if (preset.category_name in categoryCache) {
        categoryId = categoryCache[preset.category_name];
      } else {
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .eq("organization_id", organizationId)
          .eq("name", preset.category_name)
          .maybeSingle();

        if (cat) {
          categoryId = cat.id;
        } else {
          const { data: newCat, error: catErr } = await supabase
            .from("categories")
            .insert({
              name: preset.category_name,
              organization_id: organizationId,
            })
            .select("id")
            .single();
          if (!catErr && newCat) categoryId = newCat.id;
        }
        categoryCache[preset.category_name] = categoryId;
      }
    }

    const { error: prodErr } = await supabase.from("products").insert({
      organization_id: organizationId,
      name: preset.product_name,
      sku: preset.product_sku || null,
      unit: preset.unit,
      brand_id: brandId,
      category_id: categoryId,
      cost_price: preset.cost_price,
      sale_price: preset.sale_price,
      min_stock: preset.min_stock,
      current_stock: 0,
    });

    if (!prodErr) importedCount++;
  }

  revalidatePath("/products");
  revalidatePath("/settings");
  return { success: true as const, count: importedCount };
}

export async function updateProfile(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { supabase, userId } = await requireAppContext();

  const fullName = formData.get("full_name");

  if (typeof fullName !== "string" || !fullName.trim()) {
    return { error: "Нэр шаардлагатай." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName.trim() })
    .eq("id", userId);

  if (error) {
    return { error: `Профайл шинэчлэхэд алдаа гарлаа: ${error.message}` };
  }

  revalidatePath("/settings");
  return { success: true as const };
}
