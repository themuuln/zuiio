import { capture, withDbCapture } from "@zuiio/capture";
import { notFound } from "next/navigation";
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
import { createClient } from "@/lib/supabase/server";

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

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  try {
    const { data: invoice, error: lookupError } = await withDbCapture(
      "public invoice: lookup",
      supabase
        .from("invoices")
        .select(
          "id, invoice_number, issue_date, status, total_amount, paid_amount, notes, contacts(name, phone, email), organizations(name)",
        )
        .eq("token", token)
        .single(),
    );

    if (lookupError) {
      capture(lookupError, { context: "public invoice: lookup" });
      notFound();
    }

    if (!invoice) {
      notFound();
    }

    const { data: items, error: itemsError } = await withDbCapture(
      "public invoice: items",
      supabase
        .from("invoice_items")
        .select(
          "id, description, quantity, unit_price, total_price, products(name, unit)",
        )
        .eq("invoice_id", invoice.id),
    );

    if (itemsError) {
      capture(itemsError, { context: "public invoice: items" });
      notFound();
    }

    const contact = invoice.contacts as {
      name: string;
      phone: string | null;
      email: string | null;
    } | null;
    const org = invoice.organizations as { name: string } | null;

    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Нэхэмжлэл #{invoice.invoice_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            {org?.name ?? "Байгууллага"} — {formatDate(invoice.issue_date)}
          </p>
          <Badge variant={STATUS_VARIANTS[invoice.status ?? ""] ?? "outline"}>
            {STATUS_LABELS[invoice.status ?? ""] ?? invoice.status}
          </Badge>
        </div>

        <Card>
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

        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-2">
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Нийт дүн</span>
              <span className="text-xl font-bold">
                {formatCurrency(invoice.total_amount ?? 0)}
              </span>
            </div>
            {(invoice.paid_amount ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Төлсөн</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(invoice.paid_amount ?? 0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {contact && (
          <Card>
            <CardHeader>
              <CardTitle>Харилцагчийн мэдээлэл</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{contact.name}</p>
              {contact.phone && (
                <p className="text-sm text-muted-foreground">{contact.phone}</p>
              )}
              {contact.email && (
                <p className="text-sm text-muted-foreground">{contact.email}</p>
              )}
            </CardContent>
          </Card>
        )}

        {invoice.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Тэмдэглэл</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  } catch (err) {
    capture(err, { context: "public invoice" });
    notFound();
  }
}
