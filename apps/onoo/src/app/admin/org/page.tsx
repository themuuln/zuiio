"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { orgApi, orgRefApi, type OrganizationRow } from "@/app/admin/_lib/api";
import { AdminPageLayout } from "@/components/admin/page-layout";
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const orgSchema = z.object({
  name: z.string().min(1, "Нэр оруулна уу"),
  slug: z.string().min(1, "Slug оруулна уу"),
  logo_url: z.string().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  contact_email: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  social_links: z.record(z.string(), z.string()).optional(),
});

const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { id: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { id: "twitter", label: "Twitter / X", placeholder: "https://twitter.com/..." },
  { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
  { id: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/..." },
  { id: "website", label: "Вэб", placeholder: "https://..." },
] as const;

type OrgFormValues = z.infer<typeof orgSchema>;

export default function OrgPage() {
  const { data: ref, isPending } = useQuery({
    queryKey: ["admin", "org", "reference"],
    queryFn: () => orgRefApi.get(),
    staleTime: 3 * 60 * 1000,
  });
  const orgs = (ref?.orgs ?? []) as OrganizationRow[]

  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganizationRow | null>(null);

  const form = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: { name: "", slug: "", logo_url: "", contact_phone: "", contact_email: "", website: "", social_links: {} },
  });

  const updateMutation = useMutation({
    mutationFn: (values: OrgFormValues) => {
      if (!editingOrg) throw new Error("No organization selected");
      return orgApi.update(editingOrg.id, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "org", "reference"] });
      toast.success("Байгууллага шинэчлэгдсэн");
      setDialogOpen(false);
      setEditingOrg(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    },
  });

  function handleEdit(org: OrganizationRow) {
    setEditingOrg(org);
    form.reset({
      name: org.name,
      slug: org.slug,
      logo_url: org.logo_url ?? "",
      contact_phone: org.contact_phone ?? "",
      contact_email: org.contact_email ?? "",
      website: org.website ?? "",
      social_links: org.social_links ?? {},
    });
    setDialogOpen(true);
  }

  function onSubmit(values: OrgFormValues) {
    updateMutation.mutate(values);
  }

  return (
    <AdminPageLayout
      title="Байгууллага"
      headerExtras={<p className="text-sm text-muted-foreground">Байгууллагын профайл, холбоо барих мэдээлэл, тохиргоо</p>}
    >
      {isPending ? (
        <p className="text-sm text-muted-foreground">Уншиж байна...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Нэр</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Утас</TableHead>
              <TableHead>Имэйл</TableHead>
              <TableHead>Веб</TableHead>
              <TableHead>Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgs.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">{org.name}</TableCell>
                <TableCell className="text-muted-foreground">{org.slug}</TableCell>
                <TableCell>{org.contact_phone ?? "—"}</TableCell>
                <TableCell>{org.contact_email ?? "—"}</TableCell>
                <TableCell>
                  {org.website ? (
                    <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-warning hover:underline">
                      {org.website}
                    </a>
                  ) : "—"}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(org)}>
                    Засах
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Байгууллага засах</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Нэр</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Лого URL</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Утас</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имэйл</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Веб сайт</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">Сошиал холбоосууд</p>
                {SOCIAL_PLATFORMS.map((platform) => (
                  <FormField
                    key={platform.id}
                    control={form.control}
                    name={`social_links.${platform.id}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{platform.label}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={platform.placeholder}
                            value={String(field.value ?? "")}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Болих
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Хадгалах..." : "Хадгалах"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}
