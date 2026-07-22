import type { NextRequest } from "next/server";

/**
 * Shared test utilities and mocks for admin tests.
 */

/** Creates a mock Supabase response for chained queries */
export function mockQueryResult<T>(data: T | null, error: Error | null = null) {
  return {
    data,
    error,
    count: null,
  };
}

/** Creates a mock Supabase query builder for select().single() */
export function mockSingleResult<T>(
  data: T | null,
  error: Error | null = null,
) {
  return Promise.resolve({
    data,
    error,
    count: null,
    status: error ? 500 : 200,
    statusText: error ? error.message : "OK",
  });
}

/** Mock NextRequest helper */
export function createMockRequest(
  body?: Record<string, unknown>,
  url = "http://localhost:3000/admin/api/test",
  method = "GET",
): NextRequest {
  return {
    json: () => Promise.resolve(body ?? {}),
    nextUrl: new URL(url),
    method,
    headers: new Headers(),
  } as unknown as NextRequest;
}

/** Creates a mock params Promise for Next.js route handlers */
export function createMockParams(id: string): Promise<{ id: string }> {
  return Promise.resolve({ id });
}

/** Mock Supabase get user response */
export function mockUser(userId = "admin-user-id") {
  return {
    data: { user: { id: userId, email: "admin@onoo.mn" } },
    error: null,
  };
}

/** Mock unauthenticated user response */
export function mockNoUser() {
  return {
    data: { user: null },
    error: null,
  };
}

/** Mock NextResponse for route handler tests */
export function parseResponse(response: Response) {
  return response.json().catch(() => null);
}
