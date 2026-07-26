/**
 * Types and API client functions for Phase 10c+10d+11 advanced operations.
 * Payments ledger, waitlists, and announcements.
 */
import { request } from "./api";

// ── Shared types ───────────────────────────────────────────────────────────

export interface PaymentRow {
  id: string;
  student_id: string;
  enrollment_id: string | null;
  amount_mnt: number;
  type: "tuition" | "registration" | "uniform" | "other";
  status: "pending" | "confirmed" | "cancelled" | "refunded";
  method: "cash" | "bank_transfer" | "qpay" | null;
  reference: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  notes: string | null;
  created_at: string;
  /** Joined student name */
  academy_students?: { canonical_name: string } | null;
}

export interface WaitlistRow {
  id: string;
  program_id: string;
  student_id: string;
  position: number;
  status: "waiting" | "promoted" | "expired" | "cancelled";
  note: string | null;
  created_at: string;
  /** Joined student name */
  academy_students?: { canonical_name: string } | null;
  /** Joined program name */
  academy_programs?: { name: string } | null;
}

export interface AnnouncementRow {
  id: string;
  academy_id: string;
  title: string;
  body: string;
  program_id: string | null;
  created_by: string;
  created_at: string;
  /** Joined creator info */
  users?: { email: string } | null;
  /** Joined program name */
  academy_programs?: { name: string } | null;
}

export interface RegistrationIntentRow {
  id: string;
  academy_id: string;
  program_id: string;
  student_name: string;
  date_of_birth: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  notes: string | null;
  status: "pending" | "approved" | "declined" | "cancelled" | "expired";
  reviewed_by: string | null;
  reviewed_at: string | null;
  expires_at: string;
  created_at: string;
  /** Joined program name */
  academy_programs?: { name: string } | null;
}

export interface CreatePaymentPayload {
  student_id: string;
  amount_mnt: number;
  type: PaymentRow["type"];
  method: PaymentRow["method"];
  enrollment_id?: string;
  reference?: string;
  notes?: string;
}

export interface JoinWaitlistPayload {
  student_id: string;
  program_id: string;
}

export interface CreateAnnouncementPayload {
  academy_id: string;
  title: string;
  body: string;
  program_id?: string;
}

// ── API functions ──────────────────────────────────────────────────────────

const BASE = "/admin/api/academy";

export const paymentsApi = {
  list: () => request<PaymentRow[]>(`${BASE}/payments`),
  create: (data: CreatePaymentPayload) =>
    request<PaymentRow>(`${BASE}/payments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  confirm: (paymentId: string) =>
    request<PaymentRow>(`${BASE}/payments`, {
      method: "PUT",
      body: JSON.stringify({ payment_id: paymentId, action: "confirm" }),
    }),
  cancel: (paymentId: string) =>
    request<void>(`${BASE}/payments`, {
      method: "DELETE",
      body: JSON.stringify({ payment_id: paymentId }),
    }),
};

export const waitlistsApi = {
  list: () => request<WaitlistRow[]>(`${BASE}/waitlists`),
  join: (data: JoinWaitlistPayload) =>
    request<WaitlistRow>(`${BASE}/waitlists`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  promote: (waitlistId: string) =>
    request<WaitlistRow>(`${BASE}/waitlists`, {
      method: "PUT",
      body: JSON.stringify({ waitlist_id: waitlistId, action: "promote" }),
    }),
  remove: (waitlistId: string) =>
    request<void>(`${BASE}/waitlists`, {
      method: "DELETE",
      body: JSON.stringify({ waitlist_id: waitlistId }),
    }),
};

export const announcementsApi = {
  list: () => request<AnnouncementRow[]>(`${BASE}/announcements`),
  create: (data: CreateAnnouncementPayload) =>
    request<AnnouncementRow>(`${BASE}/announcements`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    request<void>(`${BASE}/announcements`, {
      method: "DELETE",
      body: JSON.stringify({ id }),
    }),
};

export const registrationsApi = {
  list: () => request<RegistrationIntentRow[]>(`${BASE}/registrations`),
  approve: (intentId: string) =>
    request<{ status: string }>(`${BASE}/registrations`, {
      method: "POST",
      body: JSON.stringify({ intent_id: intentId, action: "approve" }),
    }),
  decline: (intentId: string) =>
    request<{ status: string }>(`${BASE}/registrations`, {
      method: "POST",
      body: JSON.stringify({ intent_id: intentId, action: "decline" }),
    }),
};
