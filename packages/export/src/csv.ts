import type { ExportColumn } from "./types";

/**
 * Sanitize a CSV cell value to prevent formula injection (CSV injection attack).
 * Prefixes dangerous leading characters (=, +, -, @) with a single quote.
 */
function sanitizeCsvCell(str: string): string {
  if (/^[=+\-@]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Convert an array of objects to a CSV string.
 *
 * @param rows   Array of data objects
 * @param columns  Column definitions (header + key)
 * @returns CSV string with header row followed by data rows
 */
export function toCsv(
  rows: Record<string, unknown>[],
  columns: ExportColumn[],
): string {
  const headerRow = columns.map((c) => c.header).join(",");

  const dataRows = rows.map((row) =>
    columns
      .map((c) => {
        const value = row[c.key];
        if (value === null || value === undefined) return "";
        const str = sanitizeCsvCell(String(value));
        // Escape quotes and wrap in quotes if the value contains commas,
        // double-quotes, or newlines
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(","),
  );

  return `${headerRow}\n${dataRows.join("\n")}`;
}
