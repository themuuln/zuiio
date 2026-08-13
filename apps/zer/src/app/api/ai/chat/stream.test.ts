import { runWithTools, type Tool } from "@zuiio/ai-agent";
import { afterEach, describe, expect, it, vi } from "vitest";

// @zuiio/ai-agent exports source (packages/ai-agent/src), so this exercises
// the REAL SSE stream parser inside runWithTools — token forwarding, chunk
// reassembly across network boundaries, tool-call delta reconstruction,
// and reasoning_content filtering. The route tests mock the agent; this
// file tests the actual streaming implementation.

vi.mock("server-only", () => ({}));

const encoder = new TextEncoder();

function sseResponse(chunks: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return {
    ok: true,
    status: 200,
    body,
    text: async () => "",
  } as unknown as Response;
}

function event(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

const DONE = "data: [DONE]\n\n";

function delta(payload: Record<string, unknown>): unknown {
  return { choices: [{ delta: payload, finish_reason: null }] };
}

describe("runWithTools streaming", () => {
  const fetchMock = vi.fn();

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("forwards content deltas and returns the assembled answer", async () => {
    // Deliberately split one SSE event across two network chunks to prove
    // the parser buffers partial frames correctly.
    const full = `data: ${JSON.stringify(delta({ content: "Сайн " }))}`;
    const chunks = [
      full.slice(0, 25),
      `${full.slice(25)}\n\n${event(delta({ content: "байна" }))}${event(
        delta({ content: " уу?" }),
      )}${DONE}`,
    ];
    fetchMock.mockResolvedValue(sseResponse(chunks));
    vi.stubGlobal("fetch", fetchMock);

    const tokens: string[] = [];
    const reply = await runWithTools({
      apiKey: "test-key",
      tools: [],
      systemPrompt: "prompt",
      userMessage: "hi",
      onToken: (t) => tokens.push(t),
    });

    expect(reply).toBe("Сайн байна уу?");
    expect(tokens).toEqual(["Сайн ", "байна", " уу?"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reassembles fragmented tool calls and streams only the final round", async () => {
    const round1 =
      event(
        delta({
          tool_calls: [
            {
              index: 0,
              id: "call_1",
              type: "function",
              function: { name: "search_products", arguments: "" },
            },
          ],
        }),
      ) +
      event(
        delta({
          tool_calls: [{ index: 0, function: { arguments: '{"search":' } }],
        }),
      ) +
      event(
        delta({
          tool_calls: [{ index: 0, function: { arguments: '"утас"}' } }],
        }),
      ) +
      DONE;
    const round2 = event(delta({ content: "Танд 2 утас байна." })) + DONE;

    fetchMock
      .mockResolvedValueOnce(sseResponse([round1]))
      .mockResolvedValueOnce(sseResponse([round2]));
    vi.stubGlobal("fetch", fetchMock);

    const tool = vi.fn().mockResolvedValue(JSON.stringify({ total_found: 2 }));
    const tools: Tool[] = [
      {
        name: "search_products",
        description: "Дэлгүүрийн бүтээгдэхүүнийг хайх",
        parameters: [],
        execute: tool,
      },
    ];

    const tokens: string[] = [];
    const reply = await runWithTools({
      apiKey: "test-key",
      tools,
      systemPrompt: "prompt",
      userMessage: "утас хай",
      onToken: (t) => tokens.push(t),
    });

    expect(reply).toBe("Танд 2 утас байна.");
    // Tool rounds emit no text deltas — the buyer only sees the answer.
    expect(tokens).toEqual(["Танд 2 утас байна."]);
    expect(tool).toHaveBeenCalledWith({ search: "утас" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("never forwards reasoning_content deltas", async () => {
    const stream =
      event(delta({ reasoning_content: "гүнзгий бодолт..." })) +
      event(delta({ content: "Хариулт" })) +
      event(delta({ reasoning_content: "илүү бодолт" })) +
      DONE;
    fetchMock.mockResolvedValue(sseResponse([stream]));
    vi.stubGlobal("fetch", fetchMock);

    const tokens: string[] = [];
    const reply = await runWithTools({
      apiKey: "test-key",
      tools: [],
      systemPrompt: "prompt",
      userMessage: "hi",
      onToken: (t) => tokens.push(t),
    });

    expect(reply).toBe("Хариулт");
    expect(tokens).toEqual(["Хариулт"]);
  });
});
