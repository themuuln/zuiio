import fontkit from "@pdf-lib/fontkit";
import type { PDFFont } from "pdf-lib";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { ExportColumn } from "./types";

// ── Font loading (lazy — node:fs is not available in browser) ──────

let cachedFontBytes: Uint8Array | null = null;

async function getRobotoFontBytes(): Promise<Uint8Array | null> {
  if (cachedFontBytes) return cachedFontBytes;
  try {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const FONT_PATH = join(
      typeof process !== "undefined" ? process.cwd() : "",
      "public/fonts/Roboto-Regular.ttf",
    );
    cachedFontBytes = readFileSync(FONT_PATH);
    return cachedFontBytes;
  } catch (err) {
    console.warn("Failed to load Cyrillic font for PDF:", err);
    return null;
  }
}

// ── Layout constants ────────────────────────────────────────────────

const MARGIN = 50;
const PAGE_WIDTH = 595; // A4
const PAGE_HEIGHT = 842;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const TITLE_SIZE = 18;
const HEADER_SIZE = 10;
const CELL_SIZE = 9;
const CELL_PADDING = 4;

// ── Types ────────────────────────────────────────────────────────────

type PdfTableSection = {
  title?: string;
  rows: Record<string, unknown>[];
  columns: ExportColumn[];
};

// ── PDF builder ──────────────────────────────────────────────────────

async function buildPdf(sections: PdfTableSection[]): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const fontBytes = await getRobotoFontBytes();
  let font: PDFFont;

  if (fontBytes) {
    font = await doc.embedFont(fontBytes, { subset: false });
  } else {
    // Fall back to built-in Helvetica (Latin-only, but won't crash)
    font = await doc.embedFont(StandardFonts.Helvetica);
  }

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;
  const colWidth = CONTENT_WIDTH;
  const rowHeight = 18;
  const headerHeight = 22;

  for (const section of sections) {
    // ── Title ──
    if (section.title) {
      if (y - TITLE_SIZE - 10 < MARGIN) {
        page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN;
      }
      page.drawText(section.title, {
        x: MARGIN,
        y,
        size: TITLE_SIZE,
        font,
        color: rgb(0.12, 0.12, 0.12),
      });
      y -= TITLE_SIZE + 8;
    }

    // ── Empty state ──
    if (section.rows.length === 0) {
      if (y - 20 < MARGIN) {
        page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN;
      }
      page.drawText("(Өгөгдөл байхгүй)", {
        x: MARGIN,
        y,
        size: CELL_SIZE,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
      y -= 20;
      continue;
    }

    const colCount = section.columns.length;
    const colW = colWidth / colCount;

    // ── Header row ──
    if (y - headerHeight < MARGIN) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }

    page.drawRectangle({
      x: MARGIN,
      y: y - headerHeight,
      width: colWidth,
      height: headerHeight,
      color: rgb(0.42, 0.45, 0.5),
    });

    for (let c = 0; c < colCount; c++) {
      page.drawText(section.columns[c].header, {
        x: MARGIN + c * colW + CELL_PADDING,
        y: y - headerHeight + 5,
        size: HEADER_SIZE,
        font,
        color: rgb(1, 1, 1),
      });
    }
    y -= headerHeight;

    // ── Data rows ──
    for (let r = 0; r < section.rows.length; r++) {
      if (y - rowHeight < MARGIN) {
        page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN;
      }

      if (r % 2 === 1) {
        page.drawRectangle({
          x: MARGIN,
          y: y - rowHeight,
          width: colWidth,
          height: rowHeight,
          color: rgb(0.95, 0.95, 0.97),
        });
      }

      for (let c = 0; c < colCount; c++) {
        const value = String(section.rows[r][section.columns[c].key] ?? "");
        page.drawText(value, {
          x: MARGIN + c * colW + CELL_PADDING,
          y: y - rowHeight + 4,
          size: CELL_SIZE,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
      }

      y -= rowHeight;
    }

    y -= 12; // gap between sections
  }

  return Buffer.from(await doc.save());
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Generates a PDF buffer from a single table of data.
 */
export function toPdf(
  _rows: Record<string, unknown>[],
  _columns: ExportColumn[],
  _title = "Export",
): Buffer {
  throw new Error(
    "toPdf is not supported directly. Use await toPdfAsync() instead.",
  );
}

/**
 * Generates a PDF buffer from multiple section tables.
 */
export function toPdfMultiSection(_sections: PdfTableSection[]): Buffer {
  throw new Error(
    "toPdfMultiSection is not supported directly. Use await toPdfMultiSectionAsync() instead.",
  );
}

/**
 * Async version: generates a PDF buffer from a single table of data.
 */
export async function toPdfAsync(
  rows: Record<string, unknown>[],
  columns: ExportColumn[],
  title = "Export",
): Promise<Buffer> {
  return buildPdf([{ title, rows, columns }]);
}

/**
 * Async version: generates a PDF buffer from multiple section tables.
 */
export async function toPdfMultiSectionAsync(
  sections: PdfTableSection[],
): Promise<Buffer> {
  return buildPdf(sections);
}
