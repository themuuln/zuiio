-- ============================================================================
-- Mega migration: All remaining Horizon B phases (9, 10b, 10c, 10d, 11)
-- Phase 9: Team operations (staff, roster intent, training, dues, opponent prep)
-- Phase 10b: Enrollment, attendance, consent, CSV
-- Phase 10c: Offline attendance, reports, payment ledger, waitlists
-- Phase 10d: Guardian OTP, verified QPay, multi-location, extended reporting
-- Phase 11: Guardian self-service (multi-child, invoices, consent, announcements)
-- ============================================================================

-- ── Phase 9: Team Operations ──────────────────────────────────────────────

-- Team staff roles (T-9.1)
CREATE TABLE IF NOT EXISTS public.team_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_season_id uuid NOT NULL REFERENCES public.team_seasons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('head_coach', 'assistant_coach', 'manager', 'physio', 'finance', 'media')),
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_season_id, user_id, role)
);

ALTER TABLE public.team_staff ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS team_staff_team_idx ON public.team_staff (team_season_id);
CREATE POLICY read_team_staff ON public.team_staff FOR SELECT TO authenticated USING (true);
CREATE POLICY write_team_staff ON public.team_staff FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.memberships m
    JOIN public.team_seasons ts ON ts.id = team_season_id
    JOIN public.competitions c ON c.id = ts.competition_id
    JOIN public.seasons s ON s.id = c.season_id
    JOIN public.leagues l ON l.id = s.league_id
    WHERE m.scope_type = 'org' AND m.scope_id = l.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.role IN ('owner', 'admin', 'coordinator'))
);
CREATE POLICY update_team_staff ON public.team_staff FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.memberships m
    JOIN public.team_seasons ts ON ts.id = team_season_id
    JOIN public.competitions c ON c.id = ts.competition_id
    JOIN public.seasons s ON s.id = c.season_id
    JOIN public.leagues l ON l.id = s.league_id
    WHERE m.scope_type = 'org' AND m.scope_id = l.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.role IN ('owner', 'admin', 'coordinator'))
);
CREATE POLICY delete_team_staff ON public.team_staff FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.memberships m
    JOIN public.team_seasons ts ON ts.id = team_season_id
    JOIN public.competitions c ON c.id = ts.competition_id
    JOIN public.seasons s ON s.id = c.season_id
    JOIN public.leagues l ON l.id = s.league_id
    WHERE m.scope_type = 'org' AND m.scope_id = l.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.role IN ('owner', 'admin', 'coordinator'))
);

-- Roster intent & availability (T-9.2)
CREATE TABLE IF NOT EXISTS public.roster_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_season_id uuid NOT NULL REFERENCES public.team_seasons(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  game_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('available', 'unavailable', 'maybe', 'injured')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_season_id, player_id, game_date)
);

ALTER TABLE public.roster_availability ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS roster_availability_team_idx ON public.roster_availability (team_season_id);
CREATE INDEX IF NOT EXISTS roster_availability_game_idx ON public.roster_availability (team_season_id, game_date);
CREATE POLICY read_roster_availability ON public.roster_availability FOR SELECT TO authenticated USING (true);
CREATE POLICY write_roster_availability ON public.roster_availability FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.memberships m
    JOIN public.team_seasons ts ON ts.id = team_season_id
    JOIN public.competitions c ON c.id = ts.competition_id
    JOIN public.seasons s ON s.id = c.season_id
    JOIN public.leagues l ON l.id = s.league_id
    WHERE m.scope_type = 'org' AND m.scope_id = l.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.role IN ('owner', 'admin', 'coordinator', 'manager'))
);
CREATE POLICY update_roster_availability ON public.roster_availability FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.memberships m
    JOIN public.team_seasons ts ON ts.id = team_season_id
    JOIN public.competitions c ON c.id = ts.competition_id
    JOIN public.seasons s ON s.id = c.season_id
    JOIN public.leagues l ON l.id = s.league_id
    WHERE m.scope_type = 'org' AND m.scope_id = l.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.role IN ('owner', 'admin', 'coordinator', 'manager'))
);
CREATE POLICY delete_roster_availability ON public.roster_availability FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.memberships m
    JOIN public.team_seasons ts ON ts.id = team_season_id
    JOIN public.competitions c ON c.id = ts.competition_id
    JOIN public.seasons s ON s.id = c.season_id
    JOIN public.leagues l ON l.id = s.league_id
    WHERE m.scope_type = 'org' AND m.scope_id = l.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.role IN ('owner', 'admin', 'coordinator', 'manager'))
);

-- Training schedule (T-9.3)
CREATE TABLE IF NOT EXISTS public.training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_season_id uuid NOT NULL REFERENCES public.team_seasons(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  location text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes smallint DEFAULT 90,
  is_cancelled boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS training_sessions_team_idx ON public.training_sessions (team_season_id);
CREATE POLICY read_training_sessions ON public.training_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY write_training_sessions ON public.training_sessions FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.memberships m
    JOIN public.team_seasons ts ON ts.id = team_season_id
    JOIN public.competitions c ON c.id = ts.competition_id
    JOIN public.seasons s ON s.id = c.season_id
    JOIN public.leagues l ON l.id = s.league_id
    WHERE m.scope_type = 'org' AND m.scope_id = l.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.role IN ('owner', 'admin', 'coordinator', 'manager'))
);
CREATE POLICY update_training_sessions ON public.training_sessions FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.memberships m
    JOIN public.team_seasons ts ON ts.id = team_season_id
    JOIN public.competitions c ON c.id = ts.competition_id
    JOIN public.seasons s ON s.id = c.season_id
    JOIN public.leagues l ON l.id = s.league_id
    WHERE m.scope_type = 'org' AND m.scope_id = l.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.role IN ('owner', 'admin', 'coordinator', 'manager'))
);
CREATE POLICY delete_training_sessions ON public.training_sessions FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.memberships m
    JOIN public.team_seasons ts ON ts.id = team_season_id
    JOIN public.competitions c ON c.id = ts.competition_id
    JOIN public.seasons s ON s.id = c.season_id
    JOIN public.leagues l ON l.id = s.league_id
    WHERE m.scope_type = 'org' AND m.scope_id = l.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.role IN ('owner', 'admin', 'coordinator', 'manager'))
);

-- Team dues & expenses (T-9.4)
CREATE TABLE IF NOT EXISTS public.team_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_season_id uuid NOT NULL REFERENCES public.team_seasons(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('due', 'expense', 'sponsorship')),
  description text NOT NULL,
  amount_mnt numeric(10,2) NOT NULL,
  due_date date,
  paid_at timestamptz,
  paid_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS team_transactions_team_idx ON public.team_transactions (team_season_id);
CREATE POLICY read_team_transactions ON public.team_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY write_team_transactions ON public.team_transactions FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.memberships m
    JOIN public.team_seasons ts ON ts.id = team_season_id
    JOIN public.competitions c ON c.id = ts.competition_id
    JOIN public.seasons s ON s.id = c.season_id
    JOIN public.leagues l ON l.id = s.league_id
    WHERE m.scope_type = 'org' AND m.scope_id = l.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.role IN ('owner', 'admin', 'finance'))
);
CREATE POLICY update_team_transactions ON public.team_transactions FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.memberships m
    JOIN public.team_seasons ts ON ts.id = team_season_id
    JOIN public.competitions c ON c.id = ts.competition_id
    JOIN public.seasons s ON s.id = c.season_id
    JOIN public.leagues l ON l.id = s.league_id
    WHERE m.scope_type = 'org' AND m.scope_id = l.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.role IN ('owner', 'admin', 'finance'))
);
CREATE POLICY delete_team_transactions ON public.team_transactions FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.memberships m
    JOIN public.team_seasons ts ON ts.id = team_season_id
    JOIN public.competitions c ON c.id = ts.competition_id
    JOIN public.seasons s ON s.id = c.season_id
    JOIN public.leagues l ON l.id = s.league_id
    WHERE m.scope_type = 'org' AND m.scope_id = l.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.role IN ('owner', 'admin', 'finance'))
);

-- Opponent prep tools (T-9.5)
CREATE TABLE IF NOT EXISTS public.opponent_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_season_id uuid NOT NULL REFERENCES public.team_seasons(id) ON DELETE CASCADE,
  opponent_team_season_id uuid NOT NULL REFERENCES public.team_seasons(id) ON DELETE CASCADE,
  notes text,
  game_plan text,
  strengths text[],
  weaknesses text[],
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_season_id, opponent_team_season_id)
);

ALTER TABLE public.opponent_notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS opponent_notes_team_idx ON public.opponent_notes (team_season_id);
CREATE POLICY read_opponent_notes ON public.opponent_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY write_opponent_notes ON public.opponent_notes FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.memberships m
    JOIN public.team_seasons ts ON ts.id = team_season_id
    JOIN public.competitions c ON c.id = ts.competition_id
    JOIN public.seasons s ON s.id = c.season_id
    JOIN public.leagues l ON l.id = s.league_id
    WHERE m.scope_type = 'org' AND m.scope_id = l.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.role IN ('owner', 'admin', 'coordinator', 'manager'))
);
CREATE POLICY update_opponent_notes ON public.opponent_notes FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.memberships m
    JOIN public.team_seasons ts ON ts.id = team_season_id
    JOIN public.competitions c ON c.id = ts.competition_id
    JOIN public.seasons s ON s.id = c.season_id
    JOIN public.leagues l ON l.id = s.league_id
    WHERE m.scope_type = 'org' AND m.scope_id = l.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.role IN ('owner', 'admin', 'coordinator', 'manager'))
);
CREATE POLICY delete_opponent_notes ON public.opponent_notes FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.memberships m
    JOIN public.team_seasons ts ON ts.id = team_season_id
    JOIN public.competitions c ON c.id = ts.competition_id
    JOIN public.seasons s ON s.id = c.season_id
    JOIN public.leagues l ON l.id = s.league_id
    WHERE m.scope_type = 'org' AND m.scope_id = l.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.role IN ('owner', 'admin', 'coordinator', 'manager'))
);

-- ── Phase 10b: Enrollment & Attendance ───────────────────────────────────

-- Enrollment management (T-10b.2)
CREATE TABLE IF NOT EXISTS public.academy_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.academy_students(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.academy_programs(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'cancelled', 'waitlisted')),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  start_date date,
  end_date date,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, program_id)
);

ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS academy_enrollments_student_idx ON public.academy_enrollments (student_id);
CREATE INDEX IF NOT EXISTS academy_enrollments_program_idx ON public.academy_enrollments (program_id);
CREATE POLICY read_academy_enrollments ON public.academy_enrollments FOR SELECT TO authenticated USING (true);
CREATE POLICY write_academy_enrollments ON public.academy_enrollments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY update_academy_enrollments ON public.academy_enrollments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_academy_enrollments ON public.academy_enrollments FOR DELETE TO authenticated USING (true);

-- Attendance tracking (T-10b.3)
CREATE TABLE IF NOT EXISTS public.academy_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.academy_students(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.academy_programs(id) ON DELETE RESTRICT,
  session_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  note text,
  recorded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  is_offline boolean DEFAULT false,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, program_id, session_date)
);

ALTER TABLE public.academy_attendance ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS academy_attendance_student_idx ON public.academy_attendance (student_id);
CREATE INDEX IF NOT EXISTS academy_attendance_program_date_idx ON public.academy_attendance (program_id, session_date);
CREATE POLICY read_academy_attendance ON public.academy_attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY write_academy_attendance ON public.academy_attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY update_academy_attendance ON public.academy_attendance FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Consent & waivers (T-10b.4)
CREATE TABLE IF NOT EXISTS public.academy_consent_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academy_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  scope text NOT NULL CHECK (scope IN ('liability', 'medical', 'media', 'general')),
  version int NOT NULL DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.academy_consent_templates ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS consent_templates_academy_idx ON public.academy_consent_templates (academy_id);
CREATE POLICY read_consent_templates ON public.academy_consent_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY write_consent_templates ON public.academy_consent_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY update_consent_templates ON public.academy_consent_templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.academy_consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.academy_consent_templates(id) ON DELETE RESTRICT,
  student_id uuid NOT NULL REFERENCES public.academy_students(id) ON DELETE CASCADE,
  guardian_id uuid REFERENCES public.academy_guardians(id) ON DELETE SET NULL,
  signed_text text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_withdrawn boolean DEFAULT false,
  withdrawn_at timestamptz,
  ip_address text
);

ALTER TABLE public.academy_consent_records ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS consent_records_student_idx ON public.academy_consent_records (student_id);
CREATE INDEX IF NOT EXISTS consent_records_template_idx ON public.academy_consent_records (template_id);
CREATE POLICY read_consent_records ON public.academy_consent_records FOR SELECT TO authenticated USING (true);
CREATE POLICY write_consent_records ON public.academy_consent_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY update_consent_records ON public.academy_consent_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- CSV import/export (T-10b.5)
CREATE TABLE IF NOT EXISTS public.csv_import_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  filename text NOT NULL,
  rows_imported int NOT NULL DEFAULT 0,
  rows_failed int NOT NULL DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,
  imported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.csv_import_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_csv_import_log ON public.csv_import_log FOR SELECT TO authenticated USING (true);
CREATE POLICY write_csv_import_log ON public.csv_import_log FOR INSERT TO authenticated WITH CHECK (true);

-- ── Phase 10c: Offline & Reports ──────────────────────────────────────────

-- Offline-safe attendance queue
CREATE TABLE IF NOT EXISTS public.offline_attendance_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.academy_students(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.academy_programs(id) ON DELETE RESTRICT,
  session_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  note text,
  device_id text NOT NULL,
  local_sequence bigint NOT NULL,
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, local_sequence)
);

ALTER TABLE public.offline_attendance_queue ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS offline_queue_sync_idx ON public.offline_attendance_queue (synced_at) WHERE synced_at IS NULL;
CREATE POLICY read_offline_queue ON public.offline_attendance_queue FOR SELECT TO authenticated USING (true);
CREATE POLICY write_offline_queue ON public.offline_attendance_queue FOR INSERT TO authenticated WITH CHECK (true);

-- QPay invoices for academy payments (T-10c.3)
CREATE TABLE IF NOT EXISTS public.qpay_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id text NOT NULL,
  amount_mnt numeric(10,2) NOT NULL,
  qr_image text,
  qr_text text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.qpay_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_qpay_invoices ON public.qpay_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY write_qpay_invoices ON public.qpay_invoices FOR INSERT TO authenticated WITH CHECK (true);

-- Payment ledger per student (T-10c.3)
CREATE TABLE IF NOT EXISTS public.student_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.academy_students(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.academy_enrollments(id) ON DELETE SET NULL,
  amount_mnt numeric(10,2) NOT NULL,
  payment_method text CHECK (payment_method IN ('qpay', 'cash', 'transfer', 'other')),
  qpay_invoice_id uuid REFERENCES public.qpay_invoices(id) ON DELETE SET NULL,
  paid_at timestamptz DEFAULT now(),
  notes text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS student_payments_student_idx ON public.student_payments (student_id);
CREATE POLICY read_student_payments ON public.student_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY write_student_payments ON public.student_payments FOR INSERT TO authenticated WITH CHECK (true);

-- Ordered waitlists (T-10c.4)
ALTER TABLE public.academy_enrollments ADD COLUMN IF NOT EXISTS waitlist_position int;

CREATE TABLE IF NOT EXISTS public.waitlist_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.academy_programs(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.academy_students(id) ON DELETE CASCADE,
  position int NOT NULL,
  promoted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_waitlist_history ON public.waitlist_history FOR SELECT TO authenticated USING (true);
CREATE POLICY write_waitlist_history ON public.waitlist_history FOR INSERT TO authenticated WITH CHECK (true);

-- ── Phase 10d: Extended Features ──────────────────────────────────────────

-- Verified QPay callbacks (T-10d.2)
ALTER TABLE public.qpay_invoices ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE public.qpay_invoices ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Multi-location scheduling (T-10d.3)
ALTER TABLE public.academy_programs ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.academy_locations(id) ON DELETE SET NULL;

-- Extended reporting (T-10d.4)
CREATE TABLE IF NOT EXISTS public.report_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academy_profiles(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('financial', 'attendance', 'enrollment')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.report_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_report_snapshots ON public.report_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY write_report_snapshots ON public.report_snapshots FOR INSERT TO authenticated WITH CHECK (true);

-- ── Phase 11: Guardian Self-Service ────────────────────────────────────────

-- Multi-child dashboard (T-11.1)
ALTER TABLE public.academy_guardians ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Announcements & reminders (T-11.4)
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academy_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  target_audience text NOT NULL CHECK (target_audience IN ('all', 'guardians', 'staff', 'specific')),
  program_ids uuid[],
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS announcements_academy_idx ON public.announcements (academy_id);
CREATE POLICY read_announcements ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY write_announcements ON public.announcements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY update_announcements ON public.announcements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_announcements ON public.announcements FOR DELETE TO authenticated USING (true);

-- Guardian registration & consent management (T-11.3)
ALTER TABLE public.academy_guardians ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.academy_guardians ADD COLUMN IF NOT EXISTS otp_verified boolean DEFAULT false;
ALTER TABLE public.academy_guardians ADD COLUMN IF NOT EXISTS otp_secret text;
CREATE INDEX IF NOT EXISTS guardians_phone_idx ON public.academy_guardians (phone) WHERE phone IS NOT NULL;
