import { CreditCard, Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { requireAppContext } from "@/lib/erp";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function ExpensesPage() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, category, amount, payment_method, expense_date, description")
    .eq("organization_id", organizationId)
    .order("expense_date", { ascending: false })
    .limit(50);

  const totalAmount =
    expenses?.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0) ??
    0;
  const cashCount =
    expenses?.filter((expense) => expense.payment_method === "cash").length ??
    0;
  const bankCount =
    expenses?.filter((expense) => expense.payment_method === "bank_transfer")
      .length ?? 0;

  return (
    <PageShell
      title="Зарлага"
      description="Өдөр тутмын мөнгөн урсгал, үйл ажиллагааны зардлуудаа хялбар бүртгэнэ."
      actions={
        <Button render={<Link href="/expenses/new" />}>
          <Plus data-icon="inline-start" />
          Зарлага нэмэх
        </Button>
      }
    >
      {!!expenses?.length && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Сүүлийн 50 зарлага</CardTitle>
              <CardDescription>Бүртгэгдсэн мөрийн тоо</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {expenses.length}
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Нийт дүн</CardTitle>
              <CardDescription>
                Сонгогдсон жагсаалтын нийт зарлага
              </CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {formatCurrency(totalAmount)}
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Төлбөрийн бүтэц</CardTitle>
              <CardDescription>
                {cashCount} бэлэн, {bankCount} данс
              </CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-chart-4">
              {cashCount + bankCount}
            </CardContent>
          </Card>
        </div>
      )}

      {!expenses?.length ? (
        <ErpEmptyState
          icon={<CreditCard className="size-4" />}
          title="Зарлагын бүртгэл алга"
          description="Түрээс, тээвэр, цалин, хангамж зэрэг бүх зардлаа энд ангилж бүртгэнэ."
          actionHref="/expenses/new"
          actionLabel="Анхны зарлага нэмэх"
        />
      ) : (
        <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Сүүлийн 50 зарлага</CardTitle>
            <CardDescription>
              Ангилал, тайлбар, төлбөрийн төрлөөр зарлагаа хурдан шалгана.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Огноо</TableHead>
                  <TableHead>Ангилал</TableHead>
                  <TableHead>Тайлбар</TableHead>
                  <TableHead>Төлбөр</TableHead>
                  <TableHead>Дүн</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDate(expense.expense_date)}</TableCell>
                    <TableCell className="font-medium">
                      {expense.category}
                    </TableCell>
                    <TableCell>{expense.description ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {expense.payment_method ?? "cash"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(Number(expense.amount))}
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
