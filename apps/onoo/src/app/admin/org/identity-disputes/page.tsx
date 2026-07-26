"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  type CompetitionRow,
  competitionsApi,
  type IdentityDisputeRow,
  identityDisputesApi,
  type PlayerRow,
  playersApi,
} from "@/app/admin/_lib/api";
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
import { Label } from "@/components/ui/label";
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

const STATUS_OPTIONS = [
  { value: "", label: "Бүгд" },
  { value: "open", label: "Нээлттэй" },
  { value: "under_review", label: "Хянаж байгаа" },
  { value: "resolved", label: "Шийдвэрлэсэн" },
  { value: "dismissed", label: "Татгалзсан" },
] as const;

const DISPUTE_REASONS = [
  { value: "wrong_player", label: "Буруу тоглогч" },
  { value: "wrong_team", label: "Буруу баг" },
  { value: "wrong_position", label: "Буруу байрлал" },
  { value: "wrong_jersey", label: "Буруу дугаар" },
  { value: "eligibility_error", label: "Эрхийн алдаа" },
  { value: "duplicate_record", label: "Давхардсан бүртгэл" },
  { value: "stat_error", label: "Үзүүлэлтийн алдаа" },
  { value: "other", label: "Бусад" },
] as const;

function statusBadgeVariant(
  status: string,
): "default" | "destructive" | "secondary" | "outline" {
  switch (status) {
    case "open":
      return "destructive";
    case "under_review":
      return "secondary";
    case "resolved":
      return "default";
    case "dismissed":
      return "outline";
    default:
      return "outline";
  }
}

function statusLabel(status: string): string {
  const opt = STATUS_OPTIONS.find((o) => o.value === status);
  return opt?.label ?? status;
}

function reasonLabel(reason: string): string {
  const opt = DISPUTE_REASONS.find((o) => o.value === reason);
  return opt?.label ?? reason;
}

const createSchema = z.object({
  player_id: z.string().min(1, "Тоглогч сонгоно уу"),
  competition_id: z.string().optional(),
  dispute_reason: z.string().min(1, "Шалтгаан сонгоно уу"),
  description: z.string().min(1, "Тайлбар оруулна уу"),
  evidence_notes: z.string().optional(),
});

type CreateFormValues = z.infer<typeof createSchema>;

export default function IdentityDisputesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<IdentityDisputeRow | null>(
    null,
  );
  const [resolveStatus, setResolveStatus] = useState("resolved");
  const [resolveNotes, setResolveNotes] = useState("");

  const { data: disputes = [], isPending: disputesPending } = useQuery({
    queryKey: ["admin", "identity-disputes", statusFilter],
    queryFn: () => identityDisputesApi.list(statusFilter || undefined),
  });

  const { data: players = [] } = useQuery({
    queryKey: ["admin", "players", "all"],
    queryFn: () => playersApi.list(),
  });

  const { data: competitions = [] } = useQuery({
    queryKey: ["admin", "competitions", "all"],
    queryFn: () => competitionsApi.list(),
  });

  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      player_id: "",
      competition_id: "",
      dispute_reason: "",
      description: "",
      evidence_notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateFormValues) =>
      identityDisputesApi.create({
        player_id: values.player_id,
        competition_id: values.competition_id || null,
        dispute_reason: values.dispute_reason,
        description: values.description,
        evidence_notes: values.evidence_notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "identity-disputes"],
      });
      toast.success("Маргаан үүсгэгдсэн");
      setCreateOpen(false);
      createForm.reset();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (params: { id: string; status: string; notes?: string }) =>
      identityDisputesApi.resolve(params.id, params.status, params.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "identity-disputes"],
      });
      toast.success("Маргаан шийдвэрлэгдсэн");
      setResolveTarget(null);
      setResolveNotes("");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    },
  });

  return (
    <AdminPageLayout
      title="Тоглогчийн таних маргаан"
      actions={
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Шинэ маргаан
          </Button>
        </div>
      }
      loading={disputesPending}
      isEmpty={!disputesPending && disputes.length === 0}
      emptyTitle="Маргаан олдсонгүй"
      emptyDescription="Таних маргаан байхгүй байна."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Тоглогч</TableHead>
            <TableHead>Тэмцээн</TableHead>
            <TableHead>Шалтгаан</TableHead>
            <TableHead>Тайлбар</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Огноо</TableHead>
            <TableHead>Үйлдэл</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {disputes.map((dispute) => (
            <TableRow key={dispute.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {dispute.players?.photo_url ? (
                    <Image
                      src={dispute.players.photo_url}
                      alt=""
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                      ?
                    </div>
                  )}
                  {dispute.players?.canonical_name ?? "—"}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {dispute.competitions?.name ?? "—"}
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {reasonLabel(dispute.dispute_reason)}
                </span>
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                {dispute.description}
              </TableCell>
              <TableCell>
                <Badge variant={statusBadgeVariant(dispute.status)}>
                  {statusLabel(dispute.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(dispute.submitted_at).toLocaleDateString("mn-MN")}
              </TableCell>
              <TableCell>
                {dispute.status === "open" ||
                dispute.status === "under_review" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setResolveTarget(dispute);
                      setResolveStatus("resolved");
                      setResolveNotes("");
                    }}
                  >
                    Шийдвэрлэх
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setResolveTarget(dispute);
                      setResolveStatus(dispute.status);
                      setResolveNotes(dispute.resolution_notes ?? "");
                    }}
                  >
                    Дэлгэрэнгүй
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Шинэ маргаан үүсгэх</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit((values) =>
                createMutation.mutate(values),
              )}
              className="space-y-4"
            >
              <FormField
                control={createForm.control}
                name="player_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тоглогч</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Тоглогч сонгох..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(players as PlayerRow[]).map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.canonical_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="competition_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тэмцээн (заавал биш)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Тэмцээн сонгох..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(competitions as CompetitionRow[]).map((comp) => (
                          <SelectItem key={comp.id} value={comp.id}>
                            {comp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="dispute_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Шалтгаан</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Шалтгаан сонгох..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DISPUTE_REASONS.map((reason) => (
                          <SelectItem key={reason.value} value={reason.value}>
                            {reason.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тайлбар</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Маргааны дэлгэрэнгүй тайлбар..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="evidence_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Нотолгооны тэмдэглэл (заавал биш)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Нотлох баримт, зураг, холбоос..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Болих
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Үүсгэж байна..." : "Үүсгэх"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Resolve / detail dialog */}
      <Dialog
        open={resolveTarget !== null}
        onOpenChange={(open) => {
          if (!open) setResolveTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {resolveTarget?.status === "open" ||
              resolveTarget?.status === "under_review"
                ? "Маргаан шийдвэрлэх"
                : "Маргааны дэлгэрэнгүй"}
            </DialogTitle>
          </DialogHeader>
          {resolveTarget && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 text-sm">
                <div className="mb-2">
                  <span className="font-medium">Тоглогч:</span>{" "}
                  {resolveTarget.players?.canonical_name ?? "—"}
                </div>
                <div className="mb-2">
                  <span className="font-medium">Шалтгаан:</span>{" "}
                  {reasonLabel(resolveTarget.dispute_reason)}
                </div>
                <div className="mb-2">
                  <span className="font-medium">Тайлбар:</span>{" "}
                  {resolveTarget.description}
                </div>
                {resolveTarget.evidence_notes && (
                  <div className="mb-2">
                    <span className="font-medium">Нотолгоо:</span>{" "}
                    {resolveTarget.evidence_notes}
                  </div>
                )}
                <div>
                  <span className="font-medium">Статус:</span>{" "}
                  <Badge
                    variant={statusBadgeVariant(resolveTarget.status)}
                    className="ml-1"
                  >
                    {statusLabel(resolveTarget.status)}
                  </Badge>
                </div>
                {resolveTarget.resolution_notes && (
                  <div className="mt-2">
                    <span className="font-medium">Шийдвэрлэсэн тэмдэглэл:</span>{" "}
                    {resolveTarget.resolution_notes}
                  </div>
                )}
              </div>

              {(resolveTarget.status === "open" ||
                resolveTarget.status === "under_review") && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Шинэ статус</Label>
                    <Select
                      value={resolveStatus}
                      onValueChange={setResolveStatus}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resolved">Шийдвэрлэсэн</SelectItem>
                        <SelectItem value="dismissed">Төгсгөсөн</SelectItem>
                        <SelectItem value="under_review">
                          Хянаж байгаа
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resolve-notes">
                      Шийдвэрлэсэн тэмдэглэл
                    </Label>
                    <Textarea
                      id="resolve-notes"
                      value={resolveNotes}
                      onChange={(e) => setResolveNotes(e.target.value)}
                      placeholder="Шийдвэрлэсэн дэлгэрэнгүй..."
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setResolveTarget(null)}
                    >
                      Болих
                    </Button>
                    <Button
                      onClick={() =>
                        resolveMutation.mutate({
                          id: resolveTarget.id,
                          status: resolveStatus,
                          notes: resolveNotes || undefined,
                        })
                      }
                      disabled={resolveMutation.isPending}
                    >
                      {resolveMutation.isPending
                        ? "Хадгалж байна..."
                        : "Хадгалах"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}
