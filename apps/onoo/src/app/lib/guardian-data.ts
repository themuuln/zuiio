/**
 * Data layer for guardian-facing pages.
 *
 * All queries are server-side only via createClient(). Guarded by
 * SECURITY DEFINER cmd_* functions and RLS on academy tables.
 * Returns empty arrays / null on no data (never throws).
 */

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Summary row from cmd_list_my_children RPC. */
export interface ChildSummary {
  student_id: string;
  student_name: string;
  student_name_latin: string | null;
  date_of_birth: string | null;
  photo_url: string | null;
  school_name: string | null;
  grade_level: string | null;
  enrollment_id: string | null;
  program_id: string | null;
  program_name: string | null;
  enrollment_status: string | null;
  link_id: string;
  authority_status: string;
}

/** Full detail for a single child — non-medical fields only. */
export interface ChildDetail {
  student: {
    id: string;
    academy_id: string;
    canonical_name: string;
    name_latin: string | null;
    date_of_birth: string | null;
    photo_url: string | null;
    school_name: string | null;
    grade_level: string | null;
    status: string;
    created_at: string;
  };
  enrollments: Array<{
    id: string;
    program_id: string;
    program_name: string | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
    enrolled_at: string;
    notes: string | null;
  }>;
  attendance_summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  payment_summary: {
    total_paid: number;
    total_due: number;
    balance: number;
    last_payment_date: string | null;
    last_payment_amount: number | null;
  };
}

/** A single academy announcement visible to this guardian. */
export interface AcademyAnnouncement {
  id: string;
  academy_id: string;
  title: string;
  body: string;
  program_id: string | null;
  created_at: string;
  created_by: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List the current guardian's verified children with active enrollments.
 * Returns an empty array when the user is not authenticated or has no children.
 */
export const getMyChildren = cache(async (): Promise<ChildSummary[]> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("cmd_list_my_children");
  return (data as ChildSummary[]) ?? [];
});

/**
 * Full detail for a single child — student info, enrollments, attendance
 * summary, and payment summary. Returns null when the student is not found
 * or the current user is not a verified guardian of this student.
 */
export const getChildDetail = cache(
  async (studentId: string): Promise<ChildDetail | null> => {
    const supabase = await createClient();

    // ── Student info (non-medical fields only) ──────────────────────────
    const { data: student } = await supabase
      .from("academy_students")
      .select(
        "id, academy_id, canonical_name, name_latin, date_of_birth, photo_url, school_name, grade_level, status, created_at",
      )
      .eq("id", studentId)
      .maybeSingle();

    if (!student) return null;

    // ── Enrollments with program name ───────────────────────────────────
    const { data: enrollments } = await supabase
      .from("academy_enrollments")
      .select(
        "id, program_id, program:program_id(name), status, start_date, end_date, enrolled_at, notes",
      )
      .eq("student_id", studentId)
      .order("enrolled_at", { ascending: false });

    // ── Attendance summary ──────────────────────────────────────────────
    const { data: attendanceRows } = await supabase
      .from("academy_attendance")
      .select("status")
      .eq("student_id", studentId);

    const attendanceSummary = summarizeAttendance(
      (attendanceRows as { status: string }[]) ?? [],
    );

    // ── Payment summary ─────────────────────────────────────────────────
    const { data: paymentRows } = await supabase
      .from("academy_payment_ledger")
      .select("amount_mnt, status, confirmed_at")
      .eq("student_id", studentId)
      .order("confirmed_at", { ascending: false });

    const paymentSummary = summarizePayments(
      (paymentRows as {
        amount_mnt: number;
        status: string;
        confirmed_at: string | null;
      }[]) ?? [],
    );

    return {
      student: {
        id: student.id,
        academy_id: student.academy_id,
        canonical_name: student.canonical_name,
        name_latin: student.name_latin,
        date_of_birth: student.date_of_birth,
        photo_url: student.photo_url,
        school_name: student.school_name,
        grade_level: student.grade_level,
        status: student.status,
        created_at: student.created_at,
      },
      enrollments:
        (
          enrollments as unknown as Array<{
            id: string;
            program_id: string;
            program: { name: string }[] | null;
            status: string;
            start_date: string | null;
            end_date: string | null;
            enrolled_at: string;
            notes: string | null;
          }>
        )?.map((e) => ({
          id: e.id,
          program_id: e.program_id,
          program_name: e.program?.[0]?.name ?? null,
          status: e.status,
          start_date: e.start_date,
          end_date: e.end_date,
          enrolled_at: e.enrolled_at,
          notes: e.notes,
        })) ?? [],
      attendance_summary: attendanceSummary,
      payment_summary: paymentSummary,
    };
  },
);

/**
 * Fetch announcements for the guardian's children's academy(ies).
 * Returns an empty array when the guardian has no children or no
 * announcements exist.
 */
export const getAnnouncements = cache(
  async (): Promise<AcademyAnnouncement[]> => {
    const supabase = await createClient();

    // Get children to discover academy IDs
    const { data: children } = await supabase.rpc("cmd_list_my_children");
    if (!children || children.length === 0) return [];

    // Collect unique academy_ids from the children's student records
    const studentIds = (children as ChildSummary[]).map((c) => c.student_id);
    const { data: students } = await supabase
      .from("academy_students")
      .select("academy_id")
      .in("id", studentIds);

    if (!students || students.length === 0) return [];

    const academyIds = [
      ...new Set(
        (students as { academy_id: string }[]).map((s) => s.academy_id),
      ),
    ];

    const { data: announcements } = await supabase
      .from("academy_announcements")
      .select("*")
      .in("academy_id", academyIds)
      .order("created_at", { ascending: false });

    return (announcements as AcademyAnnouncement[]) ?? [];
  },
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function summarizeAttendance(
  rows: { status: string }[],
): ChildDetail["attendance_summary"] {
  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;

  for (const row of rows) {
    switch (row.status) {
      case "present":
        present++;
        break;
      case "absent":
        absent++;
        break;
      case "late":
        late++;
        break;
      case "excused":
        excused++;
        break;
    }
  }

  return {
    total: rows.length,
    present,
    absent,
    late,
    excused,
  };
}

function summarizePayments(
  rows: {
    amount_mnt: number;
    status: string;
    confirmed_at: string | null;
  }[],
): ChildDetail["payment_summary"] {
  let totalPaid = 0;
  let totalDue = 0;
  let lastPaymentDate: string | null = null;
  let lastPaymentAmount: number | null = null;

  for (const row of rows) {
    if (row.status === "confirmed" || row.status === "paid") {
      totalPaid += row.amount_mnt;
      if (
        row.confirmed_at &&
        (!lastPaymentDate || row.confirmed_at > lastPaymentDate)
      ) {
        lastPaymentDate = row.confirmed_at;
        lastPaymentAmount = row.amount_mnt;
      }
    } else if (row.status === "due" || row.status === "pending") {
      totalDue += row.amount_mnt;
    }
  }

  return {
    total_paid: totalPaid,
    total_due: totalDue,
    balance: totalDue - totalPaid,
    last_payment_date: lastPaymentDate,
    last_payment_amount: lastPaymentAmount,
  };
}

export interface ConsentInfo {
  /** Consent templates the guardian has signed for this child. */
  signed: Array<{
    id: string;
    template_id: string;
    template_title: string;
    signed_at: string;
    is_withdrawn: boolean;
  }>;
  /** Consent templates the academy requires but are not yet signed. */
  pending: Array<{
    id: string;
    title: string;
    scope: string;
    body: string;
  }>;
}

/**
 * Fetch consent templates and signed records for a child.
 * Returns null when the student is not accessible to the current user.
 */
export const getChildConsent = cache(
  async (studentId: string): Promise<ConsentInfo | null> => {
    const supabase = await createClient();

    // Verify guardian has access to this student
    const { data: student } = await supabase
      .from("academy_students")
      .select("id, academy_id")
      .eq("id", studentId)
      .maybeSingle();

    if (!student) return null;

    // Fetch all templates for the child's academy
    const { data: templates } = await supabase
      .from("academy_consent_templates")
      .select("id, title, body, scope")
      .eq("academy_id", student.academy_id)
      .eq("is_active", true);

    // Fetch signed records for this child
    const { data: records } = await supabase
      .from("academy_consent_records")
      .select(
        "id, template_id, signed_at, is_withdrawn, template:template_id(title)",
      )
      .eq("student_id", studentId)
      .order("signed_at", { ascending: false });

    const signedRecords =
      (records as unknown as Array<{
        id: string;
        template_id: string;
        signed_at: string;
        is_withdrawn: boolean | null;
        template: { title: string }[] | null;
      }>) ?? [];
    const signedMap = new Set(signedRecords.map((r) => r.template_id));

    const activeTemplates =
      (templates as Array<{
        id: string;
        title: string;
        body: string;
        scope: string;
      }>) ?? [];
    return {
      signed: signedRecords.map((r) => ({
        id: r.id,
        template_id: r.template_id,
        template_title: r.template?.[0]?.title ?? "—",
        signed_at: r.signed_at,
        is_withdrawn: r.is_withdrawn ?? false,
      })),
      pending: activeTemplates
        .filter((t) => !signedMap.has(t.id))
        .map((t) => ({
          id: t.id,
          title: t.title,
          scope: t.scope,
          body: t.body,
        })),
    };
  },
);

// ---------------------------------------------------------------------------
// Batch helpers for dashboard pages
// ---------------------------------------------------------------------------

/** Attendance counts per student_id — used by the guardian dashboard. */
export async function getChildrenAttendance(
  studentIds: string[],
): Promise<Record<string, { present: number; total: number }>> {
  if (studentIds.length === 0) return {};

  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("academy_attendance")
    .select("student_id, status")
    .in("student_id", studentIds);

  const result: Record<string, { present: number; total: number }> = {};
  for (const id of studentIds) {
    result[id] = { present: 0, total: 0 };
  }

  for (const row of (rows as { student_id: string; status: string }[]) ?? []) {
    const entry = result[row.student_id];
    if (entry) {
      entry.total++;
      if (row.status === "present") entry.present++;
    }
  }

  return result;
}
