"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  type ConsentPolicyRow,
  type OrganizationRow,
  orgConsentApi,
  orgRefApi,
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

const RETENTION_OPTIONS = [
  { value: 30, label: "30 хоног" },
  { value: 90, label: "3 сар" },
  { value: 180, label: "6 сар" },
  { value: 365, label: "1 жил" },
  { value: 730, label: "2 жил" },
  { value: 1825, label: "5 жил" },
];
const policySchema = z.object({
  title: z.string().min(1, "Гарчиг оруулна уу"),
  description: z.string().optional().nullable(),
  retention_days: z.number().min(1, "Хадгалах хугацаа оруулна уу"),
  is_active: z.boolean(),
});
type PolicyFormValues = z.infer<typeof policySchema>;

export default function OrgConsentPage() {
  const { data: ref, isPending: orgsPending } = useQuery({
    queryKey: ["admin", "org", "reference"],
    queryFn: () => orgRefApi.get(),
    staleTime: 3 * 60 * 1000,
  });
  const orgs = (ref?.orgs ?? []) as OrganizationRow[];

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: policies = [], isPending: policiesLoading } = useQuery({
    queryKey: ["admin", "org-consent", selectedOrgId],
    queryFn: () => orgConsentApi.list(selectedOrgId!),
    enabled: !!selectedOrgId,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<ConsentPolicyRow | null>(
    null,
  );
  const [removeConfirm, setRemoveConfirm] = useState<{
    open: boolean;
    policy: ConsentPolicyRow | null;
  }>({ open: false, policy: null });
  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      title: "",
      description: "",
      retention_days: 365,
      is_active: true,
    },
  });
  const createMutation = useMutation({
    mutationFn: (values: PolicyFormValues) =>
      orgConsentApi.create({
        organization_id: selectedOrgId!,
        title: values.title,
        description: values.description || null,
        retention_days: values.retention_days,
        is_active: values.is_active,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "org-consent", selectedOrgId],
      });
      toast.success("Бодлого нэмэгдсэн");
      setDialogOpen(false);
      setEditingPolicy(null);
      form.reset();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...values }: PolicyFormValues & { id: string }) =>
      orgConsentApi.update(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "org-consent", selectedOrgId],
      });
      toast.success("Бодлого шинэчлэгдсэн");
      setDialogOpen(false);
      setEditingPolicy(null);
      form.reset();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => orgConsentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "org-consent", selectedOrgId],
      });
      toast.success("Бодлого хасагдсан");
      setRemoveConfirm({ open: false, policy: null });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    },
  });

  function handleEdit(policy: ConsentPolicyRow) {
    setEditingPolicy(policy);
    form.reset({
      title: policy.title,
      description: policy.description ?? "",
      retention_days: policy.retention_days,
      is_active: policy.is_active,
    });
    setDialogOpen(true);
  }

  function handleCreate() {
    setEditingPolicy(null);
    form.reset({
      title: "",
      description: "",
      retention_days: 365,
      is_active: true,
    });
    setDialogOpen(true);
  }

  function onSubmit(values: PolicyFormValues) {
    if (editingPolicy) {
      updateMutation.mutate({ ...values, id: editingPolicy.id });
    } else {
      createMutation.mutate(values);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  const selectedOrg = orgs.find((o) => o.id === selectedOrgId);

  return (
    <AdminPageLayout title="Зөвшөөрлийн бодлогууд">
      {/* Org selector */}
      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm font-medium">Байгууллага:</label>
        <select
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
          <Button size="sm" onClick={handleCreate}>
            <Plus className="mr-1 h-4 w-4" />
            Бодлого нэмэх
          </Button>
        )}
      </div>

      {/* Policies list */}
      {!selectedOrgId ? (
        <p className="text-sm text-muted-foreground">
          Байгууллага сонгоод бодлогуудыг харах
        </p>
      ) : policiesLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Уншиж байна...
        </div>
      ) : policies.length === 0 ? (
        <p className="text-sm text-muted-foreground">Бодлого олдсонгүй</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Гарчиг</TableHead>
              <TableHead>Тайлбар</TableHead>
              <TableHead>Хадгалах хугацаа</TableHead>
              <TableHead>Төлөв</TableHead>
              <TableHead>Үүсгэсэн</TableHead>
              <TableHead>Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.map((policy) => (
              <TableRow key={policy.id}>
                <TableCell className="font-medium">{policy.title}</TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {policy.description ?? "—"}
                </TableCell>
                <TableCell>{policy.retention_days} хоног</TableCell>
                <TableCell>
                  <Badge variant={policy.is_active ? "default" : "secondary"}>
                    {policy.is_active ? "Идэвхтэй" : "Идэвхгүй"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(policy.created_at).toLocaleDateString("mn-MN")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(policy)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setRemoveConfirm({ open: true, policy })}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create/Edit policy dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPolicy ? "Бодлого засах" : "Бодлого нэмэх"}
              {selectedOrg ? ` - ${selectedOrg.name}` : ""}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Гарчиг</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Өгөгдөл хадгалах бодлого"
                      />
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
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Бодлогын дэлгэрэнгүй тайлбар"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="retention_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Өгөгдөл хадгалах хугацаа</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      defaultValue={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RETENTION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={String(opt.value)}>
                            {opt.label}
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
                name="is_active"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Төлөв</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "true")}
                      value={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Идэвхтэй</SelectItem>
                        <SelectItem value="false">Идэвхгүй</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingPolicy(null);
                  }}
                >
                  Болих
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? "Хадгалж байна..."
                    : editingPolicy
                      ? "Хадгалах"
                      : "Нэмэх"}
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
            <AlertDialogTitle>Бодлого хасах</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{removeConfirm.policy?.title}&quot; бодлогыг хасах уу?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Болих</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (removeConfirm.policy) {
                  removeMutation.mutate(removeConfirm.policy.id);
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
