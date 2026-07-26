/**
 * Extended API types and client functions for Academy Phase 10b
 * (Enrollments, Attendance, Consent, CSV)
 */
import { request } from "./api";

const BASE = "/admin/api/academy";

// ── Types ─────────────────────────────────────────────────────────────────

export interface EnrollmentRow {
  id: string;
  student_id: string;
  program_id: string;
  status: string;
  enrolled_at: string;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  academy_students?: { canonical_name: string } | null;
  academy_programs?: { name: string } | null;
}

export interface AttendanceRow {
  id: string;
  student_id: string;
  program_id: string;
  session_date: string;
  status: string;
  note: string | null;
  recorded_by: string;
  is_offline: boolean;
  recorded_at: string;
  updated_at: string;
  academy_students?: { canonical_name: string } | null;
}

export interface ConsentTemplateRow {
  id: string;
  academy_id: string;
  title: string;
  body: string;
  scope: string;
  version: number;
  is_active: boolean;
  created_at: string;
}

export interface ConsentRecordRow {
  id: string;
  template_id: string;
  student_id: string;
  guardian_id: string | null;
  signed_text: string;
  signed_at: string;
  expires_at: string | null;
  is_withdrawn: boolean;
  withdrawn_at: string | null;
  ip_address: string | null;
  academy_consent_templates?: { title: string } | null;
  academy_students?: { canonical_name: string } | null;
}

export interface CsvImportResult {
  success_count: number;
  errors: Array<{ row: number; message: string }>;
}

// ── API Clients ─────────────────────────────────────────────────────────────

/** Create enrollment via RPC */
export async function createEnrollment(data: {
  student_id: string;
  program_id: string;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
}): Promise<EnrollmentRow> {
  return request<EnrollmentRow>(`${BASE}/enrollments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Update enrollment via RPC */
export async function updateEnrollment(data: {
  enrollment_id: string;
  status?: string | null;
  notes?: string | null;
}): Promise<EnrollmentRow> {
  return request<EnrollmentRow>(`${BASE}/enrollments`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/** Delete enrollment */
export async function deleteEnrollment(id: string): Promise<void> {
  return request<void>(`${BASE}/enrollments`, {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
}

export const enrollmentsApi = {
  list: () => request<EnrollmentRow[]>(`${BASE}/enrollments`),
};

export const attendanceApi = {
  list: (params?: { program_id?: string; session_date?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.program_id) searchParams.set("program_id", params.program_id);
    if (params?.session_date)
      searchParams.set("session_date", params.session_date);
    const qs = searchParams.toString();
    return request<AttendanceRow[]>(`${BASE}/attendance${qs ? `?${qs}` : ""}`);
  },
  create: (data: {
    student_id: string;
    program_id: string;
    session_date: string;
    status: string;
    note?: string | null;
  }) =>
    request<AttendanceRow>(`${BASE}/attendance`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (data: { id: string; status: string }) =>
    request<AttendanceRow>(`${BASE}/attendance`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export const consentApi = {
  listTemplates: () => request<ConsentTemplateRow[]>(`${BASE}/consent`),
  list: () =>
    request<{ templates: ConsentTemplateRow[]; records: ConsentRecordRow[] }>(
      `${BASE}/consent`,
    ),
  createTemplate: (data: {
    title: string;
    body: string;
    scope: string;
    academy_id: string;
  }) =>
    request<ConsentTemplateRow>(`${BASE}/consent`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTemplate: (data: {
    id: string;
    title?: string;
    body?: string;
    scope?: string;
    is_active?: boolean;
  }) =>
    request<ConsentTemplateRow>(`${BASE}/consent`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteTemplate: (id: string) =>
    request<void>(`${BASE}/consent`, {
      method: "DELETE",
      body: JSON.stringify({ id }),
    }),
};

export const csvApi = {
  exportStudents: async (): Promise<Blob> => {
    const res = await fetch(`${BASE}/students/csv`);
    if (!res.ok) throw new Error("CSV экспорт амжилтгүй боллоо");
    return res.blob();
  },
  importStudents: async (file: File): Promise<CsvImportResult> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE}/students/csv`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "CSV импорт амжилтгүй боллоо");
    }
    return res.json();
  },
};
