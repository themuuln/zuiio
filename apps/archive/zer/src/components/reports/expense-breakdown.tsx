import { CreditCard } from "@phosphor-icons/react/dist/ssr";
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
import type { ExpenseCategoryRow } from "@/lib/reports";

export function ExpenseBreakdown({ data }: { data: ExpenseCategoryRow[] }) {
  const totalExpenses = data.reduce((sum, row) => sum + row.total, 0);

  return (
    <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Зарлагын ангилал</CardTitle>
        <CardDescription>Зарлагыг ангилалаар бүлэглэсэн дүн</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <ErpEmptyState
            icon={<CreditCard className="size-4" />}
            title="Зарлагын мэдээлэл алга"
            description="Сонгосон хугацаанд зарлага бүртгэгдээгүй байна."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ангилал</TableHead>
                  <TableHead className="text-right">Тоо</TableHead>
                  <TableHead className="text-right">Дүн</TableHead>
                  <TableHead className="text-right">Эзлэх хувь</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.category}>
                    <TableCell className="font-medium">
                      {row.category}
                    </TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      {totalExpenses > 0
                        ? `${((row.total / totalExpenses) * 100).toFixed(1)}%`
                        : "0%"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
