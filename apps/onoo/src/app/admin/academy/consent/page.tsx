"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { academyRefApi } from "@/app/admin/_lib/api";
import {
  type ConsentTemplateRow,
  consentApi,
} from "@/app/admin/_lib/api-academy-ext";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const SCOPE_LABELS: Record<string, string> = {
  liability: "Хариуцлагаас чөлөөлөх",
  medical: "Эмнэлгийн",
  media: "Медиа",
  general: "Ерөнхий",
};

const templateSchema = z.object({
  title: z.string().min(1, "Гарчиг заавал байх ёстой"),
  body: z.string().min(1, "Агуулга заавал байх ёстой"),
  scope: z.string().min(1, "Хамрах хүрээ заавал сонгох"),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

export default function AcademyConsentPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<ConsentTemplateRow | null>(null);

  const { data: consentResponse, isPending } = useQuery({
    queryKey: ["admin", "academy", "consent"],
    queryFn: () => consentApi.list(),
  });

  const templates = consentResponse?.templates ?? [];
  const records = consentResponse?.records ?? [];

  const { data: ref } = useQuery({
    queryKey: ["admin", "academy", "reference"],
    queryFn: () => academyRefApi.get(),
    staleTime: 3 * 60 * 1000,
  });

  const profile = (ref?.profile?.[0] ?? null) as { id: string } | null;
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: { title: "", body: "", scope: "general" },
  });

  const createMutation = useMutation({
    mutationFn: (data: TemplateFormValues) =>
      consentApi.createTemplate({
        academy_id: profile?.id ?? "",
        title: data.title,
        body: data.body,
        scope: data.scope,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "consent"],
      });
      toast.success("Зөвшөөрлийн загвар амжилттай нэмэгдлээ");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: TemplateFormValues & { id: string }) =>
      consentApi.updateTemplate({
        id: data.id,
        title: data.title,
        body: data.body,
        scope: data.scope,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "consent"],
      });
      toast.success("Зөвшөөрлийн загвар амжилттай шинэчлэгдлээ");
      setDialogOpen(false);
      setEditingTemplate(null);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => consentApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "consent"],
      });
      toast.success("Зөвшөөрлийн загвар устгагдлаа");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  function handleEdit(template: ConsentTemplateRow) {
    setEditingTemplate(template);
    form.reset({
      title: template.title,
      body: template.body,
      scope: template.scope,
    });
    setDialogOpen(true);
  }

  function handleSubmit(values: TemplateFormValues) {
    if (editingTemplate) {
      updateMutation.mutate({ ...values, id: editingTemplate.id });
    } else {
      if (!profile) {
        toast.error("Эхлээд академийн профайл үүсгэнэ үү");
        return;
      }
      createMutation.mutate(values);
    }
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setEditingTemplate(null);
      form.reset();
    }
  }

  return (
    <AdminPageLayout
      title="Зөвшөөрөл"
      loading={isPending}
      isEmpty={templates.length === 0}
      emptyTitle="Зөвшөөрлийн загвар олдсонгүй"
      emptyDescription="Одоогоор зөвшөөрлийн загвар бүртгэгдээгүй байна."
      actions={
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Загвар нэмэх
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate
                  ? "Зөвшөөрлийн загвар засах"
                  : "Шинэ зөвшөөрлийн загвар нэмэх"}
              </DialogTitle>
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
                        <Input placeholder="Зөвшөөрлийн гарчиг" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Хамрах хүрээ</FormLabel>
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
                          {Object.entries(SCOPE_LABELS).map(
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
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Агуулга</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Зөвшөөрлийн агуулга..."
                          rows={6}
                          {...field}
                        />
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
      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Загварууд</TabsTrigger>
          <TabsTrigger value="records">Бүртгэлүүд</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Гарчиг</TableHead>
                <TableHead>Хамрах хүрээ</TableHead>
                <TableHead>Хувилбар</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead className="w-[100px]">Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    {template.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {SCOPE_LABELS[template.scope] ?? template.scope}
                    </Badge>
                  </TableCell>
                  <TableCell>v{template.version}</TableCell>
                  <TableCell>
                    {template.is_active ? (
                      <Badge variant="secondary">Идэвхтэй</Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
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
                        onClick={() => handleEdit(template)}
                        aria-label={`${template.title} засах`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (
                            window.confirm(
                              `"${template.title}" загварыг устгах уу?`,
                            )
                          ) {
                            deleteMutation.mutate(template.id);
                          }
                        }}
                        aria-label={`${template.title} устгах`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          {records.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Зөвшөөрлийн бүртгэл олдсонгүй
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Сурагч</TableHead>
                  <TableHead>Загвар</TableHead>
                  <TableHead>Гарын үсэг зурсан</TableHead>
                  <TableHead>Төлөв</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.academy_students?.canonical_name ?? "—"}
                    </TableCell>
                    <TableCell>
                      {record.academy_consent_templates?.title ?? "—"}
                    </TableCell>
                    <TableCell>
                      {new Date(record.signed_at).toLocaleDateString("mn-MN")}
                    </TableCell>
                    <TableCell>
                      {record.is_withdrawn ? (
                        <Badge variant="destructive">Татагдсан</Badge>
                      ) : (
                        <Badge variant="secondary">Хүчинтэй</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}
