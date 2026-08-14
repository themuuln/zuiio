import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { logAuditAfter } from "@/lib/audit";
import { cacheTags } from "@/lib/cache/keys";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import type {
  CashRegisterEntry,
  CashRegisterSession,
  CashRegisterSessionWithEntries,
} from "@/lib/types";

// ── Select fragments ───────────────────────────────────────

const SESSION_COLUMNS =
  "id, organization_id, branch_id, date, status, opened_at, closed_at, opening_balance, closing_balance, expected_balance, cash_in, cash_out, discrepancy, discrepancy_note, opened_by, closed_by, created_by, created_at, updated_at, deleted_at";

const ENTRY_COLUMNS =
  "id, session_id, organization_id, entry_type, amount, source, source_id, description, created_by, created_at";

// ── Open Session ───────────────────────────────────────────

export async function openSession(
  db: SupabaseClient,
  orgId: string,
  userId: string,
  openingBalance: number,
  branchId?: string | null,
): Promise<CashRegisterSession> {
  if (openingBalance < 0) {
    throw new ValidationError("Opening balance cannot be negative");
  }

  // Check no open session exists for this org+branch+today
  const today = localDateStr();

  const { data: existing } = await db
    .from("cash_register_sessions")
    .select("id")
    .eq("organization_id", orgId)
    .eq("branch_id", branchId ?? null)
    .eq("date", today)
    .eq("status", "open")
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    throw new ConflictError("A register session is already open for today");
  }

  const { data, error } = await db
    .from("cash_register_sessions")
    .insert({
      organization_id: orgId,
      branch_id: branchId ?? null,
      date: today,
      status: "open",
      opening_balance: openingBalance,
      created_by: userId,
      opened_by: userId,
    })
    .select(SESSION_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to open session");
  }

  logAuditAfter({
    supabase: db,
    action: "create",
    table_name: "cash_register_sessions",
    record_id: data.id,
    user_id: userId,
    organization_id: orgId,
    new_data: data,
  });

  revalidateTag(cacheTags.cashRegisterSessions(orgId), "max");

  return data as unknown as CashRegisterSession;
}

// ── Close Session ──────────────────────────────────────────

export async function closeSession(
  db: SupabaseClient,
  sessionId: string,
  orgId: string,
  userId: string,
  closingBalance: number,
  note?: string | null,
): Promise<CashRegisterSession> {
  if (closingBalance < 0) {
    throw new ValidationError("Closing balance cannot be negative");
  }

  // Fetch current session and entries in parallel
  const [sessionResult, entriesResult] = await Promise.all([
    db
      .from("cash_register_sessions")
      .select(SESSION_COLUMNS)
      .eq("id", sessionId)
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .single(),
    db
      .from("cash_register_entries")
      .select("entry_type, amount")
      .eq("session_id", sessionId),
  ]);

  // Throw on entries query errors; session errors are handled by the !session check below
  if (entriesResult.error) throw entriesResult.error;

  const session = sessionResult.data;
  const entries = entriesResult.data;

  if (!session) {
    throw new NotFoundError("Session not found");
  }

  if (session.status === "closed") {
    throw new ConflictError("Session is already closed");
  }

  let cashIn = 0;
  let cashOut = 0;
  for (const entry of entries ?? []) {
    if (entry.entry_type === "in") {
      cashIn += Number(entry.amount);
    } else {
      cashOut += Number(entry.amount);
    }
  }

  const expectedBalance = Number(session.opening_balance) + cashIn - cashOut;
  const discrepancy = closingBalance - expectedBalance;

  const { data, error } = await db
    .from("cash_register_sessions")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
      closed_by: userId,
      closing_balance: closingBalance,
      expected_balance: expectedBalance,
      cash_in: cashIn,
      cash_out: cashOut,
      discrepancy,
      discrepancy_note: note ?? null,
    })
    .eq("id", sessionId)
    .eq("organization_id", orgId)
    .select(SESSION_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to close session");
  }

  logAuditAfter({
    supabase: db,
    action: "update",
    table_name: "cash_register_sessions",
    record_id: sessionId,
    user_id: userId,
    organization_id: orgId,
    old_data: session,
    new_data: data,
  });

  revalidateTag(cacheTags.cashRegisterSessions(orgId), "max");
  revalidateTag(cacheTags.cashRegisterSession(sessionId), "max");

  return data as unknown as CashRegisterSession;
}

// ── Get Current Session ────────────────────────────────────

export async function getCurrentSession(
  db: SupabaseClient,
  orgId: string,
  branchId?: string | null,
): Promise<CashRegisterSessionWithEntries | null> {
  const today = localDateStr();

  let query = db
    .from("cash_register_sessions")
    .select(SESSION_COLUMNS)
    .eq("organization_id", orgId)
    .eq("date", today)
    .eq("status", "open")
    .is("deleted_at", null);

  // Only filter by branch_id when a specific branch is requested.
  // branchId === undefined means "all branches" — find any open session.
  if (branchId !== undefined) {
    query = query.eq("branch_id", branchId ?? null);
  }

  const { data } = await query.maybeSingle();

  if (!data) return null;

  // Fetch entries for this session
  const { data: entries } = await db
    .from("cash_register_entries")
    .select(ENTRY_COLUMNS)
    .eq("session_id", data.id)
    .order("created_at", { ascending: true });

  return {
    ...(data as unknown as CashRegisterSession),
    entries: (entries ?? []) as unknown as CashRegisterEntry[],
  };
}

// ── Get Session with Entries ───────────────────────────────

export async function getSession(
  db: SupabaseClient,
  sessionId: string,
  orgId: string,
): Promise<CashRegisterSessionWithEntries> {
  const { data: session, error } = await db
    .from("cash_register_sessions")
    .select(SESSION_COLUMNS)
    .eq("id", sessionId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (error || !session) {
    throw new NotFoundError("Session not found");
  }

  const { data: entries } = await db
    .from("cash_register_entries")
    .select(ENTRY_COLUMNS)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return {
    ...(session as unknown as CashRegisterSession),
    entries: (entries ?? []) as unknown as CashRegisterEntry[],
  };
}

// ── List Sessions ──────────────────────────────────────────

export async function getSessions(
  db: SupabaseClient,
  orgId: string,
  options?: {
    status?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  },
): Promise<{ data: CashRegisterSession[]; total: number }> {
  const limit = Math.min(100, Math.max(1, options?.limit ?? 50));
  const offset = options?.offset ?? 0;

  let query = db
    .from("cash_register_sessions")
    .select(SESSION_COLUMNS, { count: "exact" })
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }
  if (options?.from) {
    query = query.gte("date", options.from);
  }
  if (options?.to) {
    query = query.lte("date", options.to);
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as unknown as CashRegisterSession[],
    total: count ?? 0,
  };
}

// ── Add Cash Out ───────────────────────────────────────────

export async function addCashOut(
  db: SupabaseClient,
  sessionId: string,
  orgId: string,
  userId: string,
  amount: number,
  description: string,
): Promise<CashRegisterEntry> {
  if (amount <= 0) {
    throw new ValidationError("Amount must be positive");
  }
  if (!description?.trim()) {
    throw new ValidationError("Description is required");
  }

  // Verify session exists and is open
  const { data: session } = await db
    .from("cash_register_sessions")
    .select("id, status")
    .eq("id", sessionId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (!session) {
    throw new NotFoundError("Session not found");
  }
  if (session.status !== "open") {
    throw new ConflictError("Cannot add entries to a closed session");
  }

  const { data, error } = await db
    .from("cash_register_entries")
    .insert({
      session_id: sessionId,
      organization_id: orgId,
      entry_type: "out",
      amount,
      source: "manual",
      description: description.trim(),
      created_by: userId,
    })
    .select(ENTRY_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to record cash out");
  }

  revalidateTag(cacheTags.cashRegisterSession(sessionId), "max");

  return data as unknown as CashRegisterEntry;
}

// ── Get Session Entries ────────────────────────────────────

export async function getSessionEntries(
  db: SupabaseClient,
  sessionId: string,
): Promise<CashRegisterEntry[]> {
  const { data, error } = await db
    .from("cash_register_entries")
    .select(ENTRY_COLUMNS)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as CashRegisterEntry[];
}

// ── Void Session ───────────────────────────────────────────

export async function voidSession(
  db: SupabaseClient,
  sessionId: string,
  orgId: string,
  userId: string,
): Promise<void> {
  const { data: session } = await db
    .from("cash_register_sessions")
    .select("id, status")
    .eq("id", sessionId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .single();

  if (!session) {
    throw new NotFoundError("Session not found");
  }

  // Only allow voiding open sessions with no entries
  if (session.status === "closed") {
    throw new ConflictError("Cannot void a closed session");
  }

  const { count } = await db
    .from("cash_register_entries")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  if ((count ?? 0) > 0) {
    throw new ConflictError(
      "Cannot void a session with entries. Close it instead.",
    );
  }

  const { error } = await db
    .from("cash_register_sessions")
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", sessionId)
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message);

  logAuditAfter({
    supabase: db,
    action: "soft_delete",
    table_name: "cash_register_sessions",
    record_id: sessionId,
    user_id: userId,
    organization_id: orgId,
  });

  revalidateTag(cacheTags.cashRegisterSessions(orgId), "max");
  revalidateTag(cacheTags.cashRegisterSession(sessionId), "max");
}

// ── Helper ─────────────────────────────────────────────────

function localDateStr(date?: Date): string {
  const d = date ?? new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
