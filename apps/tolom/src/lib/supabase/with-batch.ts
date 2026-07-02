/**
 * Batch upsert helper — reliable bulk operations with chunking,
 * conflict handling, and per-row error visibility.
 *
 * Supabase pitfalls it addresses:
 * - Missing UNIQUE constraint → upsert silently inserts duplicates
 *   (throws here instead of silently corrupting data)
 * - Oversized batches → auto-chunks into safe request sizes
 * - Immutable field reset → use checkThenUpsert to preserve fields
 *   during recalculation operations
 */
// ── Config ─────────────────────────────────────────────────────

const DEFAULT_CHUNK_SIZE = 50;

// ── Types ──────────────────────────────────────────────────────

export interface BatchUpsertOptions {
  /** Column(s) for ON CONFLICT resolution (required for upsert — prevents silent duplicates) */
  onConflict?: string;
  /** Ignore duplicate rows instead of updating them */
  ignoreDuplicates?: boolean;
  /** Max rows per API call (default: 50). Supabase typically handles 50-100 rows per request. */
  chunkSize?: number;
}

export interface BatchResult {
  inserted: number;
  errors: Array<{ index: number; row: unknown; error: string }>;
}

// ── Helpers ────────────────────────────────────────────────────

/**
 * Splits an array into chunks of the given size.
 */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ── Public API ──────────────────────────────────────────────────

/**
 * Upserts rows in chunks, collecting per-row errors so a partial
 * failure doesn't lose the entire batch.
 *
 * Requires `onConflict` to be set (throws if omitted) — this prevents
 * the silent duplicate-insertion pitfall documented in TOLOM AGENTS.md.
 *
 * @example
 * const result = await batchUpsert(
 *   supabase,
 *   "inventory_movements",
 *   movements,
 *   { onConflict: "id" },
 * );
 *
 * @example
 * // Without onConflict — throws
 * const result = await batchUpsert(supabase, "inventory_movements", movements);
 * // → Error: "onConflict is required for batchUpsert"
 *
 * @example
 * // Ignore duplicates (INSERT ... ON CONFLICT DO NOTHING)
 * const result = await batchUpsert(supabase, "audit_logs", logs, {
 *   onConflict: "id",
 *   ignoreDuplicates: true,
 * });
 */
export async function batchUpsert<T extends Record<string, unknown>>(
  supabase: { from: (table: string) => any },
  table: string,
  rows: T[],
  options?: BatchUpsertOptions,
): Promise<BatchResult> {
  if (!options?.onConflict) {
    throw new Error(
      "batchUpsert: `onConflict` is required. " +
        "Without it, upsert silently inserts duplicates when the UNIQUE constraint is missing. " +
        "Set onConflict to the column(s) that define uniqueness for this table.",
    );
  }

  if (rows.length === 0) {
    return { inserted: 0, errors: [] };
  }

  const chunkSize = options?.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const chunks = chunkArray(rows, chunkSize);
  let inserted = 0;
  const errors: BatchResult["errors"] = [];

  for (const chunk of chunks) {
    try {
      const query = supabase
        .from(table)
        .upsert(chunk, {
          onConflict: options.onConflict,
          ignoreDuplicates: options.ignoreDuplicates ?? false,
        })
        .select();

      const { error } = await query;

      if (error) {
        // Chunk-level error — attribute the whole chunk as errors
        for (let i = 0; i < chunk.length; i++) {
          errors.push({
            index: inserted + i,
            row: chunk[i],
            error: error.message,
          });
        }
      } else {
        inserted += chunk.length;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      for (let i = 0; i < chunk.length; i++) {
        errors.push({
          index: inserted + i,
          row: chunk[i],
          error: message,
        });
      }
    }
  }

  return { inserted, errors };
}

/**
 * Check-then-upsert pattern for recalculation operations where
 * certain fields (status, immutable timestamps) must be preserved.
 *
 * Reads existing rows matching the conflict keys, merges the incoming
 * data with preserved fields, then upserts.
 *
 * @example
 * // During payroll recalculation: preserve `status` and `paid_at`
 * const result = await checkThenUpsert(
 *   supabase,
 *   "payroll_records",
 *   recalculatedRows,
 *   { onConflict: "id", preserve: ["status", "paid_at"] },
 * );
 */
export async function checkThenUpsert<T extends Record<string, unknown>>(
  supabase: { from: (table: string) => any },
  table: string,
  rows: T[],
  options: BatchUpsertOptions & {
    /** Fields to preserve from existing rows instead of overwriting */
    preserve: string[];
    /** Column to use for querying existing rows (default: "id") */
    lookupKey?: string;
  },
): Promise<BatchResult> {
  const lookupKey = options.lookupKey ?? "id";
  const ids = rows
    .map((r) => r[lookupKey])
    .filter((id): id is string | number => id != null);

  // Fetch existing rows
  const existingMap = new Map<string | number, Record<string, unknown>>();
  if (ids.length > 0) {
    const { data: existing } = await supabase
      .from(table)
      .select(`*`)
      .in(lookupKey, ids);

    if (existing) {
      for (const row of existing) {
        existingMap.set(row[lookupKey] as string | number, row);
      }
    }
  }

  // Merge preserved fields into incoming rows
  const merged = rows.map((row) => {
    const existing = existingMap.get(row[lookupKey] as string | number);
    if (!existing) return row; // new row, nothing to preserve

    const result = { ...row } as Record<string, unknown>;
    for (const field of options.preserve) {
      if (field in existing) {
        result[field] = existing[field];
      }
    }
    return result as T;
  });

  return batchUpsert(supabase, table, merged, options);
}
