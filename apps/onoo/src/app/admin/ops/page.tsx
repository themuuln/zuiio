import { createClient } from "@/lib/supabase/server";
import { ErrorReportActions } from "./_components/error-report-actions";
import { formatDistanceToNow } from "date-fns";
import { mn } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function OpsConsolePage() {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: activeSessions },
    { count: pendingSubmissions },
    { count: pendingRevisions },
    { data: auditRows },
    { data: staleGames },
    { data: errorReports },
  ] = await Promise.all([
    supabase
      .from("tracker_sessions")
      .select(
        "id, game_id, scorer_id, role, started_at, last_acknowledged_sequence, profiles!tracker_sessions_scorer_id_fkey(display_name), games!tracker_sessions_game_id_fkey(scheduled_at)",
      )
      .eq("status", "active"),
    supabase
      .from("source_submissions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("game_revisions")
      .select("*", { count: "exact", head: true })
      .eq("state", "pending"),
    supabase
      .from("audit_log")
      .select("id, actor_id, action, entity, entity_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("games")
      .select("id, scheduled_at, created_at")
      .eq("status", "final_pending_review")
      .lt("created_at", cutoff),
    supabase
      .from("public_error_reports")
      .select("id, game_id, player_id, message, contact, created_at, status")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const sessions = activeSessions ?? [];
  const auditLog = auditRows ?? [];
  const reports = errorReports ?? [];
  const stale = staleGames ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Операторын хяналтын самбар
        </h1>
        {stale.length > 0 && (
          <Badge variant="destructive">{stale.length} хугацаа хэтэрсэн</Badge>
        )}
      </div>

      {/* Pending counts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Хүлээгдэж буй эх сурвалж
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingSubmissions ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Хүлээгдэж буй нэмэлт засвар
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingRevisions ?? 0}</p>
          </CardContent>
        </Card>
      </div>
      {/* Error Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Алдааны мэдээлэл
            {reports.length > 0 && (
              <Badge variant="destructive">{reports.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Нээлттэй алдааны мэдээлэл байхгүй
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Тоглолт</TableHead>
                    <TableHead>Тоглогч</TableHead>
                    <TableHead>Мессеж</TableHead>
                    <TableHead>Холбоо</TableHead>
                    <TableHead>Үүсгэсэн</TableHead>
                    <TableHead className="text-right">Үйлдэл</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">
                        {r.game_id?.slice(0, 8) ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.player_id?.slice(0, 8) ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-sm">
                        {r.message}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.contact ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString("mn-MN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <ErrorReportActions reportId={r.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tracker Health */}
      <Card>
        <CardHeader>
          <CardTitle>Бүртгэгчийн эрүүл мэнд</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Идэвхитэй бүртгэгч байхгүй байна
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Тоглолт</TableHead>
                    <TableHead>Бүртгэгч</TableHead>
                    <TableHead>Үүрэг</TableHead>
                    <TableHead>Эхэлсэн</TableHead>
                    <TableHead className="text-right">
                      Сүүлийн дугаар
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">
                        {s.game_id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        {(
                          s as typeof s & {
                            profiles: { display_name: string | null } | null;
                          }
                        ).profiles?.display_name ?? s.scorer_id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {s.role === "lead_scorer" ? "Үндсэн" : "Нөөц"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(s.started_at), {
                          addSuffix: true,
                          locale: mn,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {s.last_acknowledged_sequence}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staleness Alarm */}
      {stale.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Хугацаа хэтэрсэн
              <Badge variant="destructive">{stale.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Тоглолт</TableHead>
                    <TableHead>Товлосон</TableHead>
                    <TableHead>Үүсгэсэн</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stale.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-mono text-xs">
                        {g.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(g.scheduled_at).toLocaleString("mn-MN")}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(g.created_at), {
                          addSuffix: true,
                          locale: mn,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle>Аудит лог</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">Бүртгэл байхгүй</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Үйлдэл</TableHead>
                    <TableHead>Объект</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Хэрэглэгч</TableHead>
                    <TableHead>Цаг</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Badge variant="secondary">{row.action}</Badge>
                      </TableCell>
                      <TableCell>{row.entity}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.entity_id?.slice(0, 8) ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.actor_id?.slice(0, 8) ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(row.created_at).toLocaleString("mn-MN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
