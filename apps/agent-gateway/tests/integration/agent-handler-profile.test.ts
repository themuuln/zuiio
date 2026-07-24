/**
 * Integration tests for agent-handler.ts profile loading pipeline.
 *
 * Verifies that:
 * 1. AgentHandlerOptions callbacks (getTools, getSystemPrompt) receive correct params
 * 2. loadAgentProfile is invoked with orgId + audience during handleAgentMessage
 * 3. Profile context is composed into the system prompt in the documented order
 * 4. Missing profile does not break the pipeline
 *
 * Since handleAgentMessage depends on module-level singletons and many state
 * modules, every external dependency is mocked. These are integration-level
 * tests that exercise the real handler logic with controlled boundaries.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentHandlerOptions } from "@/gateway/agent-handler";
import type {
	AgentAudience,
	AgentProfile,
	GatewayContext,
} from "@/gateway/types";
import type { GatewayTool, ToolContext } from "@/providers/types";
import { TEST_CHAT_ID, TEST_ORG_ID } from "../fixtures/supabase-mock";

// ─── Core infrastructure mocks ───────────────────────────────────────────────

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({
	after: vi.fn((cb: () => void) => cb()),
}));
vi.mock("@/lib/redis", () => ({ getRedis: vi.fn(() => null) }));
vi.mock("@/lib/debug", () => ({ debug: vi.fn() }));
vi.mock("@/lib/env", () => ({
	openAiConfig: vi.fn(() => null),
	openCodeGoConfig: vi.fn(() => ({
		apiKey: "test-key",
		baseUrl: "http://localhost",
	})),
	validateConfig: vi.fn(() => true),
}));
vi.mock("@/lib/sanitize", () => ({
	sanitizeUserInput: vi.fn((s: string) => s),
}));
vi.mock("@/lib/supabase", () => ({
	createServiceClient: vi.fn(() => ({ from: vi.fn() })),
}));

// ─── State module mocks ──────────────────────────────────────────────────────

// Budget
const mockCheckDailyBudget = vi.fn();
const mockRecordUsageAtomic = vi.fn();
vi.mock("@/state/budget", () => ({
	checkDailyBudget: (...a: unknown[]) => mockCheckDailyBudget(...a),
	recordUsageAtomic: (...a: unknown[]) => mockRecordUsageAtomic(...a),
	REQUEST_LIMITS: { maxToolRounds: 5 },
}));

// Rate limit
const mockCheckRateLimit = vi.fn();
vi.mock("@/state/rate-limit", () => ({
	checkRateLimit: (...a: unknown[]) => mockCheckRateLimit(...a),
	RATE_LIMITS: { messagesPerMinute: 20 },
}));

// Handoff
const mockCheckHandoffTriggers = vi.fn();
vi.mock("@/state/handoff", () => ({
	checkHandoffTriggers: (...a: unknown[]) => mockCheckHandoffTriggers(...a),
}));

// Session
const mockLoadSession = vi.fn();
const mockSaveSession = vi.fn();
const mockSummarizeIfNeeded = vi.fn();
vi.mock("@/state/session", () => ({
	loadSession: (...a: unknown[]) => mockLoadSession(...a),
	saveSession: (...a: unknown[]) => mockSaveSession(...a),
	summarizeIfNeeded: (...a: unknown[]) => mockSummarizeIfNeeded(...a),
	MAX_SESSION_MESSAGES: 50,
}));

// Knowledge
const mockSearchKnowledge = vi.fn();
const mockFormatKnowledgeContext = vi.fn();
vi.mock("@/state/knowledge", () => ({
	searchKnowledge: (...a: unknown[]) => mockSearchKnowledge(...a),
	formatKnowledgeContext: (...a: unknown[]) => mockFormatKnowledgeContext(...a),
}));

// Wizard
const mockGetWizardState = vi.fn();
const mockClearWizardState = vi.fn();
vi.mock("@/state/wizard", () => ({
	getWizardState: (...a: unknown[]) => mockGetWizardState(...a),
	clearWizardState: (...a: unknown[]) => mockClearWizardState(...a),
}));

// Agent profile
const mockLoadAgentProfile = vi.fn();
const mockFormatProfileContext = vi.fn();
vi.mock("@/state/agent-profile", () => ({
	loadAgentProfile: (...a: unknown[]) => mockLoadAgentProfile(...a),
	formatProfileContext: (...a: unknown[]) => mockFormatProfileContext(...a),
}));

// Audit (passthrough)
vi.mock("@/state/audit", () => ({
	withAudit: vi.fn((tool: unknown) => tool),
}));

// Provider stubs — must be class-like (constructable) since getGateway uses `new`
vi.mock("@/providers/opencode-go", () => ({
	OpenCodeGoProvider: class OpenCodeGoProvider {},
}));
vi.mock("@/providers/gpt-mini", () => ({
	GptMiniProvider: class GptMiniProvider {},
}));

// AiGateway — mock class with controllable runWithTools.
// Dynamic import needed: vi.mock is hoisted above static imports, so the
// original module must be fetched at mock-definition time.
const mockRunWithTools = vi.fn();
vi.mock("@/providers/types", async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		AiGateway: class AiGateway {
			runWithTools = mockRunWithTools;
		},
	};
});

// Dynamic import required: vi.mock must be installed before the module loads,
// otherwise the real singleton (getSb/getGateway) initializes with unmocked deps.
const { handleAgentMessage } = await import("@/gateway/agent-handler");

// ─── Test fixtures ───────────────────────────────────────────────────────────

function makeCtx(overrides?: Partial<GatewayContext>): GatewayContext {
	return {
		orgId: TEST_ORG_ID,
		audience: "customer",
		userId: "user-1",
		productType: "zer",
		chatId: TEST_CHAT_ID,
		telegramUserId: 111111,
		channel: "telegram",
		channelChatId: String(TEST_CHAT_ID),
		channelUserId: "user-1",
		...overrides,
	};
}

function makeProfile(overrides?: Partial<AgentProfile>): AgentProfile {
	return {
		id: "prof-1",
		organizationId: TEST_ORG_ID,
		audience: "customer",
		assistantName: "ZerBot",
		businessSummary: "We sell widgets",
		responseLanguage: null,
		tone: "friendly",
		contactDetails: null,
		businessHours: null,
		responseRules: "Never mention competitors",
		handoffMessage: null,
		isActive: true,
		updatedBy: null,
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-06-01T00:00:00Z",
		...overrides,
	};
}

const FAKE_TOOLS: GatewayTool[] = [
	{
		name: "test_tool",
		description: "A test tool",
		parameters: [],
		execute: vi.fn(async () => "ok"),
	},
];

// ─── Default mock return values ──────────────────────────────────────────────

beforeEach(() => {
	vi.clearAllMocks();

	// Budget: always allowed
	mockCheckDailyBudget.mockResolvedValue({ allowed: true });

	// Rate limit: always allowed
	mockCheckRateLimit.mockResolvedValue({ allowed: true });

	// No handoff triggers
	mockCheckHandoffTriggers.mockReturnValue({ triggered: false, reason: "" });

	// Empty session
	mockLoadSession.mockResolvedValue({ messages: [], tokenCount: 0 });

	// No knowledge results
	mockSearchKnowledge.mockResolvedValue([]);

	// No wizard state
	mockGetWizardState.mockResolvedValue(null);

	// Profile: returns null by default (override per test)
	mockLoadAgentProfile.mockResolvedValue(null);
	mockFormatProfileContext.mockReturnValue("");

	// Summarize: pass through
	mockSummarizeIfNeeded.mockImplementation(async (msgs: unknown) => msgs);

	// LLM response
	mockRunWithTools.mockResolvedValue("Hello from the agent!");
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("AgentHandlerOptions profile pipeline", () => {
	it("getSystemPrompt receives productType, orgId, chatType, and detected lang", async () => {
		const getSystemPrompt = vi.fn(async () => "base prompt");
		const getTools = vi.fn(() => FAKE_TOOLS);

		const ctx = makeCtx({ productType: "tolom" });

		// Send Cyrillic text → detectedLang should be "mn"
		await handleAgentMessage(ctx, "Сайн байна уу", "private", {
			getSystemPrompt,
			getTools,
		});

		expect(getSystemPrompt).toHaveBeenCalledOnce();
		const [productType, orgId, chatType, lang] = getSystemPrompt.mock.calls[0]!;
		expect(productType).toBe("tolom");
		expect(orgId).toBe(TEST_ORG_ID);
		expect(chatType).toBe("private");
		expect(lang).toBe("mn");
	});

	it("getSystemPrompt detects English for Latin text", async () => {
		const getSystemPrompt = vi.fn(async () => "base prompt");
		const getTools = vi.fn(() => FAKE_TOOLS);

		await handleAgentMessage(makeCtx(), "Hello there", "private", {
			getSystemPrompt,
			getTools,
		});

		const [, , , lang] = getSystemPrompt.mock.calls[0]!;
		expect(lang).toBe("en");
	});

	it("getTools receives ToolContext with audience from GatewayContext", async () => {
		const getSystemPrompt = vi.fn(async () => "base prompt");
		const getTools = vi.fn(() => FAKE_TOOLS);

		const ctx = makeCtx({ audience: "internal" });
		await handleAgentMessage(ctx, "hello", "private", {
			getSystemPrompt,
			getTools,
		});

		expect(getTools).toHaveBeenCalledOnce();
		const receivedContext = getTools.mock.calls[0]?.[0] as ToolContext;
		expect(receivedContext.audience).toBe("internal");
		expect(receivedContext.orgId).toBe(TEST_ORG_ID);
		expect(receivedContext.userId).toBe("user-1");
		expect(receivedContext.supabase).toBeDefined();
	});

	it("getTools receives customer audience when GatewayContext.audience is customer", async () => {
		const getSystemPrompt = vi.fn(async () => "base prompt");
		const getTools = vi.fn(() => FAKE_TOOLS);

		const ctx = makeCtx({ audience: "customer" });
		await handleAgentMessage(ctx, "hello", "group", {
			getSystemPrompt,
			getTools,
		});

		const receivedContext = getTools.mock.calls[0]?.[0] as ToolContext;
		expect(receivedContext.audience).toBe("customer");
	});
});

describe("ToolContext audience integration", () => {
	it("ToolContext audience matches GatewayContext audience", async () => {
		const audiences: AgentAudience[] = ["internal", "customer"];

		for (const audience of audiences) {
			const getTools = vi.fn(() => FAKE_TOOLS);
			const getSystemPrompt = vi.fn(async () => "prompt");

			await handleAgentMessage(makeCtx({ audience }), "hi", "private", {
				getSystemPrompt,
				getTools,
			});

			const ctx = getTools.mock.calls[0]?.[0] as ToolContext;
			expect(ctx.audience).toBe(audience);
		}
	});

	it("ToolContext uses dataClient from opts when provided", async () => {
		const fakeClient = { from: vi.fn() } as never;
		const getSystemPrompt = vi.fn(async () => "prompt");
		const getTools = vi.fn(() => FAKE_TOOLS);

		await handleAgentMessage(makeCtx(), "hi", "private", {
			getSystemPrompt,
			getTools,
			dataClient: fakeClient,
		});

		const ctx = getTools.mock.calls[0]?.[0] as ToolContext;
		expect(ctx.supabase).toBe(fakeClient);
	});

	it("ToolContext falls back to default client when dataClient is omitted", async () => {
		const getSystemPrompt = vi.fn(async () => "prompt");
		const getTools = vi.fn(() => FAKE_TOOLS);

		await handleAgentMessage(makeCtx(), "hi", "private", {
			getSystemPrompt,
			getTools,
		});

		const ctx = getTools.mock.calls[0]?.[0] as ToolContext;
		// Should NOT be the fakeClient — it should be the default sb client
		expect(ctx.supabase).toBeDefined();
		expect(ctx.supabase).not.toBeNull();
	});
});

describe("loadAgentProfile integration", () => {
	it("loadAgentProfile is called with orgId and audience from context", async () => {
		const getSystemPrompt = vi.fn(async () => "base prompt");
		const getTools = vi.fn(() => FAKE_TOOLS);

		const ctx = makeCtx({ audience: "customer" });
		await handleAgentMessage(ctx, "hello", "private", {
			getSystemPrompt,
			getTools,
		});

		expect(mockLoadAgentProfile).toHaveBeenCalledOnce();
		const [, orgId, audience] = mockLoadAgentProfile.mock.calls[0]!;
		expect(orgId).toBe(TEST_ORG_ID);
		expect(audience).toBe("customer");
	});

	it("loadAgentProfile receives internal audience for internal context", async () => {
		const getSystemPrompt = vi.fn(async () => "base prompt");
		const getTools = vi.fn(() => FAKE_TOOLS);

		const ctx = makeCtx({ audience: "internal" });
		await handleAgentMessage(ctx, "hello", "private", {
			getSystemPrompt,
			getTools,
		});

		const [, , audience] = mockLoadAgentProfile.mock.calls[0]!;
		expect(audience).toBe("internal");
	});

	it("formatProfileContext is called when profile exists", async () => {
		const profile = makeProfile();
		mockLoadAgentProfile.mockResolvedValue(profile);
		mockFormatProfileContext.mockReturnValue(
			"## ORGANIZATION CONTEXT\nAssistant name: ZerBot",
		);

		const getSystemPrompt = vi.fn(async () => "base prompt");
		const getTools = vi.fn(() => FAKE_TOOLS);

		await handleAgentMessage(makeCtx(), "hello", "private", {
			getSystemPrompt,
			getTools,
		});

		expect(mockFormatProfileContext).toHaveBeenCalledOnce();
		expect(mockFormatProfileContext).toHaveBeenCalledWith(profile);
	});

	it("formatProfileContext is NOT called when profile is null", async () => {
		mockLoadAgentProfile.mockResolvedValue(null);

		const getSystemPrompt = vi.fn(async () => "base prompt");
		const getTools = vi.fn(() => FAKE_TOOLS);

		await handleAgentMessage(makeCtx(), "hello", "private", {
			getSystemPrompt,
			getTools,
		});

		expect(mockFormatProfileContext).not.toHaveBeenCalled();
	});
});

describe("System prompt composition order", () => {
	it("composes prompt in order: base → profile → knowledge → wizard", async () => {
		const profile = makeProfile();
		mockLoadAgentProfile.mockResolvedValue(profile);
		mockFormatProfileContext.mockReturnValue(
			"\n\n## ORGANIZATION CONTEXT\nAssistant name: ZerBot",
		);
		mockSearchKnowledge.mockResolvedValue([{ content: "knowledge chunk" }]);
		mockFormatKnowledgeContext.mockReturnValue(
			"\n\n## KNOWLEDGE CONTEXT\nknowledge chunk",
		);
		mockGetWizardState.mockResolvedValue({
			type: "booking",
			step: 1,
			data: { date: "2026-07-15" },
		});

		// Capture the system prompt passed to LLM by inspecting the runWithTools call
		mockRunWithTools.mockImplementation(async (opts: { system: string }) => {
			return opts.system;
		});

		const getSystemPrompt = vi.fn(
			async () => "## BASE PROMPT\nYou are an assistant.",
		);
		const getTools = vi.fn(() => FAKE_TOOLS);

		const response = await handleAgentMessage(
			makeCtx(),
			"book a slot",
			"private",
			{
				getSystemPrompt,
				getTools,
			},
		);

		// The response IS the system prompt (we returned it from runWithTools)
		const systemPrompt = response;

		// Verify the composition order by checking substring positions
		const baseIdx = systemPrompt.indexOf("## BASE PROMPT");
		const profileIdx = systemPrompt.indexOf("## ORGANIZATION CONTEXT");
		const knowledgeIdx = systemPrompt.indexOf("## KNOWLEDGE CONTEXT");
		const wizardIdx = systemPrompt.indexOf("## ACTIVE WIZARD");

		expect(baseIdx).toBeGreaterThanOrEqual(0);
		expect(profileIdx).toBeGreaterThan(baseIdx);
		expect(knowledgeIdx).toBeGreaterThan(profileIdx);
		expect(wizardIdx).toBeGreaterThan(knowledgeIdx);
	});

	it("base prompt appears when profile is null (graceful fallback)", async () => {
		mockLoadAgentProfile.mockResolvedValue(null);
		mockFormatProfileContext.mockReturnValue("");
		mockSearchKnowledge.mockResolvedValue([]);

		mockRunWithTools.mockImplementation(async (opts: { system: string }) => {
			return opts.system;
		});

		const getSystemPrompt = vi.fn(
			async () => "## BASE PROMPT\nYou are an assistant.",
		);
		const getTools = vi.fn(() => FAKE_TOOLS);

		const response = await handleAgentMessage(makeCtx(), "hi", "private", {
			getSystemPrompt,
			getTools,
		});

		expect(response).toBe("## BASE PROMPT\nYou are an assistant.");
		expect(response).not.toContain("## ORGANIZATION CONTEXT");
	});

	it("knowledge section absent when no chunks found", async () => {
		mockSearchKnowledge.mockResolvedValue([]);
		mockFormatKnowledgeContext.mockReturnValue("");

		mockRunWithTools.mockImplementation(async (opts: { system: string }) => {
			return opts.system;
		});

		const getSystemPrompt = vi.fn(async () => "base");
		const getTools = vi.fn(() => FAKE_TOOLS);

		const response = await handleAgentMessage(makeCtx(), "hi", "private", {
			getSystemPrompt,
			getTools,
		});

		expect(response).toBe("base");
		expect(response).not.toContain("## KNOWLEDGE CONTEXT");
	});

	it("wizard section absent when no active wizard", async () => {
		mockGetWizardState.mockResolvedValue(null);

		mockRunWithTools.mockImplementation(async (opts: { system: string }) => {
			return opts.system;
		});

		const getSystemPrompt = vi.fn(async () => "base");
		const getTools = vi.fn(() => FAKE_TOOLS);

		const response = await handleAgentMessage(makeCtx(), "hi", "private", {
			getSystemPrompt,
			getTools,
		});

		expect(response).not.toContain("## ACTIVE WIZARD");
	});

	it("all sections present when profile, knowledge, and wizard are active", async () => {
		const profile = makeProfile();
		mockLoadAgentProfile.mockResolvedValue(profile);
		mockFormatProfileContext.mockReturnValue(
			"\n\n## ORGANIZATION CONTEXT\nAssistant name: ZerBot",
		);
		mockSearchKnowledge.mockResolvedValue([{ content: "widget info" }]);
		mockFormatKnowledgeContext.mockReturnValue(
			"\n\n## KNOWLEDGE CONTEXT\nwidget info",
		);
		mockGetWizardState.mockResolvedValue({
			type: "order",
			step: 2,
			data: { item: "widget" },
		});

		mockRunWithTools.mockImplementation(async (opts: { system: string }) => {
			return opts.system;
		});

		const getSystemPrompt = vi.fn(async () => "base prompt");
		const getTools = vi.fn(() => FAKE_TOOLS);

		const response = await handleAgentMessage(
			makeCtx(),
			"continue",
			"private",
			{
				getSystemPrompt,
				getTools,
			},
		);

		expect(response).toContain("base prompt");
		expect(response).toContain("## ORGANIZATION CONTEXT");
		expect(response).toContain("## KNOWLEDGE CONTEXT");
		expect(response).toContain("## ACTIVE WIZARD");
	});
});

describe("Type safety: AgentHandlerOptions interface", () => {
	it("getTools callback accepts ToolContext and returns GatewayTool[]", () => {
		// Compile-time check: the interface signature must accept this pattern
		const handler: AgentHandlerOptions["getTools"] = (
			context: ToolContext,
		): GatewayTool[] => {
			expect(context.orgId).toBeDefined();
			expect(context.audience).toBeDefined();
			return [];
		};

		const ctx: ToolContext = {
			orgId: TEST_ORG_ID,
			userId: "user-1",
			audience: "internal",
			supabase: { from: vi.fn() } as never,
		};

		const result = handler(ctx);
		expect(result).toEqual([]);
	});

	it("getSystemPrompt callback accepts correct parameters", async () => {
		const handler: AgentHandlerOptions["getSystemPrompt"] = async (
			productType,
			orgId,
			chatType,
			lang?,
		) => {
			expect(typeof productType).toBe("string");
			expect(typeof orgId).toBe("string");
			expect(typeof chatType).toBe("string");
			if (lang !== undefined) {
				expect(typeof lang).toBe("string");
			}
			return "prompt";
		};

		const result = await handler("zer", TEST_ORG_ID, "private", "mn");
		expect(result).toBe("prompt");
	});

	it("options interface is structurally compatible with required shape", () => {
		const opts: AgentHandlerOptions = {
			getSystemPrompt: async () => "prompt",
			getTools: () => [],
		};

		expect(typeof opts.getSystemPrompt).toBe("function");
		expect(typeof opts.getTools).toBe("function");
		expect(opts.dataClient).toBeUndefined();
		expect(opts.onToken).toBeUndefined();
	});

	it("options with optional fields compiles correctly", () => {
		const fakeClient = { from: vi.fn() } as never;
		const opts: AgentHandlerOptions = {
			getSystemPrompt: async () => "prompt",
			getTools: () => [],
			dataClient: fakeClient,
			onToken: vi.fn(),
		};

		expect(opts.dataClient).toBe(fakeClient);
		expect(typeof opts.onToken).toBe("function");
	});
});

describe("Edge cases: missing profile does not break pipeline", () => {
	it("returns LLM response even when loadAgentProfile throws", async () => {
		mockLoadAgentProfile.mockRejectedValue(new Error("DB connection lost"));

		const getSystemPrompt = vi.fn(async () => "base prompt");
		const getTools = vi.fn(() => FAKE_TOOLS);

		// The .catch(() => null) in agent-handler should swallow this
		const response = await handleAgentMessage(makeCtx(), "hello", "private", {
			getSystemPrompt,
			getTools,
		});

		expect(response).toBe("Hello from the agent!");
		expect(mockFormatProfileContext).not.toHaveBeenCalled();
	});

	it("returns LLM response when profile loading returns null", async () => {
		mockLoadAgentProfile.mockResolvedValue(null);

		const getSystemPrompt = vi.fn(async () => "base prompt");
		const getTools = vi.fn(() => FAKE_TOOLS);

		const response = await handleAgentMessage(makeCtx(), "hello", "private", {
			getSystemPrompt,
			getTools,
		});

		expect(response).toBe("Hello from the agent!");
	});
});
