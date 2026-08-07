"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUp, Plus, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { academyRefApi } from "@/app/admin/_lib/api";
import { type WaitlistRow, waitlistsApi } from "@/app/admin/_lib/api-advanced";
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

const waitlistSchema = z.object({
  student_id: z.string().min(1, "Сурагч заавал байх ёстой"),
  program_id: z.string().min(1, "Хөтөлбөр заавал байх ёстой"),
});

type WaitlistFormValues = z.infer<typeof waitlistSchema>;

const STATUS_LABELS: Record<string, string> = {
  waiting: "Хүлээгдэж буй",
  promoted: "Дэвшсэн",
  expired: "Хугацаа дууссан",
  cancelled: "Цуцлагдсан",
};

export default function AcademyWaitlistsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: waitlists = [], isPending } = useQuery({
    queryKey: ["admin", "academy", "waitlists"],
    queryFn: () => waitlistsApi.list(),
  });

  const { data: ref } = useQuery({
    queryKey: ["admin", "academy", "reference"],
    queryFn: () => academyRefApi.get(),
    staleTime: 3 * 60 * 1000,
  });

  const students = (ref?.students ?? []) as {
    id: string;
    canonical_name: string;
  }[];
  const programs = (ref?.programs ?? []) as { id: string; name: string }[];
  const form = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      student_id: "",
      program_id: "",
    },
  });

  const joinMutation = useMutation({
    mutationFn: (data: WaitlistFormValues) => waitlistsApi.join(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "waitlists"],
      });
      toast.success("Хүлээлгийн жагсаалтад нэмэгдлээ");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const promoteMutation = useMutation({
    mutationFn: (waitlistId: string) => waitlistsApi.promote(waitlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "waitlists"],
      });
      toast.success("Хүлээлгийн жагсаалтаас дэвшүүллээ");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (waitlistId: string) => waitlistsApi.remove(waitlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "waitlists"],
      });
      toast.success("Хүлээлгийн жагсаалтаас хасагдлаа");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  function handleSubmit(values: WaitlistFormValues) {
    joinMutation.mutate(values);
  }

  return (
    <AdminPageLayout
      title="Хүлээлгийн жагсаалт"
      loading={isPending}
      isEmpty={waitlists.length === 0}
      emptyTitle="Хүлээлгийн жагсаалт хоосон"
      emptyDescription="Одоогоор хүлээлгийн жагсаалтад бүртгэл байхгүй байна."
      actions={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Хүлээлгийн жагсаалтад нэмэх
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Хүлээлгийн жагсаалтад нэмэх</DialogTitle>
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
                            <SelectValue placeholder="Сурагч сонгох">
                              {
                                students?.find((s) => s.id === field.value)
                                  ?.canonical_name
                              }
                            </SelectValue>
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
                  name="program_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Хөтөлбөр</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Хөтөлбөр сонгох">
                              {
                                programs?.find((p) => p.id === field.value)
                                  ?.name
                              }
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {programs.map((p: { id: string; name: string }) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                  <Button type="submit" disabled={joinMutation.isPending}>
                    {joinMutation.isPending ? "Нэмж байна..." : "Нэмэх"}
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
            <TableHead>#</TableHead>
            <TableHead>Сурагч</TableHead>
            <TableHead>Хөтөлбөр</TableHead>
            <TableHead>Төлөв</TableHead>
            <TableHead>Бүртгүүлсэн</TableHead>
            <TableHead className="w-[120px]">Үйлдэл</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {waitlists.map((entry: WaitlistRow) => {
            const student = entry.academy_students;
            const program = entry.academy_programs;
            return (
              <TableRow key={entry.id}>
                <TableCell>{entry.position}</TableCell>
                <TableCell className="font-medium">
                  {student?.canonical_name ?? "—"}
                </TableCell>
                <TableCell>{program?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      entry.status === "waiting"
                        ? "default"
                        : entry.status === "promoted"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {STATUS_LABELS[entry.status] ?? entry.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(entry.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {entry.status === "waiting" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => promoteMutation.mutate(entry.id)}
                          disabled={promoteMutation.isPending}
                          aria-label="Дэвшүүлэх"
                        >
                          <ArrowUp className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (
                              window.confirm("Хүлээлгийн жагсаалтаас хасах уу?")
                            ) {
                              removeMutation.mutate(entry.id);
                            }
                          }}
                          disabled={removeMutation.isPending}
                          aria-label="Хасах"
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
