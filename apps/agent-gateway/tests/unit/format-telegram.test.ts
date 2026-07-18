import { describe, expect, it } from "vitest";
import {
	markdownToTelegramHtml,
	markdownToMessengerFormat,
	convertTablesToPlainList,
} from "@/lib/format-telegram";

describe("markdownToTelegramHtml", () => {
	it("strips <hr> tags replacing with newline", () => {
		const input = "Line 1\n<hr>\nLine 2";
		const result = markdownToTelegramHtml(input);
		expect(result).not.toContain("<hr>");
		expect(result).toContain("Line 1");
		expect(result).toContain("Line 2");
	});

	it("handles <hr/> self-closing variant", () => {
		const input = "Before<hr/>After";
		const result = markdownToTelegramHtml(input);
		expect(result).not.toContain("<hr");
		expect(result).toContain("Before");
		expect(result).toContain("After");
	});

	it("converts **bold** to <b> tags", () => {
		expect(markdownToTelegramHtml("**hello**")).toContain("<b>hello</b>");
		expect(markdownToTelegramHtml("**hello**")).not.toContain("**");
	});

	it("converts markdown tables to <pre> blocks", () => {
		const input = "| Name | Price |\n| --- | --- |\n| Item | 100 |";
		const result = markdownToTelegramHtml(input);
		expect(result).toContain("<pre>");
	});

	it("converts inline `code` to <code> tags", () => {
		expect(markdownToTelegramHtml("use `format()`")).toContain(
			"<code>format()</code>",
		);
	});

	it("converts *italic* to <i> tags", () => {
		expect(markdownToTelegramHtml("*italic*")).toContain("<i>italic</i>");
	});

	it("converts [text](url) to <a> tags", () => {
		expect(markdownToTelegramHtml("[click](https://x.com)")).toContain(
			'<a href="https://x.com">click</a>',
		);
	});

	it("converts - list items to bullet points", () => {
		expect(markdownToTelegramHtml("- item")).toContain("• item");
	});

	it("handles empty input", () => {
		expect(markdownToTelegramHtml("")).toBe("");
	});

	it("handles plain text without formatting", () => {
		expect(markdownToTelegramHtml("Just text")).toBe("Just text");
	});

	it("escapes stray HTML entities", () => {
		// < and > that aren't formatting tags should be escaped
		const result = markdownToTelegramHtml("a < b and c > d");
		expect(result).toContain("&lt;");
		expect(result).toContain("&gt;");
	});
});

describe("markdownToMessengerFormat", () => {
	it("converts **bold** to *bold* for Messenger", () => {
		expect(markdownToMessengerFormat("**hello**")).toBe("*hello*");
	});

	it("strips markdown headers", () => {
		expect(markdownToMessengerFormat("# Title\nContent")).not.toContain("#");
	});

	it("strips markdown links to plain text", () => {
		expect(markdownToMessengerFormat("[text](url)")).toBe("text");
	});

	it("handles empty input", () => {
		expect(markdownToMessengerFormat("")).toBe("");
	});
});

describe("convertTablesToPlainList", () => {
	it("converts tables to key-value list", () => {
		const input = "| Name | Value |\n| --- | --- |\n| A | 1 |";
		const result = convertTablesToPlainList(input);
		expect(result).toContain("A");
		expect(result).toContain("1");
		expect(result).not.toContain("|");
	});

	it("handles text without tables", () => {
		expect(convertTablesToPlainList("Just text")).toBe("Just text");
	});
});
