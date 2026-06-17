"use client";

import { Percent } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { DiscountCreateDrawer } from "@/components/discounts/discount-create-drawer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import type { DiscountRow } from "./page";

const TYPE_LABELS: Record<string, string> = {
  percentage: "Хувь",
  fixed_amount: "Тогтмол дүн",
};

const APPLIES_TO_LABELS: Record<string, string> = {
  all: "Бүх бүтээгдэхүүн",
  selected_products: "Сонгосон бүтээгдэхүүн",
  selected_categories: "Сонгосон ангилал",
};

export function DiscountsContent({
  discounts,
}: {
  discounts: DiscountRow[];
}) {
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(
    searchParams.get("create") === "true",
  );
  const initialCreateRef = useRef(createOpen);

  useEffect(() => {
    if (initialCreateRef.current) {
      window.history.replaceState({}, "", "/discounts");
    }
  }, []);

  return (
    <>
      <PageShell
        title="Хямдрал, урамшуулал"
        description="Бүтээгдэхүүний хямдрал болон урамшууллын тохиргоо"
        actions={
          <DiscountCreateDrawer
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
        }
      >
        {!discounts.length ? (
          <ErpEmptyState
            icon={<Percent className="size-4" />}
            title="Хямдрал байхгүй"
            description="Шинэ хямдрал үүсгэж, үнийн урамшууллыг тохируулна уу."
            action={
              <DiscountCreateDrawer
                open={createOpen}
                onOpenChange={setCreateOpen}
              />
            }
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Хямдралын жагсаалт</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Нэр</TableHead>
                    <TableHead>Төрөл</TableHead>
                    <TableHead>Утга</TableHead>
                    <TableHead>Хамаарах хүрээ</TableHead>
                    <TableHead>Хүчинтэй эхлэх</TableHead>
                    <TableHead>Хүчинтэй дуусах</TableHead>
                    <TableHead>Ашигласан</TableHead>
                    <TableHead>Идэвхтэй</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discounts.map((discount) => (
                    <TableRow key={discount.id}>
                      <TableCell className="font-medium">
                        {discount.name}
                      </TableCell>
                      <TableCell>
                        {TYPE_LABELS[discount.type] ?? discount.type}
                      </TableCell>
                      <TableCell>
                        {discount.type === "percentage"
                          ? `${discount.value}%`
                          : formatCurrency(discount.value)}
                      </TableCell>
                      <TableCell>
                        {APPLIES_TO_LABELS[discount.applies_to] ??
                          discount.applies_to}
                      </TableCell>
                      <TableCell>
                        {formatDate(discount.valid_from)}
                      </TableCell>
                      <TableCell>
                        {discount.valid_until
                          ? formatDate(discount.valid_until)
                          : "Тодорхойгүй"}
                      </TableCell>
                      <TableCell>
                        {discount.used_count}
                        {discount.usage_limit !== null
                          ? ` / ${discount.usage_limit}`
                          : ""}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={discount.is_active ? "default" : "secondary"}
                        >
                          {discount.is_active ? "Тийм" : "Үгүй"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </PageShell>
    </>
  );
}
