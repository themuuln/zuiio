import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { PageShell } from "@/components/erp/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createServiceClient } from "@/lib/supabase/server-service";
import { requireSuperadmin } from "@/lib/superadmin";
import { DeleteButton, ToggleButton } from "./actions-client";
import { AddSmtpForm } from "./add-form";

export default async function SmtpSettingsPage() {
  // Only the superadmin (developer) can access this page
  await requireSuperadmin();

  const admin = createServiceClient();
  const { data: configs } = await admin
    .from("smtp_configs")
    .select("*")
    .order("priority", { ascending: true });

  return (
    <PageShell
      title="SMTP тохиргоо"
      description="Имэйл илгээх Gmail бүртгэлүүд. Олон бүртгэлээр автоматаар сэлгэн ажиллана."
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
                {configs && configs.length > 0 ? (
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
                          isActive={config.is_active}
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
          </CardContent>
        </Card>

        <AddSmtpForm />
      </div>
    </PageShell>
  );
}
