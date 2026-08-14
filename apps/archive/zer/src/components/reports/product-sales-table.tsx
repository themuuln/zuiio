import { Package } from "@phosphor-icons/react/dist/ssr";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { Badge } from "@/components/ui/badge";
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
import type { ProductSalesRow } from "@/lib/reports";

export function ProductSalesTable({ data }: { data: ProductSalesRow[] }) {
  return (
    <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Бүтээгдэхүүн тус бүрийн борлуулалт</CardTitle>
        <CardDescription>
          Бүтээгдэхүүн тус бүрийн тоо хэмжээ, орлого, өртөг, ашиг
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <ErpEmptyState
            icon={<Package className="size-4" />}
            title="Бүтээгдэхүүний борлуулалтын мэдээлэл алга"
            description="Сонгосон хугацаанд борлуулалт хийгдээгүй эсвэл бүтээгдэхүүн байхгүй байна."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Бүтээгдэхүүн</TableHead>
                  <TableHead className="text-right">Тоо хэмжээ</TableHead>
                  <TableHead className="text-right">Орлого</TableHead>
                  <TableHead className="text-right">Өртөг</TableHead>
                  <TableHead className="text-right">Ашиг</TableHead>
                  <TableHead className="text-right">Ашиг %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.productName}>
                    <TableCell className="font-medium">
                      {row.productName}
                    </TableCell>
                    <TableCell className="text-right">{row.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.cost)}
                    </TableCell>
                    <TableCell
                      className={`text-right ${row.profit >= 0 ? "text-chart-2" : "text-destructive"}`}
                    >
                      {formatCurrency(row.profit)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={row.margin >= 0 ? "secondary" : "destructive"}
                      >
                        {row.margin.toFixed(1)}%
                      </Badge>
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
