import type { SupabaseClient } from "@supabase/supabase-js";

export interface ListOptions {
  orderBy?: string;
  ascending?: boolean;
  from?: number;
  to?: number;
  filters?: Record<string, unknown>;
}

export interface QueryResult<T> {
  data: T[];
  count: number | null;
}

export async function listRecords<T>(
  supabase: SupabaseClient,
  table: string,
  opts: ListOptions = {},
): Promise<QueryResult<T>> {
  const { orderBy = "created_at", ascending = false, from, to, filters = {} } = opts;

  let query = supabase
    .from(table)
    .select("*", { count: "exact" })
    .order(orderBy, { ascending });

  for (const [col, val] of Object.entries(filters)) {
    if (val !== undefined && val !== null && val !== "") {
      query = query.eq(col, val);
    }
  }

  if (from !== undefined && to !== undefined) {
    query = query.range(from, to);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: (data ?? []) as T[], count };
}

export async function getRecord<T>(
  supabase: SupabaseClient,
  table: string,
  id: string,
): Promise<T | null> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as T | null;
}
