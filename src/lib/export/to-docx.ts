import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { ExportColumn } from "./types";

/**
 * Converts an array of objects to a DOCX buffer.
 */
export async function toDocx(
  rows: Record<string, unknown>[],
  columns: ExportColumn[],
  title = "Export",
): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          buildTable(rows, columns),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

/**
 * Creates a DOCX buffer with multiple section tables.
 */
export async function toDocxMultiSection(
  sections: {
    title: string;
    rows: Record<string, unknown>[];
    columns: ExportColumn[];
  }[],
): Promise<Buffer> {
  const children = [];

  for (const { title, rows, columns } of sections) {
    children.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      }),
      buildTable(rows, columns),
    );
  }

  const doc = new Document({ sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
}

function buildTable(
  rows: Record<string, unknown>[],
  columns: ExportColumn[],
): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: columns.map(
      (col) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: col.header, bold: true })],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: { fill: "E5E7EB" },
          verticalAlign: "center",
        }),
    ),
  });

  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: columns.map(
          (col) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun(String(row[col.key] ?? ""))],
                }),
              ],
            }),
        ),
      }),
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}
