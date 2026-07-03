/** Input for evening report generation. Compatible with Zer's ReportData. */
export interface ReportInput {
  /** Date label, e.g. "2026-07-02 (Пүрэв)" */
  date: string;
  /** Vertical/business context for the AI prompt (e.g. "шашны дэлгүүр", "кафе").
   *  When omitted, the prompt stays generic. */
  businessType?: string;
  /** Organization/shop display name. */
  orgName: string;
  totalSales: number;
  totalPaid: number;
  totalExpenses: number;
  grossProfit: number;
  productSales: Array<{
    name: string;
    quantity: number;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
  }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  expenseBreakdown: Array<{ category: string; count: number; total: number }>;
  stockMovements: { in: number; out: number; adjustment: number };
  pendingSales: Array<{
    id: string;
    contactName: string | null;
    totalAmount: number;
    paymentMethod: string | null;
  }>;
  commissionSummary: {
    totalEarned: number;
    totalPaid: number;
    totalUnpaid: number;
  };
  lowStockItems: Array<{ name: string; stock: number; threshold: number }>;
}

/** Input for NL→SQL query. */
export interface NLQueryInput {
  question: string;
  /** Description of available tables and columns for context. */
  tableSchema: string;
}

export interface NLQueryResult {
  sql: string;
  explanation: string;
  /** Row data returned by executing the SQL (if available). */
  data?: unknown;
}

/** Input for expense categorization. */
export interface CategorizeInput {
  description: string;
  amount: number;
  availableCategories: string[];
}

export interface CategorizeResult {
  category: string;
  confidence: number;
}

/** Options passed to every AI function. */
export interface AiOptions {
  apiKey: string;
  /** DeepSeek model override (default: "deepseek-chat"). */
  model?: string;
  /** Base URL override for API proxy. */
  baseUrl?: string;
}

/** Tool parameter definition for function-calling. */
export interface ToolParam {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required?: boolean;
  enum?: string[];
  items?: { type: string };
  properties?: Record<string, { type: string; description: string }>;
}

/**
 * A curated, parameterized tool the LLM can call during a conversation.
 * execute receives parsed JSON arguments from the model.
 */
export interface Tool {
  name: string;
  description: string;
  parameters: ToolParam[];
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

/** Result of executing a tool call. */
export interface ToolResult {
  toolName: string;
  result: unknown;
}

