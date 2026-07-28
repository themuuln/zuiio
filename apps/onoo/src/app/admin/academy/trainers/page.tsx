"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { type AcademyTrainerRow, academyApi } from "@/app/admin/_lib/api";
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

const trainerSchema = z.object({
  name: z.string().min(1, "Нэр заавал байх ёстой"),
  photo_url: z.string().optional(),
  specialties: z.string().optional(),
  bio: z.string().optional(),
  is_active: z.enum(["active", "inactive"]),
});

type TrainerFormValues = z.infer<typeof trainerSchema>;

export default function AcademyTrainersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] =
    useState<AcademyTrainerRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmItem, setConfirmItem] = useState<AcademyTrainerRow | null>(
    null,
  );

  const { data: trainers = [], isPending } = useQuery({
    queryKey: ["admin", "academy", "trainers"],
    queryFn: () => academyApi.trainers.list(),
  });

  const form = useForm<TrainerFormValues>({
    resolver: zodResolver(trainerSchema),
    defaultValues: {
      name: "",
      photo_url: "",
      specialties: "",
      bio: "",
      is_active: "active",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TrainerFormValues) =>
      academyApi.trainers.create({
        name: data.name,
        photo_url: data.photo_url || undefined,
        specialties: data.specialties
          ? data.specialties
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        bio: data.bio || undefined,
        is_active: data.is_active === "active",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "trainers"],
      });
      toast.success("Дасгалжуулагч амжилттай нэмэгдлээ");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: TrainerFormValues & { id: string }) =>
      academyApi.trainers.update(id, {
        name: data.name,
        photo_url: data.photo_url || undefined,
        specialties: data.specialties
          ? data.specialties
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        bio: data.bio || undefined,
        is_active: data.is_active === "active",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "trainers"],
      });
      toast.success("Дасгалжуулагч амжилттай шинэчлэгдлээ");
      setDialogOpen(false);
      setEditingTrainer(null);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => academyApi.trainers.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "trainers"],
      });
      toast.success("Дасгалжуулагч устгагдлаа");
      setConfirmOpen(false);
      setConfirmItem(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  function handleEdit(trainer: AcademyTrainerRow) {
    setEditingTrainer(trainer);
    form.reset({
      name: trainer.name,
      photo_url: trainer.photo_url ?? "",
      specialties: (trainer.specialties ?? []).join(", "),
      bio: trainer.bio ?? "",
      is_active: trainer.is_active ? "active" : "inactive",
    });
    setDialogOpen(true);
  }

  function handleSubmit(values: TrainerFormValues) {
    if (editingTrainer) {
      updateMutation.mutate({ ...values, id: editingTrainer.id });
    } else {
      createMutation.mutate(values);
    }
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setEditingTrainer(null);
      form.reset();
    }
  }

  return (
    <>
      <AdminPageLayout
        title="Дасгалжуулагч"
        loading={isPending}
        isEmpty={trainers.length === 0}
        emptyTitle="Дасгалжуулагч олдсонгүй"
        emptyDescription="Одоогоор дасгалжуулагч бүртгэгдээгүй байна."
        actions={
          <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Нэмэх
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTrainer
                    ? "Дасгалжуулагч засах"
                    : "Шинэ дасгалжуулагч нэмэх"}
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
                          <Input
                            placeholder="Дасгалжуулагчийн нэр"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="photo_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Зураг URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="specialties"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Мэргэжил</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Таслалаар тусгаарлана (жнь: Довтолгоо, Хамгаалалт)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Намтар</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Дэлгэрэнгүй мэдээлэл..."
                            {...field}
                          />
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
              <TableHead>Мэргэжил</TableHead>
              <TableHead>Төлөв</TableHead>
              <TableHead className="w-[100px]">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainers.map((trainer) => (
              <TableRow key={trainer.id}>
                <TableCell className="font-medium">{trainer.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {trainer.specialties && trainer.specialties.length > 0
                    ? trainer.specialties.map((s) => (
                        <Badge key={s} variant="secondary" className="mr-1">
                          {s}
                        </Badge>
                      ))
                    : "—"}
                </TableCell>
                <TableCell>
                  {trainer.is_active ? (
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
                      onClick={() => handleEdit(trainer)}
                      aria-label={`${trainer.name} засах`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setConfirmItem(trainer);
                        setConfirmOpen(true);
                      }}
                      aria-label={`${trainer.name} устгах`}
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
        title={`"${confirmItem?.name}" дасгалжуулагчийг устгах уу?`}
        description="Устгасны дараа мэдээллийг сэргээх боломжгүй."
        loading={deleteMutation.isPending}
      />
    </>
  );
}
