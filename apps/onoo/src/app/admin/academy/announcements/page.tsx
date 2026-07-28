"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  type AnnouncementRow,
  announcementsApi,
} from "@/app/admin/_lib/api-advanced";
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
import { academyRefApi } from "../../_lib/api";

const announcementSchema = z.object({
  title: z.string().min(1, "Гарчиг заавал байх ёстой"),
  body: z.string().min(1, "Агуулга заавал байх ёстой"),
  program_id: z.string().optional(),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export default function AcademyAnnouncementsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: announcements = [], isPending } = useQuery({
    queryKey: ["admin", "academy", "announcements"],
    queryFn: () => announcementsApi.list(),
  });

  const { data: ref } = useQuery({
    queryKey: ["admin", "academy", "reference"],
    queryFn: () => academyRefApi.get(),
    staleTime: 3 * 60 * 1000,
  });

  const profile = (ref?.profile?.[0] ?? null) as { id: string } | null;
  const programs = (ref?.programs ?? []) as { id: string; name: string }[];

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      body: "",
      program_id: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: AnnouncementFormValues) => {
      return announcementsApi.create({
        academy_id: profile?.id ?? "",
        title: data.title,
        body: data.body,
        program_id: data.program_id || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "announcements"],
      });
      toast.success("Зарлал амжилттай нэмэгдлээ");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => announcementsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "announcements"],
      });
      toast.success("Зарлал устгагдлаа");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  function handleSubmit(values: AnnouncementFormValues) {
    createMutation.mutate(values);
  }

  return (
    <AdminPageLayout
      title="Зарлал"
      loading={isPending}
      isEmpty={announcements.length === 0}
      emptyTitle="Зарлал байхгүй"
      emptyDescription="Одоогоор зарлал байхгүй байна."
      actions={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Зарлал нэмэх
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Шинэ зарлал нэмэх</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Гарчиг</FormLabel>
                      <FormControl>
                        <Input placeholder="Зарлалын гарчиг" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Агуулга</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Зарлалын агуулга..."
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="program_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Хөтөлбөр (заавал биш)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Бүх хөтөлбөр" />
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
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Гарчиг</TableHead>
            <TableHead>Агуулга</TableHead>
            <TableHead>Хөтөлбөр</TableHead>
            <TableHead>Үүсгэсэн</TableHead>
            <TableHead className="w-[80px]">Үйлдэл</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {announcements.map((ann: AnnouncementRow) => {
            const program = ann.academy_programs;
            return (
              <TableRow key={ann.id}>
                <TableCell className="font-medium">{ann.title}</TableCell>
                <TableCell className="text-muted-foreground max-w-[300px] truncate">
                  {ann.body}
                </TableCell>
                <TableCell>
                  {program?.name ? (
                    <Badge variant="secondary">{program.name}</Badge>
                  ) : (
                    <Badge variant="outline">Бүх хөтөлбөр</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(ann.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (
                        window.confirm(`"${ann.title}" зарлалыг устгах уу?`)
                      ) {
                        deleteMutation.mutate(ann.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    aria-label="Устгах"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </AdminPageLayout>
  );
}
