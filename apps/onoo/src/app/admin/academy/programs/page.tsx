"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { type AcademyProgramRow, academyApi } from "@/app/admin/_lib/api";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
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

const programSchema = z.object({
  name: z.string().min(1, "Нэр заавал байх ёстой"),
  description: z.string().optional(),
  age_group: z.string().optional(),
  price_mnt: z.string().optional(),
  duration_weeks: z.string().optional(),
  is_active: z.enum(["active", "inactive"]),
});

type ProgramFormValues = z.infer<typeof programSchema>;

export default function AcademyProgramsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] =
    useState<AcademyProgramRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmItem, setConfirmItem] = useState<AcademyProgramRow | null>(
    null,
  );

  const { data: programs = [], isPending } = useQuery({
    queryKey: ["admin", "academy", "programs"],
    queryFn: () => academyApi.programs.list(),
  });

  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: "",
      description: "",
      age_group: "",
      price_mnt: "",
      duration_weeks: "",
      is_active: "active",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ProgramFormValues) =>
      academyApi.programs.create({
        name: data.name,
        description: data.description || undefined,
        age_group: data.age_group || undefined,
        price_mnt: data.price_mnt ? Number(data.price_mnt) : undefined,
        duration_weeks: data.duration_weeks
          ? Number(data.duration_weeks)
          : undefined,
        is_active: data.is_active === "active",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "programs"],
      });
      toast.success("Хөтөлбөр амжилттай нэмэгдлээ");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: ProgramFormValues & { id: string }) =>
      academyApi.programs.update(id, {
        name: data.name,
        description: data.description || undefined,
        age_group: data.age_group || undefined,
        price_mnt: data.price_mnt ? Number(data.price_mnt) : undefined,
        duration_weeks: data.duration_weeks
          ? Number(data.duration_weeks)
          : undefined,
        is_active: data.is_active === "active",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "programs"],
      });
      toast.success("Хөтөлбөр амжилттай шинэчлэгдлээ");
      setDialogOpen(false);
      setEditingProgram(null);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => academyApi.programs.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "programs"],
      });
      toast.success("Хөтөлбөр устгагдлаа");
      setConfirmOpen(false);
      setConfirmItem(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  function handleEdit(program: AcademyProgramRow) {
    setEditingProgram(program);
    form.reset({
      name: program.name,
      description: program.description ?? "",
      age_group: program.age_group ?? "",
      price_mnt: program.price_mnt?.toString() ?? "",
      duration_weeks: program.duration_weeks?.toString() ?? "",
      is_active: program.is_active ? "active" : "inactive",
    });
    setDialogOpen(true);
  }

  function handleSubmit(values: ProgramFormValues) {
    if (editingProgram) {
      updateMutation.mutate({ ...values, id: editingProgram.id });
    } else {
      createMutation.mutate(values);
    }
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setEditingProgram(null);
      form.reset();
    }
  }

  return (
    <>
      <AdminPageLayout
        title="Хөтөлбөр"
        loading={isPending}
        isEmpty={programs.length === 0}
        emptyTitle="Хөтөлбөр олдсонгүй"
        emptyDescription="Одоогоор хөтөлбөр бүртгэгдээгүй байна."
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
                <DialogTitle>
                  {editingProgram ? "Хөтөлбөр засах" : "Шинэ хөтөлбөр нэмэх"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Нэр</FormLabel>
                        <FormControl>
                          <Input placeholder="Хөтөлбөрийн нэр" {...field} />
                        </FormControl>
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
                          <Textarea placeholder="Тайлбар..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="age_group"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Насны ангилал</FormLabel>
                        <FormControl>
                          <Input placeholder="Жнь: 10-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price_mnt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Үнэ (₮)</FormLabel>
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
                    name="duration_weeks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Хугацаа (долоо хоног)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Төлөв</FormLabel>
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
                            <SelectItem value="active">Идэвхтэй</SelectItem>
                            <SelectItem value="inactive">Идэвхгүй</SelectItem>
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
                      onClick={() => handleDialogOpenChange(false)}
                    >
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
              <TableHead>Нэр</TableHead>
              <TableHead>Тайлбар</TableHead>
              <TableHead>Насны ангилал</TableHead>
              <TableHead>Үнэ (₮)</TableHead>
              <TableHead>Төлөв</TableHead>
              <TableHead className="w-[100px]">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((program) => (
              <TableRow key={program.id}>
                <TableCell className="font-medium">{program.name}</TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {program.description ?? "—"}
                </TableCell>
                <TableCell>{program.age_group ?? "—"}</TableCell>
                <TableCell>
                  {program.price_mnt != null
                    ? `${Number(program.price_mnt).toLocaleString()} ₮`
                    : "—"}
                </TableCell>
                <TableCell>
                  {program.is_active ? (
                    <Badge variant="secondary">Идэвхтэй</Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-muted-foreground/40 text-muted-foreground"
                    >
                      Идэвхгүй
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(program)}
                      aria-label={`${program.name} засах`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setConfirmItem(program);
                        setConfirmOpen(true);
                      }}
                      aria-label={`${program.name} устгах`}
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
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => {
          if (confirmItem) deleteMutation.mutate(confirmItem.id);
        }}
        title={`"${confirmItem?.name}" хөтөлбөрийг устгах уу?`}
        description="Устгасны дараа мэдээллийг сэргээх боломжгүй."
        loading={deleteMutation.isPending}
      />
    </>
  );
}
