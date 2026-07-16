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
			let headerDone = false;

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
					headerDone = true;
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
					// Single row — just show as bold list
					output.push(`<b>${headers.join(" | ")}</b>`);
				} else if (headers.length <= 3) {
					// Simple table: show as key-value pairs per row
					for (const row of dataRows) {
						const parts = headers.map((h, idx) => {
							const val = row[idx] ?? "—";
							return `<b>${h}:</b> ${val}`;
						});
						output.push(parts.join("\n"));
						output.push("");
					}
				} else {
					// Complex table: show each row as a block with header labels
					for (let r = 0; r < dataRows.length; r++) {
						const row = dataRows[r]!;
						const block = headers
							.map((h, idx) => {
								const val = row[idx] ?? "—";
								return `<b>${h}:</b> ${val}`;
							})
							.join("\n");
						output.push(block);
						if (r < dataRows.length - 1) output.push("—————————");
					}
				}
			}
		} else {
			output.push(lines[i]!);
			i++;
		}
	}

	return output.join("\n");
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
