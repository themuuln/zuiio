import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
	markdownToMessengerFormat,
	markdownToTelegramHtml,
} from "@/lib/format-telegram";
import { calculateBackoff, classifyError } from "@/lib/resilience";
import {
	sanitizeDisplayName,
	sanitizeUserInput,
	truncateResult,
} from "@/lib/sanitize";

/**
 * Generates edge-case strings, Unicode, control characters, and injection
 * attacks for pure utility contracts.
 */
const FUZZ_CHARACTERS = [
	// Mongolian Cyrillic & Extended
	"А",
	"Б",
	"В",
	"Г",
	"Д",
	"Е",
	"Ё",
	"Ж",
	"З",
	"И",
	"Й",
	"К",
	"Л",
	"М",
	"Н",
	"О",
	"Ө",
	"П",
	"Р",
	"С",
	"Т",
	"У",
	"Ү",
	"Ф",
	"Х",
	"Ц",
	"Ч",
	"Ш",
	"Щ",
	"Ъ",
	"Ы",
	"Ь",
	"Э",
	"Ю",
	"Я",
	"а",
	"б",
	"в",
	"г",
	"д",
	"е",
	"ё",
	"ж",
	"з",
	"и",
	"й",
	"к",
	"л",
	"м",
	"н",
	"о",
	"ө",
	"п",
	"р",
	"с",
	"т",
	"у",
	"ү",
	"ф",
	"х",
	"ц",
	"ч",
	"ш",
	"щ",
	"ъ",
	"ы",
	"ь",
	"э",
	"ю",
	"я",
	// Traditional Mongolian script ranges
	"\u1820",
	"\u1821",
	"\u1828",
	"\u182D",
	"\u1834",
	// Markdown & HTML symbols
	"*",
	"_",
	"`",
	"#",
	"<",
	">",
	"&",
	"[",
	"]",
	"(",
	")",
	"{",
	"}",
	"|",
	"\n",
	"\r",
	"\t",
	" ",
	// Injection tokens & tags
	"<system>",
	"</system>",
	"<user_input>",
	"<qr>secret</qr>",
	"DROP TABLE",
	"--",
	"sk-1234567890123456789012",
	// Control chars
	"\x00",
	"\x01",
	"\x08",
	"\x1B",
	"\x7F",
	// Emojis & surrogate pairs
	"🇲🇳",
	"🤖",
	"📦",
	"💳",
	"🔥",
	"⚠️",
	// ASCII
	..."abcdefghijklmnopqrstuvwxyz0123456789".split(""),
] as const;

const fuzzCharacter = fc.constantFrom(...FUZZ_CHARACTERS);

function fuzzString(maxLength: number): fc.Arbitrary<string> {
	return fc
		.array(fuzzCharacter, { maxLength })
		.map((characters) => characters.join(""));
}

describe("generative fuzz & property tests", () => {
	it("markdownToTelegramHtml never crashes on arbitrary fuzz input", () => {
		fc.assert(
			fc.property(fuzzString(500), (input) => {
				expect(typeof markdownToTelegramHtml(input)).toBe("string");
			}),
			{ numRuns: 300 },
		);
	});

	it("markdownToMessengerFormat never crashes and preserves string integrity", () => {
		fc.assert(
			fc.property(fuzzString(500), (input) => {
				const output = markdownToMessengerFormat(input);
				expect(typeof output).toBe("string");
				expect(output).not.toMatch(/<(?:qr|system)[^>]*>/i);
			}),
			{ numRuns: 300 },
		);
	});

	it("sanitizeUserInput always enforces length bounds and strips control characters", () => {
		fc.assert(
			fc.property(fuzzString(3000), (input) => {
				const sanitized = sanitizeUserInput(input);
				expect(sanitized.length).toBeLessThanOrEqual(2000);
				expect(sanitized).not.toMatch(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/);
			}),
			{ numRuns: 300 },
		);
	});

	it("sanitizeDisplayName enforces safe string bounds", () => {
		fc.assert(
			fc.property(fuzzString(200), (input) => {
				const clean = sanitizeDisplayName(input);
				expect(typeof clean).toBe("string");
				expect(clean.length).toBeLessThanOrEqual(100);
			}),
			{ numRuns: 200 },
		);
	});

	it("truncateResult maintains bounded length and PARTIAL contract", () => {
		fc.assert(
			fc.property(
				fuzzString(4000),
				fc.integer({ min: 20, max: 219 }),
				(input, maxTokens) => {
					const result = truncateResult(input, maxTokens);
					expect(typeof result).toBe("string");
					if (input.length > maxTokens * 4) {
						expect(result).toContain("[PARTIAL:");
					}
				},
			),
			{ numRuns: 200 },
		);
	});

	it("classifyError consistently handles any status code and message", () => {
		fc.assert(
			fc.property(
				fc.oneof(fc.constant(undefined), fc.integer({ min: 0, max: 599 })),
				fc.oneof(fc.constant(undefined), fuzzString(200)),
				(status, message) => {
					const result = classifyError(status, message);
					expect(typeof result.retryable).toBe("boolean");
					expect(typeof result.isQuotaOrAuth).toBe("boolean");
					expect(typeof result.reason).toBe("string");
				},
			),
			{ numRuns: 300 },
		);
	});

	it("calculateBackoff always returns non-negative bounded integers", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 0, max: 10 }),
				fc.integer({ min: 200, max: 699 }),
				fc.integer({ min: 2000, max: 6999 }),
				(attempt, base, max) => {
					const delay = calculateBackoff(attempt, base, max);
					expect(delay).toBeGreaterThanOrEqual(0);
					expect(delay).toBeLessThanOrEqual(max);
				},
			),
			{ numRuns: 300 },
		);
	});
});
