"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  type PaymentRow,
  paymentsApi,
} from "@/app/admin/_lib/api-advanced";
import { academyRefApi } from "@/app/admin/_lib/api";
import { AdminPageLayout } from "@/components/admin/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const paymentSchema = z.object({
  student_id: z.string().min(1, "Сурагч заавал байх ёстой"),
  amount_mnt: z.string().min(1, "Дүн заавал байх ёстой"),
  type: z.enum(["tuition", "registration", "uniform", "other"] as const),
  method: z.enum(["cash", "bank_transfer", "qpay"] as const),
  reference: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  confirmed: "Баталгаажсан",
  cancelled: "Цуцлагдсан",
  refunded: "Буцаагдсан",
};

const TYPE_LABELS: Record<string, string> = {
  tuition: "Сургалтын төлбөр",
  registration: "Бүртгэл",
  uniform: "Дүрэмт хувцас",
  other: "Бусад",
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Бэлэн мөнгө",
  bank_transfer: "Банкны шилжүүлэг",
  qpay: "QPay",
};

export default function AcademyPaymentsLedgerPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: payments = [], isPending } = useQuery({
    queryKey: ["admin", "academy", "payments"],
    queryFn: () => paymentsApi.list(),
  });

  const { data: ref } = useQuery({
    queryKey: ["admin", "academy", "reference"],
    queryFn: () => academyRefApi.get(),
    staleTime: 3 * 60 * 1000,
  });
  const students = (ref?.students ?? []) as Array<{ id: string; canonical_name: string }>;

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      student_id: "",
      amount_mnt: "",
      type: "tuition",
      method: "cash",
      reference: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PaymentFormValues) =>
      paymentsApi.create({
        student_id: data.student_id,
        amount_mnt: Number(data.amount_mnt),
        type: data.type,
        method: data.method,
        reference: data.reference || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "payments"],
      });
      toast.success("Төлбөр амжилттай нэмэгдлээ");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (paymentId: string) => paymentsApi.confirm(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "payments"],
      });
      toast.success("Төлбөр баталгаажлаа");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (paymentId: string) => paymentsApi.cancel(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "payments"],
      });
      toast.success("Төлбөр цуцлагдлаа");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  function handleSubmit(values: PaymentFormValues) {
    createMutation.mutate(values);
  }

  function formatMnt(amount: number): string {
    return `${amount.toLocaleString()} ₮`;
  }

  return (
    <AdminPageLayout
      title="Төлбөрийн түүх"
      loading={isPending}
      isEmpty={payments.length === 0}
      emptyTitle="Төлбөрийн түүх байхгүй"
      emptyDescription="Төлбөрийн бүртгэл олдсонгүй."
      actions={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Төлбөр нэмэх
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Шинэ төлбөр нэмэх</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="student_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Сурагч</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Сурагч сонгох" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students.map(
                            (s: { id: string; canonical_name: string }) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.canonical_name}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount_mnt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дүн (₮)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="100000"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Төрөл</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(TYPE_LABELS).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Арга</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(METHOD_LABELS).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Лавлах дугаар</FormLabel>
                      <FormControl>
                        <Input placeholder="INV-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Цуцлах
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending
                      ? "Хадгалж байна..."
                      : "Хадгалах"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Сурагч</TableHead>
            <TableHead>Төрөл</TableHead>
            <TableHead>Дүн</TableHead>
            <TableHead>Арга</TableHead>
            <TableHead>Төлөв</TableHead>
            <TableHead>Лавлах</TableHead>
            <TableHead>Баталгаажсан</TableHead>
            <TableHead className="w-[120px]">Үйлдэл</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment: PaymentRow) => {
            const student = payment.academy_students;
            return (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">
                  {student?.canonical_name ?? "—"}
                </TableCell>
                <TableCell>{TYPE_LABELS[payment.type] ?? payment.type}</TableCell>
                <TableCell>{formatMnt(payment.amount_mnt)}</TableCell>
                <TableCell>
                  {payment.method ? METHOD_LABELS[payment.method] ?? payment.method : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      payment.status === "confirmed"
                        ? "secondary"
                        : payment.status === "cancelled"
                          ? "outline"
                          : "default"
                    }
                  >
                    {STATUS_LABELS[payment.status] ?? payment.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {payment.reference ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {payment.confirmed_at
                    ? new Date(payment.confirmed_at).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {payment.status === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            confirmMutation.mutate(payment.id)
                          }
                          disabled={confirmMutation.isPending}
                          aria-label="Баталгаажуулах"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Энэ төлберийг цуцлах уу?",
                              )
                            ) {
                              cancelMutation.mutate(payment.id);
                            }
                          }}
                          disabled={cancelMutation.isPending}
                          aria-label="Цуцлах"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </AdminPageLayout>
  );
}
