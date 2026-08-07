"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  type RegistrationIntentRow,
  registrationsApi,
} from "@/app/admin/_lib/api-advanced";
import { AdminPageLayout } from "@/components/admin/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  approved: "Зөвшөөрсөн",
  declined: "Татгалзсан",
  cancelled: "Цуцлагдсан",
  expired: "Хугацаа дууссан",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "default",
  approved: "secondary",
  declined: "destructive",
  cancelled: "outline",
  expired: "outline",
};

export default function AcademyRegistrationsPage() {
  const queryClient = useQueryClient();

  const { data: intents = [], isPending } = useQuery({
    queryKey: ["admin", "academy", "registrations"],
    queryFn: () => registrationsApi.list(),
  });

  const approveMutation = useMutation({
    mutationFn: (intentId: string) => registrationsApi.approve(intentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "registrations"],
      });
      toast.success("Бүртгэлийг зөвшөөрлөө");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const declineMutation = useMutation({
    mutationFn: (intentId: string) => registrationsApi.decline(intentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "registrations"],
      });
      toast.success("Бүртгэлийг татгалзлаа");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <AdminPageLayout
      title="Бүртгэлийн хүсэлтүүд"
      loading={isPending}
      isEmpty={intents.length === 0}
      emptyTitle="Бүртгэлийн хүсэлт байхгүй"
      emptyDescription="Одоогоор бүртгүүлэх хүсэлт ирээгүй байна."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Сурагч</TableHead>
            <TableHead>Асран хамгаалагч</TableHead>
            <TableHead>Утас</TableHead>
            <TableHead>Хөтөлбөр</TableHead>
            <TableHead>Төлөв</TableHead>
            <TableHead>Огноо</TableHead>
            <TableHead className="w-[140px]">Үйлдэл</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {intents.map((intent: RegistrationIntentRow) => {
            const program = intent.academy_programs;
            return (
              <TableRow key={intent.id}>
                <TableCell className="font-medium">
                  {intent.student_name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {intent.guardian_name ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {intent.guardian_phone ?? "—"}
                </TableCell>
                <TableCell>{program?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[intent.status] ?? "outline"}>
                    {STATUS_LABELS[intent.status] ?? intent.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(intent.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {intent.status === "pending" && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (
                            window.confirm(
                              `"${intent.student_name}"-ийг бүртгэхийг зөвшөөрөх үү?`,
                            )
                          ) {
                            approveMutation.mutate(intent.id);
                          }
                        }}
                        disabled={approveMutation.isPending}
                        aria-label="Зөвшөөрөх"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (
                            window.confirm(
                              `"${intent.student_name}"-ийг бүртгэхээс татгалзах уу?`,
                            )
                          ) {
                            declineMutation.mutate(intent.id);
                          }
                        }}
                        disabled={declineMutation.isPending}
                        aria-label="Татгалзах"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </AdminPageLayout>
  );
}
