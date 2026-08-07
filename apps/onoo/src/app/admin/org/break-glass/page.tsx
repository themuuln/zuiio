"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, ShieldOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  type BreakGlassRow,
  breakGlassApi,
  type OrganizationRow,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const grantSchema = z.object({
  granted_to: z.string().min(1, "Хэрэглэгчийн ID оруулна уу"),
  reason: z.string().min(1, "Шалтгаан оруулна уу"),
  expires_at: z.string().min(1, "Дуусах хугацаа оруулна уу"),
});

type GrantFormValues = z.infer<typeof grantSchema>;

export default function BreakGlassPage() {
  const { data: ref } = useQuery({
    queryKey: ["admin", "org", "reference"],
    queryFn: () => orgRefApi.get(),
    staleTime: 3 * 60 * 1000,
  });
  const orgs = (ref?.orgs ?? []) as OrganizationRow[];

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: entries = [], isPending: entriesLoading } = useQuery({
    queryKey: ["admin", "break-glass", selectedOrgId],
    queryFn: () => {
      if (!selectedOrgId) throw new Error("Байгууллага сонгоогүй байна");
      return breakGlassApi.list(selectedOrgId);
    },
    enabled: !!selectedOrgId,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [expireConfirm, setExpireConfirm] = useState<{
    open: boolean;
    entry: BreakGlassRow | null;
  }>({ open: false, entry: null });

  const form = useForm<GrantFormValues>({
    resolver: zodResolver(grantSchema),
    defaultValues: { granted_to: "", reason: "", expires_at: "" },
  });

  const grantMutation = useMutation({
    mutationFn: (values: GrantFormValues) => {
      if (!selectedOrgId) throw new Error("Байгууллага сонгоогүй байна");
      return breakGlassApi.grant({
        organization_id: selectedOrgId,
        granted_to: values.granted_to,
        reason: values.reason,
        expires_at: new Date(values.expires_at).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "break-glass", selectedOrgId],
      });
      toast.success("Яаралтай хандалт олгогдсон");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    },
  });

  const expireMutation = useMutation({
    mutationFn: (id: string) => breakGlassApi.expire(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "break-glass", selectedOrgId],
      });
      toast.success("Хандалт дуусгавар болсон");
      setExpireConfirm({ open: false, entry: null });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    },
  });

  function isExpiredOrExpiring(entry: BreakGlassRow) {
    if (entry.is_expired) return true;
    return new Date(entry.expires_at) < new Date();
  }

  const selectedOrg = orgs.find((o) => o.id === selectedOrgId);

  return (
    <AdminPageLayout title="Яаралтай хандалт (Break Glass)">
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
            Хандалт олгох
          </Button>
        )}
      </div>

      {/* Entries list */}
      {!selectedOrgId ? (
        <p className="text-sm text-muted-foreground">
          Байгууллага сонгоод хандалтуудыг харах
        </p>
      ) : entriesLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Уншиж байна...
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Яаралтай хандалтын бүртгэл олдсонгүй
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Хэрэглэгч ID</TableHead>
              <TableHead>Шалтгаан</TableHead>
              <TableHead>Дуусах хугацаа</TableHead>
              <TableHead>Төлөв</TableHead>
              <TableHead>Үүсгэсэн</TableHead>
              <TableHead>Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const expired = isExpiredOrExpiring(entry);
              return (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium font-mono text-xs">
                    {entry.granted_to.slice(0, 12)}...
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate">
                    {entry.reason}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(entry.expires_at).toLocaleDateString("mn-MN")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={expired ? "secondary" : "destructive"}>
                      {expired ? "Дууссан" : "Идэвхтэй"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString("mn-MN")}
                  </TableCell>
                  <TableCell>
                    {!expired && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setExpireConfirm({ open: true, entry })}
                        disabled={expireMutation.isPending}
                      >
                        <ShieldOff className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Grant access dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              Яаралтай хандалт олгох
              {selectedOrg ? ` - ${selectedOrg.name}` : ""}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) =>
                grantMutation.mutate(values),
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="granted_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Хэрэглэгчийн ID (auth.users)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="uuid" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Шалтгаан</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Яагаад яаралтай хандалт хэрэгтэй вэ?"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expires_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дуусах хугацаа</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
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
                <Button type="submit" disabled={grantMutation.isPending}>
                  {grantMutation.isPending ? "Олгож байна..." : "Хандалт олгох"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Expire confirmation */}
      <AlertDialog
        open={expireConfirm.open}
        onOpenChange={(open) => setExpireConfirm((p) => ({ ...p, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Хандалтыг дуусгавар болгох</AlertDialogTitle>
            <AlertDialogDescription>
              {expireConfirm.entry?.reason} — шалтгаантай хандалтыг хаах уу?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Болих</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (expireConfirm.entry) {
                  expireMutation.mutate(expireConfirm.entry.id);
                }
              }}
            >
              Хаах
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageLayout>
  );
}
