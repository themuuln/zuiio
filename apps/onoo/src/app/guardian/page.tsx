import {
  ArrowRight,
  CalendarDays,
  GraduationCap,
  Megaphone,
  User,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import type { AcademyAnnouncement, ChildSummary } from "../lib/guardian-data";
import {
  getAnnouncements,
  getChildrenAttendance,
  getMyChildren,
} from "../lib/guardian-data";
import { formatDate } from "../lib/shared";

export const metadata: Metadata = {
  title: "Хяналтын самбар — Оноо",
  description: "Хүүхдүүдийн сурлага, ирц, хөтөлбөрийн мэдээлэл.",
};

/* ──────────────────────────────────────────────────────────────────────────────
 * Child card
 * ──────────────────────────────────────────────────────────────────────────── */
function ChildCard({
  child,
  present,
  total,
}: {
  child: ChildSummary;
  present: number;
  total: number;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {/* Photo placeholder */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground">
            {child.photo_url ? (
              // biome-ignore lint/performance/noImgElement: user-uploaded dynamic URL
              <img
                src={child.photo_url}
                alt={child.student_name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate text-lg">
              {child.student_name}
            </CardTitle>
            {child.student_name_latin && (
              <p className="truncate text-sm text-muted-foreground">
                {child.student_name_latin}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Date of birth */}
        {child.date_of_birth && (
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              Төрсөн огноо
            </span>
            <span>{formatDate(child.date_of_birth)}</span>
          </div>
        )}

        {/* Active enrollment / program */}
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5" />
            Хөтөлбөр
          </span>
          {child.program_name ? (
            <Badge
              variant={
                child.enrollment_status === "active" ? "default" : "secondary"
              }
            >
              {child.program_name}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>

        {/* Attendance summary */}
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Ирц
          </span>
          <span className="font-medium tabular-nums">
            {present} / {total}
          </span>
        </div>

        {/* Link to detail */}
        <Link
          href={`/guardian/children/${child.student_id}`}
          className="block pt-1"
        >
          <Button variant="outline" className="w-full">
            Дэлгэрэнгүй
            <ArrowRight />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Unauthenticated state
 * ──────────────────────────────────────────────────────────────────────────── */
function UnauthenticatedState() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-6 px-4 text-center">
      <Empty>
        <EmptyContent>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <User className="h-7 w-7 text-muted-foreground" />
          </div>
          <EmptyTitle>Нэвтрэх шаардлагатай</EmptyTitle>
          <EmptyDescription>
            Хүүхдүүдийн мэдээллийг үзэхийн тулд эцэг/эх эрхээрээ нэвтэрнэ үү.
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    </main>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
 * No children state (authenticated but not linked)
 * ──────────────────────────────────────────────────────────────────────────── */
function NoChildrenState() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-6 px-4 text-center">
      <Empty>
        <EmptyContent>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Users className="h-7 w-7 text-muted-foreground" />
          </div>
          <EmptyTitle>Та эцэг/эх хэрэглэгчтэй холбогдоогүй байна</EmptyTitle>
          <EmptyDescription>
            Энэ хуудсыг ашиглахын тулд таны бүртгэлийг хүүхдийн эцэг/эхтэй
            холбох шаардлагатай. Дэлгэрэнгүй мэдээллийг академийн админтай
            холбогдоно уу.
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    </main>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Announcements section
 * ──────────────────────────────────────────────────────────────────────────── */
function AnnouncementsSection({
  announcements,
}: {
  announcements: AcademyAnnouncement[];
}) {
  if (announcements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="h-5 w-5" />
            Зар мэдээ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyContent>
              <EmptyTitle>Зар мэдээ байхгүй</EmptyTitle>
              <EmptyDescription>
                Одоогоор таны хүүхдийн академид зарласан мэдээ байхгүй байна.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Megaphone className="h-5 w-5" />
          Зар мэдээ
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {announcements.slice(0, 5).map((a) => (
          <article key={a.id} className="py-3 first:pt-0 last:pb-0">
            <div className="mb-1 flex items-start justify-between gap-2">
              <h3 className="font-semibold leading-tight">{a.title}</h3>
              <time className="shrink-0 text-xs text-muted-foreground">
                {formatDate(a.created_at)}
              </time>
            </div>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {a.body}
            </p>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Page
 * ──────────────────────────────────────────────────────────────────────────── */
export default async function GuardianPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return <UnauthenticatedState />;
  }

  const children = await getMyChildren();

  if (children.length === 0) {
    return <NoChildrenState />;
  }

  // Batch fetch attendance for all children
  const studentIds = children.map((c) => c.student_id);
  const attendanceMap = await getChildrenAttendance(studentIds);

  // Fetch announcements for the guardian's academies
  const announcements = await getAnnouncements();

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Хяналтын самбар</h1>
        <p className="mt-1 text-muted-foreground">
          Нийт {children.length} хүүхэд
        </p>
      </div>

      {/* Children grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {children.map((child) => {
          const att = attendanceMap[child.student_id] ?? {
            present: 0,
            total: 0,
          };
          return (
            <ChildCard
              key={child.student_id}
              child={child}
              present={att.present}
              total={att.total}
            />
          );
        })}
      </div>

      {/* Announcements */}
      <section className="mt-8">
        <AnnouncementsSection announcements={announcements} />
      </section>
    </main>
  );
}
