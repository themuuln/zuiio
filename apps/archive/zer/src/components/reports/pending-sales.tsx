import { CurrencyDollar } from "@phosphor-icons/react/dist/ssr";
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
import { formatCurrency, formatDate } from "@/lib/format";
import type { PendingSaleRow } from "@/lib/reports";

export function PendingSales({ data }: { data: PendingSaleRow[] }) {
  return (
    <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Хүлээгдэж буй борлуулалтууд</CardTitle>
        <CardDescription>
          Төлбөр хүлээгдэж буй борлуулалтын жагсаалт
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <ErpEmptyState
            icon={<CurrencyDollar className="size-4" />}
            title="Хүлээгдэж буй борлуулалт байхгүй"
            description="Сонгосон хугацаанд хүлээгдэж буй борлуулалт байхгүй байна."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Огноо</TableHead>
                  <TableHead>Харилцагч</TableHead>
                  <TableHead>Төлбөрийн арга</TableHead>
                  <TableHead className="text-right">Дүн</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.saleDate)}</TableCell>
                    <TableCell className="font-medium">
                      {row.contactName ?? "Walk-in"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {row.paymentMethod ?? "cash"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.totalAmount)}
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
