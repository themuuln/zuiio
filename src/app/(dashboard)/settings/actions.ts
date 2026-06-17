"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
