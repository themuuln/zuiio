import { CurrencyCircleDollar } from "@phosphor-icons/react/dist/ssr";
import { ErpEmptyState } from "@/components/erp/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import type { CommissionSummaryData } from "@/lib/reports";

export function CommissionSummary({ data }: { data: CommissionSummaryData }) {
  const summaryCards = [
    {
      title: "Нийт комисс",
      value: data.totalEarned,
      color: "text-primary",
    },
    {
      title: "Төлсөн комисс",
      value: data.totalPaid,
      color: "text-chart-2",
    },
    {
      title: "Төлөгдөөгүй комисс",
      value: data.totalUnpaid,
      color: data.totalUnpaid > 0 ? "text-destructive" : "text-muted-foreground",
    },
  ];

  return (
    <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Комиссын тайлан</CardTitle>
        <CardDescription>
          Сонгосон хугацааны ажилтнуудын комиссын мэдээлэл
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Summary cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          {summaryCards.map((card) => (
            <div
              key={card.title}
              className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3"
            >
              <span className="text-xs text-muted-foreground">
                {card.title}
              </span>
              <span
                className={`text-xl font-semibold tabular-nums ${card.color}`}
              >
                {formatCurrency(card.value)}
              </span>
            </div>
          ))}
        </div>

        {/* Per-staff breakdown */}
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Ажилтан тус бүрээр
          </p>
          {data.staffBreakdown.length === 0 ? (
            <ErpEmptyState
              icon={<CurrencyCircleDollar className="size-4" />}
              title="Комиссын мэдээлэл алга"
              description="Сонгосон хугацаанд комиссын мэдээлэл байхгүй байна."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ажилтан</TableHead>
                    <TableHead className="text-right">Нийт комисс</TableHead>
                    <TableHead className="text-right">Төлсөн</TableHead>
                    <TableHead className="text-right">Төлөгдөөгүй</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.staffBreakdown.map((row) => (
                    <TableRow key={row.staffId}>
                      <TableCell className="font-medium">
                        {row.staffName}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.earned)}
                      </TableCell>
                      <TableCell className="text-right text-chart-2">
                        {formatCurrency(row.paid)}
                      </TableCell>
                      <TableCell
                        className={`text-right ${
                          row.unpaid > 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatCurrency(row.unpaid)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
