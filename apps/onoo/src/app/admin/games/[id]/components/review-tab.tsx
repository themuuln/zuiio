"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle, ExternalLink, FileText, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  type RevisionRow,
  revisionsApi,
  type SubmissionRow,
  submissionsApi,
} from "@/app/admin/_lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SOURCE_LABELS: Record<string, string> = {
  tracker_journal: "Трекерийн сэтгүүл",
  official_score_sheet: "Албан ёсны дүн",
  manual_box_score: "Гар бичмэл",
  import: "Импорт",
};

function submissionStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Хүлээгдэж байна";
    case "approved":
      return "Зөвшөөрсөн";
    case "rejected":
      return "Татгалзсан";
    case "superseded":
      return "Шинэчлэгдсэн";
    default:
      return status;
  }
}

function submissionStatusVariant(status: string) {
  switch (status) {
    case "pending":
      return "outline" as const;
    case "approved":
      return "default" as const;
    case "rejected":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function revisionStatusLabel(state: string) {
  switch (state) {
    case "pending":
      return "Хүлээгдэж байна";
    case "approved":
      return "Баталгаажсан";
    case "rejected":
      return "Татгалзсан";
    case "superseded":
      return "Хүчингүй болсон";
    default:
      return state;
  }
}

function revisionStatusVariant(state: string) {
  switch (state) {
    case "pending":
      return "outline" as const;
    case "approved":
      return "default" as const;
    case "rejected":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

interface ReviewTabProps {
  gameId: string;
}

export function ReviewTab({ gameId }: ReviewTabProps) {
  const queryClient = useQueryClient();

  const { data: submissions = [], isPending: subsPending } = useQuery({
    queryKey: ["admin", "game", gameId, "submissions"],
    queryFn: () => submissionsApi.list(gameId),
  });

  const { data: revisions = [], isPending: revsPending } = useQuery({
    queryKey: ["admin", "game", gameId, "revisions"],
    queryFn: () => revisionsApi.list(gameId),
  });

  const approveSubmission = useMutation({
    mutationFn: (id: string) => submissionsApi.approve(id),
    onSuccess: () => {
      toast.success("Илгээлтийг зөвшөөрлөө");
      queryClient.invalidateQueries({
        queryKey: ["admin", "game", gameId, "submissions"],
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Алдаа гарлаа");
    },
  });

  const rejectSubmission = useMutation({
    mutationFn: (id: string) => submissionsApi.reject(id),
    onSuccess: () => {
      toast.success("Илгээлтийг татгалзлаа");
      queryClient.invalidateQueries({
        queryKey: ["admin", "game", gameId, "submissions"],
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Алдаа гарлаа");
    },
  });

  const approveRevision = useMutation({
    mutationFn: (id: string) => revisionsApi.approve(id),
    onSuccess: () => {
      toast.success("Нэмэлтийг баталгаажууллаа");
      queryClient.invalidateQueries({
        queryKey: ["admin", "game", gameId, "revisions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "game", gameId],
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Алдаа гарлаа");
    },
  });

  const rejectRevision = useMutation({
    mutationFn: (id: string) => revisionsApi.reject(id),
    onSuccess: () => {
      toast.success("Нэмэлтийг татгалзлаа");
      queryClient.invalidateQueries({
        queryKey: ["admin", "game", gameId, "revisions"],
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Алдаа гарлаа");
    },
  });

  const rebuildProjection = useMutation({
    mutationFn: () => revisionsApi.rebuildProjection(gameId),
    onSuccess: () => {
      toast.success("Төсөөллийг дахин бүтээлээ");
      queryClient.invalidateQueries({
        queryKey: ["admin", "game", gameId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "game", gameId, "revisions"],
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Алдаа гарлаа");
    },
  });

  function handleApproveSubmission(sub: SubmissionRow) {
    if (!window.confirm("Илгээлтийг зөвшөөрөх үү? Энэ нь бүхнийг зөвшөөрнө."))
      return;
    approveSubmission.mutate(sub.id);
  }

  function handleRejectSubmission(sub: SubmissionRow) {
    if (!window.confirm("Илгээлтийг татгалзах уу?")) return;
    rejectSubmission.mutate(sub.id);
  }

  function handleApproveRevision(rev: RevisionRow) {
    if (!window.confirm("Нэмэлтийг баталгаажуулах уу? Энэ нь оноог шинэчилнэ."))
      return;
    approveRevision.mutate(rev.id);
  }

  function handleRejectRevision(rev: RevisionRow) {
    if (!window.confirm("Нэмэлтийг татгалзах уу?")) return;
    rejectRevision.mutate(rev.id);
  }

  const pendingSubs = submissions.filter((s) => s.status === "pending");
  const processedSubs = submissions.filter((s) => s.status !== "pending");
  const pendingRevs = revisions.filter((r) => r.state === "pending");
  const processedRevs = revisions.filter((r) => r.state !== "pending");

  return (
    <div className="space-y-6">
      {/* ── Submissions ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Илгээлүүд
            {pendingSubs.length > 0 && (
              <Badge variant="destructive">{pendingSubs.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subsPending ? (
            <p className="text-sm text-muted-foreground">Ачаалж байна...</p>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Илгээлтийн жагсаалт хоосон байна
            </p>
          ) : (
            <div className="space-y-4">
              {pendingSubs.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Төрөл</TableHead>
                      <TableHead>Илгээсэн</TableHead>
                      <TableHead>Нотолгоо</TableHead>
                      <TableHead>Төлөв</TableHead>
                      <TableHead className="text-right">Үйлдэл</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingSubs.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          {SOURCE_LABELS[sub.source_type] ?? sub.source_type}
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(sub.submitted_at),
                            "yyyy-MM-dd HH:mm",
                          )}
                        </TableCell>
                        <TableCell>
                          {sub.evidence_url ? (
                            <a
                              href={
                                sub.source_type === "official_score_sheet"
                                  ? `/admin/api/submissions/${sub.id}/evidence`
                                  : sub.evidence_url
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                              aria-label={`Нотолгоо үзэх: ${sub.source_type}`}
                            >
                              Үзэх
                              <ExternalLink className="size-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={submissionStatusVariant(sub.status)}>
                            {submissionStatusLabel(sub.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              disabled={approveSubmission.isPending}
                              onClick={() => handleApproveSubmission(sub)}
                              aria-label={`Зөвшөөрөх: ${sub.source_type}`}
                            >
                              <CheckCircle className="mr-1 size-3" />
                              Зөвшөөрөх
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={rejectSubmission.isPending}
                              onClick={() => handleRejectSubmission(sub)}
                              aria-label={`Татгалзах: ${sub.source_type}`}
                            >
                              <XCircle className="mr-1 size-3" />
                              Татгалзах
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {processedSubs.length > 0 && (
                <details>
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Шийдвэрлэгдсэн ({processedSubs.length})
                  </summary>
                  <Table className="mt-2">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Төрөл</TableHead>
                        <TableHead>Илгээсэн</TableHead>
                        <TableHead>Төлөв</TableHead>
                        <TableHead>Шийдвэр</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedSubs.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            {SOURCE_LABELS[sub.source_type] ?? sub.source_type}
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(sub.submitted_at),
                              "yyyy-MM-dd HH:mm",
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={submissionStatusVariant(sub.status)}
                            >
                              {submissionStatusLabel(sub.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {sub.reviewed_at
                              ? format(
                                  new Date(sub.reviewed_at),
                                  "yyyy-MM-dd HH:mm",
                                )
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Revisions ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Нэмэлтүүд
            {pendingRevs.length > 0 && (
              <Badge variant="destructive">{pendingRevs.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revsPending ? (
            <p className="text-sm text-muted-foreground">Ачаалж байна...</p>
          ) : revisions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Нэмэлтийн жагсаалт хоосон байна
            </p>
          ) : (
            <div className="space-y-4">
              {pendingRevs.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дугаар</TableHead>
                      <TableHead>Үүсгэсэн</TableHead>
                      <TableHead>Төлөв</TableHead>
                      <TableHead className="text-right">Үйлдэл</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRevs.map((rev) => (
                      <TableRow key={rev.id}>
                        <TableCell>#{rev.revision_number}</TableCell>
                        <TableCell>
                          {format(new Date(rev.created_at), "yyyy-MM-dd HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={revisionStatusVariant(rev.state)}>
                            {revisionStatusLabel(rev.state)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              disabled={approveRevision.isPending}
                              onClick={() => handleApproveRevision(rev)}
                              aria-label={`Баталгаажуулах: нэмэлт #${rev.revision_number}`}
                            >
                              <CheckCircle className="mr-1 size-3" />
                              Баталгаажуулах
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={rejectRevision.isPending}
                              onClick={() => handleRejectRevision(rev)}
                              aria-label={`Татгалзах: нэмэлт #${rev.revision_number}`}
                            >
                              <XCircle className="mr-1 size-3" />
                              Татгалзах
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {processedRevs.length > 0 && (
                <details>
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Шийдвэрлэгдсэн ({processedRevs.length})
                  </summary>
                  <Table className="mt-2">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дугаар</TableHead>
                        <TableHead>Төлөв</TableHead>
                        <TableHead>Шийдвэр</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedRevs.map((rev) => (
                        <TableRow key={rev.id}>
                          <TableCell>#{rev.revision_number}</TableCell>
                          <TableCell>
                            <Badge variant={revisionStatusVariant(rev.state)}>
                              {revisionStatusLabel(rev.state)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {rev.approved_at
                              ? format(
                                  new Date(rev.approved_at),
                                  "yyyy-MM-dd HH:mm",
                                )
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </details>
              )}
            </div>
          )}

          <div className="flex justify-end border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={rebuildProjection.isPending}
              onClick={() => {
                if (
                  !window.confirm(
                    "Баталгаажсан нэмэлтээс төсөөллийг дахин бүтээх үү?",
                  )
                )
                  return;
                rebuildProjection.mutate();
              }}
              aria-label="Төсөөллийг дахин бүтээх"
            >
              <span className="mr-1">⟳</span>
              Төсөөллийг дахин бүтээх
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
