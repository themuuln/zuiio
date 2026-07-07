import type { ExportColumn } from "./types";


function escapeCsv(
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const sanitized = SANITIZE_LEADING.test(str) ? `'${str}` : str;
  if (sanitized.includes(",") || sanitized.includes('"') || sanitized.includes("\n")) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

/** Characters that trigger formula injection protection. */
const SANITIZE_LEADING = /^[=+\-@\t\r]/;

/**
 * Converts an array of rows into a CSV string.
 * The columns define both the header row and how to extract values from each row
 * by key.
 */
export function toCsv(
  rows: Record<string, unknown>[],
  columns: ExportColumn[],
): string {
  const header = columns.map((c) => escapeCsv(c.header)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCsv(row[c.key] as string | number | boolean | null | undefined)).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
