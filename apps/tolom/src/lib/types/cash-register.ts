/**
 * Cash register session types — physical drawer tracking.
 */

export interface CashRegisterSession {
  id: string;
  organization_id: string;
  branch_id: string | null;
  date: string;
  status: "open" | "closed";
  opened_at: string;
  closed_at: string | null;
  opening_balance: number;
  closing_balance: number | null;
  expected_balance: number | null;
  cash_in: number;
  cash_out: number;
  discrepancy: number | null;
  discrepancy_note: string | null;
  opened_by: string | null;
  closed_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CashRegisterEntry {
  id: string;
  session_id: string;
  organization_id: string;
  entry_type: "in" | "out";
  amount: number;
  source: "payment" | "invoice_payment" | "manual" | "expense" | "refund";
  source_id: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CashRegisterSessionWithEntries extends CashRegisterSession {
  entries: CashRegisterEntry[];
}

export interface OpenSessionParams {
  opening_balance: number;
  branch_id?: string | null;
}

export interface CloseSessionParams {
  closing_balance: number;
  note?: string | null;
}

export interface CashOutParams {
  amount: number;
  description: string;
}
