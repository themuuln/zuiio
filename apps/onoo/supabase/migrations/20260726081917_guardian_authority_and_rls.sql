-- ============================================================================
-- Phase 11 Step 0: Guardian authority model, RLS hardening, guarded commands
-- and registration intent flow
-- ============================================================================

-- ── 1. Guardian authority model on student-guardian links ──────────────────

ALTER TABLE public.academy_student_guardians
  ADD COLUMN IF NOT EXISTS authority_status text NOT NULL DEFAULT 'pending'
    CHECK (authority_status IN ('pending', 'verified', 'revoked'));
ALTER TABLE public.academy_student_guardians
  ADD COLUMN IF NOT EXISTS granted_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.academy_student_guardians
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE public.academy_student_guardians
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.academy_student_guardians
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;
ALTER TABLE public.academy_student_guardians
  ADD COLUMN IF NOT EXISTS revoked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.academy_student_guardians
  ADD COLUMN IF NOT EXISTS verified_phone text;

-- ── 2. Guardian authority events audit table ───────────────────────────────

CREATE TABLE IF NOT EXISTS public.guardian_authority_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_guardian_id uuid NOT NULL REFERENCES public.academy_student_guardians(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('granted', 'verified', 'revoked', 'invited', 'claimed')),
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.guardian_authority_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS guardian_authority_events_link_idx ON public.guardian_authority_events (student_guardian_id);
CREATE INDEX IF NOT EXISTS guardian_authority_events_actor_idx ON public.guardian_authority_events (actor_id);

-- ── 3. Registration intents table ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.academy_registration_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academy_profiles(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.academy_programs(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  date_of_birth date,
  guardian_name text,
  guardian_phone text,
  notes text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'declined', 'cancelled', 'expired')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_registration_intents ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS academy_registration_intents_academy_idx ON public.academy_registration_intents (academy_id);
CREATE INDEX IF NOT EXISTS academy_registration_intents_status_idx ON public.academy_registration_intents (status);

-- ── 4. Private helper functions ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION private.is_academy_staff(p_academy_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.academy_profiles ap
    JOIN public.memberships m ON m.scope_type = 'org' AND m.scope_id = ap.organization_id
    WHERE ap.id = p_academy_id AND m.user_id = (SELECT auth.uid()) AND m.role IN ('owner', 'admin', 'coordinator')
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.is_academy_finance(p_academy_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.academy_profiles ap
    JOIN public.memberships m ON m.scope_type = 'org' AND m.scope_id = ap.organization_id
    WHERE ap.id = p_academy_id AND m.user_id = (SELECT auth.uid()) AND m.role IN ('owner', 'admin', 'finance')
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.is_verified_guardian(p_student_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.academy_student_guardians sg
    JOIN public.academy_guardians ag ON ag.id = sg.guardian_id
    WHERE sg.student_id = p_student_id AND ag.user_id = (SELECT auth.uid()) AND sg.authority_status = 'verified'
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.is_academy_guardian(p_academy_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.academy_students s
    JOIN public.academy_student_guardians sg ON sg.student_id = s.id
    JOIN public.academy_guardians ag ON ag.id = sg.guardian_id
    WHERE s.academy_id = p_academy_id AND ag.user_id = (SELECT auth.uid()) AND sg.authority_status = 'verified'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION private.is_academy_staff TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_academy_finance TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_verified_guardian TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_academy_guardian TO authenticated;

-- ── 5. RLS policy replacement ──────────────────────────────────────────────

-- guardian_authority_events
DROP POLICY IF EXISTS read_guardian_authority_events ON public.guardian_authority_events;
DROP POLICY IF EXISTS write_guardian_authority_events ON public.guardian_authority_events;
CREATE POLICY read_guardian_authority_events ON public.guardian_authority_events FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.academy_student_guardians sg
    JOIN public.academy_students s ON s.id = sg.student_id
    JOIN public.academy_profiles ap ON ap.id = s.academy_id
    JOIN public.memberships m ON m.scope_type = 'org' AND m.scope_id = ap.organization_id
      AND m.user_id = (SELECT auth.uid()) AND m.role IN ('owner', 'admin', 'coordinator'))
  OR EXISTS (SELECT 1 FROM public.academy_student_guardians sg2
    JOIN public.academy_guardians ag ON ag.id = sg2.guardian_id
    WHERE sg2.id = student_guardian_id AND ag.user_id = (SELECT auth.uid()))
);
CREATE POLICY write_guardian_authority_events ON public.guardian_authority_events FOR INSERT TO authenticated WITH CHECK (
  (SELECT auth.uid()) = actor_id
);

-- academy_registration_intents
DROP POLICY IF EXISTS staff_select_registration_intents ON public.academy_registration_intents;
DROP POLICY IF EXISTS staff_insert_registration_intents ON public.academy_registration_intents;
DROP POLICY IF EXISTS staff_update_registration_intents ON public.academy_registration_intents;
CREATE POLICY staff_select_registration_intents ON public.academy_registration_intents FOR SELECT TO authenticated USING (private.is_academy_staff(academy_id));
CREATE POLICY staff_insert_registration_intents ON public.academy_registration_intents FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY staff_update_registration_intents ON public.academy_registration_intents FOR UPDATE TO authenticated USING (private.is_academy_staff(academy_id)) WITH CHECK (private.is_academy_staff(academy_id));

-- academy_guardians
DROP POLICY IF EXISTS read_academy_guardians ON public.academy_guardians;
DROP POLICY IF EXISTS write_academy_guardians ON public.academy_guardians;
DROP POLICY IF EXISTS update_academy_guardians ON public.academy_guardians;
DROP POLICY IF EXISTS delete_academy_guardians ON public.academy_guardians;
CREATE POLICY staff_select_academy_guardians ON public.academy_guardians FOR SELECT TO authenticated USING (
  private.is_academy_staff(academy_id) OR private.is_academy_finance(academy_id) OR (user_id = (SELECT auth.uid()))
);
CREATE POLICY staff_insert_academy_guardians ON public.academy_guardians FOR INSERT TO authenticated WITH CHECK (private.is_academy_staff(academy_id));
CREATE POLICY staff_update_academy_guardians ON public.academy_guardians FOR UPDATE TO authenticated USING (private.is_academy_staff(academy_id) OR private.is_academy_finance(academy_id)) WITH CHECK (private.is_academy_staff(academy_id) OR private.is_academy_finance(academy_id));
CREATE POLICY staff_delete_academy_guardians ON public.academy_guardians FOR DELETE TO authenticated USING (private.is_academy_staff(academy_id));

-- academy_students
DROP POLICY IF EXISTS read_academy_students ON public.academy_students;
DROP POLICY IF EXISTS write_academy_students ON public.academy_students;
DROP POLICY IF EXISTS update_academy_students ON public.academy_students;
DROP POLICY IF EXISTS delete_academy_students ON public.academy_students;
CREATE POLICY staff_select_academy_students ON public.academy_students FOR SELECT TO authenticated USING (
  private.is_academy_staff(academy_id) OR (private.is_academy_finance(academy_id) AND medical_notes IS NULL AND allergies IS NULL) OR private.is_verified_guardian(id)
);
CREATE POLICY staff_insert_academy_students ON public.academy_students FOR INSERT TO authenticated WITH CHECK (private.is_academy_staff(academy_id));
CREATE POLICY staff_update_academy_students ON public.academy_students FOR UPDATE TO authenticated USING (private.is_academy_staff(academy_id)) WITH CHECK (private.is_academy_staff(academy_id));
CREATE POLICY staff_delete_academy_students ON public.academy_students FOR DELETE TO authenticated USING (private.is_academy_staff(academy_id));

-- academy_student_guardians
DROP POLICY IF EXISTS read_academy_student_guardians ON public.academy_student_guardians;
DROP POLICY IF EXISTS write_academy_student_guardians ON public.academy_student_guardians;
DROP POLICY IF EXISTS delete_academy_student_guardians ON public.academy_student_guardians;
CREATE POLICY staff_select_academy_student_guardians ON public.academy_student_guardians FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.academy_students s JOIN public.academy_profiles ap ON ap.id = s.academy_id WHERE s.id = student_id AND private.is_academy_staff(ap.id))
  OR EXISTS (SELECT 1 FROM public.academy_guardians ag WHERE ag.id = guardian_id AND ag.user_id = (SELECT auth.uid()))
);
CREATE POLICY staff_insert_academy_student_guardians ON public.academy_student_guardians FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.academy_students s JOIN public.academy_profiles ap ON ap.id = s.academy_id WHERE s.id = student_id AND private.is_academy_staff(ap.id))
);
CREATE POLICY staff_delete_academy_student_guardians ON public.academy_student_guardians FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.academy_students s JOIN public.academy_profiles ap ON ap.id = s.academy_id WHERE s.id = student_id AND private.is_academy_staff(ap.id))
);

-- academy_enrollments
DROP POLICY IF EXISTS read_academy_enrollments ON public.academy_enrollments;
DROP POLICY IF EXISTS write_academy_enrollments ON public.academy_enrollments;
DROP POLICY IF EXISTS update_academy_enrollments ON public.academy_enrollments;
DROP POLICY IF EXISTS delete_academy_enrollments ON public.academy_enrollments;
CREATE POLICY staff_select_academy_enrollments ON public.academy_enrollments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.academy_students s JOIN public.academy_profiles ap ON ap.id = s.academy_id WHERE s.id = student_id AND (private.is_academy_staff(ap.id) OR private.is_academy_finance(ap.id)))
  OR (SELECT private.is_verified_guardian(student_id))
);
CREATE POLICY staff_insert_academy_enrollments ON public.academy_enrollments FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.academy_students s JOIN public.academy_profiles ap ON ap.id = s.academy_id WHERE s.id = student_id AND private.is_academy_staff(ap.id))
);
CREATE POLICY staff_update_academy_enrollments ON public.academy_enrollments FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.academy_students s JOIN public.academy_profiles ap ON ap.id = s.academy_id WHERE s.id = student_id AND private.is_academy_staff(ap.id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.academy_students s JOIN public.academy_profiles ap ON ap.id = s.academy_id WHERE s.id = student_id AND private.is_academy_staff(ap.id))
);
CREATE POLICY staff_delete_academy_enrollments ON public.academy_enrollments FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.academy_students s JOIN public.academy_profiles ap ON ap.id = s.academy_id WHERE s.id = student_id AND private.is_academy_staff(ap.id))
);

-- academy_attendance
DROP POLICY IF EXISTS read_academy_attendance ON public.academy_attendance;
DROP POLICY IF EXISTS write_academy_attendance ON public.academy_attendance;
DROP POLICY IF EXISTS update_academy_attendance ON public.academy_attendance;
CREATE POLICY staff_select_academy_attendance ON public.academy_attendance FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.academy_students s JOIN public.academy_profiles ap ON ap.id = s.academy_id WHERE s.id = student_id AND (private.is_academy_staff(ap.id) OR private.is_academy_finance(ap.id)))
  OR (SELECT private.is_verified_guardian(student_id))
);
CREATE POLICY staff_insert_academy_attendance ON public.academy_attendance FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.academy_students s JOIN public.academy_profiles ap ON ap.id = s.academy_id WHERE s.id = student_id AND private.is_academy_staff(ap.id))
);
CREATE POLICY staff_update_academy_attendance ON public.academy_attendance FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.academy_students s JOIN public.academy_profiles ap ON ap.id = s.academy_id WHERE s.id = student_id AND private.is_academy_staff(ap.id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.academy_students s JOIN public.academy_profiles ap ON ap.id = s.academy_id WHERE s.id = student_id AND private.is_academy_staff(ap.id))
);

-- academy_consent_templates
DROP POLICY IF EXISTS read_consent_templates ON public.academy_consent_templates;
DROP POLICY IF EXISTS write_consent_templates ON public.academy_consent_templates;
DROP POLICY IF EXISTS update_consent_templates ON public.academy_consent_templates;
CREATE POLICY staff_select_academy_consent_templates ON public.academy_consent_templates FOR SELECT TO authenticated USING (private.is_academy_staff(academy_id));
CREATE POLICY staff_insert_academy_consent_templates ON public.academy_consent_templates FOR INSERT TO authenticated WITH CHECK (private.is_academy_staff(academy_id));
CREATE POLICY staff_update_academy_consent_templates ON public.academy_consent_templates FOR UPDATE TO authenticated USING (private.is_academy_staff(academy_id)) WITH CHECK (private.is_academy_staff(academy_id));

-- academy_consent_records
DROP POLICY IF EXISTS read_consent_records ON public.academy_consent_records;
DROP POLICY IF EXISTS write_consent_records ON public.academy_consent_records;
DROP POLICY IF EXISTS update_consent_records ON public.academy_consent_records;
CREATE POLICY staff_select_academy_consent_records ON public.academy_consent_records FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.academy_students s JOIN public.academy_profiles ap ON ap.id = s.academy_id WHERE s.id = student_id AND (private.is_academy_staff(ap.id) OR private.is_academy_finance(ap.id)))
  OR (SELECT private.is_verified_guardian(student_id))
);
CREATE POLICY staff_insert_academy_consent_records ON public.academy_consent_records FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.academy_students s JOIN public.academy_profiles ap ON ap.id = s.academy_id WHERE s.id = student_id AND private.is_academy_staff(ap.id))
);
CREATE POLICY staff_update_academy_consent_records ON public.academy_consent_records FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.academy_students s JOIN public.academy_profiles ap ON ap.id = s.academy_id WHERE s.id = student_id AND private.is_academy_staff(ap.id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.academy_students s JOIN public.academy_profiles ap ON ap.id = s.academy_id WHERE s.id = student_id AND private.is_academy_staff(ap.id))
);

-- academy_announcements
DROP POLICY IF EXISTS read_academy_announcements ON public.academy_announcements;
DROP POLICY IF EXISTS write_academy_announcements ON public.academy_announcements;
DROP POLICY IF EXISTS delete_academy_announcements ON public.academy_announcements;
CREATE POLICY staff_select_academy_announcements ON public.academy_announcements FOR SELECT TO authenticated USING (
  private.is_academy_staff(academy_id) OR private.is_academy_guardian(academy_id)
);
CREATE POLICY staff_insert_academy_announcements ON public.academy_announcements FOR INSERT TO authenticated WITH CHECK (private.is_academy_staff(academy_id));
CREATE POLICY staff_delete_academy_announcements ON public.academy_announcements FOR DELETE TO authenticated USING (private.is_academy_staff(academy_id));

-- academy_payment_ledger
DROP POLICY IF EXISTS read_payment_ledger ON public.academy_payment_ledger;
DROP POLICY IF EXISTS write_payment_ledger ON public.academy_payment_ledger;
DROP POLICY IF EXISTS update_payment_ledger ON public.academy_payment_ledger;
CREATE POLICY staff_select_academy_payment_ledger ON public.academy_payment_ledger FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.academy_students s JOIN public.academy_profiles ap ON ap.id = s.academy_id WHERE s.id = student_id AND (private.is_academy_staff(ap.id) OR private.is_academy_finance(ap.id)))
  OR (SELECT private.is_verified_guardian(student_id))
);
CREATE POLICY staff_insert_academy_payment_ledger ON public.academy_payment_ledger FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.academy_students s JOIN public.academy_profiles ap ON ap.id = s.academy_id WHERE s.id = student_id AND (private.is_academy_staff(ap.id) OR private.is_academy_finance(ap.id)))
);
CREATE POLICY staff_update_academy_payment_ledger ON public.academy_payment_ledger FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.academy_students s JOIN public.academy_profiles ap ON ap.id = s.academy_id WHERE s.id = student_id AND (private.is_academy_staff(ap.id) OR private.is_academy_finance(ap.id)))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.academy_students s JOIN public.academy_profiles ap ON ap.id = s.academy_id WHERE s.id = student_id AND (private.is_academy_staff(ap.id) OR private.is_academy_finance(ap.id)))
);

-- academy_waitlists
DROP POLICY IF EXISTS read_academy_waitlists ON public.academy_waitlists;
DROP POLICY IF EXISTS write_academy_waitlists ON public.academy_waitlists;
DROP POLICY IF EXISTS update_academy_waitlists ON public.academy_waitlists;
DROP POLICY IF EXISTS delete_academy_waitlists ON public.academy_waitlists;
CREATE POLICY staff_select_academy_waitlists ON public.academy_waitlists FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.academy_programs p JOIN public.academy_profiles ap ON ap.id = p.academy_id WHERE p.id = program_id AND private.is_academy_staff(ap.id))
);
CREATE POLICY staff_insert_academy_waitlists ON public.academy_waitlists FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.academy_programs p JOIN public.academy_profiles ap ON ap.id = p.academy_id WHERE p.id = program_id AND private.is_academy_staff(ap.id))
);
CREATE POLICY staff_update_academy_waitlists ON public.academy_waitlists FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.academy_programs p JOIN public.academy_profiles ap ON ap.id = p.academy_id WHERE p.id = program_id AND private.is_academy_staff(ap.id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.academy_programs p JOIN public.academy_profiles ap ON ap.id = p.academy_id WHERE p.id = program_id AND private.is_academy_staff(ap.id))
);
CREATE POLICY staff_delete_academy_waitlists ON public.academy_waitlists FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.academy_programs p JOIN public.academy_profiles ap ON ap.id = p.academy_id WHERE p.id = program_id AND private.is_academy_staff(ap.id))
);

-- academy_profiles
DROP POLICY IF EXISTS read_academy_profiles ON public.academy_profiles;
DROP POLICY IF EXISTS write_academy_profiles ON public.academy_profiles;
DROP POLICY IF EXISTS update_academy_profiles ON public.academy_profiles;
CREATE POLICY staff_select_academy_profiles ON public.academy_profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY staff_insert_academy_profiles ON public.academy_profiles FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.memberships m WHERE m.scope_type = 'org' AND m.scope_id = organization_id AND m.user_id = (SELECT auth.uid()) AND m.role IN ('owner', 'admin'))
);
CREATE POLICY staff_update_academy_profiles ON public.academy_profiles FOR UPDATE TO authenticated USING (private.is_academy_staff(id)) WITH CHECK (private.is_academy_staff(id));

-- academy_programs
DROP POLICY IF EXISTS read_academy_programs ON public.academy_programs;
DROP POLICY IF EXISTS write_academy_programs ON public.academy_programs;
DROP POLICY IF EXISTS update_academy_programs ON public.academy_programs;
DROP POLICY IF EXISTS delete_academy_programs ON public.academy_programs;
CREATE POLICY staff_select_academy_programs ON public.academy_programs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY staff_insert_academy_programs ON public.academy_programs FOR INSERT TO authenticated WITH CHECK (private.is_academy_staff(academy_id));
CREATE POLICY staff_update_academy_programs ON public.academy_programs FOR UPDATE TO authenticated USING (private.is_academy_staff(academy_id)) WITH CHECK (private.is_academy_staff(academy_id));
CREATE POLICY staff_delete_academy_programs ON public.academy_programs FOR DELETE TO authenticated USING (private.is_academy_staff(academy_id));

-- academy_trainers
DROP POLICY IF EXISTS read_academy_trainers ON public.academy_trainers;
DROP POLICY IF EXISTS write_academy_trainers ON public.academy_trainers;
DROP POLICY IF EXISTS update_academy_trainers ON public.academy_trainers;
DROP POLICY IF EXISTS delete_academy_trainers ON public.academy_trainers;
CREATE POLICY staff_select_academy_trainers ON public.academy_trainers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY staff_insert_academy_trainers ON public.academy_trainers FOR INSERT TO authenticated WITH CHECK (private.is_academy_staff(academy_id));
CREATE POLICY staff_update_academy_trainers ON public.academy_trainers FOR UPDATE TO authenticated USING (private.is_academy_staff(academy_id)) WITH CHECK (private.is_academy_staff(academy_id));
CREATE POLICY staff_delete_academy_trainers ON public.academy_trainers FOR DELETE TO authenticated USING (private.is_academy_staff(academy_id));

-- academy_locations
DROP POLICY IF EXISTS read_academy_locations ON public.academy_locations;
DROP POLICY IF EXISTS write_academy_locations ON public.academy_locations;
DROP POLICY IF EXISTS update_academy_locations ON public.academy_locations;
DROP POLICY IF EXISTS delete_academy_locations ON public.academy_locations;
CREATE POLICY staff_select_academy_locations ON public.academy_locations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY staff_insert_academy_locations ON public.academy_locations FOR INSERT TO authenticated WITH CHECK (private.is_academy_staff(academy_id));
CREATE POLICY staff_update_academy_locations ON public.academy_locations FOR UPDATE TO authenticated USING (private.is_academy_staff(academy_id)) WITH CHECK (private.is_academy_staff(academy_id));
CREATE POLICY staff_delete_academy_locations ON public.academy_locations FOR DELETE TO authenticated USING (private.is_academy_staff(academy_id));

-- ── 6. Guarded cmd_* functions ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.cmd_invite_guardian(
  p_academy_id uuid, p_student_id uuid, p_guardian_name text,
  p_guardian_phone text DEFAULT NULL, p_guardian_email text DEFAULT NULL,
  p_relationship text DEFAULT 'parent', p_is_primary boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_guardian_id uuid; v_link_id uuid;
BEGIN
  IF NOT private.is_academy_staff(p_academy_id) THEN RAISE EXCEPTION 'ONOO_NOT_AUTHORIZED'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.academy_students WHERE id = p_student_id AND academy_id = p_academy_id) THEN RAISE EXCEPTION 'ONOO_STUDENT_NOT_FOUND'; END IF;
  IF p_guardian_phone IS NOT NULL THEN
    INSERT INTO public.academy_guardians (academy_id, name, phone, email, relationship, is_primary)
    VALUES (p_academy_id, p_guardian_name, p_guardian_phone, p_guardian_email, p_relationship, p_is_primary)
    ON CONFLICT (academy_id, phone) DO UPDATE SET name = EXCLUDED.name, email = COALESCE(EXCLUDED.email, academy_guardians.email), relationship = EXCLUDED.relationship, updated_at = now()
    RETURNING id INTO v_guardian_id;
  ELSE
    INSERT INTO public.academy_guardians (academy_id, name, email, relationship, is_primary)
    VALUES (p_academy_id, p_guardian_name, p_guardian_email, p_relationship, p_is_primary)
    RETURNING id INTO v_guardian_id;
  END IF;
  INSERT INTO public.academy_student_guardians (student_id, guardian_id, authority_status)
  VALUES (p_student_id, v_guardian_id, 'pending')
  ON CONFLICT (student_id, guardian_id) DO UPDATE SET authority_status = CASE WHEN academy_student_guardians.authority_status = 'revoked' THEN 'pending' ELSE academy_student_guardians.authority_status END
  RETURNING id INTO v_link_id;
  INSERT INTO public.guardian_authority_events (student_guardian_id, action, actor_id, details)
  VALUES (v_link_id, 'invited', (SELECT auth.uid()), jsonb_build_object('guardian_name', p_guardian_name, 'guardian_phone', p_guardian_phone, 'student_id', p_student_id));
  RETURN jsonb_build_object('guardian_id', v_guardian_id, 'link_id', v_link_id, 'authority_status', 'pending');
END;
$$;
REVOKE ALL ON FUNCTION public.cmd_invite_guardian FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.cmd_invite_guardian TO authenticated;

CREATE OR REPLACE FUNCTION public.cmd_verify_guardian(p_link_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_academy_id uuid;
BEGIN
  SELECT s.academy_id INTO v_academy_id FROM public.academy_student_guardians sg JOIN public.academy_students s ON s.id = sg.student_id WHERE sg.id = p_link_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'ONOO_LINK_NOT_FOUND'; END IF;
  IF NOT private.is_academy_staff(v_academy_id) THEN RAISE EXCEPTION 'ONOO_NOT_AUTHORIZED'; END IF;
  UPDATE public.academy_student_guardians SET authority_status = 'verified', verified_at = now(), verified_by = (SELECT auth.uid())
  WHERE id = p_link_id AND authority_status = 'pending' RETURNING id INTO p_link_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'ONOO_LINK_NOT_PENDING'; END IF;
  INSERT INTO public.guardian_authority_events (student_guardian_id, action, actor_id) VALUES (p_link_id, 'verified', (SELECT auth.uid()));
  RETURN jsonb_build_object('link_id', p_link_id, 'authority_status', 'verified');
END;
$$;
REVOKE ALL ON FUNCTION public.cmd_verify_guardian FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.cmd_verify_guardian TO authenticated;

CREATE OR REPLACE FUNCTION public.cmd_revoke_guardian(p_link_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_academy_id uuid;
BEGIN
  SELECT s.academy_id INTO v_academy_id FROM public.academy_student_guardians sg JOIN public.academy_students s ON s.id = sg.student_id WHERE sg.id = p_link_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'ONOO_LINK_NOT_FOUND'; END IF;
  IF NOT private.is_academy_staff(v_academy_id) THEN RAISE EXCEPTION 'ONOO_NOT_AUTHORIZED'; END IF;
  UPDATE public.academy_student_guardians SET authority_status = 'revoked', revoked_at = now(), revoked_by = (SELECT auth.uid())
  WHERE id = p_link_id AND authority_status IN ('pending', 'verified') RETURNING id INTO p_link_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'ONOO_LINK_ALREADY_REVOKED'; END IF;
  INSERT INTO public.guardian_authority_events (student_guardian_id, action, actor_id) VALUES (p_link_id, 'revoked', (SELECT auth.uid()));
  RETURN jsonb_build_object('link_id', p_link_id, 'authority_status', 'revoked');
END;
$$;
REVOKE ALL ON FUNCTION public.cmd_revoke_guardian FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.cmd_revoke_guardian TO authenticated;

CREATE OR REPLACE FUNCTION public.cmd_list_my_children(p_academy_id uuid DEFAULT NULL)
RETURNS TABLE(student_id uuid, student_name text, student_name_latin text, date_of_birth date, photo_url text, school_name text, grade_level text, enrollment_id uuid, program_id uuid, program_name text, enrollment_status text, link_id uuid, authority_status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.canonical_name, s.name_latin, s.date_of_birth, s.photo_url, s.school_name, s.grade_level, e.id, e.program_id, p.name, e.status, sg.id, sg.authority_status
  FROM public.academy_guardians ag
  JOIN public.academy_student_guardians sg ON sg.guardian_id = ag.id AND sg.authority_status = 'verified'
  JOIN public.academy_students s ON s.id = sg.student_id
  LEFT JOIN public.academy_enrollments e ON e.student_id = s.id AND e.status = 'active'
  LEFT JOIN public.academy_programs p ON p.id = e.program_id
  WHERE ag.user_id = (SELECT auth.uid()) AND (p_academy_id IS NULL OR s.academy_id = p_academy_id)
  ORDER BY s.canonical_name;
END;
$$;
REVOKE ALL ON FUNCTION public.cmd_list_my_children FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.cmd_list_my_children TO authenticated;

CREATE OR REPLACE FUNCTION public.cmd_link_guardian_account(p_guardian_id uuid, p_user_id uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user_id uuid;
BEGIN
  v_user_id := COALESCE(p_user_id, (SELECT auth.uid()));
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'ONOO_NOT_AUTHORIZED'; END IF;
  UPDATE public.academy_guardians SET user_id = v_user_id, updated_at = now()
  WHERE id = p_guardian_id AND (user_id IS NULL OR user_id = v_user_id);
  IF NOT FOUND THEN RAISE EXCEPTION 'ONOO_GUARDIAN_ALREADY_LINKED'; END IF;
  RETURN jsonb_build_object('guardian_id', p_guardian_id, 'user_id', v_user_id);
END;
$$;
REVOKE ALL ON FUNCTION public.cmd_link_guardian_account FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.cmd_link_guardian_account TO authenticated;

CREATE OR REPLACE FUNCTION public.cmd_submit_registration(
  p_academy_id uuid, p_program_id uuid, p_student_name text,
  p_date_of_birth date DEFAULT NULL, p_guardian_name text DEFAULT NULL,
  p_guardian_phone text DEFAULT NULL, p_notes text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_intent_id uuid; v_rate_limit boolean;
BEGIN
  IF p_guardian_phone IS NOT NULL THEN
    SELECT COUNT(*) < 5 INTO v_rate_limit FROM public.academy_registration_intents
    WHERE guardian_phone = p_guardian_phone AND created_at >= (now() AT TIME ZONE 'UTC')::date;
    IF NOT v_rate_limit THEN RAISE EXCEPTION 'ONOO_RATE_LIMIT: Too many submissions, try again tomorrow'; END IF;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.academy_programs WHERE id = p_program_id AND academy_id = p_academy_id) THEN
    RAISE EXCEPTION 'ONOO_PROGRAM_NOT_FOUND';
  END IF;
  INSERT INTO public.academy_registration_intents (academy_id, program_id, student_name, date_of_birth, guardian_name, guardian_phone, notes)
  VALUES (p_academy_id, p_program_id, p_student_name, p_date_of_birth, p_guardian_name, p_guardian_phone, p_notes)
  RETURNING id INTO v_intent_id;
  RETURN jsonb_build_object('intent_id', v_intent_id, 'status', 'pending',
    'message', 'Таны бүртгэлийн хүсэлт хүлээгдэж байна. Тун удахгүй бид тантай холбогдох болно.');
END;
$$;
REVOKE ALL ON FUNCTION public.cmd_submit_registration FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.cmd_submit_registration TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.cmd_approve_registration(p_intent_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_intent public.academy_registration_intents; v_result jsonb;
BEGIN
  SELECT * INTO v_intent FROM public.academy_registration_intents WHERE id = p_intent_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ONOO_INTENT_NOT_FOUND'; END IF;
  IF NOT private.is_academy_staff(v_intent.academy_id) THEN RAISE EXCEPTION 'ONOO_NOT_AUTHORIZED'; END IF;
  IF v_intent.status != 'pending' THEN RAISE EXCEPTION 'ONOO_INTENT_NOT_PENDING'; END IF;
  SELECT public.cmd_public_enroll(v_intent.academy_id, v_intent.program_id, v_intent.student_name, v_intent.date_of_birth, v_intent.guardian_name, v_intent.guardian_phone, v_intent.notes) INTO v_result;
  UPDATE public.academy_registration_intents SET status = 'approved', reviewed_by = (SELECT auth.uid()), reviewed_at = now() WHERE id = p_intent_id;
  RETURN jsonb_build_object('intent_id', p_intent_id, 'status', 'approved', 'result', v_result);
END;
$$;
REVOKE ALL ON FUNCTION public.cmd_approve_registration FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.cmd_approve_registration TO authenticated;

CREATE OR REPLACE FUNCTION public.cmd_decline_registration(p_intent_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_intent public.academy_registration_intents;
BEGIN
  SELECT * INTO v_intent FROM public.academy_registration_intents WHERE id = p_intent_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ONOO_INTENT_NOT_FOUND'; END IF;
  IF NOT private.is_academy_staff(v_intent.academy_id) THEN RAISE EXCEPTION 'ONOO_NOT_AUTHORIZED'; END IF;
  IF v_intent.status != 'pending' THEN RAISE EXCEPTION 'ONOO_INTENT_NOT_PENDING'; END IF;
  UPDATE public.academy_registration_intents SET status = 'declined', reviewed_by = (SELECT auth.uid()), reviewed_at = now() WHERE id = p_intent_id;
  RETURN jsonb_build_object('intent_id', p_intent_id, 'status', 'declined');
END;
$$;
REVOKE ALL ON FUNCTION public.cmd_decline_registration FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.cmd_decline_registration TO authenticated;
