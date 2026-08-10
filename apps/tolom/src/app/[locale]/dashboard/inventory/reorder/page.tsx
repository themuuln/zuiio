"use client";

import { PackagePlus, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ListPageShell } from "@/components/list-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/lib/i18n/navigation";
import { useReorderSuggestions } from "@/lib/queries/use-inventory";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId } from "@/lib/stores";

export default function ReorderPage() {
  const t = useTranslations("inventory") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;

  const { data: suggestions = [], isPending } = useReorderSuggestions(
    orgId,
    branchFilter,
  );

  const sorted = useMemo(
    () => [...suggestions].sort((a, b) => b.shortage - a.shortage),
    [suggestions],
  );

  return (
    <div className="px-4 pt-4 pb-6 md:px-6">
      <ListPageShell
        title={t("reorderTitle")}
        description={t("reorderSubtitle")}
      >
        <Card>
          <CardContent className="p-0">
            {isPending ? (
              <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="flex items-center gap-4 p-4">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ShoppingCart />
                  </EmptyMedia>
                  <EmptyTitle>{t("noReorderItems")}</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("part")}</TableHead>
                      <TableHead>{t("stockLevel")}</TableHead>
                      <TableHead>{t("shortage")}</TableHead>
                      <TableHead>{t("suggestedOrderQty")}</TableHead>
                      <TableHead>{t("preferredSupplier")}</TableHead>
                      <TableHead className="w-[120px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((item) => (
                      <TableRow key={item.part_id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {item.part_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.part_number ?? "—"} · {item.category ?? "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums text-sm">
                          {item.quantity_on_hand} / {item.minimum_quantity}{" "}
                          {item.unit ?? ""}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold text-destructive tabular-nums">
                            -{item.shortage}
                          </span>
                        </TableCell>
                        <TableCell className="tabular-nums text-sm font-medium">
                          {item.suggested_order_qty}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.preferred_supplier ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            render={
                              <Link href="/dashboard/inventory/purchase-orders/new" />
                            }
                          >
                            <PackagePlus className="size-3" /> {t("createPO")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </ListPageShell>
    </div>
  );
}
