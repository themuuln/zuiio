"use client";

import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { withDbCapture } from "@zuiio/capture";
import { PageShell } from "@/components/erp/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { createClient } from "@/lib/supabase/client";
import { DeleteButton, ToggleButton } from "./actions-client";
import { AddSmtpForm } from "./add-form";

interface SmtpConfig {
  id: string;
  from_email: string;
  username: string;
  is_active: boolean | null;
  daily_count: number | null;
  priority: number | null;
  updated_at: string | null;
}

const columns: ColumnDef<SmtpConfig>[] = [
  {
    accessorKey: "from_email",
    header: "Имэйл",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.from_email}
        <span className="ml-2 text-xs text-muted-foreground">
          ({row.original.username})
        </span>
      </span>
    ),
  },
  {
    id: "status",
    header: "Төлөв",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <span onClick={(e) => e.stopPropagation()}>
        <ToggleButton
          configId={row.original.id}
          isActive={row.original.is_active ?? false}
        />
      </span>
    ),
  },
  {
    accessorKey: "daily_count",
    header: "Өдрийн тоо",
    cell: ({ row }) => (
      <>
        {row.original.daily_count}
        <span className="ml-1 text-xs text-muted-foreground">/ 500</span>
      </>
    ),
  },
  {
    accessorKey: "priority",
    header: "Тэргүүлэх",
  },
  {
    accessorKey: "updated_at",
    header: "Сүүлд шинэчлэгдсэн",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.updated_at
          ? new Date(row.original.updated_at).toLocaleDateString("mn-MN")
          : "-"}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Үйлдэл",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <span onClick={(e) => e.stopPropagation()}>
        <DeleteButton configId={row.original.id} />
      </span>
    ),
  },
];

export function SmtpContent() {
  const query = useQuery({
    queryKey: ["smtp-configs"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await withDbCapture(
        "page:smtp",
        supabase
          .from("smtp_configs")
          .select(
            "id, from_email, username, is_active, daily_count, priority, updated_at",
          )
          .order("priority", { ascending: true }),
      );
      return (data ?? []) as SmtpConfig[];
    },
  });

  const configs = query.data ?? [];
  const isPending = query.isPending;
  const error = query.error?.message ?? null;

  return (
    <PageShell
      title="SMTP тохиргоо"
      description="Имэйл илгээх Gmail бүртгэлүүд. Олон бүртгэлээр автоматаар сэлгэн ажиллана."
      loading={isPending && configs.length === 0}
      error={error}
      onRetry={() => query.refetch()}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <EnvelopeSimple className="size-4" />
              SMTP бүртгэлүүд
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isPending && configs.length === 0 ? (
              <DataTable
                columns={columns}
                data={[]}
                loading
                searchColumn="from_email"
                searchPlaceholder="Имэйл хайх..."
                totalLabel="бүртгэл"
                enableSorting
              />
            ) : configs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Бүртгэл байхгүй. Доор шинээр нэмнэ үү.
                </p>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={configs}
                searchColumn="from_email"
                searchPlaceholder="Имэйл хайх..."
                totalLabel="бүртгэл"
                enableSorting
              />
            )}
          </CardContent>
        </Card>

        <AddSmtpForm />
      </div>
    </PageShell>
  );
}
