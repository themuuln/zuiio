import { NextResponse } from "next/server";
import { createRouteHandler } from "./api-handler";
export { createRouteHandler };

/**
 * Standard API response helpers.
 *
 * Usage in route handlers:
 * ```ts
 * export const GET = createRouteHandler(async ({ orgId }) => {
 *   const data = await getItems(orgId);
 *   return ok(data);
 * });
 * ```
 */

/** 200 OK — returns `{ data }` */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

/** 201 Created — returns `{ data }` */
export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

/** 204 No Content — empty body */
export function noContent() {
  return new NextResponse(null, { status: 204 });
}

/** Structured API error response */
export function apiError(
  code: string,
  message: string,
  status: number,
  headers?: HeadersInit,
) {
  return NextResponse.json({ error: { code, message } }, { status, headers });
}
