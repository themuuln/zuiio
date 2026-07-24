export { markdownToMessengerFormat, convertTablesToPlainList } from "@zuiio/gateway-core";

/**
 * Convert AI-generated markdown to Telegram-compatible HTML.
 *
 * Telegram HTML supports: <b>, <i>, <u>, <s>, <code>, <pre>, <a href>.
 * Telegram does NOT support markdown tables — convert to formatted lists.
 */
export function markdownToTelegramHtml(text: string): string {
	let result = text;

	// First: convert tables BEFORE other transformations
	result = convertTables(result);

	// Code blocks: ```lang\n...``` → <pre><code class="language-lang">...</code></pre>
	result = result.replace(
		/```(\w*)\n?([\s\S]*?)```/g,
		(_, lang, code) => {
			const cls = lang ? ` class="language-${lang}"` : "";
			return `<pre><code${cls}>${escapeHtml(code.trim())}</code></pre>`;
		},
	);

	// Inline code: `text` → <code>text</code>
	result = result.replace(/`([^`]+)`/g, "<code>$1</code>");

	// Bold: **text** → <b>text</b>
	result = result.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

	// Italic: *text* → <i>text</i> (single asterisk, not inside bold)
	result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<i>$1</i>");

	// Strikethrough: ~~text~~ → <s>text</s>
	result = result.replace(/~~(.+?)~~/g, "<s>$1</s>");

	// Links: [text](url) → <a href="url">text</a>
	result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

	// Lists: - item → • item (bullet)
	result = result.replace(/^- (.+)$/gm, "• $1");

	// Escape any remaining HTML entities (but not our tags)
	result = escapeStrayHtml(result);

	return result;
}

function convertTables(text: string): string {
	const lines = text.split("\n");
	const output: string[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i]!.trim();

		// Detect table start: first row with | separators
		if (line.startsWith("|") && line.endsWith("|")) {
			const rows: string[][] = [];

			// Collect all table rows
			while (i < lines.length) {
				const row = lines[i]!.trim();
				if (!row.startsWith("|") || !row.endsWith("|")) break;

				const cells = row
					.split("|")
					.slice(1, -1)
					.map((c) => c.trim().replace(/\*\*/g, "").replace(/`/g, ""));

				// Skip separator rows (---|---|---)
				if (cells.every((c) => /^[-:]+$/.test(c))) {
					i++;
					continue;
				}

				rows.push(cells);
				i++;
			}

			if (rows.length > 0) {
				const headers = rows[0]!;
				const dataRows = rows.slice(1);

				if (dataRows.length === 0) {
					// Single row — show as bold header
					output.push(`<b>${headers.join(" | ")}</b>`);
				} else {
					// Calculate column widths for alignment
					const colWidths = headers.map((h, idx) => {
						const maxData = Math.max(
							...dataRows.map((r) => (r[idx] ?? "—").length),
						);
						return Math.max(h.length, maxData);
					});

					// Pad cell to column width
					const pad = (cell: string, width: number) =>
						cell + " ".repeat(Math.max(0, width - cell.length));

					// Build aligned table
					const headerLine = headers
						.map((h, idx) => pad(h, colWidths[idx]!))
						.join(" | ");
					const separator = colWidths.map((w) => "-".repeat(w)).join("-+-");
					const dataLines = dataRows.map((row) =>
						headers
							.map((_, idx) => pad(row[idx] ?? "—", colWidths[idx]!))
							.join(" | "),
					);

					const table = [headerLine, separator, ...dataLines].join("\n");
					output.push(`<pre>${table}</pre>`);
				}
			}
		} else {
			output.push(lines[i]!);
			i++;
		}
	}

	return output.join("\n");
}

/**
 * Convert markdown tables to Telegram RichBlockTable blocks (Bot API 10.1+).
 * Returns an array of blocks — empty if no tables found.
 * Used by TelegramChannel.sendRichMessage() for native table rendering.
 */
export function convertMarkdownToRichBlocks(
	text: string,
): Array<Record<string, unknown>> {
	const lines = text.split("\n");
	const blocks: Array<Record<string, unknown>> = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i]!.trim();

		if (line.startsWith("|") && line.endsWith("|")) {
			const rows: string[][] = [];

			while (i < lines.length) {
				const row = lines[i]!.trim();
				if (!row.startsWith("|") || !row.endsWith("|")) break;

				const cells = row
					.split("|")
					.slice(1, -1)
					.map((c) => c.trim());

				// Skip separator rows
				if (cells.every((c) => /^[-:]+$/.test(c))) {
					i++;
					continue;
				}

				rows.push(cells);
				i++;
			}

			if (rows.length > 0) {
				const headers = rows[0]!;
				const dataRows = rows.slice(1);

				const tableRows: Array<Record<string, unknown>> = [];

				// Header row (bold)
				tableRows.push({
					cells: headers.map((h) => ({
						text: h.replace(/\*\*/g, "").replace(/`/g, ""),
						style: ["bold"],
					})),
				});

				// Data rows
				for (const row of dataRows) {
					tableRows.push({
						cells: row.map((cell) => ({
							text: cell.replace(/\*\*/g, "").replace(/`/g, ""),
						})),
					});
				}

				blocks.push({
					type: "table",
					rows: tableRows,
				});
			}
		} else {
			i++;
		}
	}

	return blocks;
}

/** Escape < > & in text but preserve our formatting tags */
function escapeStrayHtml(text: string): string {
	// Split by our known tags, escape the non-tag parts, rejoin
	const tagPattern = /<(\/?)(b|i|u|s|code|pre|a|strong|em|span)[^>]*>/gi;
	const parts: string[] = [];
	let lastIdx = 0;

	for (const match of text.matchAll(tagPattern)) {
		if (match.index! > lastIdx) {
			parts.push(escapeHtml(text.slice(lastIdx, match.index!)));
		}
		parts.push(match[0]!);
		lastIdx = match.index! + match[0]!.length;
	}
	if (lastIdx < text.length) {
		parts.push(escapeHtml(text.slice(lastIdx)));
	}

	return parts.join("");
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}
