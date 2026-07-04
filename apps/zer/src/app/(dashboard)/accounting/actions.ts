"use server";

import { requireWriteAction } from "@/lib/action-utils";
import { logAuditEventWithClient } from "@/lib/audit";
import { revalidateEntities } from "@/lib/revalidate";
import { getString } from "@/lib/validation";

export async function createJournalEntry(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("accounting.manage");
  if ("error" in ctx) return ctx;
  const { organizationId, userId, branchId } = ctx;
  const db = ctx.supabase;

  const entryDate = getString(formData, "entry_date");
  const description = getString(formData, "description");
  const linesJson = formData.get("lines") as string;

  if (!entryDate) {
    return { error: "Огноо шаардлагатай." };
  }

  if (!description) {
    return { error: "Тайлбар шаардлагатай." };
  }

  if (!linesJson) {
    return { error: "Журналын мөрүүд шаардлагатай." };
  }

  let lines: Array<{
    account_id: string;
    debit_amount: number;
    credit_amount: number;
  }>;

  try {
    lines = JSON.parse(linesJson);
  } catch {
    return { error: "Журналын мөрүүдийн өгөгдөл буруу байна." };
  }

  if (!Array.isArray(lines) || lines.length === 0) {
    return { error: "Дор хаяж нэг мөр оруулна уу." };
  }

  // Validate lines
  for (const [i, line] of lines.entries()) {
    if (!line.account_id) {
      return { error: `Мөр ${i + 1}: Данс сонгоно уу.` };
    }
    if (line.debit_amount < 0 || line.credit_amount < 0) {
      return {
        error: `Мөр ${i + 1}: Дебет ба кредит дүн сөрөг байж болохгүй.`,
      };
    }
    if (line.debit_amount === 0 && line.credit_amount === 0) {
      return { error: `Мөр ${i + 1}: Дебет эсвэл кредит дүн оруулна уу.` };
    }
  }

  // Validate debits = credits
  const totalDebits = lines.reduce((sum, l) => sum + l.debit_amount, 0);
  const totalCredits = lines.reduce((sum, l) => sum + l.credit_amount, 0);

  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    return {
      error: `Дебет ба кредит дүн тэнцүү байх ёстой. Дебет: ${totalDebits.toFixed(2)}, Кредит: ${totalCredits.toFixed(2)}`,
    };
  }

  // Generate entry number
  const { data: entryNumberData, error: numError } = await db.rpc(
    "generate_journal_entry_number",
  );

  if (numError) {
    return { error: `Дугаар үүсгэхэд алдаа гарлаа: ${numError.message}` };
  }

  const entryNumber = entryNumberData as string;

  // Insert journal entry
  const { data: journalEntry, error: entryError } = await db
    .from("journal_entries")
    .insert({
      organization_id: organizationId,
      branch_id: branchId,
      entry_date: entryDate,
      entry_number: entryNumber,
      description,
      created_by: userId,
    })
    .select("id")
    .single();

  if (entryError) {
    return {
      error: `Журналын бичилт үүсгэхэд алдаа гарлаа: ${entryError.message}`,
    };
  }

  // Insert lines
  const { error: linesError } = await db.from("journal_entry_lines").insert(
    lines.map((line) => ({
      journal_entry_id: journalEntry.id,
      account_id: line.account_id,
      debit_amount: line.debit_amount,
      credit_amount: line.credit_amount,
    })),
  );

  if (linesError) {
    return { error: `Мөрүүд хадгалахад алдаа гарлаа: ${linesError.message}` };
  }

  await logAuditEventWithClient(
    ctx.supabase,
    organizationId,
    userId,
    "created",
    "product",
    journalEntry.id,
    undefined,
    `Журналын бичилт ${entryNumber} үүсгэсэн`,
  );

  revalidateEntities(["accounting"]);
  return { success: true as const, error: undefined };
}

export async function createAccount(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("accounting.manage");
  if ("error" in ctx) return ctx;
  const { organizationId, userId, branchId } = ctx;
  const db = ctx.supabase;

  const code = getString(formData, "code");
  const name = getString(formData, "name");
  const type = getString(formData, "type");
  const parentId = getString(formData, "parent_id") || null;
  const isActive = formData.get("is_active") === "on";

  if (!code) {
    return { error: "Дансны код шаардлагатай." };
  }

  if (!name) {
    return { error: "Дансны нэр шаардлагатай." };
  }

  const validTypes = ["asset", "liability", "equity", "income", "expense"];
  if (!validTypes.includes(type)) {
    return { error: "Дансны төрөл буруу байна." };
  }

  // Check uniqueness
  const { data: existing } = await db
    .from("chart_of_accounts")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("code", code)
    .maybeSingle();

  if (existing) {
    return { error: `"${code}" кодтой данс бүртгэгдсэн байна.` };
  }

  const { error: insertError } = await db.from("chart_of_accounts").insert({
    organization_id: organizationId,
    branch_id: branchId,
    code,
    name,
    type,
    parent_id: parentId || null,
    is_active: isActive,
  });

  if (insertError) {
    return { error: `Данс үүсгэхэд алдаа гарлаа: ${insertError.message}` };
  }

  await logAuditEventWithClient(
    ctx.supabase,
    organizationId,
    userId,
    "created",
    "product",
    code,
    undefined,
    `Данс "${code} - ${name}" үүсгэсэн`,
  );

  revalidateEntities(["accounting"]);
  return { success: true as const, error: undefined };
}

export async function updateJournalEntry(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("accounting.manage");
  if ("error" in ctx) return ctx;
  const { organizationId, userId, branchId, isBranchScoped } = ctx;
  const db = ctx.supabase;

  const entryId = getString(formData, "id");
  const entryDate = getString(formData, "entry_date");
  const description = getString(formData, "description");
  const linesJson = formData.get("lines") as string;

  if (!entryId) {
    return { error: "Бичилтийн ID шаардлагатай." };
  }

  if (!entryDate) {
    return { error: "Огноо шаардлагатай." };
  }

  if (!description) {
    return { error: "Тайлбар шаардлагатай." };
  }

  if (!linesJson) {
    return { error: "Журналын мөрүүд шаардлагатай." };
  }

  let lines: Array<{
    account_id: string;
    debit_amount: number;
    credit_amount: number;
  }>;

  try {
    lines = JSON.parse(linesJson);
  } catch {
    return { error: "Журналын мөрүүдийн өгөгдөл буруу байна." };
  }

  if (!Array.isArray(lines) || lines.length === 0) {
    return { error: "Дор хаяж нэг мөр оруулна уу." };
  }

  // Validate lines
  for (const [i, line] of lines.entries()) {
    if (!line.account_id) {
      return { error: `Мөр ${i + 1}: Данс сонгоно уу.` };
    }
    if (line.debit_amount < 0 || line.credit_amount < 0) {
      return {
        error: `Мөр ${i + 1}: Дебет ба кредит дүн сөрөг байж болохгүй.`,
      };
    }
    if (line.debit_amount === 0 && line.credit_amount === 0) {
      return { error: `Мөр ${i + 1}: Дебет эсвэл кредит дүн оруулна уу.` };
    }
  }

  // Validate debits = credits
  const totalDebits = lines.reduce((sum, l) => sum + l.debit_amount, 0);
  const totalCredits = lines.reduce((sum, l) => sum + l.credit_amount, 0);

  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    return {
      error: `Дебет ба кредит дүн тэнцүү байх ёстой. Дебет: ${totalDebits.toFixed(2)}, Кредит: ${totalCredits.toFixed(2)}`,
    };
  }

  // Update journal entry — enforce branch access if scoped
  let updateQuery = db
    .from("journal_entries")
    .update({
      entry_date: entryDate,
      description,
    })
    .eq("id", entryId)
    .eq("organization_id", organizationId);

  if (isBranchScoped && branchId) {
    updateQuery = updateQuery.eq("branch_id", branchId);
  }

  const { error: entryError } = await updateQuery;

  if (entryError) {
    return {
      error: `Журналын бичилт шинэчлэхэд алдаа гарлаа: ${entryError.message}`,
    };
  }

  // Save old lines for potential rollback, then delete
  const { data: oldLines } = await db
    .from("journal_entry_lines")
    .select("account_id, debit_amount, credit_amount")
    .eq("journal_entry_id", entryId);

  const { error: deleteLinesError } = await db
    .from("journal_entry_lines")
    .delete()
    .eq("journal_entry_id", entryId);

  if (deleteLinesError) {
    return {
      error: `Мөрүүд устгахад алдаа гарлаа: ${deleteLinesError.message}`,
    };
  }

  const { error: linesError } = await db.from("journal_entry_lines").insert(
    lines.map((line) => ({
      journal_entry_id: entryId,
      account_id: line.account_id,
      debit_amount: line.debit_amount,
      credit_amount: line.credit_amount,
    })),
  );

  if (linesError) {
    // Rollback: restore old lines
    if (oldLines && oldLines.length > 0) {
      await db.from("journal_entry_lines").insert(
        oldLines.map(
          (line: {
            account_id: string;
            debit_amount: number;
            credit_amount: number;
          }) => ({
            journal_entry_id: entryId,
            account_id: line.account_id,
            debit_amount: line.debit_amount,
            credit_amount: line.credit_amount,
          }),
        ),
      );
    }
    return { error: `Мөрүүд хадгалахад алдаа гарлаа: ${linesError.message}` };
  }

  await logAuditEventWithClient(
    ctx.supabase,
    organizationId,
    userId,
    "updated",
    "product",
    entryId,
    undefined,
    `Журналын бичилт шинэчлэгдсэн`,
  );

  revalidateEntities(["accounting"]);
  return { success: true as const, error: undefined };
}

export async function deleteJournalEntry(entryId: string) {
  const ctx = await requireWriteAction("accounting.manage");
  if ("error" in ctx) return ctx;
  const { organizationId, branchId, isBranchScoped } = ctx;
  const db = ctx.supabase;

  // Lines are cascade-deleted by the FK constraint — enforce branch access if scoped
  let deleteQuery = db
    .from("journal_entries")
    .delete()
    .eq("id", entryId)
    .eq("organization_id", organizationId);

  if (isBranchScoped && branchId) {
    deleteQuery = deleteQuery.eq("branch_id", branchId);
  }

  const { error } = await deleteQuery;

  if (error) {
    return { error: `Журналын бичилт устгахад алдаа гарлаа: ${error.message}` };
  }

  revalidateEntities(["accounting"]);
  return { success: true as const, error: undefined };
}

export async function toggleAccountActive(
  accountId: string,
  isActive: boolean,
) {
  const ctx = await requireWriteAction("accounting.manage");
  if ("error" in ctx) return ctx;
  const { organizationId, branchId, isBranchScoped } = ctx;
  const db = ctx.supabase;

  let updateQuery = db
    .from("chart_of_accounts")
    .update({ is_active: isActive })
    .eq("id", accountId)
    .eq("organization_id", organizationId);

  if (isBranchScoped && branchId) {
    updateQuery = updateQuery.eq("branch_id", branchId);
  }

  const { error } = await updateQuery;

  if (error) {
    return { error: `Төлөв шинэчлэхэд алдаа гарлаа: ${error.message}` };
  }

  revalidateEntities(["accounting"]);
  return { success: true as const, error: undefined };
}
