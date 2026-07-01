import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useOrgMutation } from "./use-org-mutation";

// ─── Mocks for @zuiio/hooks and @zuiio/offline ───────────────

vi.mock("@zuiio/hooks", () => ({
	useOnlineStatus: vi.fn(() => true),
}));

const mockEnqueue = vi.fn();
vi.mock("@zuiio/offline", () => ({
	useMutationQueue: vi.fn(() => ({ enqueue: mockEnqueue })),
}));

import { useOnlineStatus } from "@zuiio/hooks";

// ─── Helpers ─────────────────────────────────────────────────

const mockedOnlineStatus = useOnlineStatus as ReturnType<typeof vi.fn>;

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	};
}

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

beforeEach(() => {
	vi.clearAllMocks();
	mockedOnlineStatus.mockReturnValue(true);
	mockFetch.mockReset();
});

afterEach(() => {
	vi.restoreAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────

describe("useOrgMutation — online success", () => {
	it("sends correct POST request and returns data", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ data: { id: "1", name: "test" } }),
		});

		const { result } = renderHook(
			() =>
				useOrgMutation<{ id: string; name: string }, { name: string }>({
					endpoint: "/api/test",
					method: "POST",
					queryKey: ["test"],
				}),
			{ wrapper: createWrapper() },
		);

		result.current.mutate({ name: "test" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockFetch).toHaveBeenCalledWith(
			"/api/test",
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: "test" }),
			}),
		);
		expect(result.current.data).toEqual({ id: "1", name: "test" });
	});

	it("calls dynamic endpoint with variables", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ data: { success: true } }),
		});

		const { result } = renderHook(
			() =>
				useOrgMutation<{ success: boolean }, { id: string }>({
					endpoint: (vars) => `/api/test/${vars.id}`,
					method: "DELETE",
					queryKey: ["test"],
				}),
			{ wrapper: createWrapper() },
		);

		result.current.mutate({ id: "abc" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockFetch).toHaveBeenCalledWith(
			"/api/test/abc",
			expect.objectContaining({ method: "DELETE" }),
		);
	});

	it("applies optimistic update to cache on mutate", async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		// Seed cache with initial data
		queryClient.setQueryData(["test", "list"], [{ id: "1", name: "old" }]);

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ data: { id: "2", name: "new" } }),
		});

		const { result } = renderHook(
			() =>
				useOrgMutation<{ id: string; name: string }, { name: string }>({
					endpoint: "/api/test",
					method: "POST",
					queryKey: ["test", "list"],
					optimisticUpdate: (cached, vars) => [
						...cached,
						{ id: `temp-${Date.now()}`, name: vars.name },
					],
				}),
			{
				wrapper: function Wrapper({ children }: { children: ReactNode }) {
					return (
						<QueryClientProvider client={queryClient}>
							{children}
						</QueryClientProvider>
					);
				},
			},
		);

		result.current.mutate({ name: "new" });

		// Wait for the optimistic update to be applied (onMutate is async)
		await waitFor(() => {
			const cached = queryClient.getQueryData(["test", "list"]) as Array<{
				name: string;
			}>;
			expect(cached).toHaveLength(2);
		});
		const cached = queryClient.getQueryData(["test", "list"]) as Array<{
			name: string;
		}>;
		expect(cached![1]?.name).toBe("new");

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
	});

	it("rolls back optimistic update on error", async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		const initialData = [{ id: "1", name: "persisted" }];
		queryClient.setQueryData(["test", "list"], initialData);

		mockFetch.mockRejectedValueOnce(new Error("Network error"));

		const { result } = renderHook(
			() =>
				useOrgMutation<{ id: string; name: string }, { name: string }>({
					endpoint: "/api/test",
					method: "POST",
					queryKey: ["test", "list"],
					optimisticUpdate: (cached, vars) => [
						...cached,
						{ id: "temp", name: vars.name },
					],
					errorMessage: "Custom error",
				}),
			{
				wrapper: function Wrapper({ children }: { children: ReactNode }) {
					return (
						<QueryClientProvider client={queryClient}>
							{children}
						</QueryClientProvider>
					);
				},
			},
		);

		result.current.mutate({ name: "should-rollback" });

		await waitFor(() => expect(result.current.isError).toBe(true));

		// Cache should be rolled back
		const cached = queryClient.getQueryData(["test", "list"]);
		expect(cached).toEqual(initialData);
	});

	it("uses optimisticQueryKey for cache read/write", async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		// Data stored under specific list key
		queryClient.setQueryData(
			["test", "list", "filtered"],
			[{ id: "1", name: "item" }],
		);

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ data: { id: "2", name: "new" } }),
		});

		const { result } = renderHook(
			() =>
				useOrgMutation<{ id: string; name: string }, { name: string }>({
					endpoint: "/api/test",
					method: "POST",
					queryKey: ["test"], // broad prefix for invalidation
					optimisticQueryKey: ["test", "list", "filtered"], // exact key for read/write
					optimisticUpdate: (cached, vars) => [
						...cached,
						{ id: "temp", name: vars.name },
					],
				}),
			{
				wrapper: function Wrapper({ children }: { children: ReactNode }) {
					return (
						<QueryClientProvider client={queryClient}>
							{children}
						</QueryClientProvider>
					);
				},
			},
		);

		result.current.mutate({ name: "added" });

		// Wait for the optimistic update to be applied (onMutate is async)
		await waitFor(() => {
			const exactCached = queryClient.getQueryData([
				"test",
				"list",
				"filtered",
			]) as Array<{ name: string }>;
			expect(exactCached).toHaveLength(2);
		});
		const exactCached = queryClient.getQueryData([
			"test",
			"list",
			"filtered",
		]) as Array<{ name: string }>;
		expect(exactCached![1]?.name).toBe("added");

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
	});
});

describe("useOrgMutation — offline", () => {
	it("queues mutation and returns queued response", async () => {
		mockedOnlineStatus.mockReturnValue(false);
		mockEnqueue.mockResolvedValueOnce(undefined);

		const { result } = renderHook(
			() =>
				useOrgMutation<unknown, { name: string }>({
					endpoint: "/api/test",
					method: "POST",
					queryKey: ["test"],
				}),
			{ wrapper: createWrapper() },
		);

		result.current.mutate({ name: "offline" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockFetch).not.toHaveBeenCalled();
		expect(mockEnqueue).toHaveBeenCalledWith(
			expect.objectContaining({
				endpoint: "/api/test",
				method: "POST",
				body: { name: "offline" },
			}),
		);
		expect(result.current.data).toEqual({ queued: true });
	});

	it("does NOT call fetch when offline", async () => {
		mockedOnlineStatus.mockReturnValue(false);
		mockEnqueue.mockResolvedValueOnce(undefined);

		const { result } = renderHook(
			() =>
				useOrgMutation<unknown, void>({
					endpoint: "/api/test",
					method: "DELETE",
					queryKey: ["test"],
				}),
			{ wrapper: createWrapper() },
		);

		result.current.mutate(undefined as unknown as void);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(mockFetch).not.toHaveBeenCalled();
	});
});

describe("useOrgMutation — bodyFn", () => {
	it("uses bodyFn to build request body", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ data: { success: true } }),
		});

		const { result } = renderHook(
			() =>
				useOrgMutation<{ success: boolean }, { id: string; name: string }>({
					endpoint: (vars) => `/api/test/${vars.id}`,
					method: "PATCH",
					queryKey: ["test"],
					bodyFn: ({ id, name }) => ({ name }), // strip id from body
				}),
			{ wrapper: createWrapper() },
		);

		result.current.mutate({ id: "1", name: "updated" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockFetch).toHaveBeenCalledWith(
			"/api/test/1",
			expect.objectContaining({
				body: JSON.stringify({ name: "updated" }),
			}),
		);
	});

	it("calls bodyFn even for DELETE", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ data: { success: true } }),
		});

		const { result } = renderHook(
			() =>
				useOrgMutation<{ success: boolean }, { id: string; reason: string }>({
					endpoint: (vars) => `/api/test/${vars.id}`,
					method: "DELETE",
					queryKey: ["test"],
					bodyFn: ({ reason }) => ({ reason }),
				}),
			{ wrapper: createWrapper() },
		);

		result.current.mutate({ id: "1", reason: "archived" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockFetch).toHaveBeenCalledWith(
			"/api/test/1",
			expect.objectContaining({
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reason: "archived" }),
			}),
		);
	});
});

// ─── Tests: PATCH ────────────────────────────────────────────

describe("useOrgMutation — PATCH", () => {
	it("sends correct PATCH request with body", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ data: { id: "1", name: "updated" } }),
		});

		const { result } = renderHook(
			() =>
				useOrgMutation<
					{ id: string; name: string },
					{ id: string; name: string }
				>({
					endpoint: (vars) => `/api/test/${vars.id}`,
					method: "PATCH",
					queryKey: ["test"],
				}),
			{ wrapper: createWrapper() },
		);

		result.current.mutate({ id: "1", name: "updated" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockFetch).toHaveBeenCalledWith(
			"/api/test/1",
			expect.objectContaining({
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: "1", name: "updated" }),
			}),
		);
		expect(result.current.data).toEqual({ id: "1", name: "updated" });
	});
});

// ─── Tests: DELETE without bodyFn ────────────────────────────

describe("useOrgMutation — DELETE without bodyFn", () => {
	it("sends DELETE with no Content-Type and no body", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ data: { success: true } }),
		});

		const { result } = renderHook(
			() =>
				useOrgMutation<{ success: boolean }, { id: string }>({
					endpoint: (vars) => `/api/test/${vars.id}`,
					method: "DELETE",
					queryKey: ["test"],
				}),
			{ wrapper: createWrapper() },
		);

		result.current.mutate({ id: "1" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockFetch).toHaveBeenCalledWith(
			"/api/test/1",
			expect.objectContaining({
				method: "DELETE",
				headers: undefined,
				body: undefined,
			}),
		);
	});
});

// ─── Tests: successMessage as function ──────────────────────

describe("useOrgMutation — successMessage function", () => {
	it("calls successMessage function with variables", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ data: { id: "1" } }),
		});

		const successMessageFn = vi.fn(
			(vars: { name: string }) => `Created ${vars.name}`,
		);

		const { result } = renderHook(
			() =>
				useOrgMutation<{ id: string }, { name: string }>({
					endpoint: "/api/test",
					method: "POST",
					queryKey: ["test"],
					successMessage: successMessageFn,
				}),
			{ wrapper: createWrapper() },
		);

		result.current.mutate({ name: "item" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(successMessageFn).toHaveBeenCalledWith({ name: "item" });
	});
});

// ─── Tests: invalidateKeys ──────────────────────────────────

describe("useOrgMutation — invalidateKeys", () => {
	it("invalidates extra keys on settle", async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});

		// Seed caches under both primary and extra keys
		queryClient.setQueryData(["test"], [{ id: "1" }]);
		queryClient.setQueryData(["stats"], { count: 1 });
		queryClient.setQueryData(["dashboard"], { loaded: true });

		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ data: { id: "2" } }),
		});

		const { result } = renderHook(
			() =>
				useOrgMutation<unknown, { name: string }>({
					endpoint: "/api/test",
					method: "POST",
					queryKey: ["test"],
					invalidateKeys: [["stats"], ["dashboard"]],
				}),
			{
				wrapper: function Wrapper({ children }: { children: ReactNode }) {
					return (
						<QueryClientProvider client={queryClient}>
							{children}
						</QueryClientProvider>
					);
				},
			},
		);

		result.current.mutate({ name: "new" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		// Wait for onSettled to fire
		await waitFor(() => {
			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["test"] });
			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["stats"] });
			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
		});
	});
});

// ─── Tests: onSettled skips invalidation when offline ───────

describe("useOrgMutation — onSettled offline skip", () => {
	it("does NOT invalidate queryKey when mutation was offline", async () => {
		mockedOnlineStatus.mockReturnValue(false);
		mockEnqueue.mockResolvedValueOnce(undefined);

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		const seedData = [{ id: "1", name: "persisted" }];
		queryClient.setQueryData(["test"], seedData);

		const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = renderHook(
			() =>
				useOrgMutation<unknown, { name: string }>({
					endpoint: "/api/test",
					method: "POST",
					queryKey: ["test"],
					optimisticUpdate: (cached, vars) => [
						...(cached as Array<{ name: string }>),
						{ id: "temp", name: vars.name },
					],
				}),
			{
				wrapper: function Wrapper({ children }: { children: ReactNode }) {
					return (
						<QueryClientProvider client={queryClient}>
							{children}
						</QueryClientProvider>
					);
				},
			},
		);

		result.current.mutate({ name: "queued" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		// onSettled should NOT have called invalidateQueries because wasOffline = true
		expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ["test"] });

		// Seed data should still be in cache (plus the optimistic append)
		const cached = queryClient.getQueryData(["test"]);
		expect(cached).toBeDefined();
	});
});

describe("useOrgMutation — error handling", () => {
	it("shows custom errorMessage on failure", async () => {
		mockFetch.mockRejectedValueOnce(new Error("Network error"));

		const { result } = renderHook(
			() =>
				useOrgMutation<unknown, void>({
					endpoint: "/api/test",
					queryKey: ["test"],
					errorMessage: "Custom error",
				}),
			{ wrapper: createWrapper() },
		);

		result.current.mutate(undefined as unknown as void);

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error?.message).toBe("Network error");
	});

	it("calls onErrorToast instead of default toast", async () => {
		mockFetch.mockRejectedValueOnce(new Error("Custom error"));
		const onErrorToast = vi.fn();

		const { result } = renderHook(
			() =>
				useOrgMutation<unknown, { name: string }>({
					endpoint: "/api/test",
					queryKey: ["test"],
					onErrorToast,
				}),
			{ wrapper: createWrapper() },
		);

		result.current.mutate({ name: "test" });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(onErrorToast).toHaveBeenCalledWith(
			expect.any(Error),
			{ name: "test" },
			expect.objectContaining({ retry: expect.any(Function) }),
		);
	});
});
