/**
 * Minimal structural client types used by the data-layer helpers.
 *
 * The real `@supabase/supabase-js` client is structurally compatible
 * (its builders are PromiseLike), so screens pass `supabase` directly
 * while unit tests pass plain fakes — no module mocking required.
 */

export interface RpcClient {
  rpc(
    fn: string,
    args?: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

export interface TableClient {
  from(table: string): {
    select(columns: string): {
      eq(
        column: string,
        value: string,
      ): {
        maybeSingle(): PromiseLike<{
          data: unknown;
          error: { message: string } | null;
        }>;
      };
    };
    upsert(
      row: Record<string, unknown>,
    ): PromiseLike<{ error: { message: string } | null }>;
  };
}
