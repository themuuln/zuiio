"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { type TeamSeasonRow, teamsContextApi } from "@/app/admin/_lib/api";
import { staffApi, type TeamStaffRow } from "@/app/admin/_lib/api-team-ops";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminPageLayout } from "@/components/admin/page-layout";
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

const staffSchema = z.object({
  team_season_id: z.string().min(1, "Баг сонгоно уу"),
  user_id: z.string().uuid("Зөв хэрэглэгчийн ID оруулна уу"),
  role: z.string().min(1, "Үүрэг сонгоно уу"),
});

type StaffFormValues = z.infer<typeof staffSchema>;

const ROLE_LABELS: Record<string, string> = {
  head_coach: "Ахлах дасгалжуулагч",
  assistant_coach: "Туслах дасгалжуулагч",
  manager: "Менежер",
  physio: "Физио эмч",
  finance: "Санхүү",
  media: "Медиа",
};

const ROLE_COLORS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  head_coach: "default",
  assistant_coach: "secondary",
  manager: "outline",
  physio: "secondary",
  finance: "outline",
  media: "outline",
};

const ROLES = Object.keys(ROLE_LABELS);

export default function TeamStaffPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    label: string;
  }>({ open: false, id: "", label: "" });

  const { data: staff = [], isPending: staffPending } = useQuery({
    queryKey: ["admin", "team-staff"],
    queryFn: () => staffApi.list(),
  });

  const { data: ctx } = useQuery({
    queryKey: ["admin", "teams", "context"],
    queryFn: () => teamsContextApi.get(),
    staleTime: 3 * 60 * 1000,
  });
  const teamSeasons = (ctx?.teamSeasons ?? []) as TeamSeasonRow[];

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: { team_season_id: "", user_id: "", role: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: StaffFormValues) => staffApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "team-staff"] });
      toast.success("Ажилтан амжилттай нэмэгдлээ");
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "team-staff"] });
      toast.success("Ажилтан устгагдлаа");
      setDeleteConfirm({ open: false, id: "", label: "" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(values: StaffFormValues) {
    createMutation.mutate(values);
  }

  function handleDelete(item: TeamStaffRow) {
    const roleLabel = ROLE_LABELS[item.role] ?? item.role;
    const teamName = item.team_seasons?.teams?.name ?? "—";
    setDeleteConfirm({
      open: true,
      id: item.id,
      label: `${teamName} - ${roleLabel}`,
    });
  }

  return (
    <>
      <AdminPageLayout
        title="Багийн ажилтнууд"
        loading={staffPending}
        isEmpty={staff.length === 0}
        emptyTitle="Ажилтан олдсонгүй"
        emptyDescription="Ажилтан нэмэх товчийг дарж шинэ ажилтан бүртгэнэ үү."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Нэмэх
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Баг</TableHead>
              <TableHead>Хэрэглэгч</TableHead>
              <TableHead>Үүрэг</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Үүсгэсэн</TableHead>
              <TableHead className="w-[80px]">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell className="text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium">
                  {item.team_seasons?.teams?.name ?? "—"}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {item.user_id.slice(0, 8)}...
                </TableCell>
                <TableCell>
                  <Badge variant={ROLE_COLORS[item.role] ?? "outline"}>
                    {ROLE_LABELS[item.role] ?? item.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={item.is_active ? "default" : "secondary"}>
                    {item.is_active ? "Идэвхтэй" : "Идэвхгүй"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(item.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item)}
                    aria-label="Устгах"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminPageLayout>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Шинэ ажилтан нэмэх</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="team_season_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Баг</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Баг сонгох">
                            {
                              teamSeasons.find((ts) => ts.id === field.value)
                                ?.teams?.name
                            }
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teamSeasons.map((ts) => (
                          <SelectItem key={ts.id} value={ts.id}>
                            {ts.teams?.name ?? ts.id.slice(0, 8)}
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
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Хэрэглэгчийн ID</FormLabel>
                    <FormControl>
                      <Input placeholder="auth.users-ийн UUID" {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Үүрэг сонгох" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_LABELS[role]}
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

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
        onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
        title="Ажилтан устгах"
        description={`"${deleteConfirm.label}"-ийг устгах уу?`}
        loading={deleteMutation.isPending}
      />
    </>
  );
}
