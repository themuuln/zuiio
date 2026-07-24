import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDb } from "@/lib/db";
import { formatMnt } from "@/lib/format";
import { loadPricingContext, quotePackage } from "@/lib/pricing/quote";
import { setFxRateAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminFxPage() {
  const db = getDb();
  const [history, ctx, packages] = await Promise.all([
    db.listFxRates("USD_MNT", 20),
    loadPricingContext(),
    db.listPackages(),
  ]);

  const topPackages = packages
    .filter((p) => p.is_enabled && !p.is_archived)
    .slice(0, 5)
    .map((pkg) => ({
      name: pkg.name,
      retailMnt: quotePackage(pkg, ctx).retailMnt,
    }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">FX rate (USD → MNT)</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Current rate</p>
            <p className="text-3xl font-bold">
              {Number(ctx.fx.rate).toLocaleString()}₮
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              set {ctx.fx.created_at.slice(0, 16).replace("T", " ")} (
              {ctx.fx.source})
            </p>

            <form
              action={setFxRateAction}
              className="mt-4 flex items-end gap-2"
            >
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="rate">New rate</Label>
                <Input
                  id="rate"
                  name="rate"
                  type="number"
                  step="0.01"
                  min="100"
                  required
                  placeholder={String(ctx.fx.rate)}
                />
              </div>
              <Button type="submit">Set rate</Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              Applies to new orders only — paid orders keep their snapshot.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="mb-2 font-medium">Current prices (sample)</p>
            <ul className="flex flex-col gap-1 text-sm">
              {topPackages.map((pkg) => (
                <li key={pkg.name} className="flex justify-between">
                  <span className="text-muted-foreground">{pkg.name}</span>
                  <span className="font-medium">
                    {formatMnt(pkg.retailMnt)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rate</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Set at</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">
                {Number(row.rate).toLocaleString()}₮
              </TableCell>
              <TableCell>{row.source}</TableCell>
              <TableCell className="text-muted-foreground">
                {row.created_at.slice(0, 16).replace("T", " ")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
