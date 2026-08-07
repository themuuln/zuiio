-- ============================================================================
-- Migration: Public Academy Enrollment (Phase 10b public-facing)
-- 
-- 1. Adds anon SELECT policies so public pages can read academy info
-- 2. Adds unique constraint on guardians for upsert
-- 3. Creates SECURITY DEFINER function for public self-enrollment
-- 4. Creates missing cmd_create_enrollment / cmd_update_enrollment for admin
-- ============================================================================

-- ── 1. Public read policies for academy info ──────────────────────────────
-- Allow unauthenticated users to browse academies and their programs

CREATE POLICY read_academy_profiles_anon ON public.academy_profiles
  FOR SELECT TO anon USING (true);

CREATE POLICY read_academy_programs_anon ON public.academy_programs
  FOR SELECT TO anon USING (true);

CREATE POLICY read_academy_trainers_anon ON public.academy_trainers
  FOR SELECT TO anon USING (true);

CREATE POLICY read_academy_locations_anon ON public.academy_locations
  FOR SELECT TO anon USING (true);

-- ── 2. Unique constraint for guardian upsert ──────────────────────────────
-- Allows cmd_public_enroll to find/reuse guardians by phone within an academy

ALTER TABLE public.academy_guardians
  ADD CONSTRAINT academy_guardians_phone_unique UNIQUE (academy_id, phone);

-- ── 3. Public enrollment function ─────────────────────────────────────────
-- Creates guardian + student + enrollment atomically for public self-service
-- Bypasses RLS via SECURITY DEFINER

CREATE OR REPLACE FUNCTION public.cmd_public_enroll(
  p_academy_id uuid,
  p_program_id uuid,
  p_student_name text,
  p_date_of_birth date DEFAULT NULL,
  p_guardian_name text DEFAULT NULL,
  p_guardian_phone text DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_guardian_id uuid;
  v_student_id uuid;
  v_enrollment_id uuid;
  v_program_name text;
BEGIN
  -- Validate program belongs to this academy
  SELECT name INTO v_program_name
  FROM public.academy_programs
  WHERE id = p_program_id AND academy_id = p_academy_id;
  
  IF v_program_name IS NULL THEN
    RAISE EXCEPTION 'program_not_found: Program does not exist or does not belong to this academy';
  END IF;

  -- Create or find guardian by phone
  IF p_guardian_phone IS NOT NULL AND p_guardian_name IS NOT NULL THEN
    INSERT INTO public.academy_guardians (academy_id, name, phone)
    VALUES (p_academy_id, p_guardian_name, p_guardian_phone)
    ON CONFLICT (academy_id, phone) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_guardian_id;
  END IF;

  -- Create student
  INSERT INTO public.academy_students (
    academy_id, canonical_name, date_of_birth, notes
  ) VALUES (
    p_academy_id, p_student_name, p_date_of_birth, p_notes
  ) RETURNING id INTO v_student_id;

  -- Link guardian to student
  IF v_guardian_id IS NOT NULL THEN
    INSERT INTO public.academy_student_guardians (student_id, guardian_id)
    VALUES (v_student_id, v_guardian_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Create enrollment
  INSERT INTO public.academy_enrollments (student_id, program_id, status)
  VALUES (v_student_id, p_program_id, 'active')
  RETURNING id INTO v_enrollment_id;

  -- Audit
  PERFORM private.write_audit('public_enroll', 'academy_enrollment', v_enrollment_id,
    jsonb_build_object(
      'academy_id', p_academy_id,
      'program_id', p_program_id,
      'program_name', v_program_name,
      'student_name', p_student_name,
      'guardian_phone', p_guardian_phone
    ));

  RETURN jsonb_build_object(
    'enrollment_id', v_enrollment_id,
    'student_id', v_student_id,
    'guardian_id', v_guardian_id,
    'program_name', v_program_name
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cmd_public_enroll FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_public_enroll TO anon, authenticated;

-- ── 4. Missing cmd_create_enrollment / cmd_update_enrollment for admin ────
-- These were referenced by the admin API but never created in migrations

CREATE OR REPLACE FUNCTION public.cmd_create_enrollment(
  p_student_id uuid,
  p_program_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS public.academy_enrollments
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_enrollment public.academy_enrollments;
BEGIN
  INSERT INTO public.academy_enrollments (
    student_id, program_id, start_date, end_date, notes
  ) VALUES (
    p_student_id, p_program_id, p_start_date, p_end_date, p_notes
  ) RETURNING * INTO v_enrollment;

  PERFORM private.write_audit('create_enrollment', 'academy_enrollment', v_enrollment.id,
    jsonb_build_object('student_id', p_student_id, 'program_id', p_program_id));
  RETURN v_enrollment;
END;
$$;

REVOKE ALL ON FUNCTION public.cmd_create_enrollment FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_create_enrollment TO authenticated;

CREATE OR REPLACE FUNCTION public.cmd_update_enrollment(
  p_enrollment_id uuid,
  p_status text DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS public.academy_enrollments
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_enrollment public.academy_enrollments;
BEGIN
  UPDATE public.academy_enrollments SET
    status = COALESCE(p_status, status),
    notes = COALESCE(p_notes, notes),
    updated_at = now()
  WHERE id = p_enrollment_id
  RETURNING * INTO v_enrollment;

  PERFORM private.write_audit('update_enrollment', 'academy_enrollment', v_enrollment.id,
    jsonb_build_object('status', p_status));
  RETURN v_enrollment;
END;
$$;

REVOKE ALL ON FUNCTION public.cmd_update_enrollment FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_update_enrollment TO authenticated;
