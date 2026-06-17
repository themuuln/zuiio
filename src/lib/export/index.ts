export { toDocx, toDocxMultiSection } from "./to-docx";
export { toPdfAsync, toPdfMultiSectionAsync } from "./to-pdf";
export { toXlsx, toXlsxMultiSheet } from "./to-xlsx";
export type { ExportColumn, ExportFormat } from "./types";
export { formatExtensions, formatMimeTypes } from "./types";

// Local imports for serveEntityExport
import { formatExtensions, formatMimeTypes } from "./types";
import { toCsv } from "@/lib/csv";
import { toDocx } from "./to-docx";
import { toPdfAsync } from "./to-pdf";
import { toXlsx } from "./to-xlsx";
import type { ExportColumn, ExportFormat } from "./types";

/**
 * Generates the appropriate Response for a simple tabular entity export
 * based on the requested format. Handles CSV, XLSX, DOCX, and PDF.
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
