"use server";

import { capture } from "@zuiio/capture";
import { requireActionContext } from "@/lib/action-utils";
import { revalidateEntity } from "@/lib/revalidate";

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
  return { success: true as const, created };
}
