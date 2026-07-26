import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  GraduationCap,
  School,
  User,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getChildConsent, getChildDetail } from "@/app/lib/guardian-data";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui";
import ConsentSection from "./consent-section";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  params: Promise<{ id: string }>;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const child = await getChildDetail(id);
  if (!child) return { title: "Хүүхэд олдсонгүй — Оноо" };
  return {
    title: `${child.student.canonical_name} — Асран хамгаалагч — Оноо`,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function enrollmentStatusVariant(
  status: string,
): "verified" | "secondary" | "destructive" | "provisional" {
  switch (status) {
    case "active":
      return "verified";
    case "completed":
      return "secondary";
    case "withdrawn":
      return "destructive";
    default:
      return "provisional";
  }
}

function enrollmentStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Идэвхтэй";
    case "completed":
      return "Дууссан";
    case "withdrawn":
      return "Гарсан";
    case "pending":
      return "Хүлээгдэж буй";
    default:
      return status;
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ChildDetailPage({ params }: Props) {
  const { id } = await params;
  const child = await getChildDetail(id);
  if (!child) notFound();

  const consent = await getChildConsent(id);

  const {
    student,
    enrollments,
    attendance_summary: att,
    payment_summary: pay,
  } = child;

  const activeEnrollment =
    enrollments.find((e) => e.status === "active") ?? null;
  const otherEnrollments = enrollments.filter((e) => e.status !== "active");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-6">
      {/* ── Back link ───────────────────────────────────────────────── */}
      <Link
        href="/guardian"
        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Буцах
      </Link>

      {/* ═══════════════════════════════════════════════════════════════
          PROFILE HEADER
      ═══════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        {/* Photo */}
        <div className="relative size-24 shrink-0 overflow-hidden rounded-full bg-muted sm:size-28">
          {student.photo_url ? (
            <Image
              src={student.photo_url}
              alt={student.canonical_name}
              fill
              className="object-cover"
              sizes="112px"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <User className="size-10" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-bold">{student.canonical_name}</h1>
          {student.name_latin && (
            <p className="text-sm text-muted-foreground">
              {student.name_latin}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground sm:justify-start">
            {student.date_of_birth && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5" />
                {formatDate(student.date_of_birth)}
              </span>
            )}
            {student.school_name && (
              <span className="inline-flex items-center gap-1">
                <School className="size-3.5" />
                {student.school_name}
              </span>
            )}
            {student.grade_level && (
              <Badge variant="secondary">{student.grade_level}</Badge>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CURRENT ENROLLMENT
      ═══════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="size-5" />
            Одоогийн элсэлт
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeEnrollment ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">
                    {activeEnrollment.program_name ?? "—"}
                  </span>
                  <EnrollmentStatusBadge status={activeEnrollment.status} />
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {formatDate(activeEnrollment.start_date)}
                </span>
                {activeEnrollment.end_date && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {formatDate(activeEnrollment.end_date)}
                  </span>
                )}
              </div>
              {activeEnrollment.notes && (
                <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {activeEnrollment.notes}
                </p>
              )}
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="default">
                  <GraduationCap className="size-8" />
                </EmptyMedia>
                <EmptyTitle>Идэвхтэй элсэлт байхгүй</EmptyTitle>
                <EmptyDescription>
                  {enrollments.length > 0
                    ? "Өмнөх элсэлтүүд дууссан байна."
                    : "Энэ хүүхэд одоогоор ямар ч хөтөлбөрт элсээгүй байна."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          ENROLLMENT HISTORY (if any non-active exist)
      ═══════════════════════════════════════════════════════════════ */}
      {otherEnrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5" />
              Элсэлтийн түүх
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {otherEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex flex-col gap-1 rounded-lg border p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="text-sm font-medium">
                      {enrollment.program_name ?? "—"}
                    </span>
                    <EnrollmentStatusBadge status={enrollment.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatDate(enrollment.start_date)}
                    </span>
                    {enrollment.end_date && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDate(enrollment.end_date)}
                      </span>
                    )}
                  </div>
                  {enrollment.notes && (
                    <p className="text-xs text-muted-foreground">
                      {enrollment.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          ATTENDANCE SUMMARY
      ═══════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Ирцийн хураангуй
          </CardTitle>
        </CardHeader>
        <CardContent>
          {att.total > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatItem label="Нийт" value={att.total} variant="default" />
              <StatItem label="Ирсэн" value={att.present} variant="verified" />
              <StatItem
                label="Хоцорсон"
                value={att.late}
                variant="provisional"
              />
              <StatItem
                label="Тайлбартай"
                value={att.excused}
                variant="secondary"
              />
              <StatItem
                label="Тасалсан"
                value={att.absent}
                variant="destructive"
              />
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="default">
                  <Clock className="size-8" />
                </EmptyMedia>
                <EmptyTitle>Ирцийн мэдээлэл байхгүй</EmptyTitle>
                <EmptyDescription>
                  Энэ хүүхдийн ирцийн бүртгэл хараахан үүсээгүй байна.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          CONSENT STATUS
      ═══════════════════════════════════════════════════════════════ */}
      <ConsentSection consent={consent} studentId={id} />

      {/* ═══════════════════════════════════════════════════════════════
          PAYMENT HISTORY
      ═══════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5" />
            Төлбөрийн мэдээлэл
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pay.total_paid > 0 || pay.total_due > 0 ? (
            <div className="flex flex-col gap-4">
              {/* Summary badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="verified">
                  Төлсөн: {pay.total_paid.toLocaleString()}₮
                </Badge>
                {pay.total_due > 0 && (
                  <Badge variant="provisional">
                    Төлөх: {pay.total_due.toLocaleString()}₮
                  </Badge>
                )}
                {pay.balance > 0 && (
                  <Badge variant="destructive">
                    Үлдэгдэл: {pay.balance.toLocaleString()}₮
                  </Badge>
                )}
              </div>

              {/* Last payment */}
              {pay.last_payment_date && (
                <div className="flex flex-col gap-1 rounded-lg bg-muted px-3 py-2">
                  <span className="text-xs text-muted-foreground">
                    Сүүлийн төлбөр
                  </span>
                  <span className="text-sm font-medium">
                    {pay.last_payment_amount?.toLocaleString()}₮ —{" "}
                    {formatDate(pay.last_payment_date)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="default">
                  <CreditCard className="size-8" />
                </EmptyMedia>
                <EmptyTitle>Төлбөрийн мэдээлэл байхгүй</EmptyTitle>
                <EmptyDescription>
                  Энэ хүүхдийн төлбөрийн бүртгэл хараахан үүсээгүй байна.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EnrollmentStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={enrollmentStatusVariant(status)}>
      {enrollmentStatusLabel(status)}
    </Badge>
  );
}

function StatItem({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: "default" | "verified" | "destructive" | "provisional" | "secondary";
}) {
  const colorClass =
    variant === "verified"
      ? "text-emerald-600 dark:text-emerald-400"
      : variant === "destructive"
        ? "text-red-600 dark:text-red-400"
        : variant === "provisional"
          ? "text-amber-600 dark:text-amber-400"
          : variant === "secondary"
            ? "text-muted-foreground"
            : "text-foreground";

  return (
    <div className="flex flex-col rounded-lg border p-3">
      <span className={`text-lg font-bold ${colorClass}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
