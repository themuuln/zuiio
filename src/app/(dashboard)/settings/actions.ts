"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/erp";
import { createServiceClient } from "@/lib/supabase/server-service";

export async function updateOrganization(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { supabase, organizationId } = await requireAppContext();

  const name = formData.get("name");
  const slug = formData.get("slug");
  const companyType = formData.get("company_type");

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
      ...(typeof companyType === "string" && companyType.trim()
        ? { company_type: companyType.trim() }
        : {}),
    })
    .eq("id", organizationId);

  if (error) {
    return { error: `Шинэчлэхэд алдаа гарлаа: ${error.message}` };
  }

  revalidatePath("/settings");
  return { success: true as const };
}

export async function toggleBrandPreset(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { supabase, organizationId } = await requireAppContext();

  const brandName = formData.get("brand_name")?.toString();
  const enabled = formData.get("enabled") === "true";

  if (!brandName) return { error: "Брэндийн нэр шаардлагатай." };

  // Get current brand_config
  const { data: org } = await supabase
    .from("organizations")
    .select("brand_config")
    .eq("id", organizationId)
    .single();

  const brandConfig = (org?.brand_config ?? {}) as Record<string, unknown>;
  const disabledBrandNames = new Set<string>(
    Array.isArray(brandConfig.disabled_brand_names)
      ? (brandConfig.disabled_brand_names as string[])
      : [],
  );

  if (enabled) {
    disabledBrandNames.delete(brandName);
  } else {
    disabledBrandNames.add(brandName);
  }

  const { error } = await supabase
    .from("organizations")
    .update({
      brand_config: {
        ...brandConfig,
        disabled_brand_names: Array.from(disabledBrandNames),
      },
    })
    .eq("id", organizationId);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: true as const };
}

// High-quality product images sourced from official manufacturer websites.
// Used when importing presets to give products real images.
const PRESET_IMAGE_MAP: Record<string, string> = {
  // ── Real Pharm ──
  "RP-MON-2270":
    "https://realpharm.eu/hpeciai/6dcaa99e728653d397a73530e7086548/eng_pl_REAL-WHEY-100-2KG-1284_1.jpg",
  "RP-CM-500":
    "https://realpharm.eu/hpeciai/eecec708ff50a25f7ba0722e08f1a3cc/eng_pl_Real-Pharm-Kreatyna-Creatine-500g-1022_3.png",
  "RP-AAL-400":
    "https://realpharm.eu/hpeciai/2b58caf2639603bf3fbab6077e5d487b/eng_pl_ProActive-Aminokwasy-BCAA-400g-GRAPE-2639_7.png",
  "RP-OM3-90":
    "https://realpharm.eu/hpeciai/b2c5738f29afd5986deef127210876bd/eng_pm_Real-Pharm-Omega-3-60-caps-2336_1.png",
  // FIXME: RP-FW-600 and RP-FIN-500 need correct image URLs.
  // ── HiTec Nutrition ──
  "HTN-HTP-2250":
    "https://hitec.pl/hpeciai/5230f82c115505af7b67a0e153fa90c4/pol_pm_WPC-80-2000g-1037_8.jpg",
  "HTN-WMG-6000":
    "https://hitec.pl/hpeciai/8043008f7df03720559e419c57313dc6/pol_pm_100-Whey-Mass-3000g-944_1.jpg",
  "HTN-CR-500":
    "https://hitec.pl/hpeciai/fb392bcfa52f943d4d7485444389d321/pol_pm_Creatine-Powder-500g-39_1.jpg",
  "HTN-BCAA-500":
    "https://hitec.pl/hpeciai/7e51c58890d0f04b816fa467fa877d13/pol_pl_BCAA-Powder-500g-26_1.jpg",
  "HTN-P80-2000":
    "https://hitec.pl/hpeciai/5230f82c115505af7b67a0e153fa90c4/pol_pm_WPC-80-2000g-1037_8.jpg",
  "HTN-WP-1800":
    "https://hitec.pl/hpeciai/5230f82c115505af7b67a0e153fa90c4/pol_pm_WPC-80-2000g-1037_8.jpg",
};

export async function importBrandPresets(formData: FormData) {
  const { supabase, organizationId } = await requireAppContext();
  const serviceSupabase = createServiceClient();

  const brandName = formData.get("brand_name")?.toString();
  if (!brandName) return { error: "Брэндийн нэр шаардлагатай." };

  const { data: presets, error: fetchError } = await serviceSupabase
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

    const imageUrl =
      (preset.product_sku ? PRESET_IMAGE_MAP[preset.product_sku] : null) ??
      null;

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
      image_url: imageUrl,
      image_urls: imageUrl ? [imageUrl] : [],
    });

    if (!prodErr) importedCount++;
  }

  revalidatePath("/products");
  revalidatePath("/settings");
  return { success: true as const, count: importedCount };
}

export async function importProductPreset(formData: FormData) {
  const { supabase, organizationId } = await requireAppContext();
  const serviceSupabase = createServiceClient();

  const presetId = formData.get("preset_id")?.toString();
  if (!presetId) return { error: "Загварын ID шаардлагатай." };

  const { data: preset, error: fetchError } = await serviceSupabase
    .from("product_presets")
    .select("*")
    .eq("id", presetId)
    .single();

  if (fetchError || !preset) return { error: "Загвар олдсонгүй." };

  // Check if product with same SKU already exists in this org
  if (preset.product_sku) {
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("sku", preset.product_sku)
      .is("deleted_at", null)
      .maybeSingle();

    if (existing)
      return {
        error: `"${preset.product_sku}" SKU-тай бүтээгдэхүүн аль хэдийн бүртгэгдсэн байна.`,
      };
  }

  // Upsert brand in user's org
  const { data: existingBrand } = await supabase
    .from("brands")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("name", preset.brand_name)
    .maybeSingle();

  let brandId: string | null = null;
  if (existingBrand) {
    brandId = existingBrand.id;
  } else {
    const { data: newBrand, error: brandErr } = await supabase
      .from("brands")
      .insert({
        name: preset.brand_name,
        logo_url: preset.brand_logo_url,
        organization_id: organizationId,
      })
      .select("id")
      .single();
    if (!brandErr && newBrand) brandId = newBrand.id;
  }

  // Find or create category
  let categoryId: string | null = null;
  if (preset.category_name) {
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
  }

  const imageUrl =
    (preset.product_sku ? PRESET_IMAGE_MAP[preset.product_sku] : null) ??
    preset.image_url ??
    null;

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
    image_url: imageUrl,
    image_urls: imageUrl ? [imageUrl] : [],
  });

  if (prodErr) return { error: prodErr.message };

  revalidatePath("/products");
  revalidatePath("/settings");
  return { success: true as const, name: preset.product_name };
}

export async function importProductPresetsByIds(presetIds: string[]) {
  const { supabase, organizationId } = await requireAppContext();
  const serviceSupabase = createServiceClient();

  if (!presetIds.length) return { error: "Бүтээгдэхүүн сонгоогүй байна." };

  const { data: presets, error: fetchError } = await serviceSupabase
    .from("product_presets")
    .select("*")
    .in("id", presetIds);

  if (fetchError || !presets?.length) return { error: "Загварууд олдсонгүй." };

  // Group by brand — brand/category finding is per brand
  let count = 0;
  const brandCache = new Map<string, string | null>();
  const categoryCache = new Map<string, string | null>();

  for (const preset of presets) {
    // Upsert brand
    let brandId = brandCache.get(preset.brand_name) ?? null;
    if (!brandId) {
      const { data: existingBrand } = await supabase
        .from("brands")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("name", preset.brand_name)
        .maybeSingle();

      if (existingBrand) {
        brandId = existingBrand.id;
      } else {
        const { data: newBrand } = await supabase
          .from("brands")
          .insert({
            name: preset.brand_name,
            logo_url: preset.brand_logo_url,
            organization_id: organizationId,
          })
          .select("id")
          .single();
        brandId = newBrand?.id ?? null;
      }
      brandCache.set(preset.brand_name, brandId);
    }

    // Find or create category
    let categoryId = preset.category_name
      ? (categoryCache.get(preset.category_name) ?? null)
      : null;
    if (preset.category_name && !categoryId) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("name", preset.category_name)
        .maybeSingle();

      if (cat) {
        categoryId = cat.id;
      } else {
        const { data: newCat } = await supabase
          .from("categories")
          .insert({
            name: preset.category_name,
            organization_id: organizationId,
          })
          .select("id")
          .single();
        categoryId = newCat?.id ?? null;
      }
      categoryCache.set(preset.category_name, categoryId);
    }

    // Check SKU duplicate
    if (preset.product_sku) {
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("sku", preset.product_sku)
        .maybeSingle();

      if (existing) continue; // skip duplicates
    }

    const imageUrl =
      (preset.product_sku ? PRESET_IMAGE_MAP[preset.product_sku] : null) ??
      preset.image_url ??
      null;

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
      image_url: imageUrl,
      image_urls: imageUrl ? [imageUrl] : [],
    });

    if (!prodErr) count++;
  }

  revalidatePath("/products");
  revalidatePath("/settings");
  return { success: true as const, count };
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

// ─── SMTP Config ──────────────────────────────────────────────────────

export async function saveSmtpConfig(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { supabase } = await requireAppContext();

  const host = formData.get("host")?.toString();
  const portStr = formData.get("port")?.toString();
  const username = formData.get("username")?.toString();
  const password = formData.get("password")?.toString();
  const from_email = formData.get("from_email")?.toString();
  const from_name = formData.get("from_name")?.toString();

  if (!host || !portStr || !username || !password || !from_email) {
    return { error: "Шаардлагатай талбаруудыг бөглөнө үү." };
  }

  const port = Number.parseInt(portStr, 10);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    return { error: "Порт утга буруу байна." };
  }

  // Check if we're updating an existing config or creating a new one
  const configId = formData.get("config_id")?.toString();

  if (configId) {
    const { error } = await supabase
      .from("smtp_configs")
      .update({
        host,
        port,
        username,
        password,
        from_email,
        from_name: from_name || null,
      })
      .eq("id", configId);

    if (error) {
      return { error: `Хадгалахад алдаа гарлаа: ${error.message}` };
    }
  } else {
    const { error } = await supabase.from("smtp_configs").insert({
      host,
      port,
      username,
      password,
      from_email,
      from_name: from_name || null,
      is_active: true,
      priority: 0,
    });

    if (error) {
      return { error: `Хадгалахад алдаа гарлаа: ${error.message}` };
    }
  }

  revalidatePath("/settings");
  return { success: true as const };
}

// ─── Report Email Settings ───────────────────────────────────────────

export async function saveReportEmailSettings(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { supabase, organizationId } = await requireAppContext();

  const enabled = formData.get("enabled") === "true";
  const recipient = formData.get("recipient")?.toString() || null;
  const sendTime = formData.get("send_time")?.toString() || "09:00";

  if (enabled && !recipient) {
    return { error: "Хүлээн авагч и-мэйл хаяг шаардлагатай." };
  }

  const { error } = await supabase
    .from("organizations")
    .update({
      report_email_enabled: enabled,
      report_email_recipient: recipient,
      report_email_time: sendTime,
    })
    .eq("id", organizationId);

  if (error) {
    return { error: `Хадгалахад алдаа гарлаа: ${error.message}` };
  }

  revalidatePath("/settings");
  return { success: true as const };
}

// ─── Leave Organization ──────────────────────────────────────────────

export async function leaveOrganization(formData: FormData) {
  const { supabase, userId } = await requireAppContext();

  const confirmName = formData.get("confirm_name")?.toString().trim();
  if (!confirmName) {
    return { error: "Байгууллагын нэрийг бичнэ үү." };
  }

  // Verify the user knows the org name
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, organizations(name)")
    .eq("id", userId)
    .single();

  if (!profile?.organization_id) {
    return { error: "Та аль хэдийн байгууллагаас гарсан байна." };
  }

  const orgName = (profile as any).organizations?.name;
  if (!orgName) {
    return { error: "Байгууллагын мэдээлэл олдсонгүй." };
  }

  if (confirmName !== orgName) {
    return { error: "Байгууллагын нэр тохирохгүй байна." };
  }

  // Remove user from org by nullifying organization_id and role_id
  const { error } = await supabase
    .from("profiles")
    .update({
      organization_id: null,
      role_id: null,
      role: null,
    })
    .eq("id", userId);

  if (error) {
    return { error: `Алдаа гарлаа: ${error.message}` };
  }

  redirect("/organization/new");
}
