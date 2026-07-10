"use client";

import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/erp/page-shell";
import {
  Card,
  CardContent,
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
import { createClient } from "@/lib/supabase/client";
import { withDbCapture } from "@zuiio/capture";
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
  const isLoading = query.isLoading;
  const error = query.error?.message ?? null;

  return (
    <PageShell
      title="SMTP тохиргоо"
      description="Имэйл илгээх Gmail бүртгэлүүд. Олон бүртгэлээр автоматаар сэлгэн ажиллана."
      loading={isLoading && configs.length === 0}
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
            {isLoading && configs.length === 0 ? (
              <div className="h-64 animate-pulse rounded-lg bg-muted" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имэйл</TableHead>
                    <TableHead>Төлөв</TableHead>
                    <TableHead>Өдрийн тоо</TableHead>
                    <TableHead>Тэргүүлэх</TableHead>
                    <TableHead>Сүүлд шинэчлэгдсэн</TableHead>
                    <TableHead>Үйлдэл</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.length > 0 ? (
                    configs.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell className="font-medium">
                          {config.from_email}
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({config.username})
                          </span>
                        </TableCell>
                        <TableCell>
                          <ToggleButton
                            configId={config.id}
                            isActive={config.is_active ?? false}
                          />
                        </TableCell>
                        <TableCell>
                          {config.daily_count}
                          <span className="ml-1 text-xs text-muted-foreground">
                            / 500
                          </span>
                        </TableCell>
                        <TableCell>{config.priority}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {config.updated_at
                            ? new Date(config.updated_at).toLocaleDateString(
                                "mn-MN",
                              )
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <DeleteButton configId={config.id} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground"
                      >
                        Бүртгэл байхгүй. Доор шинээр нэмнэ үү.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AddSmtpForm />
      </div>
    </PageShell>
  );
}
