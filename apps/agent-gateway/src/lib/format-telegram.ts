/**
 * Convert basic markdown to Telegram HTML format.
 * Handles: **bold**, *italic*, `code`, ```code blocks```, lists, tables.
 */
export function markdownToTelegramHtml(text: string): string {
	let result = text;

	// Bold: **text** → <b>text</b>
	result = result.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

	// Italic: *text* → <i>text</i> (but not inside bold)
	result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<i>$1</i>");

	// Inline code: `text` → <code>text</code>
	result = result.replace(/`([^`]+)`/g, "<code>$1</code>");

	// Code blocks: ```text``` → <pre>text</pre>
	result = result.replace(/```(\w*)\n?([\s\S]*?)```/g, "<pre>$2</pre>");

	// Convert markdown tables to formatted text
	// | col1 | col2 | → formatted list
	result = convertTables(result);

	// Lists: - item → • item
	result = result.replace(/^- (.+)$/gm, "• $1");

	// Numbered lists: 1. item → keep as is (Telegram renders numbers)
	// Just clean up extra spaces
	result = result.replace(/^(\d+)\.\s{2,}/gm, "$1. ");

	return result;
}

function convertTables(text: string): string {
	const lines = text.split("\n");
	const result: string[] = [];
	let inTable = false;
	let headers: string[] = [];
	let separatorSeen = false;

	for (const line of lines) {
		const trimmed = line.trim();

		// Check if this is a table row
		if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
			const cells = trimmed
				.split("|")
				.slice(1, -1)
				.map((c) => c.trim());

			// Check if separator row (---|---)
			if (cells.every((c) => /^[-:]+$/.test(c))) {
				separatorSeen = true;
				continue;
			}

			if (!inTable) {
				// First row = headers
				headers = cells;
				inTable = true;
				separatorSeen = false;
			} else {
				// Data row
				const row = cells
					.map((c, i) => {
						const header = headers[i] ?? "";
						// Strip HTML tags for display
						const cleanHeader = header.replace(/<[^>]+>/g, "");
						const cleanCell = c.replace(/<[^>]+>/g, "");
						return `<b>${cleanHeader}:</b> ${cleanCell}`;
					})
					.join("\n");
				result.push(row);
				result.push(""); // blank line between rows
			}
		} else {
			if (inTable) {
				inTable = false;
				headers = [];
				separatorSeen = false;
			}
			result.push(line);
		}
	}

	return result.join("\n");
}
