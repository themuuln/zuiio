"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  enrollmentsApi,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  type EnrollmentRow,
} from "@/app/admin/_lib/api-academy-ext";
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
import { Textarea } from "@/components/ui/textarea";

const enrollmentSchema = z.object({
  student_id: z.string().min(1, "Сурагч заавал сонгох"),
  program_id: z.string().min(1, "Хөтөлбөр заавал сонгох"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  notes: z.string().optional(),
});

const editEnrollmentSchema = z.object({
  status: z.string().min(1, "Төлөв заавал сонгох"),
  notes: z.string().optional(),
});

type EnrollmentFormValues = z.infer<typeof enrollmentSchema>;
type EditEnrollmentFormValues = z.infer<typeof editEnrollmentSchema>;

const STATUS_LABELS: Record<string, string> = {
  active: "Идэвхтэй",
  inactive: "Идэвхгүй",
  completed: "Дууссан",
  cancelled: "Цуцлагдсан",
  waitlisted: "Хүлээлгийн",
};

const STATUS_COLORS: Record<string, "secondary" | "outline" | "default" | "destructive"> = {
  active: "secondary",
  completed: "default",
  cancelled: "destructive",
  inactive: "outline",
  waitlisted: "outline",
};

export default function AcademyEnrollmentsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<EnrollmentRow | null>(null);

  const { data: enrollments = [], isPending } = useQuery({
    queryKey: ["admin", "academy", "enrollments"],
    queryFn: () => enrollmentsApi.list(),
  });

  const { data: ref } = useQuery({
    queryKey: ["admin", "academy", "reference"],
    queryFn: () => academyRefApi.get(),
    staleTime: 3 * 60 * 1000,
  });

  const students = (ref?.students ?? []) as { id: string; canonical_name: string }[];
  const programs = (ref?.programs ?? []) as { id: string; name: string }[];

  const form = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      student_id: "",
      program_id: "",
      start_date: "",
      end_date: "",
      notes: "",
    },
  });

  const editForm = useForm<EditEnrollmentFormValues>({
    resolver: zodResolver(editEnrollmentSchema),
    defaultValues: {
      status: "active",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: EnrollmentFormValues) =>
      createEnrollment({
        student_id: data.student_id,
        program_id: data.program_id,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        notes: data.notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "academy", "enrollments"] });
      toast.success("Элсэлт амжилттай нэмэгдлээ");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditEnrollmentFormValues & { enrollment_id: string }) =>
      updateEnrollment({
        enrollment_id: data.enrollment_id,
        status: data.status,
        notes: data.notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "academy", "enrollments"] });
      toast.success("Элсэлт амжилттай шинэчлэгдлээ");
      setEditDialogOpen(false);
      setEditingEnrollment(null);
      editForm.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEnrollment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "academy", "enrollments"] });
      toast.success("Элсэлт устгагдлаа");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  function handleEdit(enrollment: EnrollmentRow) {
    setEditingEnrollment(enrollment);
    editForm.reset({
      status: enrollment.status,
      notes: enrollment.notes ?? "",
    });
    setEditDialogOpen(true);
  }

  function handleCreateSubmit(values: EnrollmentFormValues) {
    createMutation.mutate(values);
  }

  function handleEditSubmit(values: EditEnrollmentFormValues) {
    if (!editingEnrollment) return;
    updateMutation.mutate({ ...values, enrollment_id: editingEnrollment.id });
  }

  return (
    <AdminPageLayout
      title="Элсэлт"
      loading={isPending}
      isEmpty={enrollments.length === 0}
      emptyTitle="Элсэлт бүртгэгдээгүй байна"
      emptyDescription="Одоогоор сурагчдын элсэлт бүртгэгдээгүй байна."
      actions={
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) { form.reset(); }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Нэмэх
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Шинэ элсэлт нэмэх</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="student_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Сурагч</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Сурагч сонгох" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.canonical_name}
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
                  name="program_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Хөтөлбөр</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Хөтөлбөр сонгох" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {programs.map((p) => (
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
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Эхлэх огноо</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дуусах огноо</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тэмдэглэл</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Тэмдэглэл..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Цуцлах
                  </Button>
                  <Button type="submit" disabled={isMutating}>
                    {isMutating ? "Хадгалж байна..." : "Хадгалах"}
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
            <TableHead>Хөтөлбөр</TableHead>
            <TableHead>Төлөв</TableHead>
            <TableHead>Эхлэх огноо</TableHead>
            <TableHead>Дуусах огноо</TableHead>
            <TableHead>Тэмдэглэл</TableHead>
            <TableHead className="w-[100px]">Үйлдэл</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.map((enrollment) => (
            <TableRow key={enrollment.id}>
              <TableCell className="font-medium">
                {enrollment.academy_students?.canonical_name ?? "—"}
              </TableCell>
              <TableCell>
                {enrollment.academy_programs?.name ?? "—"}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_COLORS[enrollment.status] ?? "outline"}>
                  {STATUS_LABELS[enrollment.status] ?? enrollment.status}
                </Badge>
              </TableCell>
              <TableCell>
                {enrollment.start_date
                  ? new Date(enrollment.start_date).toLocaleDateString("mn-MN")
                  : "—"}
              </TableCell>
              <TableCell>
                {enrollment.end_date
                  ? new Date(enrollment.end_date).toLocaleDateString("mn-MN")
                  : "—"}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {enrollment.notes ?? "—"}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(enrollment)}
                  >
                    Төлөв
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (window.confirm("Энэ элсэлтийг устгах уу?")) {
                        deleteMutation.mutate(enrollment.id);
                      }
                    }}
                    aria-label="Устгах"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) { setEditingEnrollment(null); editForm.reset(); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Элсэлт засах</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Төлөв</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тэмдэглэл</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Тэмдэглэл..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Цуцлах
                </Button>
                <Button type="submit" disabled={isMutating}>
                  {isMutating ? "Хадгалж байна..." : "Хадгалах"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}
