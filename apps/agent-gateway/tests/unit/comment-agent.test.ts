import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FacebookChannel } from "@/channels/facebook";
import type { MetaFeedChangeValue } from "@/channels/types";
import {
	clearCommentCooldowns,
	DEFAULT_COMMENT_REPLY_CONFIG,
	isCoolingDown,
	markReplied,
	matchesKeywords,
	parseCommentReplyConfig,
	toUserComment,
} from "@/gateway/comment-agent";

const commentValue = (
	overrides: Partial<MetaFeedChangeValue> = {},
): MetaFeedChangeValue => ({
	item: "comment",
	verb: "add",
	comment_id: "comment_1",
	post_id: "post_1",
	from: { id: "user_1", name: "User" },
	message: "Үнэ хэд вэ?",
	...overrides,
});

describe("toUserComment", () => {
	it("extracts a valid user comment", () => {
		const result = toUserComment(commentValue(), "page_1");
		expect(result).toEqual({
			commentId: "comment_1",
			message: "Үнэ хэд вэ?",
			commenterId: "user_1",
		});
	});

	it("rejects comments authored by the Page (loop protection)", () => {
		expect(
			toUserComment(commentValue({ from: { id: "page_1" } }), "page_1"),
		).toBeNull();
	});

	it("rejects non-comment items and non-add verbs", () => {
		expect(toUserComment(commentValue({ item: "post" }), "page_1")).toBeNull();
		expect(
			toUserComment(commentValue({ verb: "remove" }), "page_1"),
		).toBeNull();
	});

	it("rejects comments without message, comment id, or sender", () => {
		expect(toUserComment(commentValue({ message: "" }), "page_1")).toBeNull();
		expect(
			toUserComment(commentValue({ message: "   " }), "page_1"),
		).toBeNull();
		expect(
			toUserComment(commentValue({ comment_id: undefined }), "page_1"),
		).toBeNull();
		expect(
			toUserComment(commentValue({ from: undefined }), "page_1"),
		).toBeNull();
	});
});

describe("matchesKeywords", () => {
	it("matches all comments when keyword list is empty", () => {
		expect(matchesKeywords("any text", [])).toBe(true);
	});

	it("matches case-insensitively", () => {
		expect(matchesKeywords("ХЭД ВЭ ЭНЭ?", ["хэд вэ"])).toBe(true);
	});

	it("rejects when no keyword appears", () => {
		expect(matchesKeywords("сайн байна уу", ["үнэ", "зарагдаж"])).toBe(false);
	});

	it("ignores empty keyword strings", () => {
		expect(matchesKeywords("", [""])).toBe(false);
	});
});

describe("parseCommentReplyConfig", () => {
	it("returns defaults when metadata is missing", () => {
		expect(parseCommentReplyConfig(null)).toEqual(DEFAULT_COMMENT_REPLY_CONFIG);
		expect(parseCommentReplyConfig({})).toEqual(DEFAULT_COMMENT_REPLY_CONFIG);
	});

	it("merges partial config over defaults", () => {
		const config = parseCommentReplyConfig({
			comment_reply: { enabled: false, keywords: ["үнэ"] },
		});
		expect(config.enabled).toBe(false);
		expect(config.keywords).toEqual(["үнэ"]);
		expect(config.publicReply).toBe(true);
		expect(config.privateReply).toBe(true);
	});

	it("drops non-string keywords and keeps custom fallback", () => {
		const config = parseCommentReplyConfig({
			comment_reply: {
				keywords: ["үнэ", 42, null],
				fallbackReply: "Баярлалаа!",
			},
		});
		expect(config.keywords).toEqual(["үнэ"]);
		expect(config.fallbackReply).toBe("Баярлалаа!");
	});
});

describe("per-commenter cooldown", () => {
	beforeEach(() => clearCommentCooldowns());
	afterEach(() => clearCommentCooldowns());

	it("blocks replies within the cooldown window", async () => {
		await markReplied("page_1", "user_1", 1_000_000);
		expect(await isCoolingDown("page_1", "user_1", 1_000_000 + 59_999)).toBe(
			true,
		);
		expect(await isCoolingDown("page_1", "user_1", 1_000_000 + 60_000)).toBe(
			false,
		);
	});

	it("tracks commenters independently", async () => {
		await markReplied("page_1", "user_1", 1_000_000);
		expect(await isCoolingDown("page_1", "user_2", 1_000_001)).toBe(false);
	});
});

describe("FacebookChannel comment methods", () => {
	const channel = new FacebookChannel({
		pageId: "page_1",
		pageAccessToken: "token",
	});

	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn());
	});
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("replyToComment posts to /{comment-id}/comments", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(new Response("{}", { status: 200 }));
		vi.stubGlobal("fetch", fetchMock);

		await expect(channel.replyToComment("comment_1", "Хариулт")).resolves.toBe(
			true,
		);
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toContain("/comment_1/comments");
		expect(JSON.parse(String(init.body))).toEqual({ message: "Хариулт" });
	});

	it("sendPrivateReply uses recipient.comment_id", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(new Response("{}", { status: 200 }));
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			channel.sendPrivateReply("comment_1", "Сайн байна уу?"),
		).resolves.toBe(true);
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toContain("/page_1/messages");
		expect(JSON.parse(String(init.body))).toEqual({
			recipient: { comment_id: "comment_1" },
			messaging_type: "RESPONSE",
			message: { text: "Сайн байна уу?" },
		});
	});

	it("hasPageReplied detects an existing Page reply", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ data: [{ from: { id: "page_1" } }] }), {
				status: 200,
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await expect(channel.hasPageReplied("comment_1")).resolves.toBe(true);
	});

	it("hasPageReplied returns false when only users replied", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ data: [{ from: { id: "user_9" } }] }), {
				status: 200,
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await expect(channel.hasPageReplied("comment_1")).resolves.toBe(false);
	});

	it("subscribeToWebhook defaults include the feed field", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(new Response("{}", { status: 200 }));
		vi.stubGlobal("fetch", fetchMock);

		await channel.subscribeToWebhook("page_1", "token");
		const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(JSON.parse(String(init.body)).subscribed_fields).toContain("feed");
	});
});
