"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { type TeamSeasonRow, teamsContextApi } from "@/app/admin/_lib/api";
import { transactionsApi } from "@/app/admin/_lib/api-team-ops";
import { AdminPageLayout } from "@/components/admin/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";

function formatMnt(amount: number): string {
  return `₮ ${amount.toLocaleString("mn-MN")}`;
}

const transactionSchema = z.object({
  team_season_id: z.string().min(1, "Баг сонгоно уу"),
  type: z.string().min(1, "Төрөл сонгоно уу"),
  description: z.string().min(1, "Тайлбар заавал байх ёстой"),
  amount_mnt: z.preprocess(
    (v) => Number(v),
    z.number().positive("Дүн эерэг тоо байх ёстой"),
  ),
  due_date: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

const TYPE_LABELS: Record<string, string> = {
  due: "Гишүүнчлэлийн хураамж",
  expense: "Зарлага",
  sponsorship: "Ивээн тэтгэлэг",
};

const TYPE_COLORS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  due: "default",
  expense: "destructive",
  sponsorship: "secondary",
};

const TYPES = Object.keys(TYPE_LABELS);

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: transactions = [], isPending: txPending } = useQuery({
    queryKey: ["admin", "team-transactions"],
    queryFn: () => transactionsApi.list(),
  });

  const { data: ctx } = useQuery({
    queryKey: ["admin", "teams", "context"],
    queryFn: () => teamsContextApi.get(),
    staleTime: 3 * 60 * 1000,
  });
  const teamSeasons = (ctx?.teamSeasons ?? []) as TeamSeasonRow[];

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as never,
    defaultValues: {
      team_season_id: "",
      type: "",
      description: "",
      amount_mnt: 0,
      due_date: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TransactionFormValues) => transactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "team-transactions"],
      });
      toast.success("Гүйлгээ амжилттай нэмэгдлээ");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.markPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "team-transactions"],
      });
      toast.success("Төлөв амжилттай тэмдэглэгдлээ");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(values: TransactionFormValues) {
    createMutation.mutate(values);
  }

  return (
    <>
      <AdminPageLayout
        title="Багийн санхүү"
        loading={txPending}
        isEmpty={transactions.length === 0}
        emptyTitle="Гүйлгээ олдсонгүй"
        emptyDescription="Гүйлгээ нэмэх товчийг дарж шинэ гүйлгээ бүртгэнэ үү."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Нэмэх
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Тайлбар</TableHead>
              <TableHead>Баг</TableHead>
              <TableHead>Төрөл</TableHead>
              <TableHead>Дүн</TableHead>
              <TableHead>Төлөх хугацаа</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Үүсгэсэн</TableHead>
              <TableHead className="w-[100px]">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx, index) => (
              <TableRow key={tx.id}>
                <TableCell className="text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {tx.description}
                </TableCell>
                <TableCell>{tx.team_seasons?.teams?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={TYPE_COLORS[tx.type] ?? "outline"}>
                    {TYPE_LABELS[tx.type] ?? tx.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono font-medium">
                  {formatMnt(Number(tx.amount_mnt))}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {tx.due_date ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={tx.paid_at ? "default" : "secondary"}>
                    {tx.paid_at ? "Төлсөн" : "Төлөөгүй"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(tx.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {!tx.paid_at && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markPaidMutation.mutate(tx.id)}
                      disabled={markPaidMutation.isPending}
                    >
                      <Banknote className="mr-1 h-3 w-3" />
                      Төлсөн
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminPageLayout>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Шинэ гүйлгээ нэмэх</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="team_season_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Баг</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Баг сонгох" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teamSeasons.map((ts) => (
                          <SelectItem key={ts.id} value={ts.id}>
                            {ts.teams?.name ?? ts.id.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Төрөл сонгох" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тайлбар</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Гүйлгээний тайлбар" {...field} />
                    </FormControl>
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
                        min={1}
                        step="1"
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
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Төлөх хугацаа</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Хадгалж байна..." : "Хадгалах"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
