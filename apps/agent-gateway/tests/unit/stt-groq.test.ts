import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { transcribeVoice } from "@/stt/groq";

vi.mock("@zuiio/capture", () => ({
	capture: vi.fn(),
}));

beforeEach(() => {
	delete process.env.GROQ_API_KEY;
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("transcribeVoice", () => {
	it("transcribes audio via Groq Whisper", async () => {
		process.env.GROQ_API_KEY = "groq-key";
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ text: "Сайн байна уу" }), {
				status: 200,
			}),
		);
		globalThis.fetch = fetchMock;

		const text = await transcribeVoice(Buffer.from("audio-bytes"), "voice.ogg");

		expect(text).toBe("Сайн байна уу");
		const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toContain("audio/transcriptions");
		expect((opts.headers as Record<string, string>).Authorization).toBe(
			"Bearer groq-key",
		);
		expect(opts.body).toBeInstanceOf(FormData);
	});

	it("returns null without GROQ_API_KEY", async () => {
		const text = await transcribeVoice(Buffer.from("x"), "voice.ogg");
		expect(text).toBeNull();
	});

	it("returns null when Groq fails", async () => {
		process.env.GROQ_API_KEY = "groq-key";
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(new Response("rate limited", { status: 429 }));
		const text = await transcribeVoice(Buffer.from("x"), "voice.ogg");
		expect(text).toBeNull();
	});

	it("returns null when the response has no text", async () => {
		process.env.GROQ_API_KEY = "groq-key";
		globalThis.fetch = vi
			.fn()
			.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
		const text = await transcribeVoice(Buffer.from("x"), "voice.ogg");
		expect(text).toBeNull();
	});
});
