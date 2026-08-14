import { runWithTools } from "@zuiio/ai-agent";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Tests the REAL @zuiio/ai-agent tool loop (no agent mocking): parallel
 * tool execution and the SSE streaming path (onToken, fragmented
 * tool-call delta reassembly, finish_reason handling). These behaviors are
 * what the storefront chat route and widget depend on for latency and
 * progressive rendering.
 */

type AnyArgs = Record<string, unknown>;

function deltaChunk(
  delta: Record<string, unknown>,
  finishReason?: string,
): string {
  const choice: Record<string, unknown> = { delta };
  if (finishReason) choice.finish_reason = finishReason;
  return `data: ${JSON.stringify({ choices: [choice] })}\n\n`;
}

function jsonResponse(message: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ choices: [{ message }] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/** SSE frame carrying tool-call deltas for a streamed tool round. */
function toolCallDeltas(
  calls: Array<{ index: number; id: string; name: string; args: string }>,
): string[] {
  return [
    deltaChunk({ role: "assistant" }),
    ...calls.map((c) =>
      deltaChunk({
        tool_calls: [
          {
            index: c.index,
            id: c.id,
            function: { name: c.name, arguments: c.args },
          },
        ],
      }),
    ),
    deltaChunk({}, "tool_calls"),
    "data: [DONE]\n\n",
  ];
}

function sseResponse(frames: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const frame of frames) controller.enqueue(encoder.encode(frame));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

const lookupTool = {
  name: "lookup",
  description: "lookup",
  parameters: [{ name: "id", type: "string", required: true }],
  execute: async (args: AnyArgs) => ({ found: args.id }),
};

const toolCall = (id: string, name: string, args: string) => ({
  id,
  type: "function",
  function: { name, arguments: args },
});

describe("runWithTools", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("executes tool calls in parallel and pushes results in call order", async () => {
    // Deterministic concurrency proof: both tool executions must be in
    // flight simultaneously. A gate releases only when both have STARTED —
    // sequential execution would deadlock (and fail the test).
    let started = 0;
    let releaseGate: () => void = () => {};
    const gate = new Promise<void>((r) => {
      releaseGate = r;
    });
    const endOrder: string[] = [];
    const tools = [
      {
        ...lookupTool,
        execute: async (args: AnyArgs) => {
          started += 1;
          if (started === 2) releaseGate();
          await gate;
          endOrder.push(String(args.id));
          return { found: args.id };
        },
      },
    ];

    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        jsonResponse({
          role: "assistant",
          content: null,
          tool_calls: [
            toolCall("call-a", "lookup", '{"id":"a"}'),
            toolCall("call-b", "lookup", '{"id":"b"}'),
          ],
        }),
      )
      .mockImplementationOnce(() =>
        jsonResponse({ role: "assistant", content: "Дууслаа" }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const reply = await runWithTools({
      apiKey: "test",
      systemPrompt: "sys",
      userMessage: "hi",
      tools,
      maxRounds: 3,
      maxTokens: 256,
    });

    expect(reply).toBe("Дууслаа");
    expect(started).toBe(2);
    expect(endOrder.sort()).toEqual(["a", "b"]);

    // Tool results pushed back to the model in tool_calls order.
    const secondBody = JSON.parse(String(fetchMock.mock.calls[1][1].body));
    const toolMessages = secondBody.messages.filter(
      (m: { role: string }) => m.role === "tool",
    );
    expect(
      toolMessages.map((m: { tool_call_id: string }) => m.tool_call_id),
    ).toEqual(["call-a", "call-b"]);
  });

  it("streams final-answer deltas via onToken", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        sseResponse(
          toolCallDeltas([
            { index: 0, id: "c1", name: "lookup", args: '{"id":"x"}' },
          ]),
        ),
      )
      .mockImplementationOnce(() =>
        sseResponse([
          deltaChunk({ role: "assistant", content: "" }),
          deltaChunk({ content: "Сайн " }),
          deltaChunk({ content: "**байна**" }),
          deltaChunk({}, "stop"),
          "data: [DONE]\n\n",
        ]),
      );
    vi.stubGlobal("fetch", fetchMock);

    const tokens: string[] = [];
    const reply = await runWithTools({
      apiKey: "test",
      systemPrompt: "sys",
      userMessage: "hi",
      tools: [lookupTool],
      maxRounds: 3,
      maxTokens: 256,
      onToken: (t) => tokens.push(t),
    });

    expect(reply).toBe("Сайн **байна**");
    expect(tokens).toEqual(["Сайн ", "**байна**"]);
    // Streaming requested on the upstream call.
    expect(JSON.parse(String(fetchMock.mock.calls[1][1].body)).stream).toBe(
      true,
    );
  });

  it("reassembles tool-call arguments fragmented across SSE deltas", async () => {
    const received: AnyArgs[] = [];
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        sseResponse([
          deltaChunk({ role: "assistant" }),
          deltaChunk({
            tool_calls: [
              { index: 0, id: "c1", function: { name: "look", arguments: "" } },
            ],
          }),
          deltaChunk({
            tool_calls: [
              { index: 0, function: { name: "up", arguments: '{"id":"a' } },
            ],
          }),
          deltaChunk({
            tool_calls: [{ index: 0, function: { arguments: '"}' } }],
          }),
          deltaChunk({}, "tool_calls"),
          "data: [DONE]\n\n",
        ]),
      )
      .mockImplementationOnce(() =>
        sseResponse([
          deltaChunk({ role: "assistant", content: "Олдлоо" }),
          deltaChunk({}, "stop"),
          "data: [DONE]\n\n",
        ]),
      );
    vi.stubGlobal("fetch", fetchMock);

    const tools = [
      {
        ...lookupTool,
        execute: async (args: AnyArgs) => {
          received.push(args);
          return { found: args.id };
        },
      },
    ];

    const reply = await runWithTools({
      apiKey: "test",
      systemPrompt: "sys",
      userMessage: "hi",
      tools,
      maxRounds: 3,
      maxTokens: 256,
      onToken: () => {},
    });

    expect(reply).toBe("Олдлоо");
    expect(received).toEqual([{ id: "a" }]);
  });

  it("throws when the upstream API returns an error status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("rate limited", {
          status: 429,
          headers: { "Content-Type": "text/plain" },
        }),
      ),
    );

    await expect(
      runWithTools({
        apiKey: "test",
        systemPrompt: "sys",
        userMessage: "hi",
        tools: [],
        maxRounds: 2,
        maxTokens: 64,
      }),
    ).rejects.toThrow(/429/);
  });

  it("returns accumulated content when maxRounds is exhausted", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        jsonResponse({
          role: "assistant",
          content: "завсрын хариулт",
          tool_calls: [toolCall("c1", "lookup", '{"id":"x"}')],
        }),
      ),
    );

    const reply = await runWithTools({
      apiKey: "test",
      systemPrompt: "sys",
      userMessage: "hi",
      tools: [lookupTool],
      maxRounds: 2,
      maxTokens: 64,
    });

    expect(reply).toBe("завсрын хариулт");
  });
});
