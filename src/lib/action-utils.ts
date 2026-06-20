import "server-only";
import { checkPermission, requireAppContext } from "@/lib/erp";
import type { AppPermission } from "@/lib/permissions";

export { requireAppContext } from "@/lib/erp";

export type ActionContext = Awaited<ReturnType<typeof requireAppContext>>;

export interface ActionError {
  error: string;
}

/**
 * Wraps requireAppContext + checkPermission + branch scope guard.
 *
 * Usage:
 * ```ts
 * const ctx = await requireActionContext("sales.create");
 * ```
 *
 * Returns the full context on success.
 * Returns `{ error: string }` if unauthorized or branch scope fails.
 */
export async function requireActionContext(
  permission: AppPermission,
): Promise<ActionContext | ActionError> {
  const ctx = await requireAppContext();
  const permError = checkPermission(ctx.permissions, permission);
  if (permError) return { error: permError };

  return ctx;
}

/**
 * Guard for branch-scoped users, returning a user-facing error
 * when the branch context is missing.
 */
export function requireBranchScope(ctx: ActionContext): ActionError | null {
  if (ctx.isBranchScoped && !ctx.branchId) {
    return { error: "Салбар тодорхойгүй байна." };
  }
  return null;
}

/**
 * Wraps requireAppContext + checkPermission + branch scope guard
 * in a single call. Convenience for write actions that need all three.
 *
 * Usage:
 * ```ts
 * const ctx = await requireWriteAction("sales.create");
 * if ("error" in ctx) return ctx;
 * // ctx.branchId is guaranteed non-null for scoped users
 * ```
 */
export async function requireWriteAction(
  permission: AppPermission,
): Promise<(ActionContext & { branchId: string }) | ActionError> {
  const ctx = await requireAppContext();
  const permError = checkPermission(ctx.permissions, permission);
  if (permError) return { error: permError };

  if (ctx.isBranchScoped && !ctx.branchId) {
    return { error: "Салбар тодорхойгүй байна." };
  }

  return ctx as ActionContext & { branchId: string };
}
