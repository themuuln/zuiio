/**
 * Convert message formatting for Messenger / WhatsApp / Instagram.
 *
 * These channels support limited formatting:
 * - Bold: `*text*` (single asterisk, not double)
 * - Tables: convert to plain-text list (no HTML, no pipe syntax)
 * - Strip other markdown (headers, links) to plain text
 */
export function markdownToMessengerFormat(text: string): string {
  let result = convertTablesToPlainList(text);
  // **bold** → *bold* (Messenger/WhatsApp single-asterisk syntax)
  result = result.replace(/\*\*(.+?)\*\*/g, "*$1*");
  // Strip remaining markdown artifacts: headers, links, stray asterisks
  result = result.replace(/^#{1,6}\s+/gm, "");
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  return result;
}

/**
 * Convert markdown tables to plain-text key-value lists (no HTML tags).
 */
export function convertTablesToPlainList(text: string): string {
  const tableRegex = /^\|(.+)\|(?:\r?\n\|[-| :]+\|)((?:\r?\n\|.+\|)*)/gm;
  return text.replace(tableRegex, (match) => {
    const lines = match.split("\n");
    if (lines.length < 2) return match;

    // First line is header — skip
    // Remaining lines are data rows
    const rows = lines.slice(2).map((line) =>
      line
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim()),
    );

    // For 2-column tables, render as key: value pairs
    // For wider tables, render as columns with labels
    if (rows[0]?.length === 2) {
      return rows.map(([k, v]) => `${k}: ${v}`).join("\n");
    }
    // Fallback: comma-separated values on each row
    return rows.map((row) => row.join(", ")).join("\n");
  });
}
