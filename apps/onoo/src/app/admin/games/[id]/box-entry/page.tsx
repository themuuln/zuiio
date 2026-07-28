"use client";

import type { FibaOfficialStats } from "@onoo/core";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  FileText,
  MapPin,
  Trophy,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { FormEvent } from "react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { gamesApi, submissionsApi } from "@/app/admin/_lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatMinutes(seconds: number | null): string {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function pct(made: number, att: number): string {
  if (att === 0) return "—";
  return `${Math.round((made / att) * 100)}%`;
}

interface TeamStatsTableProps {
  teamLabel: string;
  players: FibaOfficialStats["teams"][number]["players"];
  side: "home" | "away";
}

function TeamStatsTable({ teamLabel, players, side }: TeamStatsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={`text-lg ${side === "home" ? "" : ""}`}>
          {teamLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 text-xs">#</TableHead>
              <TableHead className="min-w-32 text-xs">Тоглогч</TableHead>
              <TableHead className="text-xs">Min</TableHead>
              <TableHead className="text-xs" colSpan={2}>
                FG
              </TableHead>
              <TableHead className="text-xs" colSpan={2}>
                3P
              </TableHead>
              <TableHead className="text-xs" colSpan={2}>
                FT
              </TableHead>
              <TableHead className="text-xs">OREB</TableHead>
              <TableHead className="text-xs">DREB</TableHead>
              <TableHead className="text-xs">REB</TableHead>
              <TableHead className="text-xs">AST</TableHead>
              <TableHead className="text-xs">TO</TableHead>
              <TableHead className="text-xs">STL</TableHead>
              <TableHead className="text-xs">BLK</TableHead>
              <TableHead className="text-xs">PF</TableHead>
              <TableHead className="text-xs">+/-</TableHead>
              <TableHead className="text-xs font-bold">PTS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => (
              <TableRow
                key={`${player.jerseyNumber}-${player.name}`}
                className={player.dnp ? "text-muted-foreground" : ""}
              >
                <TableCell className="text-xs tabular-nums">
                  {player.jerseyNumber}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {player.name}
                  {player.dnp && (
                    <Badge variant="outline" className="ml-2 text-[10px]">
                      DNP
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs tabular-nums">
                  {formatMinutes(player.secondsPlayed)}
                </TableCell>
                <TableCell className="text-xs tabular-nums text-right">
                  {player.fgm}
                </TableCell>
                <TableCell className="text-xs tabular-nums text-muted-foreground">
                  {pct(player.fgm, player.fga)}/{player.fga}
                </TableCell>
                <TableCell className="text-xs tabular-nums text-right">
                  {player.tpm}
                </TableCell>
                <TableCell className="text-xs tabular-nums text-muted-foreground">
                  {pct(player.tpm, player.tpa)}/{player.tpa}
                </TableCell>
                <TableCell className="text-xs tabular-nums text-right">
                  {player.ftm}
                </TableCell>
                <TableCell className="text-xs tabular-nums text-muted-foreground">
                  {pct(player.ftm, player.fta)}/{player.fta}
                </TableCell>
                <TableCell className="text-xs tabular-nums">
                  {player.oreb}
                </TableCell>
                <TableCell className="text-xs tabular-nums">
                  {player.dreb}
                </TableCell>
                <TableCell className="text-xs tabular-nums font-medium">
                  {player.reb}
                </TableCell>
                <TableCell className="text-xs tabular-nums">
                  {player.ast}
                </TableCell>
                <TableCell className="text-xs tabular-nums">
                  {player.tov}
                </TableCell>
                <TableCell className="text-xs tabular-nums">
                  {player.stl}
                </TableCell>
                <TableCell className="text-xs tabular-nums">
                  {player.pf}
                </TableCell>
                <TableCell className="text-xs tabular-nums">
                  {player.plusMinus > 0 ? "+" : ""}
                  {player.plusMinus}
                </TableCell>
                <TableCell className="text-xs font-bold tabular-nums">
                  {player.pts}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ScoreBadge({
  label,
  score,
  highlight,
}: {
  label: string;
  score: number;
  highlight: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-xl px-8 py-4 ${
        highlight
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground"
      }`}
    >
      <span className="text-xs font-medium uppercase tracking-wider opacity-70">
        {label}
      </span>
      <span className="text-5xl font-bold tabular-nums leading-none">
        {score}
      </span>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Товлогдсон",
  live_provisional: "Шууд (түр)",
  final_pending_review: "Дууссан (хяналт)",
  league_verified: "Албан ёсны",
};

const SUB_STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  approved: "Зөвшөөрсөн",
  rejected: "Татгалзсан",
};

const SUB_STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "default",
  approved: "secondary",
  rejected: "destructive",
};

export default function BoxEntryPage() {
  const params = useParams<{ id: string }>();
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<FibaOfficialStats | null>(null);
  const [syncInfo, setSyncInfo] = useState<{
    submissionId: string;
    revisionId: string;
    synced: boolean;
    unmatchedPlayers?: Array<{
      teamCode: string;
      jerseyNumber: number;
      name: string;
    }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: game, isPending } = useQuery({
    queryKey: ["admin", "game", params.id],
    queryFn: () => gamesApi.get(params.id),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["admin", "game", params.id, "submissions"],
    queryFn: () => submissionsApi.list(params.id),
  });

  const officialSubmissions = submissions.filter(
    (s) => s.source_type === "official_score_sheet",
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf" || dropped?.name.endsWith(".pdf")) {
      setFile(dropped);
    } else {
      toast.error("Зөвхөн PDF файл ачаалах боломжтой");
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) setFile(selected);
      // Reset so the same file can be re-selected
      e.target.value = "";
    },
    [],
  );

  const clearFile = useCallback(() => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setIsSubmitting(true);
    setResult(null);
    setSyncInfo(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      // Collect the checkbox
      const rightsCheckbox = (
        event.currentTarget as HTMLFormElement
      ).querySelector('input[name="rightsConfirmed"]') as HTMLInputElement;
      if (rightsCheckbox?.checked) {
        fd.append("rightsConfirmed", "true");
      }
      const response = await fetch(
        `/admin/api/games/${params.id}/official-stats`,
        { method: "POST", body: fd },
      );
      const body = (await response.json()) as {
        error?: string;
        boxScore?: FibaOfficialStats;
        synced?: boolean;
        submissionId?: string;
        revisionId?: string;
        unmatchedPlayers?: Array<{
          teamCode: string;
          jerseyNumber: number;
          name: string;
        }>;
      };

      if (!response.ok || !body.boxScore) {
        throw new Error(body.error ?? "Импорт хийж чадсангүй");
      }

      setResult(body.boxScore);
      setSyncInfo({
        submissionId: body.submissionId ?? "",
        revisionId: body.revisionId ?? "",
        synced: body.synced ?? false,
        unmatchedPlayers: body.unmatchedPlayers,
      });

      toast.success(
        body.synced
          ? "Амжилттай уншигдаж, тоглолтын үзүүлэлт шинэчлэгдлээ"
          : "Амжилттай уншигдлаа",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Импорт хийж чадсангүй",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/games/${params.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Тоглолт руу буцах
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Албан ёсны статистик импортлох</h1>
        <p className="text-sm text-muted-foreground">
          Дүгнэлт хуудасны FIBA Official Statistics PDF-г оруулж, тоглогчдын
          үзүүлэлт болон оноог автоматаар синк хийх.
        </p>
      </div>

      {/* Game context */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {isPending ? (
              <div className="h-5 w-48 animate-pulse rounded bg-muted" />
            ) : game ? (
              <>
                <div className="flex items-center gap-2 font-semibold">
                  <Trophy className="size-4 text-muted-foreground" />
                  <span>{game.competitions?.name ?? "Тэмцээн"}</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-lg tabular-nums">
                    {game.home_team_season?.teams?.name ?? "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">VS</span>
                  <span className="text-lg tabular-nums">
                    {game.away_team_season?.teams?.name ?? "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="size-3.5" />
                  {format(new Date(game.scheduled_at), "yyyy-MM-dd HH:mm")}
                </div>
                {game.venues && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {game.venues.name}
                    {game.venues.city ? `, ${game.venues.city}` : ""}
                  </div>
                )}
              </>
            ) : null}
          </div>
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {STATUS_LABELS[game?.status ?? ""] ?? game?.status ?? "—"}
          </Badge>
        </CardContent>
      </Card>

      {/* Upload zone — hero action */}
      {!result ? (
        <Card
          className={`border-2 transition-colors ${
            isDragOver
              ? "border-primary bg-primary/5"
              : file
                ? "border-emerald-400/50"
                : "border-dashed border-muted-foreground/30"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CardContent className="pt-8 pb-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Drop zone */}
              <div
                className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 text-center transition-colors hover:border-primary/50"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
              >
                {!file ? (
                  <>
                    <div className="rounded-full bg-primary/10 p-4">
                      <Upload className="size-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">PDF-г энд чирж авчирна уу</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        эсвэл товшоод файл сонгох
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Зөвхөн FIBA Official Statistics PDF
                    </p>
                  </>
                ) : (
                  <div className="flex w-full max-w-md items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                    <FileText className="size-6 shrink-0 text-primary" />
                    <div className="flex-1 truncate text-left">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Файл хасах"
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )}
                <Input
                  ref={fileInputRef}
                  id="official-stats-file"
                  name="file"
                  type="file"
                  accept="application/pdf,.pdf"
                  data-testid="pdf-file-input"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Rights + submit row */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-start gap-3 text-sm">
                  <input
                    name="rightsConfirmed"
                    type="checkbox"
                    value="true"
                    required
                    className="mt-0.5 size-4 accent-primary"
                  />
                  <span>
                    Энэхүү албан ёсны статистикийг ашиглах, хадгалах эрхтэйгээ
                    баталгаажуулж байна
                  </span>
                </label>

                <Button
                  type="submit"
                  disabled={isSubmitting || !file}
                  className="w-full shrink-0 sm:w-auto"
                >
                  {isSubmitting ? (
                    <>Уншиж байна…</>
                  ) : (
                    <>
                      <Upload className="mr-1.5 size-4" />
                      PDF-с статистик шинэчлэх
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Collapsed upload card — shown after successful import */
        <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-3">
            <FileText className="size-5 text-emerald-500" />
            <span>
              <span className="font-medium">{file?.name}</span> — амжилттай
              импортлогдсон
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setResult(null);
              setSyncInfo(null);
              setFile(null);
            }}
          >
            Шинэ PDF оруулах
          </Button>
        </div>
      )}

      {/* Parsed result */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Scoreboard */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-4 sm:gap-8">
                <ScoreBadge
                  label={result.teams[0]?.name ?? "Home"}
                  score={result.score.home}
                  highlight={result.score.home > result.score.away}
                />
                <span className="text-3xl font-bold text-muted-foreground">
                  :
                </span>
                <ScoreBadge
                  label={result.teams[1]?.name ?? "Away"}
                  score={result.score.away}
                  highlight={result.score.away > result.score.home}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sync status */}
          {syncInfo?.synced && (
            <Card className="border-emerald-500/30">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                  <svg
                    className="size-5 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-emerald-700 dark:text-emerald-400">
                    Статистик шинэчлэгдсэн
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Тоглолтын үзүүлэлт, оноо болон чансаа автоматаар
                    шинэчлэгдсэн. Одоо тоглолтын хуудас дээр харагдана.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unmatched players warning */}
          {syncInfo?.unmatchedPlayers &&
            syncInfo.unmatchedPlayers.length > 0 && (
              <Card className="border-amber-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <svg
                      className="size-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z"
                      />
                    </svg>
                    Тохироогүй тоглогчид ({syncInfo.unmatchedPlayers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Дараах тоглогчдын дугаар тохирохгүй байна — гараар шалгана
                    уу:
                  </p>
                  <ul className="list-disc space-y-0.5 pl-5 text-sm text-amber-700 dark:text-amber-400">
                    {syncInfo.unmatchedPlayers.map((p) => (
                      <li key={`${p.teamCode}-${p.jerseyNumber}`}>
                        #{p.jerseyNumber} {p.name} ({p.teamCode})
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

          {/* Player stats per team */}
          {result.teams.map((team, idx) => (
            <TeamStatsTable
              key={team.code}
              teamLabel={`${team.name} (${team.code})`}
              players={team.players}
              side={idx === 0 ? "home" : "away"}
            />
          ))}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <Card className="border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-amber-700 dark:text-amber-400">
                  Анхааруулга
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm text-amber-700 dark:text-amber-400">
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Actions after import */}
          {syncInfo && (
            <div className="flex flex-wrap gap-3">
              <Button variant="default">
                <Link href={`/admin/games/${params.id}`}>
                  <ExternalLink className="mr-1 size-4" />
                  Тоглолт руу очих
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setSyncInfo(null);
                  setFile(null);
                }}
              >
                Шинэ PDF оруулах
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Previous submissions */}
      {officialSubmissions.length > 0 && !result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" />
              Ымнөх импортууд ({officialSubmissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Огноо</TableHead>
                  <TableHead>Төлөв</TableHead>
                  <TableHead>PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {officialSubmissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="text-sm">
                      {format(new Date(sub.submitted_at), "yyyy-MM-dd HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={SUB_STATUS_VARIANTS[sub.status] ?? "outline"}
                      >
                        {SUB_STATUS_LABELS[sub.status] ?? sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Link
                          href={
                            sub.source_type === "official_score_sheet"
                              ? `/admin/api/submissions/${sub.id}/evidence`
                              : (sub.evidence_url ?? "#")
                          }
                          target="_blank"
                          className="inline-flex items-center gap-1"
                        >
                          <ExternalLink className="size-3" />
                          Үзэх
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
