import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	clearWizardState,
	getWizardState,
	saveWizardState,
} from "@/state/wizard";

vi.mock("server-only", () => ({}));

const mockGetCached = vi.fn();
const mockSetCached = vi.fn();
const mockInvalidate = vi.fn();
vi.mock("@/lib/cache", () => ({
	getCachedWizard: (...a: unknown[]) => mockGetCached(...a),
	setCachedWizard: (...a: unknown[]) => mockSetCached(...a),
	invalidateCachedWizard: (...a: unknown[]) => mockInvalidate(...a),
}));

const STATE = {
	type: "booking",
	step: 2,
	data: { date: "2026-08-01" },
	startedAt: new Date().toISOString(),
};

function makeSupabase(row?: unknown, error: unknown = null) {
	const chain = {
		select: vi.fn(() => chain),
		eq: vi.fn(() => chain),
		single: vi.fn(() => Promise.resolve({ data: row ?? null, error })),
		upsert: vi.fn(() => Promise.resolve({ error: null })),
		delete: vi.fn(() => chain),
	};
	return { from: vi.fn(() => chain), ...chain } as never;
}

beforeEach(() => {
	vi.clearAllMocks();
	mockGetCached.mockResolvedValue(null);
	mockSetCached.mockResolvedValue(undefined);
	mockInvalidate.mockResolvedValue(undefined);
});

describe("wizard state", () => {
	it("returns null when nothing is stored", async () => {
		const sb = makeSupabase(null);
		const result = await getWizardState(sb, "org-1", "c", "u", "telegram");
		expect(result).toBeNull();
	});

	it("reads from Supabase and populates the cache", async () => {
		const sb = makeSupabase({ value: STATE });
		const result = await getWizardState(sb, "org-1", "c", "u", "telegram");
		expect(result).toEqual(STATE);
		expect(mockSetCached).toHaveBeenCalledOnce();
	});

	it("reads from cache and skips the DB", async () => {
		mockGetCached.mockResolvedValue(STATE);
		const sb = makeSupabase({ value: null });
		const result = await getWizardState(sb, "org-1", "c", "u", "telegram");
		expect(result).toEqual(STATE);
		expect(sb.from).not.toHaveBeenCalled();
	});

	it("clears expired states", async () => {
		const expired = {
			...STATE,
			startedAt: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
		};
		const sb = makeSupabase({ value: expired });
		const result = await getWizardState(sb, "org-1", "c", "u", "telegram");
		expect(result).toBeNull();
		expect(mockInvalidate).toHaveBeenCalled();
	});

	it("saves to Supabase and cache", async () => {
		const sb = makeSupabase();
		await saveWizardState(sb, "org-1", "c", "u", "telegram", STATE);
		expect(sb.from).toHaveBeenCalledWith("app_config");
		expect(mockSetCached).toHaveBeenCalledWith(
			"org-1",
			"c",
			"u",
			"telegram",
			STATE,
		);
	});

	it("clears from Supabase and invalidates the cache", async () => {
		const sb = makeSupabase();
		await clearWizardState(sb, "org-1", "c", "u", "telegram");
		expect(sb.from).toHaveBeenCalledWith("app_config");
		expect(mockInvalidate).toHaveBeenCalled();
	});
});
