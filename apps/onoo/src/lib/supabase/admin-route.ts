/**
 * Admin API route handler factory — eliminates auth/Sentry/error boilerplate.
 */
import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function withAuth<T>(
  fn: (supabase: SupabaseClient) => Promise<NextResponse<T>>,
): Promise<NextResponse<T | { error: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      ) as unknown as NextResponse<T | { error: string }>;
    }
    return await fn(supabase);
  } catch (err) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface CrudConfig {
  select?: string;
}

interface QueryBuilder {
  eq: (column: string, value: unknown) => QueryBuilder;
  order: (column: string, opts?: { ascending?: boolean }) => QueryBuilder;
}

export function createRouteHandlers(table: string, config: CrudConfig = {}) {
  const select = config.select ?? "*";

  return {
    list:
      (filter?: (query: QueryBuilder, request: NextRequest) => QueryBuilder) =>
      (request: NextRequest) =>
        withAuth<unknown>(async (supabase) => {
          const query: QueryBuilder = supabase
            .from(table)
            .select(select) as unknown as QueryBuilder;
          const _q = filter ? filter(query, request) : query;
          const _r = await (_q as unknown as Promise<{
            data: unknown;
            error: unknown;
          }>);
          if (_r.error) throw _r.error;
          return NextResponse.json(_r.data as never);
        }),

    create:
      (
        transform?: (
          body: Record<string, unknown>,
        ) =>
          | Record<string, unknown>
          | { insert: Record<string, unknown>; validate?: string },
      ) =>
      async (request: NextRequest) =>
        withAuth<unknown>(async (supabase) => {
          const body = await request.json();
          if (transform) {
            const result = transform(body);
            if ("validate" in result && result.validate) {
              return NextResponse.json(
                { error: result.validate },
                { status: 400 },
              ) as unknown as NextResponse<unknown>;
            }
            const insertBody = "insert" in result ? result.insert : result;
            const r = await (supabase
              .from(table)
              .insert(insertBody as never)
              .select(select)
              .single() as unknown as Promise<{
              data: unknown;
              error: unknown;
            }>);
            if (r.error) throw r.error;
            return NextResponse.json(r.data as never, { status: 201 });
          }
          const r = await (supabase
            .from(table)
            .insert(body)
            .select(select)
            .single() as unknown as Promise<{ data: unknown; error: unknown }>);
          if (r.error) throw r.error;
          return NextResponse.json(r.data as never, { status: 201 });
        }),

    getById:
      () =>
      async (
        _request: NextRequest,
        { params }: { params: Promise<{ id: string }> },
      ) =>
        withAuth<unknown>(async (supabase) => {
          const { id } = await params;
          const r = await (supabase
            .from(table)
            .select(select)
            .eq("id", id)
            .single() as unknown as Promise<{ data: unknown; error: unknown }>);
          if (r.error) throw r.error;
          return NextResponse.json(r.data as never);
        }),

    update:
      (
        transform?: (body: Record<string, unknown>) => Record<string, unknown>,
      ) =>
      async (
        request: NextRequest,
        { params }: { params: Promise<{ id: string }> },
      ) =>
        withAuth<unknown>(async (supabase) => {
          const { id } = await params;
          const body = await request.json();
          const updateBody = transform ? transform(body) : body;
          const r = await (supabase
            .from(table)
            .update(updateBody)
            .eq("id", id)
            .select(select)
            .single() as unknown as Promise<{ data: unknown; error: unknown }>);
          if (r.error) throw r.error;
          return NextResponse.json(r.data as never);
        }),

    remove:
      () =>
      async (
        _request: NextRequest,
        { params }: { params: Promise<{ id: string }> },
      ) =>
        withAuth<unknown>(async (supabase) => {
          const { id } = await params;
          const r = await (supabase
            .from(table)
            .delete()
            .eq("id", id) as unknown as Promise<{ error: unknown }>);
          if (r.error) throw r.error;
          return new NextResponse(null, { status: 204 });
        }),
  };
}
