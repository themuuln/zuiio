"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  type AcademyStudentRow,
  academyApi,
  academyRefApi,
} from "@/app/admin/_lib/api";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const studentSchema = z.object({
  canonical_name: z.string().min(1, "Нэр заавал байх ёстой"),
  name_latin: z.string().optional(),
  school_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

const STATUS_ACTIVE = "active";
const _STATUS_INACTIVE = "inactive";

const STATUS_LABELS: Record<string, string> = {
  active: "Идэвхтэй",
  inactive: "Идэвхгүй",
};

export default function AcademyStudentsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: students = [], isPending } = useQuery({
    queryKey: ["admin", "academy", "students"],
    queryFn: () => academyApi.students.list(),
  });

  const { data: ref } = useQuery({
    queryKey: ["admin", "academy", "reference"],
    queryFn: () => academyRefApi.get(),
    staleTime: 3 * 60 * 1000,
  });

  const academyProfile = (ref?.profile ?? []) as Array<{ id: string }>;
  const academyId = academyProfile[0]?.id;

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      canonical_name: "",
      name_latin: "",
      school_name: "",
      emergency_contact_phone: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: StudentFormValues) =>
      academyApi.students.create({
        academy_id: academyId,
        canonical_name: data.canonical_name,
        name_latin: data.name_latin || undefined,
        school_name: data.school_name || undefined,
        emergency_contact_phone: data.emergency_contact_phone || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "students"],
      });
      toast.success("Сурагч амжилттай нэмэгдлээ");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => academyApi.students.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "students"],
      });
      toast.success("Сурагч устгагдлаа");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  function handleSubmit(values: StudentFormValues) {
    createMutation.mutate(values);
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      form.reset();
    }
  }

  return (
    <AdminPageLayout
      title="Сурагчид"
      loading={isPending}
      isEmpty={students.length === 0}
      emptyTitle="Сурагч олдсонгүй"
      emptyDescription="Одоогоор сурагч бүртгэгдээгүй байна."
      actions={
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Нэмэх
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Шинэ сурагч нэмэх</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="canonical_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Нэр</FormLabel>
                      <FormControl>
                        <Input placeholder="Сурагчийн нэр" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name_latin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Нэр (Латин)</FormLabel>
                      <FormControl>
                        <Input placeholder="Name (Latin)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="school_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Сургууль</FormLabel>
                      <FormControl>
                        <Input placeholder="Сургуулийн нэр" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergency_contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Утас</FormLabel>
                      <FormControl>
                        <Input placeholder="Утасны дугаар" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogOpenChange(false)}
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
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Нэр</TableHead>
            <TableHead>Сургууль</TableHead>
            <TableHead>Утас</TableHead>
            <TableHead>Төлөв</TableHead>
            <TableHead className="w-[100px]">Үйлдэл</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student: AcademyStudentRow) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">
                {student.canonical_name}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {student.school_name ?? "—"}
              </TableCell>
              <TableCell>{student.emergency_contact_phone ?? "—"}</TableCell>
              <TableCell>
                {student.status === STATUS_ACTIVE ? (
                  <Badge variant="secondary">
                    {STATUS_LABELS[student.status]}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-muted-foreground/40 text-muted-foreground"
                  >
                    {STATUS_LABELS[student.status] ?? student.status}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (
                        window.confirm(
                          `"${student.canonical_name}" сурагчийг устгах уу?`,
                        )
                      ) {
                        deleteMutation.mutate(student.id);
                      }
                    }}
                    aria-label={`${student.canonical_name} устгах`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </AdminPageLayout>
  );
}
