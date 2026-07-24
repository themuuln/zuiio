/**
 * Creates a minimal mock Supabase client for integration testing.
 * Supports `.from().select().eq().single()` chains and basic operations.
 */
import { vi } from "vitest";

type MockResponse = {
	data: unknown | null;
	error: unknown | null;
};

/**
 * Build a chainable mock for Supabase queries.
 * Each chained method returns `this` for chaining, and `.single()`/`then` resolve the response.
 */
export function createMockSupabase(response?: MockResponse) {
	const mockResponse: MockResponse = response ?? {
		data: null,
		error: null,
	};

	const buildChain = (currentResponse: MockResponse) => {
		const chain: Record<string, unknown> = {
			select: vi.fn(() => chain),
			insert: vi.fn(() => chain),
			update: vi.fn(() => chain),
			upsert: vi.fn(() => chain),
			delete: vi.fn(() => chain),
			eq: vi.fn(() => chain),
			neq: vi.fn(() => chain),
			in: vi.fn(() => chain),
			not: vi.fn(() => chain),
			or: vi.fn(() => chain),
			order: vi.fn(() => chain),
			limit: vi.fn(() => chain),
			range: vi.fn(() => chain),
			ilike: vi.fn(() => chain),
			gte: vi.fn(() => chain),
			lte: vi.fn(() => chain),
			is: vi.fn(() => chain),
			contains: vi.fn(() => chain),
			textSearch: vi.fn(() => chain),
			single: vi.fn(() => Promise.resolve(currentResponse)),
			then: vi.fn((resolve: (value: MockResponse) => unknown) =>
				resolve(currentResponse),
			),
			maybeSingle: vi.fn(() => Promise.resolve(currentResponse)),
			rpc: vi.fn(() => Promise.resolve(currentResponse)),
			count: vi.fn(() => currentResponse),
		};
		return chain;
	};

	return {
		from: vi.fn(() => buildChain(mockResponse)),
		rpc: vi.fn(() => Promise.resolve(mockResponse)),
		auth: {
			getUser: vi.fn(() => Promise.resolve(mockResponse)),
			getSession: vi.fn(() => Promise.resolve(mockResponse)),
			signInWithPassword: vi.fn(() => Promise.resolve(mockResponse)),
		},
	};
}

/** Create a mock Supabase that returns specific data for a table. */
export function createMockSupabaseWithData(tableName: string, data: unknown[]) {
	const chain = {
		select: vi.fn(() => chain),
		insert: vi.fn(() => chain),
		update: vi.fn(() => chain),
		upsert: vi.fn(() => chain),
		delete: vi.fn(() => chain),
		eq: vi.fn(() => chain),
		neq: vi.fn(() => chain),
		in: vi.fn(() => chain),
		not: vi.fn(() => chain),
		or: vi.fn(() => chain),
		order: vi.fn(() => chain),
		limit: vi.fn(() => chain),
		range: vi.fn(() => chain),
		ilike: vi.fn(() => chain),
		gte: vi.fn(() => chain),
		lte: vi.fn(() => chain),
		is: vi.fn(() => chain),
		single: vi.fn(() =>
			Promise.resolve({ data: data[0] ?? null, error: null }),
		),
		maybeSingle: vi.fn(() =>
			Promise.resolve({ data: data[0] ?? null, error: null }),
		),
		rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
	};

	// Override `.then()` to make the chain thenable (for `await chain`)
	const _thenable = Promise.resolve({ data, error: null });

	const _chainWithThen = new Proxy(chain, {
		get(target, prop) {
			if (prop === "then") {
				return (resolve: (v: MockResponse) => unknown) =>
					resolve({ data, error: null });
			}
			return Reflect.get(target, prop);
		},
	});

	return {
		from: vi.fn((name: string) => {
			if (name === tableName) return chain;
			return chain; // Return the same chain for any table
		}),
		rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
	};
}

/** Common org IDs for test fixtures. */
export const TEST_ORG_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
export const TEST_USER_ID = "user-123";
export const TEST_CHAT_ID = 123456789;
export const TEST_TELEGRAM_USER_ID = 987654321;
