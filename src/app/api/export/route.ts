import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";

interface ExportColumnDef {
  key: string;
  label: string;
  format?: "currency" | "date" | "number" | "string";
}

interface ExportRequestBody {
  columns: ExportColumnDef[];
  data: Record<string, unknown>[];
  filename?: string;
  sheetName?: string;
  title?: string;
}

const COLORS = {
  headerBg: "1F2937",
  headerText: "FFFFFF",
  title: "1F2937",
  borderLight: "E5E7EB",
  borderDark: "374151",
  altRow: "F9FAFB",
  tab: "2563EB",
};

const HEADER_FONT = {
  bold: true as const,
  size: 11,
  color: { argb: COLORS.headerText },
};
const HEADER_FILL = {
  type: "pattern" as const,
  pattern: "solid" as const,
  fgColor: { argb: COLORS.headerBg },
};
const CURRENCY_FMT = "₮#,##0";

function displayWidth(rawLength: number, format?: string): number {
  if (format === "currency") {
    // ₮ adds 1 char, comma separators add ~1 per 3 digits
    const groupsOfThree = Math.max(0, Math.floor((rawLength - 1) / 3));
    return rawLength + 1 + groupsOfThree;
  }
  return rawLength;
}

function autoWidth(
  label: string,
  data: Record<string, unknown>[],
  key: string,
  format?: string,
): number {
  const maxLen = data.reduce(
    (max, row) => {
      const raw = row[key];
      const str = raw == null ? "" : String(raw);
      return Math.max(max, displayWidth(str.length, format));
    },
    displayWidth(label.length, format),
  );
  return Math.min(Math.max(maxLen, 10) + 3, 60);
}

export const POST = createSimpleRouteHandler(async ({ request }) => {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = mutationRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
          ),
        },
      },
    );
  }
  const body: ExportRequestBody = await request.json();
  const { columns, data, sheetName = "Sheet1", title } = body;

  if (!data.length) {
    return NextResponse.json(
      { error: { message: "No data to export" } },
      { status: 400 },
    );
  }

  const filename =
    body.filename ?? `export-${new Date().toISOString().split("T")[0]}.xlsx`;

  const wb = new ExcelJS.Workbook();
  wb.creator = "Tolom";
  wb.created = new Date();

  // Excel limits sheet names to 31 characters
  const safeSheetName = sheetName.slice(0, 31);
  const ws = wb.addWorksheet(safeSheetName);
  ws.properties.tabColor = { argb: COLORS.tab };

  ws.pageSetup.orientation = "landscape";
  ws.pageSetup.fitToPage = true;
  ws.pageSetup.fitToWidth = 1;
  ws.pageSetup.fitToHeight = 0;
  ws.pageSetup.paperSize = 9;
  ws.pageSetup.margins = {
    left: 0.5,
    right: 0.5,
    top: 0.6,
    bottom: 0.6,
    header: 0.3,
    footer: 0.3,
  };

  const colWidths = columns.map((col) =>
    autoWidth(col.label, data, col.key, col.format),
  );
  let rowIdx = 0;

  if (title) {
    const timestamp = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const titleCell = ws.getCell(rowIdx + 1, 1);
    titleCell.value = `${title}  —  Exported ${timestamp}`;
    titleCell.font = { bold: true, size: 14, color: { argb: COLORS.title } };
    titleCell.alignment = { vertical: "middle" };
    ws.mergeCells(rowIdx + 1, 1, rowIdx + 1, columns.length);
    ws.getRow(rowIdx + 1).height = 34;
    rowIdx++;
  }

  const headerRow = ws.getRow(rowIdx + 1);
  columns.forEach((col, ci) => {
    const cell = headerRow.getCell(ci + 1);
    cell.value = col.label;
    cell.font = HEADER_FONT;
    cell.fill = HEADER_FILL;
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: COLORS.borderDark } },
      bottom: { style: "thin", color: { argb: COLORS.borderDark } },
      left: { style: "thin", color: { argb: COLORS.borderDark } },
      right: { style: "thin", color: { argb: COLORS.borderDark } },
    };
  });
  headerRow.height = 34;
  rowIdx++;

  data.forEach((rawRow, di) => {
    const isAlt = di % 2 === 1;
    const excelRow = ws.getRow(rowIdx + 1);

    columns.forEach((col, ci) => {
      const raw = rawRow[col.key];
      const cell = excelRow.getCell(ci + 1);

      let value: string | number | Date | null = null;
      if (raw != null) {
        if (
          typeof raw === "string" ||
          typeof raw === "number" ||
          raw instanceof Date
        ) {
          value = raw;
        } else {
          value = String(raw);
        }
      }

      if (value == null) {
        cell.value = "";
      } else if (
        col.format === "date" &&
        (value instanceof Date || typeof value === "string")
      ) {
        const d = value instanceof Date ? value : new Date(value);
        cell.value = Number.isNaN(d.getTime()) ? String(value) : d;
        cell.numFmt = "yyyy-mm-dd";
      } else if (col.format === "currency" && typeof value === "number") {
        cell.value = value;
        cell.numFmt = CURRENCY_FMT;
      } else if (col.format === "number" && typeof value === "number") {
        cell.value = value;
      } else {
        cell.value = String(value);
      }

      const isCurrency = col.format === "currency";
      const isNumber = col.format === "number";

      cell.font = { size: 10.5 };
      cell.alignment = {
        horizontal: isCurrency || isNumber ? "right" : "left",
        vertical: "middle",
      };
      cell.border = {
        top: { style: "thin", color: { argb: COLORS.borderLight } },
        bottom: { style: "thin", color: { argb: COLORS.borderLight } },
        left: { style: "thin", color: { argb: COLORS.borderLight } },
        right: { style: "thin", color: { argb: COLORS.borderLight } },
      };

      if (isAlt) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: COLORS.altRow },
        };
      }
    });

    excelRow.height = 22;
    rowIdx++;
  });

  columns.forEach((_col, ci) => {
    ws.getColumn(ci + 1).width = colWidths[ci];
  });

  const freezeRow = title ? 2 : 1;
  ws.views = [
    {
      state: "frozen",
      ySplit: freezeRow,
      xSplit: 0,
      showGridLines: false,
      topLeftCell: `A${freezeRow + 1}`,
      activeCell: `A${freezeRow + 1}`,
    },
  ];

  const filterStartRow = title ? 2 : 1;
  const filterEndRow = data.length + filterStartRow;
  ws.autoFilter = {
    from: { row: filterStartRow, column: 1 },
    to: { row: filterEndRow, column: columns.length },
  };

  const buffer = await wb.xlsx.writeBuffer();

  // Add timestamp to filename to prevent overwrites
  const safeFilename = filename.replace(
    /\.xlsx$/,
    `-${Date.now().toString(36)}.xlsx`,
  );

  return new NextResponse(new Uint8Array(buffer as unknown as ArrayBuffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
    },
  });
});
