"use client";

import { useQuery } from "@tanstack/react-query";
import { withDbCapture } from "@zuiio/capture";
import { useParams } from "next/navigation";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBranchContext } from "@/lib/branch-context";
import { formatCurrency, formatDate } from "@/lib/format";
import { useOrgSettings } from "@/lib/org-settings-context";
import { invoiceKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";
import { InvoiceDetailClient } from "./invoice-detail-client";

const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  paid: "Төлөгдсөн",
  partially_paid: "Хэсэгчилсэн",
  overdue: "Хугацаа хэтэрсэн",
  cancelled: "Цуцлагдсан",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  paid: "default",
  partially_paid: "outline",
  overdue: "destructive",
  cancelled: "outline",
};

export function InvoiceDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { organizationId } = useOrgSettings();
  const { isBranchScoped, userBranchId } = useBranchContext();

  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await withDbCapture(
        "page:invoice_detail:invoice",
        supabase
          .from("invoices")
          .select("*, contacts(name, phone, email)")
          .eq("id", id)
          .eq("organization_id", organizationId)
          .single(),
      );
      if (error) throw error;
      if (!data) throw new Error("Нэхэмжлэл олдсонгүй");

      if (isBranchScoped && userBranchId && data.branch_id !== userBranchId) {
        throw new Error("Нэхэмжлэл олдсонгүй");
      }

      return data;
    },
    enabled: !!organizationId && !!id,
  });

  const { data: items } = useQuery({
    queryKey: ["invoices", "items", id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await withDbCapture(
        "page:invoice_detail:items",
        supabase
          .from("invoice_items")
          .select("*, products(name, unit)")
          .eq("invoice_id", id),
      );
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  const isLoading = invoiceLoading;

  const contact = invoice?.contacts as {
    name: string;
    phone: string | null;
    email: string | null;
  } | null;

  return (
    <PageShell
      title={
        isLoading ? "Нэхэмжлэл..." : `Нэхэмжлэл #${invoice?.invoice_number}`
      }
      description={
        isLoading ? (
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        ) : invoice ? (
          <InvoiceDetailClient
            invoiceId={invoice.id}
            token={invoice.token}
            status={invoice.status ?? "pending"}
          />
        ) : null
      }
    >
      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Бараанууд</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full rounded-md" />
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Нэхэмжлэлийн мэдээлэл</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : invoice ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Бараанууд</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Бараа</TableHead>
                    <TableHead className="text-right">Тоо</TableHead>
                    <TableHead className="text-right">Нэгж үнэ</TableHead>
                    <TableHead className="text-right">Нийт</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items ?? []).map((item) => {
                    const product = item.products as {
                      name: string;
                      unit: string | null;
                    } | null;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.description || product?.name || "Бүтээгдэхүүн"}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity} {product?.unit ?? ""}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unit_price)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total_price)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Нэхэмжлэлийн мэдээлэл</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Дугаар</span>
                  <span className="text-sm font-medium">
                    {invoice.invoice_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Огноо</span>
                  <span className="text-sm">
                    {formatDate(invoice.issue_date)}
                  </span>
                </div>
                {invoice.due_date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Дуусах
                    </span>
                    <span className="text-sm">
                      {formatDate(invoice.due_date)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Төлөв</span>
                  <Badge
                    variant={STATUS_VARIANTS[invoice.status ?? ""] ?? "outline"}
                  >
                    {STATUS_LABELS[invoice.status ?? ""] ?? invoice.status}
                  </Badge>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-sm font-semibold">Нийт дүн</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(invoice.total_amount ?? 0)}
                  </span>
                </div>
                {(invoice.paid_amount ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Төлсөн
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(invoice.paid_amount ?? 0)}
                    </span>
                  </div>
                )}
                {invoice.notes && (
                  <div className="border-t pt-3">
                    <span className="text-xs text-muted-foreground">
                      Тэмдэглэл
                    </span>
                    <p className="text-sm mt-1">{invoice.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {contact && (
              <Card>
                <CardHeader>
                  <CardTitle>Харилцагч</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm font-medium">{contact.name}</p>
                  {contact.phone && (
                    <p className="text-sm text-muted-foreground">
                      {contact.phone}
                    </p>
                  )}
                  {contact.email && (
                    <p className="text-sm text-muted-foreground">
                      {contact.email}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Нэхэмжлэл олдсонгүй
        </div>
      )}
    </PageShell>
  );
}
