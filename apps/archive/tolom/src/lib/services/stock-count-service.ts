import type { SupabaseClient } from "@supabase/supabase-js";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { reportServerError } from "@/lib/sentry-report-server";

// ── Types ──────────────────────────────────────────────────────

interface StockCountSession {
  id: string;
  organization_id: string;
  branch_id: string | null;
  status: "in_progress" | "completed" | "cancelled";
  counted_by: string;
  total_items: number;
  total_variance: number;
  notes: string | null;
  started_at: string;
  completed_at: string | null;
}

interface StockCountItem {
  id: string;
  session_id: string;
  part_id: string;
  system_quantity: number;
  physical_quantity: number;
  variance: number | null;
  notes: string | null;
}

interface StockCountItemWithPart extends StockCountItem {
  part_name: string | null;
  part_number: string | null;
}

interface StockCountSessionWithItems extends StockCountSession {
  items: StockCountItemWithPart[];
}

// ── Create Session ─────────────────────────────────────────────

export async function createSession(
  db: SupabaseClient,
  orgId: string,
  userId: string,
  branchId?: string | null,
  notes?: string | null,
): Promise<StockCountSession> {
  try {
    const { data, error } = await db
      .from("stock_count_sessions")
      .insert({
        organization_id: orgId,
        branch_id: branchId ?? null,
        counted_by: userId,
        status: "in_progress",
        notes: notes ?? null,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create stock count session");
    }

    return data;
  } catch (error) {
    reportServerError("stockCount.createSession", error);
    throw error;
  }
}

// ── Get Session ────────────────────────────────────────────────

export async function getSession(
  db: SupabaseClient,
  sessionId: string,
): Promise<StockCountSessionWithItems> {
  try {
    const { data: session, error: sessionError } = await db
      .from("stock_count_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      throw new NotFoundError("Stock count session not found");
    }

    // Fetch items with embedded part info via FK relationship
    const { data: items, error: itemsError } = await db
      .from("stock_count_items")
      .select("*, parts_catalog(name, part_number)")
      .eq("session_id", sessionId);

    if (itemsError) {
      throw new Error(itemsError.message);
    }

    const mappedItems: StockCountItemWithPart[] = (items ?? []).map((item) => {
      const partsCatalog = (item as Record<string, unknown>).parts_catalog as
        | { name: string | null; part_number: string | null }
        | undefined;

      return {
        id: item.id,
        session_id: item.session_id,
        part_id: item.part_id,
        system_quantity: item.system_quantity,
        physical_quantity: item.physical_quantity,
        variance: item.variance,
        notes: item.notes,
        part_name: partsCatalog?.name ?? null,
        part_number: partsCatalog?.part_number ?? null,
      };
    });

    return {
      ...session,
      items: mappedItems,
    };
  } catch (error) {
    reportServerError("stockCount.getSession", error);
    throw error;
  }
}

// ── List Sessions ──────────────────────────────────────────────

export async function listSessions(
  db: SupabaseClient,
  orgId: string,
  status?: string,
  limit = 20,
): Promise<StockCountSession[]> {
  try {
    let query = db
      .from("stock_count_sessions")
      .select("*")
      .eq("organization_id", orgId)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  } catch (error) {
    reportServerError("stockCount.listSessions", error);
    throw error;
  }
}

// ── Helper: Recalculate Session Totals ─────────────────────────

async function recalculateSessionTotals(
  db: SupabaseClient,
  sessionId: string,
): Promise<void> {
  const { data: items, error } = await db
    .from("stock_count_items")
    .select("variance")
    .eq("session_id", sessionId);

  if (error) {
    throw new Error(error.message);
  }

  const totalItems = items?.length ?? 0;
  const totalVariance =
    items?.reduce((sum, item) => sum + Math.abs(item.variance ?? 0), 0) ?? 0;

  const { error: updateError } = await db
    .from("stock_count_sessions")
    .update({ total_items: totalItems, total_variance: totalVariance })
    .eq("id", sessionId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

// ── Add Count Item ────────────────────────────────────────────

export async function addCountItem(
  db: SupabaseClient,
  orgId: string,
  sessionId: string,
  partId: string,
  physicalQuantity: number,
  notes?: string | null,
): Promise<StockCountItemWithPart> {
  try {
    // Verify session exists and is in_progress
    const { data: session, error: sessionError } = await db
      .from("stock_count_sessions")
      .select("id, status")
      .eq("id", sessionId)
      .eq("organization_id", orgId)
      .single();

    if (sessionError || !session) {
      throw new NotFoundError("Stock count session not found");
    }

    if (session.status !== "in_progress") {
      throw new ValidationError(
        "Cannot add items to a completed or cancelled stock count session",
      );
    }

    // Look up part
    const { data: part, error: partError } = await db
      .from("parts_catalog")
      .select("id, name, part_number")
      .eq("id", partId)
      .is("deleted_at", null)
      .single();

    if (partError || !part) {
      throw new NotFoundError("Part not found");
    }

    // Get current balance from inventory_balances for system_quantity
    const { data: balance } = await db
      .from("inventory_balances")
      .select("quantity_on_hand")
      .eq("organization_id", orgId)
      .eq("part_id", partId)
      .maybeSingle();

    const systemQuantity = balance?.quantity_on_hand ?? 0;

    // Insert count item
    const { data: item, error: insertError } = await db
      .from("stock_count_items")
      .insert({
        session_id: sessionId,
        part_id: partId,
        system_quantity: systemQuantity,
        physical_quantity: physicalQuantity,
        notes: notes ?? null,
      })
      .select("*")
      .single();

    if (insertError || !item) {
      throw new Error(insertError?.message ?? "Failed to add count item");
    }

    // Recalculate session totals
    await recalculateSessionTotals(db, sessionId);

    return {
      ...item,
      part_name: part.name,
      part_number: part.part_number,
    };
  } catch (error) {
    reportServerError("stockCount.addCountItem", error);
    throw error;
  }
}

// ── Remove Count Item ─────────────────────────────────────────

export async function removeCountItem(
  db: SupabaseClient,
  orgId: string,
  itemId: string,
): Promise<void> {
  try {
    // Get the item to find its session_id
    const { data: item, error: itemError } = await db
      .from("stock_count_items")
      .select("id, session_id")
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      throw new NotFoundError("Count item not found");
    }

    // Verify session is in_progress and belongs to org
    const { data: session, error: sessionError } = await db
      .from("stock_count_sessions")
      .select("id, status")
      .eq("id", item.session_id)
      .eq("organization_id", orgId)
      .single();

    if (sessionError || !session) {
      throw new NotFoundError("Stock count session not found");
    }

    if (session.status !== "in_progress") {
      throw new ValidationError(
        "Cannot remove items from a completed or cancelled stock count session",
      );
    }

    // Delete the item
    const { error: deleteError } = await db
      .from("stock_count_items")
      .delete()
      .eq("id", itemId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    // Recalculate session totals
    await recalculateSessionTotals(db, item.session_id);
  } catch (error) {
    reportServerError("stockCount.removeCountItem", error);
    throw error;
  }
}

// ── Reconcile Session ─────────────────────────────────────────

export async function reconcileSession(
  db: SupabaseClient,
  orgId: string,
  sessionId: string,
  userId: string,
): Promise<StockCountSession & { movements_created: number }> {
  try {
    const { data, error } = await db.rpc("reconcile_stock_count_session", {
      p_org_id: orgId,
      p_session_id: sessionId,
      p_user_id: userId,
    });

    if (error) {
      if (error.code === "P0001") {
        if (error.message.includes("not found")) {
          throw new NotFoundError("Stock count session not found");
        }
        throw new ValidationError(error.message);
      }
      throw new Error(error.message);
    }

    const result = data as {
      session?: StockCountSession;
      movements_created?: number;
    } | null;

    if (!result?.session) {
      throw new Error("Failed to reconcile stock count session");
    }

    return {
      ...result.session,
      movements_created: result.movements_created ?? 0,
    };
  } catch (error) {
    reportServerError("stockCount.reconcileSession", error);
    throw error;
  }
}

// ── Cancel Session ─────────────────────────────────────────────

export async function cancelSession(
  db: SupabaseClient,
  orgId: string,
  sessionId: string,
): Promise<StockCountSession> {
  try {
    const { data: session, error: sessionError } = await db
      .from("stock_count_sessions")
      .select("id, notes, status")
      .eq("id", sessionId)
      .eq("organization_id", orgId)
      .single();

    if (sessionError || !session) {
      throw new NotFoundError("Stock count session not found");
    }

    if (session.status !== "in_progress") {
      throw new ValidationError("Session is already completed or cancelled");
    }

    const appendedNotes = [session.notes, "Cancelled"]
      .filter(Boolean)
      .join(" - ");

    const { data, error } = await db
      .from("stock_count_sessions")
      .update({
        status: "cancelled",
        notes: appendedNotes,
      })
      .eq("id", sessionId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to cancel session");
    }

    return data;
  } catch (error) {
    reportServerError("stockCount.cancelSession", error);
    throw error;
  }
}
