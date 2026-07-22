"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
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

// ── Types ──

interface SponsorPlacement {
  id: string;
  sponsor_id: string;
  competition_id: string;
  slot: string;
  starts_on: string;
  ends_on: string;
  created_at: string;
}

interface SponsorRow {
  id: string;
  name: string;
  logo_url: string | null;
  link_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  sponsor_placements: SponsorPlacement[];
}

interface CompetitionRow {
  id: string;
  name: string;
  type: string;
  season_id: string;
}

// ── Helpers ──

const SLOT_OPTIONS = [
  { value: "standings", label: "Шагналт хүснэгт" },
  { value: "leaders", label: "Тэргүүлэгчид" },
  { value: "game", label: "Тоглолт" },
  { value: "recap", label: "Тойм" },
  { value: "award_card", label: "Шагнал карт" },
  { value: "home", label: "Нүүр хуудас" },
] as const;

function slotLabel(slot: string): string {
  return SLOT_OPTIONS.find((s) => s.value === slot)?.label ?? slot;
}

const BASE = "/admin/api/sponsors";

// ── Page ──

export default function SponsorsPage() {
  const queryClient = useQueryClient();

  // List state
  const { data: sponsors = [], isPending } = useQuery({
    queryKey: ["admin", "sponsors"],
    queryFn: async () => {
      const res = await fetch(BASE);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Ачааллахад алдаа гарлаа");
      }
      return res.json() as Promise<SponsorRow[]>;
    },
  });

  const { data: competitions = [] } = useQuery({
    queryKey: ["admin", "competitions"],
    queryFn: async () => {
      const res = await fetch("/admin/api/competitions");
      if (!res.ok) throw new Error("Competitions fetch failed");
      return res.json() as Promise<CompetitionRow[]>;
    },
  });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<SponsorRow | null>(null);
  const [formName, setFormName] = useState("");
  const [formLinkUrl, setFormLinkUrl] = useState("");

  // Logo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Placement dialog
  const [placementOpen, setPlacementOpen] = useState(false);
  const [placementSponsor, setPlacementSponsor] = useState<SponsorRow | null>(
    null,
  );
  const [placementCompetition, setPlacementCompetition] = useState("");
  const [placementSlot, setPlacementSlot] = useState("");
  const [placementStartsOn, setPlacementStartsOn] = useState("");
  const [placementEndsOn, setPlacementEndsOn] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<SponsorRow | null>(null);

  // ── Mutations ──

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "sponsors"] });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; link_url?: string | null }) => {
      const res = await fetch(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Үүсгэхэд алдаа гарлаа");
      }
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast.success("Ивээн тэтгэгч амжилттай нэмэгдлээ");
      setDialogOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      link_url?: string | null;
    }) => {
      const res = await fetch(`${BASE}/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, link_url: data.link_url }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Шинэчлэхэд алдаа гарлаа");
      }
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast.success("Ивээн тэтгэгч амжилттай шинэчлэгдлээ");
      setDialogOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Устгахад алдаа гарлаа");
    },
    onSuccess: () => {
      invalidate();
      toast.success("Ивээн тэтгэгч идэвхгүй болгосон");
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  async function handleLogoUpload(
    sponsorId: string,
    file: File,
  ): Promise<string | null> {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${BASE}/${sponsorId}/logo`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Зураг оруулахад алдаа гарлаа");
      }
      const result = (await res.json()) as { logo_url: string };
      invalidate();
      toast.success("Лого амжилттай шинэчлэгдлээ");
      return result.logo_url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Зураг оруулахад алдаа гарлаа",
      );
      return null;
    } finally {
      setUploadingLogo(false);
    }
  }

  const placementMutation = useMutation({
    mutationFn: async (data: {
      sponsor_id: string;
      competition_id: string;
      slot: string;
      starts_on: string;
      ends_on: string;
    }) => {
      const res = await fetch(`${BASE}/placements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Байршил нэмэхэд алдаа гарлаа");
      }
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast.success("Байршил амжилттай нэмэгдлээ");
      resetPlacementForm();
      setPlacementOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deletePlacementMutation = useMutation({
    mutationFn: async (placementId: string) => {
      const res = await fetch(`${BASE}/placements?id=${placementId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Байршил устгахад алдаа гарлаа");
    },
    onSuccess: () => {
      invalidate();
      toast.success("Байршил устгагдлаа");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // ── Dialog handlers ──

  function openCreateDialog() {
    setEditingSponsor(null);
    setFormName("");
    setFormLinkUrl("");
    setDialogOpen(true);
  }

  function openEditDialog(sponsor: SponsorRow) {
    setEditingSponsor(sponsor);
    setFormName(sponsor.name);
    setFormLinkUrl(sponsor.link_url ?? "");
    setDialogOpen(true);
  }

  function handleSave() {
    if (!formName.trim()) {
      toast.error("Нэр заавал байх ёстой");
      return;
    }
    if (editingSponsor) {
      updateMutation.mutate({
        id: editingSponsor.id,
        name: formName.trim(),
        link_url: formLinkUrl.trim() || null,
      });
    } else {
      createMutation.mutate({
        name: formName.trim(),
        link_url: formLinkUrl.trim() || null,
      });
    }
  }

  function openPlacementDialog(sponsor: SponsorRow) {
    setPlacementSponsor(sponsor);
    resetPlacementForm();
    setPlacementOpen(true);
  }

  function resetPlacementForm() {
    setPlacementCompetition("");
    setPlacementSlot("");
    setPlacementStartsOn("");
    setPlacementEndsOn("");
  }

  function handleAddPlacement() {
    if (
      !placementSponsor ||
      !placementCompetition ||
      !placementSlot ||
      !placementStartsOn ||
      !placementEndsOn
    ) {
      toast.error("Бүх талбарыг бөглөнө үү");
      return;
    }
    placementMutation.mutate({
      sponsor_id: placementSponsor.id,
      competition_id: placementCompetition,
      slot: placementSlot,
      starts_on: placementStartsOn,
      ends_on: placementEndsOn,
    });
  }

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <AdminPageLayout
        title="Ивээн тэтгэгчид"
        loading={isPending}
        isEmpty={sponsors.length === 0}
        emptyTitle="Ивээн тэтгэгч байхгүй байна"
        emptyDescription="Шинэ ивээн тэтгэгч нэмэх товчийг дарна уу."
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Нэмэх
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Нэр</TableHead>
              <TableHead>Лого</TableHead>
              <TableHead>Төлөв</TableHead>
              <TableHead>Линк</TableHead>
              <TableHead>Байршил</TableHead>
              <TableHead className="w-[140px]">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sponsors.map((sponsor) => (
              <TableRow key={sponsor.id}>
                <TableCell className="font-medium">{sponsor.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {sponsor.logo_url ? (
                      <div className="relative size-10 overflow-hidden rounded-md border bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={sponsor.logo_url}
                          alt={`${sponsor.name} лого`}
                          className="size-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-md border bg-muted">
                        <ImageIcon className="size-4 text-muted-foreground" />
                      </div>
                    )}
                    {/* Inline upload */}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            await handleLogoUpload(sponsor.id, file);
                          }
                          // Reset so same file can be re-selected
                          e.target.value = "";
                        }}
                      />
                      <Upload className="size-4 text-muted-foreground hover:text-foreground" />
                    </label>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={sponsor.active ? "default" : "secondary"}>
                    {sponsor.active ? "Идэвхтэй" : "Идэвхгүй"}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {sponsor.link_url ? (
                    <a
                      href={sponsor.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {sponsor.link_url}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">
                      {sponsor.sponsor_placements?.length ?? 0}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openPlacementDialog(sponsor)}
                      aria-label={`${sponsor.name} байршил`}
                    >
                      <Calendar className="size-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(sponsor)}
                      aria-label={`${sponsor.name} засах`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(sponsor)}
                      aria-label={`${sponsor.name} устгах`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminPageLayout>

      {/* ── Create / Edit dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSponsor ? "Ивээн тэтгэгч засах" : "Шинэ ивээн тэтгэгч"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Нэр</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ивээн тэтгэгчийн нэр"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link-url">Линк (заавал биш)</Label>
              <Input
                id="link-url"
                value={formLinkUrl}
                onChange={(e) => setFormLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Цуцлах
            </Button>
            <Button onClick={handleSave} disabled={isMutating}>
              {isMutating ? "Хадгалж байна..." : "Хадгалах"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Placement dialog ── */}
      <Dialog open={placementOpen} onOpenChange={setPlacementOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{placementSponsor?.name} — Байршил</DialogTitle>
          </DialogHeader>

          {/* Existing placements */}
          {placementSponsor &&
            placementSponsor.sponsor_placements.length > 0 && (
              <div className="space-y-2">
                <Label>Одоогийн байршил</Label>
                <div className="max-h-48 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Тэмцээн</TableHead>
                        <TableHead>Байршил</TableHead>
                        <TableHead>Эхлэх</TableHead>
                        <TableHead>Дуусах</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {placementSponsor.sponsor_placements.map((p) => {
                        const comp = competitions.find(
                          (c) => c.id === p.competition_id,
                        );
                        return (
                          <TableRow key={p.id}>
                            <TableCell>
                              {comp?.name ?? p.competition_id.slice(0, 8)}
                            </TableCell>
                            <TableCell>{slotLabel(p.slot)}</TableCell>
                            <TableCell>{p.starts_on}</TableCell>
                            <TableCell>{p.ends_on}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  deletePlacementMutation.mutate(p.id)
                                }
                                aria-label="Устгах"
                              >
                                <X className="size-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

          {/* Add placement form */}
          <div className="grid gap-4">
            <Label>Шинэ байршил нэмэх</Label>
            <div className="grid gap-2">
              <Label htmlFor="placement-competition">Тэмцээн</Label>
              <Select
                value={placementCompetition}
                onValueChange={setPlacementCompetition}
              >
                <SelectTrigger id="placement-competition">
                  <SelectValue placeholder="Тэмцээн сонгох" />
                </SelectTrigger>
                <SelectContent>
                  {competitions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name ?? c.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="placement-slot">Байршил</Label>
              <Select value={placementSlot} onValueChange={setPlacementSlot}>
                <SelectTrigger id="placement-slot">
                  <SelectValue placeholder="Байршил сонгох" />
                </SelectTrigger>
                <SelectContent>
                  {SLOT_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="placement-starts-on">Эхлэх огноо</Label>
                <Input
                  id="placement-starts-on"
                  type="date"
                  value={placementStartsOn}
                  onChange={(e) => setPlacementStartsOn(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="placement-ends-on">Дуусах огноо</Label>
                <Input
                  id="placement-ends-on"
                  type="date"
                  value={placementEndsOn}
                  onChange={(e) => setPlacementEndsOn(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPlacementOpen(false)}
            >
              Хаах
            </Button>
            <Button
              onClick={handleAddPlacement}
              disabled={placementMutation.isPending}
            >
              {placementMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Нэмж байна...
                </>
              ) : (
                "Нэмэх"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ── */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        title={`"${deleteTarget?.name}" идэвхгүй болгох уу?`}
        description="Ивээн тэтгэгч идэвхгүй болсон хэвээр байх бөгөөд дэлгэцэнд харагдахгүй."
        confirmText="Идэвхгүй болгох"
        loading={deleteMutation.isPending}
      />
    </>
  );
}
