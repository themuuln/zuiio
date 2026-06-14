import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { AppError, NotFoundError, ValidationError } from "@/lib/errors";
import { resolveBranchId } from "@/lib/supabase/with-branch";
import type { PaginatedResponse } from "@/lib/types";
import { buildUpdates, type FieldMap } from "./build-updates";

// ── Types ──────────────────────────────────────────────────────

/**
 * Context object passed to all hooks.
 * Carries the authenticated db client, org ID, and user ID.
 */
export interface ServiceContext {
  db: SupabaseClient;
  orgId: string;
  userId: string;
}

/**
 * Hooks for custom behavior in the CRUD lifecycle.
 */
export interface CrudServiceHooks<TRecord, TInsert, TUpdate> {
  /** Called before create — return partial params to merge into the insert. */
  beforeCreate?: (
    params: TInsert,
    ctx: ServiceContext,
  ) => Promise<Partial<TInsert>>;

  /** Called after a successful create. */
  afterCreate?: (result: TRecord, ctx: ServiceContext) => Promise<void>;

  /** Called before update — return partial params to merge into the update. */
  beforeUpdate?: (
    existing: TRecord,
    params: TUpdate,
    ctx: ServiceContext,
  ) => Promise<Partial<TUpdate>>;

  /** Called after a successful update. */
  afterUpdate?: (result: TRecord, ctx: ServiceContext) => Promise<void>;

  /** Called before soft-delete. */
  beforeDelete?: (existing: TRecord, ctx: ServiceContext) => Promise<void>;

  /**
   * Called on every getAll query after base filters are applied.
   * Use for additional filters (search, date ranges, etc.).
   */
  onQuery?: (
    query: ReturnType<SupabaseClient["from"]>,
    options?: Record<string, unknown>,
  ) => ReturnType<SupabaseClient["from"]>;
}

/**
 * Configuration for createCrudService.
 */
export interface CrudServiceConfig<TRecord, TInsert, TUpdate> {
  /** The database table name (snake_case). */
  tableName: string;

  /** Columns to select in getAll queries. */
  selectColumns: string;

  /**
   * Columns to select for getById / update / delete.
   * Defaults to `selectColumns` if not provided.
   */
  selectColumnsById?: string;

  /** Generates the cache tag for collection invalidation. */
  cacheTagKey: (orgId: string) => string;

  /** Optional per-record cache tag for granular invalidation. */
  cacheTagKeyById?: (id: string) => string;

  /** Default ordering for getAll. */
  orderBy?: { column: string; direction?: "asc" | "desc" };

  /**
   * Field map for buildUpdates during PATCH operations.
   * Maps camelCase param keys to snake_case DB columns with optional transforms.
   */
  fieldMap?: FieldMap<TUpdate>;

  /** Lifecycle hooks. */
  hooks?: CrudServiceHooks<TRecord, TInsert, TUpdate>;
}

/**
 * Return type of createCrudService.
 */
export interface CrudServiceReturn<TRecord, TInsert, TUpdate> {
  /**
   * Paginated list with automatic org + soft-delete filtering.
   * Page defaults to 1, pageSize defaults to 50 (max 100).
   */
  getAll: (
    db: SupabaseClient,
    orgId: string,
    options?: {
      page?: number;
      pageSize?: number;
      branchId?: string;
      [key: string]: unknown;
    },
  ) => Promise<PaginatedResponse<TRecord>>;

  /** Get a single record by ID. Throws NotFoundError if missing. */
  getById: (db: SupabaseClient, orgId: string, id: string) => Promise<TRecord>;

  /** Create a new record with audit log and cache invalidation. */
  create: (
    db: SupabaseClient,
    orgId: string,
    params: TInsert,
    userId: string,
  ) => Promise<TRecord>;

  /**
   * Update an existing record with audit log and cache invalidation.
   * Throws NotFoundError if record is missing.
   * Throws ValidationError if no fields to update.
   */
  update: (
    db: SupabaseClient,
    orgId: string,
    id: string,
    params: TUpdate,
    userId: string,
  ) => Promise<TRecord>;

  /** Soft-delete a record with audit log and cache invalidation. */
  softDelete: (
    db: SupabaseClient,
    orgId: string,
    id: string,
    userId: string,
  ) => Promise<void>;
}

// ── Response Mappers ───────────────────────────────────────────

/**
 * Type-safe response mapper that eliminates `as unknown as T` casts.
 *
 * The cast is still performed internally (a JS runtime identity) but is
 * encapsulated here so service code never needs the ugly double-assertion.
 */
function toTypedResponse<T>(data: unknown): T {
  return data as T;
}

/**
 * Build a typed PaginatedResponse from raw query results.
 */
function toPaginatedResponse<T>(
  data: unknown[],
  count: number | null,
  page: number,
  pageSize: number,
): PaginatedResponse<T> {
  return {
    data: data as T[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

// ── Helpers ────────────────────────────────────────────────────

/**
 * Extract the `id` field from a Supabase result row at runtime.
 */
function extractId(row: Record<string, unknown>): string {
  const id = row.id;
  if (typeof id !== "string" || !id) {
    throw new AppError("Inserted record is missing an 'id' field", "INTERNAL_ERROR", 500);
  }
  return id;
}

// ── Factory ────────────────────────────────────────────────────

/**
 * Create a composable CRUD service for a database table.
 *
 * Standardizes: org filtering, soft-delete filtering, audit logging,
 * cache invalidation, branch resolution, type-safe response mapping,
 * and proper error types.
 *
 * @example
 * ```ts
 * export const crud = createCrudService<Branch, CreateBranchParams, UpdateBranchParams>({
 *   tableName: 'branches',
 *   selectColumns: 'id, organization_id, name, address, phone, email, created_at',
 *   cacheTagKey: (orgId) => cacheTags.branches(orgId),
 *   orderBy: { column: 'name', direction: 'asc' },
 *   fieldMap: {
 *     columns: { name: 'name', address: 'address' },
 *     transforms: { name: trimField },
 *   },
 * });
 * ```
 */
export function createCrudService<
  TRecord,
  TInsert = TRecord,
  TUpdate = TRecord,
>(
  config: CrudServiceConfig<TRecord, TInsert, TUpdate>,
): CrudServiceReturn<TRecord, TInsert, TUpdate> {
  const {
    tableName,
    selectColumns,
    cacheTagKey,
    cacheTagKeyById,
    orderBy,
    fieldMap,
    hooks,
  } = config;

  const selectColumnsById =
    config.selectColumnsById ?? selectColumns;

  // ── getAll ──────────────────────────────────────────────

  const getAll: CrudServiceReturn<TRecord, TInsert, TUpdate>["getAll"] = async (
    db,
    orgId,
    options,
  ) => {
    const page = Math.max(1, options?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, options?.pageSize ?? 50));
    const offset = (page - 1) * pageSize;

    let query = db
      .from(tableName)
      .select(selectColumns, { count: "exact" })
      .eq("organization_id", orgId)
      .is("deleted_at", null);

    // Apply branch filter if provided
    if (options?.branchId) {
      query = query.eq("branch_id", options.branchId);
    }

    // Apply onQuery hook for custom filters
    if (hooks?.onQuery) {
      query = hooks.onQuery(query, options);
    }

    // Apply default ordering
    if (orderBy) {
      query = query.order(orderBy.column, {
        ascending: orderBy.direction !== "desc",
      });
    }

    const { data, count, error } = await query.range(
      offset,
      offset + pageSize - 1,
    );

    if (error) {
      throw new AppError(error.message, "DATABASE_ERROR", 500);
    }

    return toPaginatedResponse<TRecord>(data ?? [], count, page, pageSize);
  };

  // ── getById ─────────────────────────────────────────────

  const getById: CrudServiceReturn<TRecord, TInsert, TUpdate>["getById"] = async (
    db,
    orgId,
    id,
  ) => {
    const { data, error } = await db
      .from(tableName)
      .select(selectColumnsById)
      .eq("id", id)
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .single();

    if (error || !data) {
      throw new NotFoundError(`${tableName} not found`);
    }

    return toTypedResponse<TRecord>(data);
  };

  // ── create ──────────────────────────────────────────────

  const create: CrudServiceReturn<TRecord, TInsert, TUpdate>["create"] = async (
    db,
    orgId,
    params,
    userId,
  ) => {
    const ctx: ServiceContext = { db, orgId, userId };

    // Resolve insert params: start with raw params, merge beforeCreate result
    let insertParams: Record<string, unknown> = {
      ...(params as Record<string, unknown>),
    };

    if (hooks?.beforeCreate) {
      const hookResult = await hooks.beforeCreate(params, ctx);
      insertParams = {
        ...insertParams,
        ...(hookResult as Record<string, unknown>),
      };
    }

    // Resolve branch ID if the param set includes a branchId
    if ("branchId" in insertParams) {
      const branchId = insertParams.branchId as string | undefined | null;
      const resolvedId = await resolveBranchId(db, orgId, branchId ?? undefined, {
        strict: false,
      });
      insertParams.branch_id = resolvedId;
      delete insertParams.branchId;
    }

    // Add standard fields
    insertParams.organization_id = orgId;
    insertParams.created_by = userId;
    insertParams.updated_by = userId;

    const { data, error } = await db
      .from(tableName)
      .insert(insertParams)
      .select(selectColumnsById)
      .single();

    if (error || !data) {
      throw new AppError(error?.message ?? `Failed to create ${tableName}`, "DATABASE_ERROR", 500);
    }

    const result = toTypedResponse<TRecord>(data);

    // Audit log
    await createAuditLog({
      supabase: db,
      action: "create",
      table_name: tableName,
      record_id: extractId(data as Record<string, unknown>),
      user_id: userId,
      organization_id: orgId,
      new_data: data as Record<string, unknown>,
    });

    // Cache invalidation
    revalidateTag(cacheTagKey(orgId), "max");

    if (cacheTagKeyById) {
      revalidateTag(cacheTagKeyById(extractId(data as Record<string, unknown>)), "max");
    }

    // afterCreate hook
    if (hooks?.afterCreate) {
      await hooks.afterCreate(result, ctx);
    }

    return result;
  };

  // ── update ──────────────────────────────────────────────

  const update: CrudServiceReturn<TRecord, TInsert, TUpdate>["update"] = async (
    db,
    orgId,
    id,
    params,
    userId,
  ) => {
    const ctx: ServiceContext = { db, orgId, userId };

    // Fetch existing record
    const { data: existing, error: fetchError } = await db
      .from(tableName)
      .select(selectColumnsById)
      .eq("id", id)
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundError(`${tableName} not found`);
    }

    const existingRecord = toTypedResponse<TRecord>(existing);

    // Apply beforeUpdate hook
    let resolvedParams: Record<string, unknown> = {
      ...(params as Record<string, unknown>),
    };

    if (hooks?.beforeUpdate) {
      const hookUpdates = await hooks.beforeUpdate(existingRecord, params, ctx);
      resolvedParams = {
        ...resolvedParams,
        ...(hookUpdates as Record<string, unknown>),
      };
    }

    // Build updates using fieldMap if provided
    let updates: Record<string, unknown>;
    if (fieldMap) {
      updates = buildUpdates(
        resolvedParams as Parameters<typeof buildUpdates>[0],
        fieldMap as Parameters<typeof buildUpdates>[1],
      );
    } else {
      updates = resolvedParams;
    }
    updates.updated_by = userId;

    if (Object.keys(updates).length <= 1) {
      throw new ValidationError("No fields to update");
    }

    const { data, error } = await db
      .from(tableName)
      .update(updates)
      .eq("id", id)
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .select(selectColumnsById)
      .single();

    if (error || !data) {
      throw new AppError(error?.message ?? `Failed to update ${tableName}`, "DATABASE_ERROR", 500);
    }

    const result = toTypedResponse<TRecord>(data);

    // Audit log
    await createAuditLog({
      supabase: db,
      action: "update",
      table_name: tableName,
      record_id: id,
      user_id: userId,
      organization_id: orgId,
      old_data: existing as Record<string, unknown>,
      new_data: data as Record<string, unknown>,
    });

    // Cache invalidation
    revalidateTag(cacheTagKey(orgId), "max");
    if (cacheTagKeyById) {
      revalidateTag(cacheTagKeyById(id), "max");
    }

    // afterUpdate hook
    if (hooks?.afterUpdate) {
      await hooks.afterUpdate(result, ctx);
    }

    return result;
  };

  // ── softDelete ──────────────────────────────────────────

  const softDelete: CrudServiceReturn<
    TRecord,
    TInsert,
    TUpdate
  >["softDelete"] = async (db, orgId, id, userId) => {
    const ctx: ServiceContext = { db, orgId, userId };

    // Fetch existing record
    const { data: existing, error: fetchError } = await db
      .from(tableName)
      .select(selectColumnsById)
      .eq("id", id)
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .single();

    if (fetchError || !existing) {
      throw new NotFoundError(`${tableName} not found`);
    }

    const existingRecord = toTypedResponse<TRecord>(existing);

    // beforeDelete hook
    if (hooks?.beforeDelete) {
      await hooks.beforeDelete(existingRecord, ctx);
    }

    const { error } = await db
      .from(tableName)
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) {
      throw new AppError(error.message, "DATABASE_ERROR", 500);
    }

    // Audit log
    await createAuditLog({
      supabase: db,
      action: "soft_delete",
      table_name: tableName,
      record_id: id,
      user_id: userId,
      organization_id: orgId,
      old_data: existing as Record<string, unknown>,
    });

    // Cache invalidation
    revalidateTag(cacheTagKey(orgId), "max");
    if (cacheTagKeyById) {
      revalidateTag(cacheTagKeyById(id), "max");
    }
  };

  return { getAll, getById, create, update, softDelete };
}
