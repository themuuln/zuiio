import ExcelJS from "exceljs";
import type { ExportColumn } from "./types";

/**
 * Convert an array of objects to an XLSX buffer (single sheet).
 */
export async function toXlsx(
  rows: Record<string, unknown>[],
  columns: ExportColumn[],
  sheetName = "Export",
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  // Header row
  const headerRow = sheet.addRow(columns.map((c) => c.header));
  headerRow.font = { bold: true };

  // Data rows
  for (const row of rows) {
    sheet.addRow(columns.map((c) => row[c.key] ?? ""));
  }

  // Auto-fit column widths
  columns.forEach((_col, i) => {
    const maxLength = Math.max(
      columns[i]!.header.length,
      ...rows.map((r) => String(r[columns[i]!.key] ?? "").length),
    );
    sheet.getColumn(i + 1).width = Math.min(Math.max(maxLength + 2, 10), 40);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Create an XLSX buffer with multiple named sheets.
 */
export async function toXlsxMultiSheet(
  sheets: {
    name: string;
    rows: Record<string, unknown>[];
    columns: ExportColumn[];
  }[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  for (const { name, rows, columns } of sheets) {
    const sheet = workbook.addWorksheet(name);

    const headerRow = sheet.addRow(columns.map((c) => c.header));
    headerRow.font = { bold: true };

    for (const row of rows) {
      sheet.addRow(columns.map((c) => row[c.key] ?? ""));
    }

    columns.forEach((_col, i) => {
      const maxLength = Math.max(
        columns[i]!.header.length,
        ...rows.map((r) => String(r[columns[i]!.key] ?? "").length),
      );
      sheet.getColumn(i + 1).width = Math.min(Math.max(maxLength + 2, 10), 40);
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
