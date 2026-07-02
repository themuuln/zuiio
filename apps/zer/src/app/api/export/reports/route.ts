import { toCsv } from "@/lib/csv";
import { requireAppContext } from "@/lib/erp";
import type { ExportColumn, ExportFormat } from "@/lib/export";
import {
  formatExtensions,
  formatMimeTypes,
  toDocxMultiSection,
  toPdfMultiSectionAsync,
  toXlsxMultiSheet,
} from "@/lib/export";
import {
  type CommissionStaffRow,
  type ExpenseCategoryRow,
  type FinancialSummary,
  getFullReport,
  type PendingSaleRow,
  type ProductSalesRow,
  type StockMovementsSummary,
} from "@/lib/reports";

// ── Column definitions per section ───────────────────────────────────

const financialCols: ExportColumn[] = [
  { header: "Нийт борлуулалт", key: "totalSales" },
  { header: "Нийт төлбөр", key: "totalPaid" },
  { header: "Нийт зарлага", key: "totalExpenses" },
  { header: "Цэвэр мөнгө", key: "netCash" },
  { header: "Нийт ашиг", key: "grossProfit" },
];

const productSalesCols: ExportColumn[] = [
  { header: "Бүтээгдэхүүн", key: "productName" },
  { header: "Тоо хэмжээ", key: "quantity" },
  { header: "Орлого", key: "revenue" },
  { header: "Өртөг", key: "cost" },
  { header: "Ашиг", key: "profit" },
  { header: "Ашгийн хувь", key: "margin" },
];

const expenseCols: ExportColumn[] = [
  { header: "Ангилал", key: "category" },
  { header: "Тоо", key: "count" },
  { header: "Нийт дүн", key: "total" },
];

const stockCols: ExportColumn[] = [
  { header: "Орлого", key: "in" },
  { header: "Зарлага", key: "out" },
  { header: "Тохируулга", key: "adjustment" },
];

const pendingSalesCols: ExportColumn[] = [
  { header: "ID", key: "id" },
  { header: "Харилцагч", key: "contactName" },
  { header: "Огноо", key: "saleDate" },
  { header: "Нийт дүн", key: "totalAmount" },
  { header: "Төлбөрийн хэлбэр", key: "paymentMethod" },
];

const commissionStaffCols: ExportColumn[] = [
  { header: "Ажилтан", key: "staffName" },
  { header: "Олсон", key: "earned" },
  { header: "Төлсөн", key: "paid" },
  { header: "Төлөгдөөгүй", key: "unpaid" },
];

// ── Router ───────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { supabase, organizationId } = await requireAppContext();

  const { searchParams } = new URL(request.url);
  const from =
    searchParams.get("from") ?? new Date().toISOString().slice(0, 10);
  const to = searchParams.get("to") ?? new Date().toISOString().slice(0, 10);
  const format = (searchParams.get("format") ?? "csv") as ExportFormat;

  const report = await getFullReport(supabase, organizationId, from, to);

  const filename = `reports-export-${from}-to-${to}`;

  switch (format) {
    case "csv":
      return serveCsv(report, filename, from, to);
    case "xlsx":
      return serveXlsx(report, filename);
    case "docx":
      return serveDocx(report, filename);
    case "pdf":
      return servePdf(report, filename);
    default:
      return serveCsv(report, filename, from, to);
  }
}

// ── CSV ──────────────────────────────────────────────────────────────

function serveCsv(
  report: Awaited<ReturnType<typeof getFullReport>>,
  filename: string,
  _from: string,
  _to: string,
): Response {
  const sections: string[] = [];

  sections.push("### Санхүүгийн хураангуй ###");
  sections.push(
    toCsv(
      [report.financialSummary],
      financialCols as { header: string; key: keyof FinancialSummary }[],
    ),
  );

  if (report.productSales.length > 0) {
    sections.push("### Бүтээгдэхүүний борлуулалт ###");
    sections.push(
      toCsv(
        report.productSales,
        productSalesCols as { header: string; key: keyof ProductSalesRow }[],
      ),
    );
  }

  if (report.expenseBreakdown.length > 0) {
    sections.push("### Зарлагын ангилал ###");
    sections.push(
      toCsv(
        report.expenseBreakdown,
        expenseCols as { header: string; key: keyof ExpenseCategoryRow }[],
      ),
    );
  }

  sections.push("### Барааны хөдөлгөөн ###");
  sections.push(
    toCsv(
      [report.stockMovements],
      stockCols as { header: string; key: keyof StockMovementsSummary }[],
    ),
  );

  if (report.pendingSales.length > 0) {
    sections.push("### Хүлээгдэж буй борлуулалт ###");
    sections.push(
      toCsv(
        report.pendingSales,
        pendingSalesCols as { header: string; key: keyof PendingSaleRow }[],
      ),
    );
  }

  // ── Commission Breakdown ──
  if (report.commissionSummary.staffBreakdown.length > 0) {
    sections.push("### Шагналын дэлгэрэнгүй ###");
    sections.push(
      toCsv(
        report.commissionSummary.staffBreakdown,
        commissionStaffCols as {
          header: string;
          key: keyof CommissionStaffRow;
        }[],
      ),
    );
  }

  return new Response(sections.join("\n\n"), {
    headers: {
      "Content-Type": formatMimeTypes.csv,
      "Content-Disposition": `attachment; filename="${filename}${formatExtensions.csv}"`,
    },
  });
}

// ── XLSX ─────────────────────────────────────────────────────────────

async function serveXlsx(
  report: Awaited<ReturnType<typeof getFullReport>>,
  filename: string,
): Promise<Response> {
  const sheets = [
    {
      name: "Санхүүгийн хураангуй",
      rows: [report.financialSummary as unknown as Record<string, unknown>],
      columns: financialCols,
    },
    {
      name: "Бүтээгдэхүүний борлуулалт",
      rows: report.productSales as unknown as Record<string, unknown>[],
      columns: productSalesCols,
    },
    {
      name: "Зарлагын ангилал",
      rows: report.expenseBreakdown as unknown as Record<string, unknown>[],
      columns: expenseCols,
    },
    {
      name: "Барааны хөдөлгөөн",
      rows: [report.stockMovements as unknown as Record<string, unknown>],
      columns: stockCols,
    },
    {
      name: "Хүлээгдэж буй борлуулалт",
      rows: report.pendingSales as unknown as Record<string, unknown>[],
      columns: pendingSalesCols,
    },
  ];

  if (report.commissionSummary.staffBreakdown.length > 0) {
    sheets.push({
      name: "Шагнал",
      rows: report.commissionSummary.staffBreakdown as unknown as Record<
        string,
        unknown
      >[],
      columns: commissionStaffCols,
    });
  }

  const buffer = await toXlsxMultiSheet(sheets);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": formatMimeTypes.xlsx,
      "Content-Disposition": `attachment; filename="${filename}${formatExtensions.xlsx}"`,
    },
  });
}

// ── DOCX ─────────────────────────────────────────────────────────────

async function serveDocx(
  report: Awaited<ReturnType<typeof getFullReport>>,
  filename: string,
): Promise<Response> {
  const sections = [
    {
      title: "Санхүүгийн хураангуй",
      rows: [report.financialSummary as unknown as Record<string, unknown>],
      columns: financialCols,
    },
    {
      title: "Бүтээгдэхүүний борлуулалт",
      rows: report.productSales as unknown as Record<string, unknown>[],
      columns: productSalesCols,
    },
    {
      title: "Зарлагын ангилал",
      rows: report.expenseBreakdown as unknown as Record<string, unknown>[],
      columns: expenseCols,
    },
    {
      title: "Барааны хөдөлгөөн",
      rows: [report.stockMovements as unknown as Record<string, unknown>],
      columns: stockCols,
    },
    {
      title: "Хүлээгдэж буй борлуулалт",
      rows: report.pendingSales as unknown as Record<string, unknown>[],
      columns: pendingSalesCols,
    },
  ];

  if (report.commissionSummary.staffBreakdown.length > 0) {
    sections.push({
      title: "Шагналын дэлгэрэнгүй",
      rows: report.commissionSummary.staffBreakdown as unknown as Record<
        string,
        unknown
      >[],
      columns: commissionStaffCols,
    });
  }

  const buffer = await toDocxMultiSection(sections);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": formatMimeTypes.docx,
      "Content-Disposition": `attachment; filename="${filename}${formatExtensions.docx}"`,
    },
  });
}

// ── PDF ──────────────────────────────────────────────────────────────

async function servePdf(
  report: Awaited<ReturnType<typeof getFullReport>>,
  filename: string,
): Promise<Response> {
  const sections = [
    {
      title: "Санхүүгийн хураангуй",
      rows: [report.financialSummary as unknown as Record<string, unknown>],
      columns: financialCols,
    },
    {
      title: "Бүтээгдэхүүний борлуулалт",
      rows: report.productSales as unknown as Record<string, unknown>[],
      columns: productSalesCols,
    },
    {
      title: "Зарлагын ангилал",
      rows: report.expenseBreakdown as unknown as Record<string, unknown>[],
      columns: expenseCols,
    },
    {
      title: "Барааны хөдөлгөөн",
      rows: [report.stockMovements as unknown as Record<string, unknown>],
      columns: stockCols,
    },
    {
      title: "Хүлээгдэж буй борлуулалт",
      rows: report.pendingSales as unknown as Record<string, unknown>[],
      columns: pendingSalesCols,
    },
  ];

  if (report.commissionSummary.staffBreakdown.length > 0) {
    sections.push({
      title: "Шагналын дэлгэрэнгүй",
      rows: report.commissionSummary.staffBreakdown as unknown as Record<
        string,
        unknown
      >[],
      columns: commissionStaffCols,
    });
  }

  const buffer = await toPdfMultiSectionAsync(sections);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": formatMimeTypes.pdf,
      "Content-Disposition": `attachment; filename="${filename}${formatExtensions.pdf}"`,
    },
  });
}
