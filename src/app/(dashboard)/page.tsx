import {
  ArrowSquareOut,
  CreditCard,
  CurrencyDollar,
  Package,
  Sparkle,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { PageShell } from "@/components/erp/page-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { getDashboardMetrics, requireAppContext } from "@/lib/erp";
import { formatCurrency } from "@/lib/format";

export default async function DashboardPage() {
  const { supabase, organizationId, profile } = await requireAppContext();
  const today = new Date().toISOString().split("T")[0];

  const [metrics, recentSalesResult, lowStockResult] = await Promise.all([
    getDashboardMetrics(organizationId, today),
    supabase
      .from("sales")
      .select("id, sale_date, total_amount, status")
      .eq("organization_id", organizationId)
      .order("sale_date", { ascending: false })
      .limit(5),
    supabase
      .from("products")
      .select("id, name, current_stock, min_stock, unit")
      .eq("organization_id", organizationId)
      .order("current_stock", { ascending: true })
      .limit(5),
  ]);

  return (
    <PageShell
      title={`Сайн байна уу, ${profile.full_name ?? "хэрэглэгч"}!`}
      description={`Өнөөдрийн ${today} өдрийн борлуулалт, мөнгөн урсгал, үлдэгдлийн товч зураг.`}
      actions={
        <>
          <Button variant="outline" render={<Link href="/expenses/new" />}>
            <CreditCard data-icon="inline-start" />
            Зарлага
          </Button>
          <Button render={<Link href="/sales/new" />}>
            <CurrencyDollar data-icon="inline-start" />
            Шинэ борлуулалт
          </Button>
        </>
      }
    >
      <Alert className="rounded-3xl border-border/80 bg-card/80 px-4 py-4 shadow-sm">
        <Sparkle />
        <AlertTitle>Өдрийн анхаарах зүйлс</AlertTitle>
        <AlertDescription>
          {metrics.lowStockCount > 0
            ? `${metrics.lowStockCount} барааны үлдэгдэл доод түвшинд ойртсон байна.`
            : "Үлдэгдлийн түвшин хэвийн байна."}{" "}
          {metrics.pendingSalesCount > 0
            ? `${metrics.pendingSalesCount} хүлээгдэж буй борлуулалтаа шалгаарай.`
            : "Өнөөдөр хүлээгдэж буй борлуулалтгүй байна."}
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="overflow-hidden rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Өнөөдрийн борлуулалт</CardTitle>
            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
              <CurrencyDollar />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(metrics.totalSales)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.saleCount} борлуулалт
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Өнөөдрийн зарлага</CardTitle>
            <div className="rounded-2xl bg-chart-4/12 p-2 text-chart-4">
              <CreditCard />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(metrics.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.expenseCount} бичлэг
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Цэвэр мөнгөн урсгал</CardTitle>
            <div className="rounded-2xl bg-chart-2/14 p-2 text-chart-2">
              <TrendUp />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-semibold ${metrics.netCash < 0 ? "text-destructive" : ""}`}
            >
              {formatCurrency(metrics.netCash)}
            </div>
            <p className="text-xs text-muted-foreground">
              Орсон мөнгө - гарсан мөнгө
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Анхаарах SKU</CardTitle>
            <div className="rounded-2xl bg-amber-500/12 p-2 text-amber-700">
              <Package />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {metrics.lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.pendingSalesCount} хүлээгдэж буй борлуулалт
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Сүүлийн борлуулалтууд</CardTitle>
            <CardDescription>
              Өдөр тутмын борлуулалтын урсгалыг хурдан шалгах хэсэг.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Огноо</TableHead>
                  <TableHead>Дүн</TableHead>
                  <TableHead>Төлөв</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSalesResult.data?.length ? (
                  recentSalesResult.data.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.sale_date}</TableCell>
                      <TableCell>
                        {formatCurrency(Number(sale.total_amount ?? 0))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sale.status === "pending" ? "outline" : "secondary"
                          }
                        >
                          {sale.status ?? "completed"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground"
                    >
                      Борлуулалтын бүртгэл байхгүй.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" render={<Link href="/sales" />}>
                Бүгдийг харах
                <ArrowSquareOut data-icon="inline-end" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Нөхөх шаардлагатай бараа</CardTitle>
            <CardDescription>
              Доод үлдэгдэлд хүрсэн эсвэл доошилсон SKU.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {lowStockResult.data?.length ? (
              lowStockResult.data.map((product) => {
                const isLow =
                  Number(product.current_stock ?? 0) <=
                  Number(product.min_stock ?? 0);
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/35 px-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.current_stock ?? 0} / {product.min_stock ?? 0}{" "}
                        {product.unit ?? "ширхэг"}
                      </p>
                    </div>
                    <Badge variant={isLow ? "destructive" : "secondary"}>
                      {isLow ? "Нөхөх" : "OK"}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                Бүх барааны үлдэгдэл хэвийн байна.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
