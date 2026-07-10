import { createJournalEntry } from "@/lib/accounting-utils";
import { capture } from "@zuiio/capture";

/**
 * Post a sale to the general ledger.
 * Debits: Cash/Receivables (defaults to account code "1200" or "1300")
 * Credits: Sales Revenue (account code "4100")
 */
export async function postSaleToJournal(
  // biome-ignore lint/suspicious/noExplicitAny: Supabase client is untyped in this accounting context
  supabase: any,
  organizationId: string,
  userId: string,
  branchId: string,
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
  const totalDebit =
    saleData.paid_amount > 0 ? saleData.paid_amount : saleData.total_amount;

  const lines: Array<{
    account_id: string;
    debit_amount: number;
    credit_amount: number;
  }> = [
    { account_id: "1200", debit_amount: totalDebit, credit_amount: 0 },
    {
      account_id: "4100",
      debit_amount: 0,
      credit_amount: totalDebit,
    },
  ];

  // If sale has items, debit COGS and credit Inventory
  if (_items && _items.length > 0) {
    const totalCost = _items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0,
    );
    if (totalCost > 0) {
      lines.push(
        {
          account_id: "5100",
          debit_amount: totalCost,
          credit_amount: 0,
        },
        {
          account_id: "1400",
          debit_amount: 0,
          credit_amount: totalCost,
        },
      );
    }
  }

  try {
    return await createJournalEntry(supabase, {
      organizationId,
      userId,
      branchId,
      referenceType: "sale",
      referenceId: saleId,
      entryDate: saleData.sale_date,
      description: `Борлуулалтын журналын бичилт - ${saleData.sale_date}`,
      accountCodes: ["1200", "1300", "4100", "5100", "1400"],
      lines,
    });
  } catch (error) {
    capture(error, { context: "accounting: postPurchaseToJournal" });
    return {
      success: false,
      error: `Журналын бичилт үүсгэхэд алдаа гарлаа: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Post an expense to the general ledger.
 * Debits: Expense account based on category
 * Credits: Cash/Bank
 */
export async function postExpenseToJournal(
  // biome-ignore lint/suspicious/noExplicitAny: Supabase client is untyped in this accounting context
  supabase: any,
  organizationId: string,
  userId: string,
  branchId: string,
  expenseId: string,
  expenseData: {
    amount: number;
    expense_date: string;
    category?: string | null;
    description?: string | null;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    return await createJournalEntry(supabase, {
      organizationId,
      userId,
      branchId,
      referenceType: "expense",
      referenceId: expenseId,
      entryDate: expenseData.expense_date,
      description:
        expenseData.description ||
        `Зарлагын журналын бичилт - ${expenseData.expense_date}`,
      accountCodes: ["1200", "5200"],
      lines: [
        {
          account_id: "5200",
          debit_amount: expenseData.amount,
          credit_amount: 0,
        },
        {
          account_id: "1200",
          debit_amount: 0,
          credit_amount: expenseData.amount,
        },
      ],
    });
  } catch (error) {
    capture(error, { context: "accounting: postSaleToJournal" });
    return {
      success: false,
      error: `Журналын бичилт үүсгэхэд алдаа гарлаа: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Post a purchase to the general ledger.
 * Debits: Inventory
 * Credits: Accounts Payable or Cash/Bank
 */
export async function postPurchaseToJournal(
  // biome-ignore lint/suspicious/noExplicitAny: Supabase client is untyped in this accounting context
  supabase: any,
  organizationId: string,
  userId: string,
  branchId: string,
  purchaseId: string,
  purchaseData: {
    total_amount: number;
    order_date: string;
    status?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  const creditAccountId = purchaseData.status === "received" ? "1200" : "2100";

  try {
    return await createJournalEntry(supabase, {
      organizationId,
      userId,
      branchId,
      referenceType: "purchase_order",
      referenceId: purchaseId,
      entryDate: purchaseData.order_date,
      description: `Худалдан авалтын журналын бичилт - ${purchaseData.order_date}`,
      accountCodes: ["1400", "2100", "1200"],
      lines: [
        {
          account_id: "1400",
          debit_amount: purchaseData.total_amount,
          credit_amount: 0,
        },
        {
          account_id: creditAccountId,
          debit_amount: 0,
          credit_amount: purchaseData.total_amount,
        },
      ],
    });
  } catch (error) {
    capture(error, { context: "accounting: postExpenseToJournal" });
    return {
      success: false,
      error: `Журналын бичилт үүсгэхэд алдаа гарлаа: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
