import {
	convertMarkdownToRichBlocks,
	markdownToTelegramHtml,
} from "@zuiio/gateway-telegram";
import { describe, expect, it } from "vitest";

// ─── markdownToTelegramHtml ─────────────────────────────────────────────────

describe("markdownToTelegramHtml", () => {
	it("converts **bold** to <b> tags", () => {
		const result = markdownToTelegramHtml("**hello**");
		expect(result).toContain("<b>hello</b>");
		expect(result).not.toContain("**");
	});

	it("converts *italic* to <i> tags", () => {
		const result = markdownToTelegramHtml("*italic*");
		expect(result).toContain("<i>italic</i>");
	});

	it("converts `inline code` to <code> tags", () => {
		const result = markdownToTelegramHtml("use `code` here");
		expect(result).toContain("<code>code</code>");
	});

	it("converts ```code blocks``` to <pre><code> tags", () => {
		const result = markdownToTelegramHtml("```\nconsole.log('hi')\n```");
		expect(result).toContain("<pre><code>");
		expect(result).toContain("console.log");
	});

	it("converts code blocks with language hint", () => {
		const result = markdownToTelegramHtml("```ts\nconst x = 1;\n```");
		expect(result).toContain('class="language-ts"');
	});

	it("converts ~~strikethrough~~ to <s> tags", () => {
		const result = markdownToTelegramHtml("~~struck~~");
		expect(result).toContain("<s>struck</s>");
	});

	it("converts links to <a> tags", () => {
		const result = markdownToTelegramHtml("[click](https://example.com)");
		expect(result).toContain('<a href="https://example.com">click</a>');
	});

	it("converts - list items to bullet points", () => {
		const result = markdownToTelegramHtml("- item one\n- item two");
		expect(result).toContain("• item one");
		expect(result).toContain("• item two");
	});

	it("converts markdown tables to <pre> blocks", () => {
		const input = "| Name | Price |\n| --- | --- |\n| Item | 100 |";
		const result = markdownToTelegramHtml(input);
		expect(result).toContain("<pre>");
		expect(result).toContain("Name");
		expect(result).toContain("100");
	});

	it("strips <hr> tags", () => {
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

	it("handles plain text without markdown", () => {
		expect(markdownToTelegramHtml("Just text")).toBe("Just text");
	});

	it("handles empty string", () => {
		expect(markdownToTelegramHtml("")).toBe("");
	});

	it("escapes stray HTML entities but preserves formatting tags", () => {
		const result = markdownToTelegramHtml("A < B && B > C");
		expect(result).toContain("&lt;");
		expect(result).toContain("&gt;");
		expect(result).toContain("&amp;");
	});

	it("handles mixed formatting", () => {
		const result = markdownToTelegramHtml("**bold** and *italic* and `code`");
		expect(result).toContain("<b>bold</b>");
		expect(result).toContain("<i>italic</i>");
		expect(result).toContain("<code>code</code>");
	});
});

// ─── convertMarkdownToRichBlocks ────────────────────────────────────────────

describe("convertMarkdownToRichBlocks", () => {
	it("converts markdown tables to RichBlockTable blocks", () => {
		const input =
			"| Name | Price |\n| --- | --- |\n| Item | 100 |\n| Tax | 10 |";
		const blocks = convertMarkdownToRichBlocks(input);

		expect(blocks).toHaveLength(1);
		expect(blocks[0]).toMatchObject({ type: "table" });
	});

	it("returns empty array for text without tables", () => {
		const blocks = convertMarkdownToRichBlocks("Just text");
		expect(blocks).toHaveLength(0);
	});

	it("handles empty string", () => {
		expect(convertMarkdownToRichBlocks("")).toHaveLength(0);
	});
});
