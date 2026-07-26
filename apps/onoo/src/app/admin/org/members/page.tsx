"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Shield, UserMinus, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  type MemberRow,
  type OrganizationRow,
  orgMembersApi,
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

const ROLE_LABELS: Record<string, string> = {
  owner: "Эзэмшигч",
  admin: "Админ",
  coordinator: "Зохицуулагч",
  finance: "Санхүү",
  manager: "Менежер",
  trainer: "Дасгалжуулагч",
  scorekeeper: "Тэмдэглэгч",
  viewer: "Харагч",
};

const ROLE_RANK: Record<string, number> = {
  owner: 100,
  admin: 80,
  coordinator: 60,
  finance: 50,
  manager: 40,
  trainer: 30,
  scorekeeper: 20,
  viewer: 10,
};

const assignSchema = z.object({
  user_id: z.string().min(1, "Хэрэглэгчийн ID оруулна уу"),
  role: z.string().min(1, "Үүрэг сонгоно уу"),
});

export default function OrgMembersPage() {
  const { data: ref, isPending: orgsPending } = useQuery({
    queryKey: ["admin", "org", "reference"],
    queryFn: () => orgRefApi.get(),
    staleTime: 3 * 60 * 1000,
  });
  const orgs = (ref?.orgs ?? []) as OrganizationRow[];

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: members = [], isPending: membersLoading } = useQuery({
    queryKey: ["admin", "org-members", selectedOrgId],
    queryFn: () => orgMembersApi.list("org", selectedOrgId!),
    enabled: !!selectedOrgId,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<{
    open: boolean;
    member: MemberRow | null;
  }>({ open: false, member: null });

  const form = useForm({
    resolver: zodResolver(assignSchema),
    defaultValues: { user_id: "", role: "viewer" },
  });

  const assignMutation = useMutation({
    mutationFn: (values: { user_id: string; role: string }) =>
      orgMembersApi.assign(values.user_id, "org", selectedOrgId!, values.role),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "org-members", selectedOrgId],
      });
      toast.success("Гишүүн нэмэгдсэн");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (membershipId: string) => orgMembersApi.remove(membershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "org-members", selectedOrgId],
      });
      toast.success("Гишүүн хасагдсан");
      setRemoveConfirm({ open: false, member: null });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    },
  });

  const sortedMembers = [...members].sort(
    (a, b) => (ROLE_RANK[b.role] ?? 0) - (ROLE_RANK[a.role] ?? 0),
  );

  function roleBadge(role: string) {
    const variants: Record<
      string,
      "default" | "destructive" | "secondary" | "outline"
    > = {
      owner: "destructive",
      admin: "default",
      coordinator: "secondary",
      finance: "secondary",
      manager: "secondary",
      trainer: "outline",
      scorekeeper: "outline",
      viewer: "outline",
    };
    return (
      <Badge variant={variants[role] ?? "outline"}>
        {ROLE_LABELS[role] ?? role}
      </Badge>
    );
  }

  return (
    <AdminPageLayout title="Байгууллагын гишүүд">
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
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <UserPlus className="mr-1 h-4 w-4" />
            Гишүүн нэмэх
          </Button>
        )}
      </div>

      {/* Members list */}
      {!selectedOrgId ? (
        <p className="text-sm text-muted-foreground">
          Байгууллага сонгоод гишүүдийг харах
        </p>
      ) : membersLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Уншиж байна...
        </div>
      ) : sortedMembers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Гишүүд олдсонгүй</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Хэрэглэгч</TableHead>
              <TableHead>Имэйл</TableHead>
              <TableHead>Үүрэг</TableHead>
              <TableHead>Нэмэгдсэн</TableHead>
              <TableHead>Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMembers.map((member) => (
              <TableRow key={member.membership_id}>
                <TableCell className="font-medium">
                  {member.display_name ?? member.user_id.slice(0, 8)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {member.user_email ?? "—"}
                </TableCell>
                <TableCell>{roleBadge(member.role)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(member.created_at).toLocaleDateString("mn-MN")}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setRemoveConfirm({ open: true, member })}
                    disabled={removeMutation.isPending}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Assign role dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Гишүүн нэмэх</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) =>
                assignMutation.mutate(values),
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="user_id"
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
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Үүрэг</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            <Shield className="mr-2 inline h-3 w-3" />
                            {label}
                          </SelectItem>
                        ))}
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
                  onClick={() => setDialogOpen(false)}
                >
                  Болих
                </Button>
                <Button type="submit" disabled={assignMutation.isPending}>
                  {assignMutation.isPending ? "Нэмж байна..." : "Нэмэх"}
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
            <AlertDialogTitle>Гишүүн хасах</AlertDialogTitle>
            <AlertDialogDescription>
              {removeConfirm.member?.display_name ??
                removeConfirm.member?.user_id.slice(0, 8)}
              -г{" "}
              {ROLE_LABELS[removeConfirm.member?.role ?? ""] ??
                removeConfirm.member?.role}{" "}
              үүргээс хасах уу?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Болих</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (removeConfirm.member) {
                  removeMutation.mutate(removeConfirm.member.membership_id);
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
