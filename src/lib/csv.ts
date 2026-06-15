/**
 * Converts an array of objects to a CSV string.
 * @param rows - Array of data objects
 * @param columns - Column definitions with header label and key to extract from each row
 * @returns A CSV string with header row and data rows
 */
export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: { header: string; key: keyof T }[],
): string {
  const headerRow = columns.map((c) => c.header).join(",");

  const dataRows = rows.map((row) =>
    columns
      .map((c) => {
        const value = row[c.key];
        if (value === null || value === undefined) return "";
        const str = String(value);
        // Escape quotes and wrap in quotes if the value contains commas, quotes, or newlines
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(","),
  );

  return `${headerRow}\n${dataRows.join("\n")}`;
}
