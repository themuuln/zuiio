import { logAuditEventWithClient } from "@/lib/audit";

/**
 * Post a sale to the general ledger.
 * Debits: Cash/Receivables (defaults to account code "1200" or "1300")
 * Credits: Sales Revenue (account code "4100")
 */
export async function postSaleToJournal(
  supabase: any,
  organizationId: string,
  userId: string,
  saleId: string,
  saleData: {
    total_amount: number;
    paid_amount: number;
    sale_date: string;
  },
  _items?: Array<{
    product_id?: string;
    quantity: number;
    unit_price: number;
  }>,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Look up accounts by code
    const { data: accounts } = await supabase
      .from("chart_of_accounts")
      .select("id, code")
      .eq("organization_id", organizationId)
      .in("code", ["1200", "1300", "4100", "5100"]);

    if (!accounts || accounts.length < 2) {
      return { success: false, error: "Дансны бүртгэл олдсонгүй. Эхлээд дансны бүртгэлээ оруулна уу." };
    }

    const accountMap = new Map(accounts.map((a: any) => [a.code, a.id]));
    const bankAccountId = accountMap.get("1200") ?? accountMap.get("1300");
    const revenueAccountId = accountMap.get("4100");
    const cogsAccountId = accountMap.get("5100");

    if (!bankAccountId || !revenueAccountId) {
      return { success: false, error: "Шаардлагатай данс олдсонгүй (Банкны данс эсвэл Борлуулалтын орлого)." };
    }

    const { data: jeData, error: jeError } = await supabase
      .rpc("generate_journal_entry_number");

    if (jeError) return { success: false, error: jeError.message };
    const entryNumber = jeData as string;

    const totalDebit = saleData.paid_amount > 0 ? saleData.paid_amount : saleData.total_amount;

    // Build lines: debit cash/bank, credit revenue
    const lines = [
      { account_id: bankAccountId, debit_amount: totalDebit, credit_amount: 0 },
      { account_id: revenueAccountId, debit_amount: 0, credit_amount: totalDebit },
    ];

    // If sale has COGS items, debit COGS and credit Inventory
    if (cogsAccountId && _items && _items.length > 0) {
      const totalCost = _items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0,
      );
      if (totalCost > 0) {
        const inventoryAccountId = accountMap.get("1400");
        if (inventoryAccountId) {
          lines.push(
            { account_id: cogsAccountId, debit_amount: totalCost, credit_amount: 0 },
            { account_id: inventoryAccountId, debit_amount: 0, credit_amount: totalCost },
          );
        }
      }
    }

    // Check debits = credits
    const totalDebits = lines.reduce((s, l) => s + l.debit_amount, 0);
    const totalCredits = lines.reduce((s, l) => s + l.credit_amount, 0);
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return { success: false, error: "Дебет ба кредит дүн тэнцүү биш байна." };
    }

    const { data: journalEntry, error: entryError } = await supabase
      .from("journal_entries")
      .insert({
        organization_id: organizationId,
        entry_date: saleData.sale_date,
        entry_number: entryNumber,
        reference_type: "sale",
        reference_id: saleId,
        description: `Борлуулалтын журналын бичилт - ${saleData.sale_date}`,
        created_by: userId,
      })
      .select("id")
      .single();

    if (entryError) return { success: false, error: entryError.message };

    const { error: linesError } = await supabase
      .from("journal_entry_lines")
      .insert(lines.map((l) => ({ ...l, journal_entry_id: journalEntry.id })));

    if (linesError) return { success: false, error: linesError.message };

    await logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "created",
      "sale" as any,
      saleId,
      undefined,
      `Борлуулалтын журналын бичилт ${entryNumber} үүсгэсэн`,
    );

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Алдаа гарлаа" };
  }
}

/**
 * Post an expense to the general ledger.
 * Debits: Expense account based on category
 * Credits: Cash/Bank
 */
export async function postExpenseToJournal(
  supabase: any,
  organizationId: string,
  userId: string,
  expenseId: string,
  expenseData: {
    amount: number;
    expense_date: string;
    category?: string | null;
    description?: string | null;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: accounts } = await supabase
      .from("chart_of_accounts")
      .select("id, code")
      .eq("organization_id", organizationId)
      .in("code", ["1200", "5200"]);

    if (!accounts || accounts.length < 2) {
      return { success: false, error: "Дансны бүртгэл олдсонгүй." };
    }

    const accountMap = new Map(accounts.map((a: any) => [a.code, a.id]));
    const bankAccountId = accountMap.get("1200") ?? accountMap.get("1300");
    const expenseAccountId = accountMap.get("5200");

    if (!bankAccountId || !expenseAccountId) {
      return { success: false, error: "Шаардлагатай данс олдсонгүй (Банкны данс эсвэл Зарлагын данс)." };
    }

    const { data: jeData, error: jeError } = await supabase
      .rpc("generate_journal_entry_number");

    if (jeError) return { success: false, error: jeError.message };
    const entryNumber = jeData as string;

    const lines = [
      { account_id: expenseAccountId, debit_amount: expenseData.amount, credit_amount: 0 },
      { account_id: bankAccountId, debit_amount: 0, credit_amount: expenseData.amount },
    ];

    const { data: journalEntry, error: entryError } = await supabase
      .from("journal_entries")
      .insert({
        organization_id: organizationId,
        entry_date: expenseData.expense_date,
        entry_number: entryNumber,
        reference_type: "expense",
        reference_id: expenseId,
        description: expenseData.description || `Зарлагын журналын бичилт - ${expenseData.expense_date}`,
        created_by: userId,
      })
      .select("id")
      .single();

    if (entryError) return { success: false, error: entryError.message };

    const { error: linesError } = await supabase
      .from("journal_entry_lines")
      .insert(lines.map((l) => ({ ...l, journal_entry_id: journalEntry.id })));

    if (linesError) return { success: false, error: linesError.message };

    await logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "created",
      "expense" as any,
      expenseId,
      undefined,
      `Зарлагын журналын бичилт ${entryNumber} үүсгэсэн`,
    );

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Алдаа гарлаа" };
  }
}

/**
 * Post a purchase to the general ledger.
 * Debits: Inventory
 * Credits: Accounts Payable or Cash/Bank
 */
export async function postPurchaseToJournal(
  supabase: any,
  organizationId: string,
  userId: string,
  purchaseId: string,
  purchaseData: {
    total_amount: number;
    order_date: string;
    status?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: accounts } = await supabase
      .from("chart_of_accounts")
      .select("id, code")
      .eq("organization_id", organizationId)
      .in("code", ["1400", "2100", "1200"]);

    if (!accounts || accounts.length < 2) {
      return { success: false, error: "Дансны бүртгэл олдсонгүй." };
    }

    const accountMap = new Map(accounts.map((a: any) => [a.code, a.id]));
    const inventoryAccountId = accountMap.get("1400");
    const payablesAccountId = accountMap.get("2100");
    const bankAccountId = accountMap.get("1200");

    if (!inventoryAccountId || !payablesAccountId) {
      return { success: false, error: "Шаардлагатай данс олдсонгүй (Бараа материал эсвэл Өглөг)." };
    }

    const { data: jeData, error: jeError } = await supabase
      .rpc("generate_journal_entry_number");

    if (jeError) return { success: false, error: jeError.message };
    const entryNumber = jeData as string;

    // Debit Inventory, Credit Accounts Payable (or Cash if already paid)
    const creditAccountId =
      purchaseData.status === "received" && bankAccountId
        ? bankAccountId
        : payablesAccountId;

    const lines = [
      { account_id: inventoryAccountId, debit_amount: purchaseData.total_amount, credit_amount: 0 },
      { account_id: creditAccountId, debit_amount: 0, credit_amount: purchaseData.total_amount },
    ];

    const { data: journalEntry, error: entryError } = await supabase
      .from("journal_entries")
      .insert({
        organization_id: organizationId,
        entry_date: purchaseData.order_date,
        entry_number: entryNumber,
        reference_type: "purchase_order",
        reference_id: purchaseId,
        description: `Худалдан авалтын журналын бичилт - ${purchaseData.order_date}`,
        created_by: userId,
      })
      .select("id")
      .single();

    if (entryError) return { success: false, error: entryError.message };

    const { error: linesError } = await supabase
      .from("journal_entry_lines")
      .insert(lines.map((l) => ({ ...l, journal_entry_id: journalEntry.id })));

    if (linesError) return { success: false, error: linesError.message };

    await logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "created",
      "stock_movement" as any,
      purchaseId,
      undefined,
      `Худалдан авалтын журналын бичилт ${entryNumber} үүсгэсэн`,
    );

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Алдаа гарлаа" };
  }
}
