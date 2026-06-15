import { toCsv } from "@/lib/csv";
import { requireAppContext } from "@/lib/erp";
import { getFullReport } from "@/lib/reports";

export async function GET(request: Request) {
  const { supabase, organizationId } = await requireAppContext();

  const { searchParams } = new URL(request.url);
  const from =
    searchParams.get("from") ?? new Date().toISOString().slice(0, 10);
  const to = searchParams.get("to") ?? new Date().toISOString().slice(0, 10);

  const report = await getFullReport(supabase, organizationId, from, to);

  const sections: string[] = [];

  // ── Financial Summary ──
  sections.push("### Санхүүгийн хураангуй ###");
  sections.push(
    toCsv(
      [report.financialSummary],
      [
        { header: "Нийт борлуулалт", key: "totalSales" },
        { header: "Нийт төлбөр", key: "totalPaid" },
        { header: "Нийт зарлага", key: "totalExpenses" },
        { header: "Цэвэр мөнгө", key: "netCash" },
        { header: "Нийт ашиг", key: "grossProfit" },
      ],
    ),
  );

  // ── Product Sales ──
  if (report.productSales.length > 0) {
    sections.push("### Бүтээгдэхүүний борлуулалт ###");
    sections.push(
      toCsv(report.productSales, [
        { header: "Бүтээгдэхүүн", key: "productName" },
        { header: "Тоо хэмжээ", key: "quantity" },
        { header: "Орлого", key: "revenue" },
        { header: "Өртөг", key: "cost" },
        { header: "Ашиг", key: "profit" },
        { header: "Ашгийн хувь", key: "margin" },
      ]),
    );
  }

  // ── Expense Breakdown ──
  if (report.expenseBreakdown.length > 0) {
    sections.push("### Зарлагын ангилал ###");
    sections.push(
      toCsv(report.expenseBreakdown, [
        { header: "Ангилал", key: "category" },
        { header: "Тоо", key: "count" },
        { header: "Нийт дүн", key: "total" },
      ]),
    );
  }

  // ── Stock Movements ──
  sections.push("### Барааны хөдөлгөөн ###");
  sections.push(
    toCsv(
      [report.stockMovements],
      [
        { header: "Орлого", key: "in" },
        { header: "Зарлага", key: "out" },
        { header: "Тохируулга", key: "adjustment" },
      ],
    ),
  );

  // ── Pending Sales ──
  if (report.pendingSales.length > 0) {
    sections.push("### Хүлээгдэж буй борлуулалт ###");
    sections.push(
      toCsv(report.pendingSales, [
        { header: "ID", key: "id" },
        { header: "Харилцагч", key: "contactName" },
        { header: "Огноо", key: "saleDate" },
        { header: "Нийт дүн", key: "totalAmount" },
        { header: "Төлбөрийн хэлбэр", key: "paymentMethod" },
      ]),
    );
  }

  const csv = sections.join("\n\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reports-export-${from}-to-${to}.csv"`,
    },
  });
}
