import { ArrowsClockwise, Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAppContext } from "@/lib/erp";
import { formatCurrency } from "@/lib/format";

export default async function InventoryPage() {
  const { supabase, organizationId } = await requireAppContext();
  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, sku, current_stock, min_stock, unit, cost_price, sale_price",
    )
    .eq("organization_id", organizationId)
    .order("current_stock", { ascending: true });

  const totalUnits =
    products?.reduce(
      (sum, product) => sum + Number(product.current_stock ?? 0),
      0,
    ) ?? 0;
  const lowStock =
    products?.filter(
      (product) =>
        Number(product.current_stock ?? 0) <= Number(product.min_stock ?? 0),
    ).length ?? 0;

  return (
    <PageShell
      title="Агуулах"
      description="Үлдэгдэл, доод үлдэгдлийн босго, өртөг болон үнэ цэнийг хянах самбар."
      actions={
        <>
          <Button
            variant="outline"
            render={<Link href="/inventory/movements" />}
          >
            <ArrowsClockwise data-icon="inline-start" />
            Хөдөлгөөний түүх
          </Button>
          <Button render={<Link href="/inventory/movements" />}>
            <Plus data-icon="inline-start" />
            Орлого / зарлага
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Нийт үлдэгдэл</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {totalUnits}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Эрсдэлтэй SKU</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-amber-600">
            {lowStock}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Жижиглэнгийн дүн</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(
              products?.reduce(
                (sum, product) =>
                  sum +
                  Number(product.current_stock ?? 0) *
                    Number(product.sale_price ?? 0),
                0,
              ) ?? 0,
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Үлдэгдлийн хүснэгт</CardTitle>
        </CardHeader>
        <CardContent>
          {!products?.length ? (
            <div className="rounded-none border border-dashed border-border px-4 py-12 text-sm text-muted-foreground">
              Эхлээд бүтээгдэхүүн үүсгээд агуулахын хөдөлгөөнөө бүртгэнэ үү.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Бүтээгдэхүүн</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Үлдэгдэл</TableHead>
                  <TableHead>Босго</TableHead>
                  <TableHead>Эрсдэл</TableHead>
                  <TableHead>Өртөг</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const current = Number(product.current_stock ?? 0);
                  const minimum = Math.max(Number(product.min_stock ?? 0), 1);
                  const progress = Math.min((current / minimum) * 100, 100);
                  const isLow = current <= minimum;

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>{product.sku ?? "-"}</TableCell>
                      <TableCell>
                        {current} {product.unit ?? "ширхэг"}
                      </TableCell>
                      <TableCell>
                        {product.min_stock ?? 0} {product.unit ?? "ширхэг"}
                      </TableCell>
                      <TableCell className="min-w-40">
                        <div className="space-y-2">
                          <Progress value={progress} />
                          <Badge variant={isLow ? "destructive" : "secondary"}>
                            {isLow ? "Нөхөх шаардлагатай" : "Хэвийн"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(Number(product.cost_price ?? 0))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
