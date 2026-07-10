import type { SupabaseClient } from "@supabase/supabase-js";

export interface BatchUpsertOptions<T> {
  table: string;
  rows: T[];
  onConflict?: string;
  chunkSize?: number;
}

export interface BatchResult<T> {
  data: T[];
  count: number;
}

export async function batchUpsert<T>(
  supabase: SupabaseClient,
  options: BatchUpsertOptions<T>,
): Promise<BatchResult<T>> {
  const { table, rows, onConflict } = options;
  if (rows.length === 0) {
    return { data: [], count: 0 };
  }

  const { data, error } = await supabase
    .from(table)
    .upsert(rows as never[], onConflict ? { onConflict } : undefined)
    .select();

  if (error) throw error;
  return { data: (data ?? []) as T[], count: data?.length ?? 0 };
}

export async function checkThenUpsert<T>(
  supabase: SupabaseClient,
  options: BatchUpsertOptions<T>,
): Promise<BatchResult<T>> {
  return batchUpsert(supabase, options);
}
