"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListRestart, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import {
  type RosterSnapshotRow,
  rosterApi,
  teamSeasonsApi,
} from "@/app/admin/_lib/api";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminPageLayout } from "@/components/admin/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const STATUS_LABELS: Record<string, string> = {
  active: "Идэвхтэй",
  injured: "Гэмтэлтэй",
  suspended: "Түр хасагдсан",
  ineligible: "Эрхгүй",
  transferred_out: "Шилжсэн",
};

const STATUS_COLORS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  active: "default",
  injured: "outline",
  suspended: "destructive",
  ineligible: "secondary",
  transferred_out: "secondary",
};

export default function RosterPage() {
  const queryClient = useQueryClient();
  const [selectedTeamSeasonId, setSelectedTeamSeasonId] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    label: string;
  }>({ open: false, id: "", label: "" });

  const { data: teamSeasons = [] } = useQuery({
    queryKey: ["admin", "team-seasons"],
    queryFn: () => teamSeasonsApi.list(),
  });

  const { data: snapshots = [], isPending: snapshotsPending } = useQuery({
    queryKey: ["admin", "roster-snapshots", selectedTeamSeasonId],
    queryFn: () => rosterApi.list(selectedTeamSeasonId),
    enabled: selectedTeamSeasonId.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: (teamSeasonId: string) => rosterApi.create(teamSeasonId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "roster-snapshots", selectedTeamSeasonId],
      });
      toast.success("Бүртгэл амжилттай үүсгэгдлээ");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rosterApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "roster-snapshots", selectedTeamSeasonId],
      });
      toast.success("Бүртгэл устгагдлаа");
      setDeleteConfirm({ open: false, id: "", label: "" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleDelete(snapshot: RosterSnapshotRow) {
    const playerName =
      snapshot.players?.canonical_name ?? snapshot.player_id.slice(0, 8);
    setDeleteConfirm({
      open: true,
      id: snapshot.id,
      label: playerName,
    });
  }

  return (
    <>
      <AdminPageLayout
        title="Бүртгэл (Roster)"
        loading={snapshotsPending}
        isEmpty={snapshots.length === 0}
        emptyTitle="Бүртгэл олдсонгүй"
        emptyDescription={
          selectedTeamSeasonId
            ? "Шинэ бүртгэл товчийг дарж одоогийн бүрэлдэхүүнийг хөлдөөнө."
            : "Багийн бүртгэлийг харахын тулд баг сонгоно уу."
        }
        actions={
          selectedTeamSeasonId ? (
            <Button
              onClick={() => createMutation.mutate(selectedTeamSeasonId)}
              disabled={createMutation.isPending}
            >
              <ListRestart className="mr-2 h-4 w-4" />
              {createMutation.isPending ? "Үүсгэж байна..." : "Шинэ бүртгэл"}
            </Button>
          ) : undefined
        }
        headerExtras={
          <div className="flex items-center gap-3">
            <div className="w-[280px]">
              <Select
                value={selectedTeamSeasonId}
                onValueChange={setSelectedTeamSeasonId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Баг сонгох">
                    {
                      teamSeasons.find((ts) => ts.id === selectedTeamSeasonId)
                        ?.teams?.name
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {teamSeasons.map((ts) => (
                    <SelectItem key={ts.id} value={ts.id}>
                      {ts.teams?.name ?? ts.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTeamSeasonId && (
              <span className="text-sm text-muted-foreground">
                {snapshots.length} тоглогч
              </span>
            )}
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">#</TableHead>
              <TableHead>Тоглогч</TableHead>
              <TableHead>Байрлал</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Бүртгэсэн</TableHead>
              <TableHead className="w-[80px]">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshots.map((item, _index) => (
              <TableRow key={item.id}>
                <TableCell className="text-muted-foreground">
                  {item.jersey_number ?? "—"}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {item.players?.photo_url && (
                      <Image
                        src={item.players.photo_url}
                        alt=""
                        width={28}
                        height={28}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    )}
                    <span>
                      {item.players?.canonical_name ??
                        item.player_id.slice(0, 8)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.position ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_COLORS[item.status] ?? "outline"}>
                    {STATUS_LABELS[item.status] ?? item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(item.captured_at).toLocaleDateString()}
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

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
        onConfirm={() => deleteMutation.mutate(deleteConfirm.id)}
        title="Бүртгэл устгах"
        description={`"${deleteConfirm.label}" бүртгэлийг устгах уу?`}
        loading={deleteMutation.isPending}
      />
    </>
  );
}
