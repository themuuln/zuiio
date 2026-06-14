import { ArrowsClockwise, Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAppContext } from "@/lib/erp";
import { formatCurrency, formatDate } from "@/lib/format";

const MOVEMENT_LABELS: Record<string, string> = {
  in: "Орлого",
  out: "Зарлага",
  adjustment: "Тохируулга",
};

export default async function InventoryMovementsPage() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: movements } = await supabase
    .from("stock_movements")
    .select(
      "id, type, quantity, unit_cost, reference, notes, created_at, products(name, unit, sku)",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <PageShell
      title="Барааны хөдөлгөөн"
      description="Орлого, зарлага, үлдэгдлийн тохируулгын сүүлийн 50 бүртгэл."
      actions={
        <Button render={<Link href="/inventory/movements/new" />}>
          <Plus data-icon="inline-start" />
          Шинэ хөдөлгөөн
        </Button>
      }
    >
      {!movements?.length ? (
        <ErpEmptyState
          icon={<ArrowsClockwise className="size-4" />}
          title="Хөдөлгөөн бүртгэгдээгүй байна"
          description="Шинэ худалдан авалт, борлуулалт эсвэл тооллогын дараах тохируулга энд харагдана."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Сүүлийн бүртгэлүүд</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Огноо</TableHead>
                  <TableHead>Бүтээгдэхүүн</TableHead>
                  <TableHead>Төрөл</TableHead>
                  <TableHead>Тоо хэмжээ</TableHead>
                  <TableHead>Өртөг</TableHead>
                  <TableHead>Лавлагаа</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {formatDate(
                        movement.created_at ?? new Date().toISOString(),
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {movement.products?.name ?? "Устсан бүтээгдэхүүн"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          movement.type === "out" ? "destructive" : "secondary"
                        }
                      >
                        {MOVEMENT_LABELS[movement.type] ?? movement.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {movement.quantity} {movement.products?.unit ?? "ширхэг"}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(Number(movement.unit_cost ?? 0))}
                    </TableCell>
                    <TableCell>
                      {movement.reference ?? movement.notes ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
