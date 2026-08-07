/**
 * Client-safe data utilities for academy pages.
 *
 * These functions use only `fetch` — no server-only imports.
 * Extracted from data.ts to avoid pulling next/headers into client bundles.
 */

export interface PublicAcademyEnrollResult {
  enrollment_id: string;
  student_id: string;
  guardian_id: string | null;
  program_name: string;
}

/**
 * Submit a public enrollment request.
 * Calls cmd_public_enroll via anon API route — uses service_role server-side.
 */
export async function submitPublicEnrollment(params: {
  academyId?: string;
  programId: string;
  studentName: string;
  dateOfBirth?: string;
  guardianName?: string;
  guardianPhone?: string;
  notes?: string;
}): Promise<PublicAcademyEnrollResult> {
  const res = await fetch("/api/academy/enroll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Холболтын алдаа" }));
    throw new Error(err.error ?? "Бүртгэл амжилтгүй боллоо");
  }

  return res.json();
}

export interface SubmitRegistrationResult {
  intent_id: string;
  status: string;
  message: string;
}

/**
 * Submit a registration intent (Phase 11 — registration intent flow).
 * Calls cmd_submit_registration via enroll-v2 API route.
 */
export async function submitRegistration(params: {
  programId: string;
  studentName: string;
  dateOfBirth?: string;
  guardianName?: string;
  guardianPhone?: string;
  notes?: string;
}): Promise<SubmitRegistrationResult> {
  const res = await fetch("/api/academy/enroll-v2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Холболтын алдаа" }));
    throw new Error(err.error ?? "Бүртгэл амжилтгүй боллоо");
  }

  return res.json();
}
