import type { SupabaseClient } from "@supabase/supabase-js";

export interface ListOptions {
  /** Column to order by (default: "created_at") */
  orderBy?: string;
  ascending?: boolean;
  /** Supabase .range() args — use paginate() from @zer/core */
  from?: number;
  to?: number;
  /** Column equality filters, e.g. { org_id: "abc", status: "active" } */
  filters?: Record<string, unknown>;
}

export interface QueryResult<T> {
  data: T[];
  count: number | null;
}

/**
 * Generic CRUD factory — pass your Supabase client + table name, get typed list/get/create/update/remove.
 *
 * @example
 * const products = createSimpleQuery<Product>(supabase, "products");
 * const { data } = await products.list({ filters: { org_id: orgId } });
 */
export function createSimpleQuery<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
) {
  return {
    async list(opts: ListOptions = {}): Promise<QueryResult<T>> {
      const {
        orderBy = "created_at",
        ascending = false,
        from,
        to,
        filters,
      } = opts;

      let q = supabase
        .from(table)
        .select("*", { count: "exact" })
        .order(orderBy, { ascending });

      if (filters) {
        for (const [col, val] of Object.entries(filters)) {
          if (val !== undefined && val !== null) {
            q = q.eq(col, val);
          }
        }
      }

      if (from !== undefined && to !== undefined) {
        q = q.range(from, to);
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return { data: (data ?? []) as T[], count };
    },

    async getById(id: string): Promise<T | null> {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return data as T;
    },

    async create(
      record: Omit<T, "id" | "created_at" | "updated_at">,
    ): Promise<T> {
      const { data, error } = await supabase
        .from(table)
        // biome-ignore lint/suspicious/noExplicitAny: Supabase generic mismatch with Omit<T,...>
        .insert(record as any)
        .select()
        .single();
      if (error) throw error;
      return data as T;
    },

    async update(
      id: string,
      record: Partial<Omit<T, "id" | "created_at">>,
    ): Promise<T> {
      const { data, error } = await supabase
        .from(table)
        // biome-ignore lint/suspicious/noExplicitAny: Supabase generic mismatch with Partial<Omit<T,...>>
        .update(record as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as T;
    },

    async remove(id: string): Promise<void> {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
  };
}
