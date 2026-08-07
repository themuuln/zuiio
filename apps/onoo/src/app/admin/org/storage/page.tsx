"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  type OrganizationRow,
  type OrgStorageBucketRow,
  orgRefApi,
  orgStorageApi,
} from "@/app/admin/_lib/api";
import { AdminPageLayout } from "@/components/admin/page-layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const bucketSchema = z.object({
  bucket_name: z.string().min(1, "Сав нэр оруулна уу"),
  bucket_id: z.string().min(1, "Сав ID оруулна уу"),
});

type BucketFormValues = z.infer<typeof bucketSchema>;

export default function OrgStoragePage() {
  const { data: ref } = useQuery({
    queryKey: ["admin", "org", "reference"],
    queryFn: () => orgRefApi.get(),
    staleTime: 3 * 60 * 1000,
  });
  const orgs = (ref?.orgs ?? []) as OrganizationRow[];

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: buckets = [], isPending: bucketsLoading } = useQuery({
    queryKey: ["admin", "org-storage", selectedOrgId],
    queryFn: () => {
      if (!selectedOrgId) throw new Error("Байгууллага сонгоогүй байна");
      return orgStorageApi.list(selectedOrgId);
    },
    enabled: !!selectedOrgId,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<{
    open: boolean;
    bucket: OrgStorageBucketRow | null;
  }>({ open: false, bucket: null });

  const form = useForm<BucketFormValues>({
    resolver: zodResolver(bucketSchema),
    defaultValues: { bucket_name: "", bucket_id: "" },
  });

  const createMutation = useMutation({
    mutationFn: (values: BucketFormValues) => {
      if (!selectedOrgId) throw new Error("Байгууллага сонгоогүй байна");
      return orgStorageApi.create({
        organization_id: selectedOrgId,
        bucket_name: values.bucket_name,
        bucket_id: values.bucket_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "org-storage", selectedOrgId],
      });
      toast.success("Сав нэмэгдсэн");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => orgStorageApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "org-storage", selectedOrgId],
      });
      toast.success("Сав хасагдсан");
      setRemoveConfirm({ open: false, bucket: null });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    },
  });

  const selectedOrg = orgs.find((o) => o.id === selectedOrgId);

  return (
    <AdminPageLayout title="Хадгалах сангийн савнууд">
      {/* Org selector */}
      <div className="mb-6 flex items-center gap-3">
        <label htmlFor="org-select" className="text-sm font-medium">
          Байгууллага:
        </label>
        <select
          id="org-select"
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={selectedOrgId ?? ""}
          onChange={(e) => setSelectedOrgId(e.target.value || null)}
        >
          <option value="">Сонгох...</option>
          {orgs.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
        {selectedOrgId && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Сав нэмэх
          </Button>
        )}
      </div>

      {/* Buckets list */}
      {!selectedOrgId ? (
        <p className="text-sm text-muted-foreground">
          Байгууллага сонгоод савнуудыг харах
        </p>
      ) : bucketsLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Уншиж байна...
        </div>
      ) : buckets.length === 0 ? (
        <p className="text-sm text-muted-foreground">Сав олдсонгүй</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Савны нэр</TableHead>
              <TableHead>Сав ID</TableHead>
              <TableHead>Тусгаарлалт</TableHead>
              <TableHead>Үүсгэсэн</TableHead>
              <TableHead>Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buckets.map((bucket) => (
              <TableRow key={bucket.id}>
                <TableCell className="font-medium">
                  {bucket.bucket_name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {bucket.bucket_id}
                </TableCell>
                <TableCell>
                  {bucket.is_tenant_isolation ? "Тийм" : "Үгүй"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(bucket.created_at).toLocaleDateString("mn-MN")}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setRemoveConfirm({ open: true, bucket })}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create bucket dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              Сав нэмэх{selectedOrg ? ` - ${selectedOrg.name}` : ""}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) =>
                createMutation.mutate(values),
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="bucket_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Савны нэр</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="images" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bucket_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сав ID (Supabase)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="org_xxx_images" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Болих
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Нэмж байна..." : "Нэмэх"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation */}
      <AlertDialog
        open={removeConfirm.open}
        onOpenChange={(open) => setRemoveConfirm((p) => ({ ...p, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сав хасах</AlertDialogTitle>
            <AlertDialogDescription>
              {removeConfirm.bucket?.bucket_name} (
              {removeConfirm.bucket?.bucket_id}) савыг хасах уу?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Болих</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (removeConfirm.bucket) {
                  removeMutation.mutate(removeConfirm.bucket.id);
                }
              }}
            >
              Хасах
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageLayout>
  );
}
