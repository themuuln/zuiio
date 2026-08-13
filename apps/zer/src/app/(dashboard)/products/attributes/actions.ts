"use server";

import { capture } from "@zuiio/capture";
import { requireActionContext } from "@/lib/action-utils";
import { revalidateEntity, revalidateEntityTag } from "@/lib/revalidate";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type AttributeDefinitionRow = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  value_type: "text" | "number" | "boolean" | "select";
  unit: string | null;
  options: string[] | null;
  is_required: boolean;
  is_filterable: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AttributeCategoryLink = {
  id: string;
  attribute_definition_id: string;
  category_id: string;
  organization_id: string;
};

/* ------------------------------------------------------------------ */
/*  Read                                                               */
/* ------------------------------------------------------------------ */

export async function listAttributeDefinitions(): Promise<{
  definitions: AttributeDefinitionRow[];
  error?: string;
}> {
  const ctx = await requireActionContext("products.read");
  if ("error" in ctx) return { definitions: [], error: ctx.error };
  const { supabase, organizationId } = ctx;

  const { data, error } = await supabase
    .from("product_attribute_definitions")
    .select("*")
    .eq("organization_id", organizationId)
    .order("sort_order")
    .order("name");

  if (error) {
    capture(error, { context: "listAttributeDefinitions" });
    return {
      definitions: [],
      error: "Шинж чанарын жагсаалт авахад алдаа гарлаа.",
    };
  }

  return { definitions: (data ?? []) as AttributeDefinitionRow[] };
}

export async function listAttributeCategoryLinks(
  definitionId: string,
): Promise<{ links: AttributeCategoryLink[]; error?: string }> {
  const ctx = await requireActionContext("products.read");
  if ("error" in ctx) return { links: [], error: ctx.error };
  const { supabase, organizationId } = ctx;

  const { data, error } = await supabase
    .from("product_attribute_categories")
    .select("*")
    .eq("attribute_definition_id", definitionId)
    .eq("organization_id", organizationId);

  if (error) {
    capture(error, { context: "listAttributeCategoryLinks" });
    return { links: [], error: "Ангиллын холболт авахад алдаа гарлаа." };
  }

  return { links: (data ?? []) as AttributeCategoryLink[] };
}

/* ------------------------------------------------------------------ */
/*  Create / Update / Delete                                           */
/* ------------------------------------------------------------------ */

export async function createAttributeDefinition(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireActionContext("products.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const name = formData.get("name")?.toString().trim();
  const valueType = formData.get("value_type")?.toString();
  const unit = formData.get("unit")?.toString().trim() || null;
  const optionsRaw = formData.get("options")?.toString().trim();
  const isRequired = formData.get("is_required") === "true";
  const isFilterable = formData.get("is_filterable") === "true";
  const sortOrder = Number(formData.get("sort_order") ?? 0);

  if (!name) {
    return { error: "Нэр шаардлагатай." };
  }
  if (
    !valueType ||
    !["text", "number", "boolean", "select"].includes(valueType)
  ) {
    return { error: "Төрөл буруу байна." };
  }

  // Slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9а-яёөү\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  let options: string[] | null = null;
  if (valueType === "select" && optionsRaw) {
    options = optionsRaw
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
  }

  const { error } = await supabase
    .from("product_attribute_definitions")
    .insert({
      organization_id: organizationId,
      name,
      slug,
      value_type: valueType,
      unit,
      options,
      is_required: isRequired,
      is_filterable: isFilterable,
      sort_order: sortOrder,
    });

  if (error) {
    capture(error, { context: "createAttributeDefinition" });
    if (error.code === "23505") {
      return { error: `"${name}" нэртэй шинж чанар аль хэдийн байна.` };
    }
    return { error: `Шинж чанар үүсгэхэд алдаа гарлаа: ${error.message}` };
  }

  revalidateEntity("products");
  revalidateEntityTag("products", organizationId);
  return { success: true as const };
}

export async function updateAttributeDefinition(
  id: string,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireActionContext("products.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const name = formData.get("name")?.toString().trim();
  const unit = formData.get("unit")?.toString().trim() || null;
  const optionsRaw = formData.get("options")?.toString().trim();
  const isRequired = formData.get("is_required") === "true";
  const isFilterable = formData.get("is_filterable") === "true";
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const valueType = formData.get("value_type")?.toString();

  if (!name) {
    return { error: "Нэр шаардлагатай." };
  }

  let options: string[] | null = null;
  if (valueType === "select" && optionsRaw) {
    options = optionsRaw
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
  }

  const { error } = await supabase
    .from("product_attribute_definitions")
    .update({
      name,
      unit,
      options,
      is_required: isRequired,
      is_filterable: isFilterable,
      sort_order: sortOrder,
    })
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    capture(error, { context: "updateAttributeDefinition" });
    return { error: `Шинж чанар шинэчлэхэд алдаа гарлаа: ${error.message}` };
  }

  revalidateEntity("products");
  revalidateEntityTag("products", organizationId);
  return { success: true as const };
}

export async function deleteAttributeDefinition(id: string) {
  const ctx = await requireActionContext("products.delete");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const { error } = await supabase
    .from("product_attribute_definitions")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    capture(error, { context: "deleteAttributeDefinition" });
    return { error: `Шинж чанар устгахад алдаа гарлаа: ${error.message}` };
  }

  revalidateEntity("products");
  revalidateEntityTag("products", organizationId);
  return { success: true as const };
}

/* ------------------------------------------------------------------ */
/*  Category linkage                                                   */
/* ------------------------------------------------------------------ */

export async function setAttributeCategories(
  definitionId: string,
  categoryIds: string[],
) {
  const ctx = await requireActionContext("products.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  // Delete existing links
  const { error: delErr } = await supabase
    .from("product_attribute_categories")
    .delete()
    .eq("attribute_definition_id", definitionId)
    .eq("organization_id", organizationId);

  if (delErr) {
    capture(delErr, { context: "setAttributeCategories: delete" });
    return { error: "Ангиллын холболт шинэчлэхэд алдаа гарлаа." };
  }

  // Insert new links
  if (categoryIds.length > 0) {
    const links = categoryIds.map((catId) => ({
      attribute_definition_id: definitionId,
      category_id: catId,
      organization_id: organizationId,
    }));

    const { error: insErr } = await supabase
      .from("product_attribute_categories")
      .insert(links);

    if (insErr) {
      capture(insErr, { context: "setAttributeCategories: insert" });
      return { error: "Ангиллын холболт үүсгэхэд алдаа гарлаа." };
    }
  }

  revalidateEntity("products");
  revalidateEntityTag("products", organizationId);
  return { success: true as const };
}
/**
 * Creates the standard Buddhist-product attribute definitions for the
 * current organization. Idempotent — skips definitions that already exist.
 */
export async function seedBuddhistAttributeTemplate() {
  const ctx = await requireActionContext("products.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const definitions = [
    // --- Material & Origin ---
    {
      name: "Материал",
      slug: "material",
      value_type: "select" as const,
      options: [
        "Зэс",
        "Мөнгө",
        "Алт",
        "Туршал",
        "Шавар",
        "Чулуу",
        "Мод",
        "Лянхуа",
        "Давуу",
        "Торго",
        "Бусад",
      ],
      is_required: true,
      is_filterable: true,
      sort_order: 0,
    },
    {
      name: "Улсын гарал",
      slug: "origin",
      value_type: "select" as const,
      options: ["Монгол", "Энэтхэг", "Непал", "Төвд", "БНХАУ", "Бусад"],
      is_required: false,
      is_filterable: true,
      sort_order: 1,
    },
    {
      name: "Үйлдвэрлэгч",
      slug: "manufacturer",
      value_type: "text" as const,
      options: null,
      is_required: false,
      is_filterable: false,
      sort_order: 2,
    },
    {
      name: "Нөхцөл",
      slug: "condition",
      value_type: "select" as const,
      options: ["Шинэ", "Ашигласан", "Эртний"],
      is_required: false,
      is_filterable: true,
      sort_order: 3,
    },

    // --- Spiritual ---
    {
      name: "Бясалгасан эсэх",
      slug: "is_consecrated",
      value_type: "boolean" as const,
      options: null,
      is_required: false,
      is_filterable: true,
      sort_order: 10,
    },
    {
      name: "Бясалгасан хүн",
      slug: "consecrated_by",
      value_type: "text" as const,
      options: null,
      is_required: false,
      is_filterable: false,
      sort_order: 11,
    },
    {
      name: "Урсгал",
      slug: "lineage",
      value_type: "select" as const,
      options: [
        "Гэлүк (Шар)",
        "Кагью",
        "Сажав",
        "Гаадамба",
        "Нинмаава",
        "Бусад",
      ],
      is_required: false,
      is_filterable: true,
      sort_order: 12,
    },
    {
      name: "Дүр төрх",
      slug: "deity_form",
      value_type: "text" as const,
      options: null,
      is_required: false,
      is_filterable: false,
      sort_order: 13,
    },
    {
      name: "Мантра",
      slug: "mantra",
      value_type: "text" as const,
      options: null,
      is_required: false,
      is_filterable: false,
      sort_order: 14,
    },

    // --- Dimensions ---
    {
      name: "Жин (грамм)",
      slug: "weight_g",
      value_type: "number" as const,
      unit: "г",
      options: null,
      is_required: false,
      is_filterable: true,
      sort_order: 20,
    },
    {
      name: "Өндөр (см)",
      slug: "height_cm",
      value_type: "number" as const,
      unit: "см",
      options: null,
      is_required: false,
      is_filterable: false,
      sort_order: 21,
    },
    {
      name: "Өргөн (см)",
      slug: "width_cm",
      value_type: "number" as const,
      unit: "см",
      options: null,
      is_required: false,
      is_filterable: false,
      sort_order: 22,
    },
    {
      name: "Диаметр (см)",
      slug: "diameter_cm",
      value_type: "number" as const,
      unit: "см",
      options: null,
      is_required: false,
      is_filterable: true,
      sort_order: 23,
    },
    {
      name: "Тоо ширхэг",
      slug: "count",
      value_type: "number" as const,
      unit: "ширхэг",
      options: null,
      is_required: false,
      is_filterable: false,
      sort_order: 24,
    },

    // --- Category-specific ---
    {
      name: "Дуусгах арга",
      slug: "finish",
      value_type: "select" as const,
      options: ["Алтан бүрмэл", "Зурган", "Сийлбэр", "Цутгамал", "Бусад"],
      is_required: false,
      is_filterable: true,
      sort_order: 30,
    },
    {
      name: "Хэмжээ",
      slug: "size_category",
      value_type: "select" as const,
      options: ["Жижиг", "Дунд", "Том"],
      is_required: false,
      is_filterable: true,
      sort_order: 31,
    },
    {
      name: "Нэршил",
      slug: "inscription",
      value_type: "text" as const,
      options: null,
      is_required: false,
      is_filterable: false,
      sort_order: 32,
    },
    {
      name: "Багц",
      slug: "collection",
      value_type: "text" as const,
      options: null,
      is_required: false,
      is_filterable: false,
      sort_order: 33,
    },
  ];

  let created = 0;
  for (const def of definitions) {
    const { error } = await supabase
      .from("product_attribute_definitions")
      .upsert(
        {
          organization_id: organizationId,
          name: def.name,
          slug: def.slug,
          value_type: def.value_type,
          unit: def.unit ?? null,
          options: def.options,
          is_required: def.is_required,
          is_filterable: def.is_filterable,
          sort_order: def.sort_order,
        },
        { onConflict: "organization_id,slug", ignoreDuplicates: true },
      );
    if (error) {
      capture(error, { context: "seedBuddhistAttributeTemplate: upsert" });
    } else {
      created++;
    }
  }
  revalidateEntity("products");
  revalidateEntityTag("products", organizationId);
  return { success: true as const, created };
}
/**
 * Check if Buddhist presets are enabled for the current org.
 */
export async function checkBuddhistPresetsEnabled(): Promise<{
  enabled: boolean;
}> {
  const ctx = await requireActionContext("products.read");
  if ("error" in ctx) return { enabled: false };
  const { supabase, organizationId } = ctx;

  const { data } = await supabase
    .from("organizations")
    .select("has_buddhist_presets")
    .eq("id", organizationId)
    .maybeSingle();

  return {
    enabled:
      (data as { has_buddhist_presets: boolean | null } | null)
        ?.has_buddhist_presets === true,
  };
}
/**
 * Creates standard Buddhist-product categories for the current organization.
 * Idempotent — skips categories that already exist (by name).
 */
export async function seedBuddhistCategories() {
  const ctx = await requireActionContext("products.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const categories = [
    { name: "Бурхан, Хийд", slug: "statues-deities" },
    { name: "Зурга", slug: "thangkas" },
    { name: "Тахилын хэрэгсэл", slug: "ritual-items" },
    { name: "Ном, Судар", slug: "scriptures-books" },
    { name: "Эрдэнэ", slug: "jewelry-mala" },
    { name: "Хата", slug: "ceremonial-scarves" },
    { name: "Шашин хувцас", slug: "religious-clothing" },
    { name: "Incense & Burners", slug: "incense-burners" },
    { name: "Дуулал", slug: "singing-bowls" },
    { name: "Хийморь", slug: "wind-horse" },
  ];

  let created = 0;
  for (const cat of categories) {
    const { error } = await supabase
      .from("categories")
      .upsert(
        { organization_id: organizationId, name: cat.name, slug: cat.slug },
        { onConflict: "organization_id,slug", ignoreDuplicates: true },
      );
    if (error) {
      capture(error, { context: "seedBuddhistCategories: upsert" });
    } else {
      created++;
    }
  }
  revalidateEntity("products");
  revalidateEntityTag("products", organizationId);
  return { success: true as const, created };
}
/* ------------------------------------------------------------------ */
/*  Religious goods shop presets                                       */
/* ------------------------------------------------------------------ */

/**
 * Check if the current org is a religious goods shop.
 */
export async function checkReligiousPresetsEnabled(): Promise<{
  enabled: boolean;
}> {
  const ctx = await requireActionContext("products.read");
  if ("error" in ctx) return { enabled: false };
  const { supabase, organizationId } = ctx;

  const { data } = await supabase
    .from("organizations")
    .select("company_type")
    .eq("id", organizationId)
    .maybeSingle();

  return {
    enabled:
      (data as { company_type: string | null } | null)?.company_type ===
      "religious",
  };
}

/**
 * Creates standard categories for a religious goods shop.
 * Idempotent — skips categories that already exist (by slug).
 */
export async function seedReligiousCategories() {
  const ctx = await requireActionContext("products.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const categories = [
    { name: "Бурхан, Хийд", slug: "statues-deities" },
    { name: "Зурга", slug: "thangkas" },
    { name: "Тахилын хэрэгсэл", slug: "ritual-items" },
    { name: "Ном, Судар", slug: "scriptures-books" },
    { name: "Эрдэнэ", slug: "jewelry-mala" },
    { name: "Хадаг", slug: "ceremonial-scarves" },
    { name: "Шашин хувцас", slug: "religious-clothing" },
    { name: "Утлага, хонх", slug: "incense-bells" },
    { name: "Дуут аяга", slug: "singing-bowls" },
    { name: "Хийморь", slug: "wind-horse" },
  ];

  let created = 0;
  for (const cat of categories) {
    const { error } = await supabase
      .from("categories")
      .upsert(
        { organization_id: organizationId, name: cat.name, slug: cat.slug },
        { onConflict: "organization_id,slug", ignoreDuplicates: true },
      );
    if (error) {
      capture(error, { context: "seedReligiousCategories: upsert" });
    } else {
      created++;
    }
  }
  revalidateEntity("products");
  revalidateEntityTag("products", organizationId);
  return { success: true as const, created };
}

/**
 * Creates seed products for a religious goods shop.
 * Looks up categories by name (expects them to be seeded first).
 * Idempotent — skips products that already exist (by SKU).
 */
export async function seedReligiousProducts() {
  const ctx = await requireActionContext("products.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  // Fetch existing categories by name → id
  const { data: catRows } = await supabase
    .from("categories")
    .select("id, name")
    .eq("organization_id", organizationId);

  const catMap = new Map<string, string>(
    (catRows ?? []).map((c) => [c.name, c.id]),
  );

  const products = [
    // --- Бурхан, Хийд (Statues & Deities) ---
    {
      name: "Будда — Жижиг (15см)",
      sku: "REL-BUD-001",
      unit: "ширхэг",
      cost_price: 35_000,
      sale_price: 65_000,
      current_stock: 12,
      min_stock: 3,
      category: "Бурхан, Хийд",
    },
    {
      name: "Будда — Дунд (30см)",
      sku: "REL-BUD-002",
      unit: "ширхэг",
      cost_price: 80_000,
      sale_price: 150_000,
      current_stock: 8,
      min_stock: 2,
      category: "Бурхан, Хийд",
    },
    {
      name: "Бурхан Гүрэн — Мөнгөн (25см)",
      sku: "REL-BUD-003",
      unit: "ширхэг",
      cost_price: 120_000,
      sale_price: 220_000,
      current_stock: 5,
      min_stock: 1,
      category: "Бурхан, Хийд",
    },

    // --- Эрдэнэ (Mala / Prayer Beads) ---
    {
      name: "Эрхи — Лянхуа (108 ширхэг)",
      sku: "REL-ERH-001",
      unit: "ширхэг",
      cost_price: 15_000,
      sale_price: 35_000,
      current_stock: 25,
      min_stock: 5,
      category: "Эрдэнэ",
    },
    {
      name: "Эрхи — Модон (108 ширхэг)",
      sku: "REL-ERH-002",
      unit: "ширхэг",
      cost_price: 8_000,
      sale_price: 20_000,
      current_stock: 30,
      min_stock: 5,
      category: "Эрдэнэ",
    },

    // --- Тахилын хэрэгсэл (Ritual Items) ---
    {
      name: "Тахилын аяга — Зэс (7 ширхэг)",
      sku: "REL-TAH-001",
      unit: "кг",
      cost_price: 45_000,
      sale_price: 85_000,
      current_stock: 10,
      min_stock: 2,
      category: "Тахилын хэрэгсэл",
    },
    {
      name: "Лхаа — Бурхан бүхий тахилын таваг",
      sku: "REL-TAH-002",
      unit: "ширхэг",
      cost_price: 25_000,
      sale_price: 55_000,
      current_stock: 15,
      min_stock: 3,
      category: "Тахилын хэрэгсэл",
    },

    // --- Ном, Судар (Scriptures & Books) ---
    {
      name: "Ганжуур — Монгол орчуулгатай",
      sku: "REL-NOM-001",
      unit: "ширхэг",
      cost_price: 30_000,
      sale_price: 55_000,
      current_stock: 20,
      min_stock: 5,
      category: "Ном, Судар",
    },
    {
      name: "Хүдэр — Зүүд нойрны ном",
      sku: "REL-NOM-002",
      unit: "ширхэг",
      cost_price: 12_000,
      sale_price: 25_000,
      current_stock: 18,
      min_stock: 5,
      category: "Ном, Судар",
    },

    // --- Хадаг (Ceremonial Scarves) ---
    {
      name: "Хадаг — Цагаан (5м)",
      sku: "REL-HAT-001",
      unit: "ширхэг",
      cost_price: 5_000,
      sale_price: 12_000,
      current_stock: 50,
      min_stock: 10,
      category: "Хадаг",
    },
    {
      name: "Хадаг — Шар (5м)",
      sku: "REL-HAT-002",
      unit: "ширхэг",
      cost_price: 6_000,
      sale_price: 15_000,
      current_stock: 40,
      min_stock: 10,
      category: "Хадаг",
    },

    // --- Утлага, хонх (Incense & Bells) ---
    {
      name: "Утлага — Сандальны мод",
      sku: "REL-INC-001",
      unit: "кг",
      cost_price: 18_000,
      sale_price: 38_000,
      current_stock: 20,
      min_stock: 5,
      category: "Утлага, хонх",
    },
    {
      name: "Хонх — Зэсэн (Гүйлэн)",
      sku: "REL-INC-002",
      unit: "ширхэг",
      cost_price: 22_000,
      sale_price: 45_000,
      current_stock: 14,
      min_stock: 3,
      category: "Утлага, хонх",
    },

    // --- Дуут аяга (Singing Bowls) ---
    {
      name: "Дуут аяга — Дунд (18см)",
      sku: "REL-DUU-001",
      unit: "ширхэг",
      cost_price: 90_000,
      sale_price: 180_000,
      current_stock: 6,
      min_stock: 2,
      category: "Дуут аяга",
    },

    // --- Хийморь (Wind Horse Flags) ---
    {
      name: "Хийморь — 5 ширхэгийн багц",
      sku: "REL-HII-001",
      unit: "кг",
      cost_price: 10_000,
      sale_price: 22_000,
      current_stock: 30,
      min_stock: 8,
      category: "Хийморь",
    },

    // --- Мани хүрд (Prayer Wheels) ---
    {
      name: "Мани хүрд — Гар (10см)",
      sku: "REL-PRW-001",
      unit: "ширхэг",
      cost_price: 35_000,
      sale_price: 65_000,
      current_stock: 10,
      min_stock: 3,
      category: "Тахилын хэрэгсэл",
    },
  ];

  let created = 0;
  for (const p of products) {
    const categoryId = catMap.get(p.category) ?? null;

    // Check if product with this SKU already exists
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("sku", p.sku)
      .maybeSingle();

    if (existing) continue;

    const { error } = await supabase.from("products").insert({
      organization_id: organizationId,
      name: p.name,
      sku: p.sku,
      unit: p.unit,
      cost_price: p.cost_price,
      sale_price: p.sale_price,
      current_stock: p.current_stock,
      min_stock: p.min_stock,
      category_id: categoryId,
    });
    if (error) {
      capture(error, { context: "seedReligiousProducts: insert" });
    } else {
      created++;
    }
  }
  revalidateEntity("products");
  revalidateEntityTag("products", organizationId);
  return { success: true as const, created };
}
