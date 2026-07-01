import { toCsv } from "./csv";
import { toDocx } from "./docx";
import { toPdfAsync } from "./pdf";
import type { ExportColumn, ExportFormat } from "./types";
import { formatExtensions, formatMimeTypes } from "./types";
import { toXlsx } from "./xlsx";

/**
 * Generate the appropriate `Response` for a tabular entity export
 * based on the requested format. Handles CSV, XLSX, DOCX, and PDF.
 *
 * @param rows     Data rows to export
 * @param columns  Column definitions (header + key)
 * @param format   One of "csv" | "xlsx" | "docx" | "pdf"
 * @param filename Base filename (without extension)
 * @param title    Optional title for the exported document
 */
export async function serveEntityExport(
  rows: Record<string, unknown>[],
  columns: ExportColumn[],
  format: ExportFormat,
  filename: string,
  title?: string,
): Promise<Response> {
  switch (format) {
    case "csv": {
      const csv = toCsv(rows, columns);
      return new Response(csv, {
        headers: {
          "Content-Type": formatMimeTypes.csv,
          "Content-Disposition": `attachment; filename="${filename}${formatExtensions.csv}"`,
        },
      });
    }
    case "xlsx": {
      const buffer = await toXlsx(rows, columns, title);
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": formatMimeTypes.xlsx,
          "Content-Disposition": `attachment; filename="${filename}${formatExtensions.xlsx}"`,
        },
      });
    }
    case "docx": {
      const buffer = await toDocx(rows, columns, title);
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": formatMimeTypes.docx,
          "Content-Disposition": `attachment; filename="${filename}${formatExtensions.docx}"`,
        },
      });
    }
    case "pdf": {
      const buffer = await toPdfAsync(rows, columns, title);
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": formatMimeTypes.pdf,
          "Content-Disposition": `attachment; filename="${filename}${formatExtensions.pdf}"`,
        },
      });
    }
    default: {
      return new Response("Unsupported export format", { status: 400 });
    }
  }
}
