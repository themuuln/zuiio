/**
 * Mock factory for @/lib/supabase/server module.
 * Provides a chainable query builder mock for testing API route handlers.
 */

type QueryResult<T = unknown> = {
  data: T | null;
  error: Error | null;
  count: null;
};

class MockQueryBuilder<T = unknown> {
  private result: QueryResult<T>;

  constructor(result: QueryResult<T>) {
    this.result = result;
  }

  select(_select?: string, _opts?: { count?: "exact"; head?: boolean }) {
    if (_opts?.head) {
      const count =
        this.result.data && Array.isArray(this.result.data)
          ? this.result.data.length
          : 0;
      // Return a thenable that resolves with { data: null, error: null, count }
      // so await supabase.from(...).select(..., { head: true }) works
      this.result = { data: null, error: null, count } as QueryResult;
    }
    return this;
  }

  eq(_field: string, _value: unknown) {
    return this;
  }

  single() {
    return this;
  }

  order(_field: string, _opts?: { ascending?: boolean }) {
    return this;
  }

  limit(_n: number) {
    return this;
  }

  lt(_field: string, _value: string) {
    return this;
  }

  or(_filter: string) {
    return this;
  }

  insert(_data: unknown) {
    return this;
  }

  update(_data: unknown) {
    return this;
  }

  delete() {
    this.result = { ...this.result, data: null, count: null };
    return this;
  }

  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>)
      | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(
      onfulfilled as (value: QueryResult<T>) => TResult1,
    );
  }

  catch<TResult = never>(
    onrejected?: ((reason: Error) => TResult | PromiseLike<TResult>) | null,
  ): Promise<QueryResult<T> | TResult> {
    return Promise.resolve(this.result).catch(onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<QueryResult<T>> {
    return Promise.resolve(this.result).finally(onfinally);
  }

  [Symbol.toStringTag] = "MockQueryBuilder";
}

interface MockAuth {
  getUser: () => Promise<{
    data: { user: { id: string; email: string } | null };
    error: null;
  }>;
}

interface MockFrom {
  from: (table: string) => MockQueryBuilder;
  auth: MockAuth;
}

export function createMockSupabase(authResult?: {
  user: { id: string; email: string } | null;
}) {
  const user =
    authResult === undefined
      ? { id: "admin-user-id", email: "admin@onoo.mn" }
      : authResult.user;

  const mock: MockFrom & { _queryResults: Map<string, unknown> } = {
    _queryResults: new Map(),

    from(table: string) {
      const result = this._queryResults.get(table) ?? { data: [], error: null };
      return new MockQueryBuilder(result as QueryResult);
    },

    auth: {
      getUser() {
        return Promise.resolve({
          data: { user },
          error: null,
        });
      },
    },
  };

  return mock;
}

/**
 * Set a mock result for a specific table query.
 */
export function setQueryResult<T>(
  mock: MockFrom & { _queryResults: Map<string, unknown> },
  table: string,
  data: T | null,
  error: Error | null = null,
) {
  mock._queryResults.set(table, { data, error, count: null });
}

export type { MockFrom, QueryResult };
/**
 * Mock the createClient function from @/lib/supabase/server for vitest.
 * Usage in tests:
 *   vi.mock("@/lib/supabase/server", () => ({
 *     createClient: vi.fn(() => createMockSupabase()),
 *   }));
 */
export { MockQueryBuilder };
