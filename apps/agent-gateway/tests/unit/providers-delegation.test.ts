import { beforeEach, describe, expect, it, vi } from "vitest";
import { GptMiniProvider } from "@/providers/gpt-mini";
import { OpenCodeGoProvider } from "@/providers/opencode-go";
import type { ToolContext } from "@/providers/types";

vi.mock("server-only", () => ({}));

const mockLoop = vi.fn(async () => "reply");
vi.mock("@/providers/openai-compatible-loop", () => ({
	runOpenAiCompatibleLoop: (...a: unknown[]) => mockLoop(...a),
}));

const CONTEXT: ToolContext = {
	orgId: "org-1",
	userId: "u",
	supabase: {} as never,
};

beforeEach(() => {
	vi.clearAllMocks();
	mockLoop.mockResolvedValue("reply");
});

describe("OpenCodeGoProvider", () => {
	it("delegates to the shared loop with OpenCodeGo defaults", async () => {
		const provider = new OpenCodeGoProvider({ apiKey: "k" });
		const result = await provider.runWithTools({
			system: "sys",
			userMessage: "hi",
			tools: [],
			context: CONTEXT,
		});

		expect(result).toBe("reply");
		const opts = mockLoop.mock.calls[0]![0] as Record<string, unknown>;
		expect(opts.baseUrl).toBe("https://opencode.ai/zen/go/v1");
		expect(opts.model).toBe("deepseek-v4-flash");
		expect(opts.label).toBe("OpenCodeGo");
	});

	it("forwards onToken to the loop", async () => {
		const provider = new OpenCodeGoProvider({ apiKey: "k", model: "custom" });
		const onToken = vi.fn();
		await provider.runWithTools({
			system: "s",
			userMessage: "m",
			tools: [],
			context: CONTEXT,
			onToken,
		});
		expect(mockLoop.mock.calls[0]![0]).toMatchObject({
			model: "custom",
			onToken,
		});
	});
});

describe("GptMiniProvider", () => {
	it("delegates to the shared loop with OpenAI defaults", async () => {
		const provider = new GptMiniProvider({ apiKey: "k" });
		const result = await provider.runWithTools({
			system: "sys",
			userMessage: "hi",
			tools: [],
			context: CONTEXT,
		});

		expect(result).toBe("reply");
		const opts = mockLoop.mock.calls[0]![0] as Record<string, unknown>;
		expect(opts.baseUrl).toBe("https://api.openai.com/v1");
		expect(opts.model).toBe("gpt-4o-mini");
		expect(opts.label).toBe("OpenAI");
	});
});
