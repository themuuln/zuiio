"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server-service";

export async function completeOnboarding(
  enabledFeatures: string[],
  brandNamesToImport?: string[],
  hasSuppliers?: boolean,
  hasInventory?: boolean,
  hasCustomerCredit?: boolean,
  hasMultiBranch?: boolean,
  hasVariants?: boolean,
  hasBrands?: boolean,
  hasCategories?: boolean,
  hasEmailReports?: boolean,
  hasAuditLog?: boolean,
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Нэвтрэх шаардлагатай." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return { error: "Байгууллага олдсонгүй." };
  }

  // Update organization with enabled features, supplier setting, and mark onboarding complete
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await supabase
    .from("organizations")
    .update({
      enabled_features: enabledFeatures,
      has_suppliers: hasSuppliers ?? true,
      has_inventory: hasInventory ?? true,
      has_customer_credit: hasCustomerCredit ?? true,
      has_multi_branch: hasMultiBranch ?? false,
      has_variants: hasVariants ?? true,
      has_brands: hasBrands ?? true,
      has_categories: hasCategories ?? true,
      has_email_reports: hasEmailReports ?? false,
      has_audit_log: hasAuditLog ?? true,
      onboarding_completed: true,
    } as any)
    .eq("id", profile.organization_id);

  if (updateError) {
    return { error: `Хадгалахад алдаа гарлаа: ${updateError.message}` };
  }

  // Import selected brand presets using service client (bypasses RLS)
  if (brandNamesToImport && brandNamesToImport.length > 0) {
    const serviceSupabase = createServiceClient();

    const { data: presets } = await serviceSupabase
      .from("product_presets")
      .select(
        "id, brand_name, brand_logo_url, product_name, product_sku, category_name, unit, cost_price, sale_price, min_stock, image_url, image_urls",
      )
      .in("brand_name", brandNamesToImport)
      .order("sort_order");

    if (presets && presets.length > 0) {
      const brandCache = new Map<string, string | null>();
      const categoryCache = new Map<string, string | null>();

      for (const preset of presets) {
        // Upsert brand
        let brandId = brandCache.get(preset.brand_name) ?? null;
        if (!brandId) {
          const { data: existingBrand } = await serviceSupabase
            .from("brands")
            .select("id")
            .eq("organization_id", profile.organization_id)
            .eq("name", preset.brand_name)
            .maybeSingle();

          if (existingBrand) {
            brandId = existingBrand.id;
          } else {
            const { data: newBrand } = await serviceSupabase
              .from("brands")
              .insert({
                name: preset.brand_name,
                logo_url: preset.brand_logo_url,
                organization_id: profile.organization_id,
              })
              .select("id")
              .single();
            if (newBrand) brandId = newBrand.id;
          }
          brandCache.set(preset.brand_name, brandId);
        }

        // Find or create category
        let categoryId = preset.category_name
          ? (categoryCache.get(preset.category_name) ?? null)
          : null;
        if (preset.category_name && !categoryId) {
          const { data: cat } = await serviceSupabase
            .from("categories")
            .select("id")
            .eq("organization_id", profile.organization_id)
            .eq("name", preset.category_name)
            .maybeSingle();

          if (cat) {
            categoryId = cat.id;
          } else {
            const { data: newCat } = await serviceSupabase
              .from("categories")
              .insert({
                name: preset.category_name,
                organization_id: profile.organization_id,
              })
              .select("id")
              .single();
            if (newCat) categoryId = newCat.id;
          }
          categoryCache.set(preset.category_name, categoryId);
        }

        // Check SKU duplicate
        if (preset.product_sku) {
          const { data: existing } = await serviceSupabase
            .from("products")
            .select("id")
            .eq("organization_id", profile.organization_id)
            .eq("sku", preset.product_sku)
            .is("deleted_at", null)
            .maybeSingle();

          if (existing) continue;
        }

        await serviceSupabase.from("products").insert({
          organization_id: profile.organization_id,
          name: preset.product_name,
          sku: preset.product_sku || null,
          unit: preset.unit ?? "ш",
          brand_id: brandId,
          category_id: categoryId,
          cost_price: preset.cost_price,
          sale_price: preset.sale_price,
          min_stock: preset.min_stock,
          current_stock: 0,
          image_url: preset.image_url,
          image_urls: preset.image_urls,
        });
      }
    }
  }

  revalidatePath("/");
  redirect("/");
}
