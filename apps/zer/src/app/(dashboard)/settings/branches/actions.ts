"use server";

import { capture } from "@zuiio/capture";

import { requireActionContext } from "@/lib/action-utils";
import { slugify } from "@/lib/format";
import { revalidateEntity } from "@/lib/revalidate";
import { createServiceClient } from "@/lib/supabase/server-service";

/**
 * Default chart of accounts entries for a new branch.
 * Mirrors the SQL seed_default_chart_of_accounts function but includes branch_id.
 */
const DEFAULT_ACCOUNTS: Array<{
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "income" | "expense";
  parent_code: string | null;
}> = [
  { code: "1000", name: "Хөрөнгө", type: "asset", parent_code: null },
  { code: "1100", name: "Бэлэн мөнгө", type: "asset", parent_code: "1000" },
  { code: "1200", name: "Банкны данс", type: "asset", parent_code: "1000" },
  { code: "1300", name: "Авлага", type: "asset", parent_code: "1000" },
  { code: "1400", name: "Бараа материал", type: "asset", parent_code: "1000" },
  { code: "2000", name: "Өр төлбөр", type: "liability", parent_code: null },
  { code: "2100", name: "Өглөг", type: "liability", parent_code: "2000" },
  { code: "2200", name: "Татвар", type: "liability", parent_code: "2000" },
  { code: "3000", name: "Өмч", type: "equity", parent_code: null },
  { code: "3100", name: "Анхны хөрөнгө", type: "equity", parent_code: "3000" },
  {
    code: "3200",
    name: "Хуримтлагдсан ашиг",
    type: "equity",
    parent_code: "3000",
  },
  { code: "4000", name: "Орлого", type: "income", parent_code: null },
  {
    code: "4100",
    name: "Борлуулалтын орлого",
    type: "income",
    parent_code: "4000",
  },
  { code: "4200", name: "Бусад орлого", type: "income", parent_code: "4000" },
  { code: "5000", name: "Зарлага", type: "expense", parent_code: null },
  {
    code: "5100",
    name: "Борлуулсан бүтээгдэхүүний өртөг",
    type: "expense",
    parent_code: "5000",
  },
  {
    code: "5200",
    name: "Үйл ажиллагааны зарлага",
    type: "expense",
    parent_code: "5000",
  },
  {
    code: "5300",
    name: "Тарифаас бусад зарлага",
    type: "expense",
    parent_code: "5000",
  },
];

// ─── Create Branch ──────────────────────────────────────────────────────

export async function createBranch(formData: FormData) {
  const ctx = await requireActionContext("settings.manage");
  if ("error" in ctx) return ctx;

  const name = formData.get("name") as string;
  const address = (formData.get("address") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const email = (formData.get("email") as string) || null;

  if (!name?.trim()) {
    return { error: "Салбарын нэр шаардлагатай." };
  }

  const slug = slugify(name.trim());

  // Check for duplicate slug
  const { data: existingBranch } = await ctx.supabase
    .from("branches")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("slug", slug)
    .maybeSingle();

  if (existingBranch) {
    return { error: "Энэ нэртэй салбар бүртгэгдсэн байна." };
  }

  const serviceClient = createServiceClient();

  // 1. Create branch
  const { data: branch, error: branchError } = await ctx.supabase
    .from("branches")
    .insert({
      organization_id: ctx.organizationId,
      name: name.trim(),
      slug,
      address,
      phone,
      email,
    })
    .select("id, name, slug")
    .single();

  if (branchError) {
    capture(branchError, { context: "branches: createBranch" });
    if (branchError.code === "23505") {
      return { error: "Энэ нэртэй салбар бүртгэгдсэн байна." };
    }
    return { error: `Салбар үүсгэхэд алдаа гарлаа: ${branchError.message}` };
  }

  // 2. Auto-create warehouse (1:1 mapping)
  const { error: warehouseError } = await serviceClient
    .from("warehouses")
    .insert({
      organization_id: ctx.organizationId,
      name: `${name.trim()} - Үндсэн агуулах`,
      location: address,
      is_default: false,
      branch_id: branch.id,
    });

  if (warehouseError) {
    // Rollback: delete the branch if warehouse creation failed
    capture(warehouseError, { context: "branches: createBranch" });
    await ctx.supabase.from("branches").delete().eq("id", branch.id);
    return {
      error: `Агуулах үүсгэхэд алдаа гарлаа: ${warehouseError.message}`,
    };
  }

  // 3. Auto-seed default chart of accounts
  const accountInsertError = await seedChartOfAccounts(
    serviceClient,
    ctx.organizationId,
    branch.id,
  );

  if (accountInsertError) {
    // Rollback: delete branch and warehouse
    capture(accountInsertError, { context: "branches: createBranch" });
    await ctx.supabase.from("branches").delete().eq("id", branch.id);
    return {
      error: `Дансны бүртгэл үүсгэхэд алдаа гарлаа: ${accountInsertError}`,
    };
  }

  revalidateEntity("branches");
  revalidateEntity("inventory");
  revalidateEntity("settings");
  return { success: true, branch };
}

async function seedChartOfAccounts(
  serviceClient: ReturnType<typeof createServiceClient>,
  organizationId: string,
  branchId: string,
): Promise<string | null> {
  // Batch 1: insert all root-level accounts (no parent)
  const rootAccounts = DEFAULT_ACCOUNTS.filter((a) => !a.parent_code);
  const { data: rootResults, error: rootError } = await serviceClient
    .from("chart_of_accounts")
    .insert(
      rootAccounts.map((acct) => ({
        organization_id: organizationId,
        branch_id: branchId,
        code: acct.code,
        name: acct.name,
        type: acct.type,
        parent_id: null,
        is_active: true,
      })),
    )
    .select("id, code");

  if (rootError) return rootError.message;
  if (!rootResults) return "Root accounts insertion returned no rows.";

  const codeToId = new Map(rootResults.map((r) => [r.code, r.id]));

  // Batch 2: insert child accounts with resolved parent_id
  const childAccounts = DEFAULT_ACCOUNTS.filter((a) => a.parent_code);
  const { error: childError } = await serviceClient
    .from("chart_of_accounts")
    .insert(
      childAccounts.map((acct) => ({
        organization_id: organizationId,
        branch_id: branchId,
        code: acct.code,
        name: acct.name,
        type: acct.type,
        parent_id: codeToId.get(acct.parent_code!) ?? null,
        is_active: true,
      })),
    );

  if (childError) return childError.message;

  return null;
}

// ─── Update Branch ──────────────────────────────────────────────────────

export async function updateBranch(branchId: string, formData: FormData) {
  const ctx = await requireActionContext("settings.manage");
  if ("error" in ctx) return ctx;

  const name = (formData.get("name") as string) || null;
  const address = (formData.get("address") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const email = (formData.get("email") as string) || null;

  if (!name?.trim()) {
    return { error: "Салбарын нэр шаардлагатай." };
  }

  const { data: currentBranch } = await ctx.supabase
    .from("branches")
    .select("name, slug")
    .eq("id", branchId)
    .eq("organization_id", ctx.organizationId)
    .single();

  if (!currentBranch) {
    return { error: "Салбар олдсонгүй." };
  }

  // Only update slug if name changed
  let slugOverride: string | undefined;
  if (currentBranch.name !== name.trim()) {
    const newSlug = slugify(name.trim());

    const { data: existingBranch } = await ctx.supabase
      .from("branches")
      .select("id")
      .eq("organization_id", ctx.organizationId)
      .eq("slug", newSlug)
      .neq("id", branchId)
      .maybeSingle();

    if (existingBranch) {
      return { error: "Энэ нэртэй салбар бүртгэгдсэн байна." };
    }

    slugOverride = newSlug;
  }

  const { error } = await ctx.supabase
    .from("branches")
    .update({
      name: name.trim(),
      address,
      phone,
      email,
      ...(slugOverride ? { slug: slugOverride } : {}),
    })
    .eq("id", branchId)
    .eq("organization_id", ctx.organizationId);

  if (error) {
    capture(error, { context: "branches: updateBranch" });
    return { error: `Шинэчлэхэд алдаа гарлаа: ${error.message}` };
  }

  revalidateEntity("branches");
  revalidateEntity("settings");
  return { success: true };
}

// ─── Set Default Branch ─────────────────────────────────────────────────

export async function setDefaultBranch(branchId: string) {
  const ctx = await requireActionContext("settings.manage");
  if ("error" in ctx) return ctx;

  const { data: branch } = await ctx.supabase
    .from("branches")
    .select("id, is_default")
    .eq("id", branchId)
    .eq("organization_id", ctx.organizationId)
    .single();

  if (!branch) {
    return { error: "Салбар олдсонгүй." };
  }

  if (branch.is_default) {
    return { success: true };
  }

  // Unset previous default
  const { error: unsetError } = await ctx.supabase
    .from("branches")
    .update({ is_default: false })
    .eq("organization_id", ctx.organizationId)
    .eq("is_default", true);

  if (unsetError) {
    return {
      error: `Өмнөх үндсэн салбарыг арилгахад алдаа гарлаа: ${unsetError.message}`,
    };
  }

  // Set new default
  const { error: setError } = await ctx.supabase
    .from("branches")
    .update({ is_default: true })
    .eq("id", branchId)
    .eq("organization_id", ctx.organizationId);

  if (setError) {
    return {
      error: `Үндсэн салбар болгоход алдаа гарлаа: ${setError.message}`,
    };
  }

  revalidateEntity("branches");
  revalidateEntity("settings");
  return { success: true };
}

// ─── Delete Branch ──────────────────────────────────────────────────────

export async function deleteBranch(branchId: string) {
  const ctx = await requireActionContext("settings.manage");
  if ("error" in ctx) return ctx;

  // Check if branch has any transactional data
  const tablesToCheck = [
    "sales",
    "expenses",
    "invoices",
    "purchase_orders",
    "quotations",
    "returns",
    "stock_movements",
    "discounts",
    "commission_payouts",
    "journal_entries",
  ] as const;

  for (const table of tablesToCheck) {
    const { count } = await ctx.supabase
      .from(table as "sales")
      .select("*", { count: "exact", head: true })
      .eq("branch_id", branchId);

    if (count && count > 0) {
      return {
        error:
          "Энэ салбар дээр өгөгдөл байна. Өгөгдөлтэй салбарыг устгах боломжгүй.",
      };
    }
  }

  // Delete warehouse linked to this branch
  const serviceClient = createServiceClient();
  await serviceClient.from("warehouses").delete().eq("branch_id", branchId);

  // Delete chart of accounts for this branch
  await serviceClient
    .from("chart_of_accounts")
    .delete()
    .eq("branch_id", branchId);

  // Delete the branch itself
  const { error } = await ctx.supabase
    .from("branches")
    .delete()
    .eq("id", branchId)
    .eq("organization_id", ctx.organizationId);

  if (error) {
    capture(error, { context: "branches: deleteBranch" });
    return { error: `Устгахад алдаа гарлаа: ${error.message}` };
  }

  revalidateEntity("branches");
  return { success: true };
}

// ─── Assign User to Branch ──────────────────────────────────────────────

export async function assignUserBranch(
  profileId: string,
  branchId: string | null,
) {
  const ctx = await requireActionContext("members.manage_role");
  if ("error" in ctx) return ctx;

  const { error } = await ctx.supabase
    .from("profiles")
    .update({ branch_id: branchId })
    .eq("id", profileId)
    .eq("organization_id", ctx.organizationId);

  if (error) {
    capture(error, { context: "branches: assignBranch" });
    return { error: `Салбар онооход алдаа гарлаа: ${error.message}` };
  }

  revalidateEntity("users");
  return { success: true };
}
