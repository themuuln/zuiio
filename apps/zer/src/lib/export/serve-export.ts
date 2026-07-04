import "server-only";

import { capture } from "@zuiio/capture";
import type { ExportColumn, ExportFormat } from "@zuiio/export";
import { serveEntityExport } from "@zuiio/export";
import { requireAppContext } from "@/lib/erp";
import type { Database } from "@/lib/supabase/types";

type TableName = keyof Database["public"]["Tables"];

/**
 * Minimal interface for the chained supabase filter builder.
 * The route config guarantees column names are valid for the chosen table.
 */
interface FilterQuery {
  eq(col: string, val: unknown): FilterQuery;
  is(col: string, val: unknown): FilterQuery;
  order(col: string, opts: { ascending: boolean }): FilterQuery;
  limit(n: number): Promise<{ data: unknown; error: unknown }>;
}

const today = () => new Date().toISOString().slice(0, 10);

export interface ServeExportConfig {
  /** Supabase table name */
  table: string;
  /** Columns to select (comma-separated string, may include foreign table refs) */
  select: string;
  /** Transform a raw row into the flat record to export */
  mapRow: (row: Record<string, unknown>) => Record<string, unknown>;
  /** Column definitions (header + key) */
  columns: ExportColumn[];
  /** Base filename (without extension); defaults to `${table}-export-${today()}` */
  filename?: string;
  /** Optional title for the export document */
  title?: string;
  /** Max rows to export (default 10_000) */
  limit?: number;
  /** Extra equality filters: `{ column: value }` */
  eq?: Record<string, string>;
  /** Columns to apply `.is("col", null)` on */
  isNull?: string[];
  /** Order clause */
  order?: { column: string; ascending?: boolean };
}

/**
 * Route handler factory for tabular exports.
 *
 * Parses `?format=` from the request (accepts "csv" or "xlsx"),
 * paginates with a configurable limit, wraps errors with `capture()`,
 * and delegates to `serveEntityExport` for formatting.
 */
export async function serveExportRoute(
  request: Request,
  config: ServeExportConfig,
): Promise<Response> {
  const { supabase, organizationId: _organizationId } =
    await requireAppContext();

  const { searchParams } = new URL(request.url);
  const formatParam = searchParams.get("format") ?? "csv";

  // Validate — only csv and xlsx allowed at the route layer
  if (!["csv", "xlsx"].includes(formatParam)) {
    return new Response("Unsupported export format", { status: 400 });
  }
  const format = formatParam as ExportFormat;

  const limit = config.limit ?? 10_000;

  try {
    // Unchecked cast through unknown — the route config guarantees a valid table name
    const table = config.table as unknown as TableName;

    let query: FilterQuery = supabase
      .from(table)
      .select(config.select) as unknown as FilterQuery;

    if (config.eq) {
      for (const [col, val] of Object.entries(config.eq)) {
        query = query.eq(col, val);
      }
    }

    if (config.isNull) {
      for (const col of config.isNull) {
        query = query.is(col, null);
      }
    }

    if (config.order) {
      query = query.order(config.order.column, {
        ascending: config.order.ascending ?? false,
      });
    }

    const { data, error } = await query.limit(limit);

    if (error) {
      capture(error, { context: `export/${config.table}` });
      return new Response("Export failed", { status: 500 });
    }

    const rows = ((data as Record<string, unknown>[]) ?? []).map((row) =>
      config.mapRow(row),
    );
    const filename = config.filename ?? `${config.table}-export-${today()}`;

    return serveEntityExport(
      rows,
      config.columns,
      format,
      filename,
      config.title,
    );
  } catch (error) {
    capture(error, { context: `export/${config.table}` });
    return new Response("Export failed", { status: 500 });
  }
}
