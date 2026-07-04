/**
 * Standard API response helpers using the standard `Response` API.
 *
 * Framework-agnostic — works with Next.js, Bun, Deno, and any
 * runtime that supports `Response.json()`.
 *
 * @example
 * ```ts
 * import { ok, created, noContent, apiError } from "@zuiio/supabase";
 *
 * export async function GET() {
 *   const data = await getItems();
 *   return ok(data);
 * }
 * ```
 */

/** 200 OK — returns `{ data }` */
export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json({ data }, init);
}

/** 201 Created — returns `{ data }` */
export function created<T>(data: T) {
  return Response.json({ data }, { status: 201 });
}

/** 204 No Content — empty body */
export function noContent() {
  return new Response(null, { status: 204 });
}

/** Structured API error response */
export function apiError(
  code: string,
  message: string,
  status: number,
  headers?: HeadersInit,
) {
  return Response.json({ error: { code, message } }, { status, headers });
}
