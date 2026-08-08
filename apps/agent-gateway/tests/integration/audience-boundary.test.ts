import { describe, expect, it, vi } from "vitest";
import type { AgentAudience, AgentProfile } from "@/gateway/types";
import { getProductTools } from "@/gateway/webhook-helpers";
import type { ToolContext } from "@/providers/types";
import { formatProfileContext } from "@/state/agent-profile";
import { TEST_ORG_ID } from "../fixtures/supabase-mock";

// ─── Mocks ──────────────────────────────────────────────────────────────────────

function createMockSupabase() {
	const chain: Record<string, unknown> = {
		select: vi.fn(() => chain),
		eq: vi.fn(() => chain),
		or: vi.fn(() => chain),
		maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
		single: vi.fn(() => Promise.resolve({ data: null, error: null })),
		limit: vi.fn(() => chain),
		order: vi.fn(() => chain),
		range: vi.fn(() => chain),
	};
	const from = vi.fn(() => chain);
	return { from, ...chain } as never;
}

// ─── Tool Contexts ───────────────────────────────────────────────────────────────

function makeContext(audience: AgentAudience): ToolContext {
	return {
		orgId: TEST_ORG_ID,
		userId: "user-1",
		audience,
		supabase: createMockSupabase(),
	};
}

const internalCtx = makeContext("internal");
const customerCtx = makeContext("customer");

// ─── Tests ───────────────────────────────────────────────────────────────────────

describe("Audience-based tool selection", () => {
	it("returns tools for internal audience", () => {
		const tools = getProductTools("tolom", internalCtx);
		expect(Array.isArray(tools)).toBe(true);
		expect(tools.length).toBeGreaterThan(0);
	});

	it("returns empty tools for customer audience", () => {
		const tools = getProductTools("tolom", customerCtx);
		expect(Array.isArray(tools)).toBe(true);
		expect(tools.length).toBe(0);
	});

	it("defaults undefined audience to internal behavior", () => {
		// Simulate context without audience (backward compat)
		const ctx = {
			orgId: TEST_ORG_ID,
			userId: "user-1",
			supabase: createMockSupabase(),
		} as ToolContext;

		const tools = getProductTools("tolom", ctx);
		expect(Array.isArray(tools)).toBe(true);
		expect(tools.length).toBeGreaterThan(0);
	});

	it("returns Zer tools for internal audience", () => {
		const tools = getProductTools("zer", internalCtx);
		expect(Array.isArray(tools)).toBe(true);
		expect(tools.length).toBeGreaterThan(0);
	});

	it("gives Zer customers exactly the read-only product search tool", () => {
		const tools = getProductTools("zer", customerCtx);
		expect(Array.isArray(tools)).toBe(true);
		expect(tools.map((t) => t.name)).toEqual(["searchProducts"]);
	});
});

describe("Profile formatting", () => {
	it("formats complete profile correctly", () => {
		const profile: AgentProfile = {
			organizationId: TEST_ORG_ID,
			audience: "internal",
			assistantName: "My Shop Assistant",
			businessSummary: "Auto repair shop in Ulaanbaatar",
			responseLanguage: "mn",
			tone: "friendly",
			contactDetails: "+976 9911 2233",
			businessHours: { mon_fri: "09:00-18:00" },
			responseRules: "Always mention holiday discounts",
			handoffMessage: "Хүний операторт холбогдож байна...",
			isActive: true,
			updatedBy: null,
			createdAt: "2026-01-01T00:00:00Z",
			updatedAt: "2026-01-01T00:00:00Z",
		};

		const result = formatProfileContext(profile);
		expect(result).toContain("## ORGANIZATION CONTEXT");
		expect(result).toContain("My Shop Assistant");
		expect(result).toContain("Auto repair shop in Ulaanbaatar");
		expect(result).toContain("friendly");
		expect(result).toContain("+976 9911 2233");
	});

	it("returns empty string when all fields are null", () => {
		const profile: AgentProfile = {
			organizationId: TEST_ORG_ID,
			audience: "internal",
			assistantName: null,
			businessSummary: null,
			responseLanguage: null,
			tone: null,
			contactDetails: null,
			businessHours: null,
			responseRules: null,
			handoffMessage: null,
			isActive: true,
			updatedBy: null,
			createdAt: "2026-01-01T00:00:00Z",
			updatedAt: "2026-01-01T00:00:00Z",
		};

		const result = formatProfileContext(profile);
		expect(result).toBe("");
	});

	it("formats partial profile (only non-null fields)", () => {
		const profile: AgentProfile = {
			organizationId: TEST_ORG_ID,
			audience: "internal",
			assistantName: "Assistant",
			businessSummary: null,
			responseLanguage: "en",
			tone: null,
			contactDetails: null,
			businessHours: null,
			responseRules: null,
			handoffMessage: null,
			isActive: true,
			updatedBy: null,
			createdAt: "2026-01-01T00:00:00Z",
			updatedAt: "2026-01-01T00:00:00Z",
		};

		const result = formatProfileContext(profile);
		expect(result).toContain("## ORGANIZATION CONTEXT");
		expect(result).toContain("Assistant");
		expect(result).toContain("en");
		// These should not be present
		expect(result).not.toContain("business_summary");
		expect(result).not.toContain("null");
	});

	it("includes the header for valid profile", () => {
		const profile: AgentProfile = {
			organizationId: TEST_ORG_ID,
			audience: "internal",
			assistantName: "Test",
			businessSummary: null,
			responseLanguage: null,
			tone: null,
			contactDetails: null,
			businessHours: null,
			responseRules: null,
			handoffMessage: null,
			isActive: true,
			updatedBy: null,
			createdAt: "2026-01-01T00:00:00Z",
			updatedAt: "2026-01-01T00:00:00Z",
		};

		const result = formatProfileContext(profile);
		expect(result).toContain("## ORGANIZATION CONTEXT");
		expect(result).toContain("Test");
	});
});

describe("Audience-boundary knowledge filtering", () => {
	it("formatProfileContext handles different audiences", () => {
		const internal: AgentProfile = {
			organizationId: TEST_ORG_ID,
			audience: "internal",
			assistantName: "Team Assistant",
			businessSummary: null,
			responseLanguage: null,
			tone: null,
			contactDetails: null,
			businessHours: null,
			responseRules: null,
			handoffMessage: null,
			isActive: true,
			updatedBy: null,
			createdAt: "2026-01-01T00:00:00Z",
			updatedAt: "2026-01-01T00:00:00Z",
		};
		const customer: AgentProfile = {
			organizationId: TEST_ORG_ID,
			audience: "customer",
			assistantName: "Customer Service",
			businessSummary: null,
			responseLanguage: null,
			tone: null,
			contactDetails: null,
			businessHours: null,
			responseRules: null,
			handoffMessage: null,
			isActive: true,
			updatedBy: null,
			createdAt: "2026-01-01T00:00:00Z",
			updatedAt: "2026-01-01T00:00:00Z",
		};

		expect(formatProfileContext(internal)).toContain("Team Assistant");
		expect(formatProfileContext(customer)).toContain("Customer Service");
	});
});
