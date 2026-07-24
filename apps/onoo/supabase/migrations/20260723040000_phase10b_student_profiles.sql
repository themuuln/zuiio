-- ============================================================================
-- Phase 10b — Academy student profiles, guardian info, medical essentials
-- ============================================================================

-- ── Academy guardians ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.academy_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academy_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  relationship text NOT NULL CHECK (relationship IN ('parent', 'grandparent', 'guardian', 'other')),
  is_primary boolean NOT NULL DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS academy_guardians_academy_idx ON public.academy_guardians (academy_id);

ALTER TABLE public.academy_guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY read_academy_guardians ON public.academy_guardians
  FOR SELECT TO authenticated USING (true);
CREATE POLICY write_academy_guardians ON public.academy_guardians
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY update_academy_guardians ON public.academy_guardians
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_academy_guardians ON public.academy_guardians
  FOR DELETE TO authenticated USING (true);

-- ── Academy students ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.academy_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academy_profiles(id) ON DELETE CASCADE,
  canonical_name text NOT NULL,
  name_latin text,
  date_of_birth date,
  photo_url text,
  school_name text,
  grade_level text,
  medical_notes text,
  allergies text[],
  emergency_contact_name text,
  emergency_contact_phone text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'transferred', 'graduated', 'withdrawn')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS academy_students_academy_idx ON public.academy_students (academy_id);
CREATE INDEX IF NOT EXISTS academy_students_name_idx ON public.academy_students USING gin (to_tsvector('simple', canonical_name));

ALTER TABLE public.academy_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY read_academy_students ON public.academy_students
  FOR SELECT TO authenticated USING (true);
CREATE POLICY write_academy_students ON public.academy_students
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY update_academy_students ON public.academy_students
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_academy_students ON public.academy_students
  FOR DELETE TO authenticated USING (true);

-- ── Student-Guardian junction ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.academy_student_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.academy_students(id) ON DELETE CASCADE,
  guardian_id uuid NOT NULL REFERENCES public.academy_guardians(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, guardian_id)
);

CREATE INDEX IF NOT EXISTS academy_student_guardians_student_idx ON public.academy_student_guardians (student_id);
CREATE INDEX IF NOT EXISTS academy_student_guardians_guardian_idx ON public.academy_student_guardians (guardian_id);

ALTER TABLE public.academy_student_guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY read_academy_student_guardians ON public.academy_student_guardians
  FOR SELECT TO authenticated USING (true);
CREATE POLICY write_academy_student_guardians ON public.academy_student_guardians
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY delete_academy_student_guardians ON public.academy_student_guardians
  FOR DELETE TO authenticated USING (true);

-- ── cmd_* functions for student management ────────────────────────────────

CREATE OR REPLACE FUNCTION public.cmd_create_student(
  p_academy_id uuid,
  p_canonical_name text,
  p_name_latin text DEFAULT NULL,
  p_date_of_birth date DEFAULT NULL,
  p_photo_url text DEFAULT NULL,
  p_school_name text DEFAULT NULL,
  p_grade_level text DEFAULT NULL,
  p_medical_notes text DEFAULT NULL,
  p_allergies text[] DEFAULT NULL,
  p_emergency_contact_name text DEFAULT NULL,
  p_emergency_contact_phone text DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS public.academy_students LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE v_student public.academy_students;
BEGIN
  INSERT INTO public.academy_students (
    academy_id, canonical_name, name_latin, date_of_birth, photo_url,
    school_name, grade_level, medical_notes, allergies,
    emergency_contact_name, emergency_contact_phone, notes
  ) VALUES (
    p_academy_id, p_canonical_name, p_name_latin, p_date_of_birth, p_photo_url,
    p_school_name, p_grade_level, p_medical_notes, p_allergies,
    p_emergency_contact_name, p_emergency_contact_phone, p_notes
  ) RETURNING * INTO v_student;

  PERFORM private.write_audit('create_student', 'academy_student', v_student.id,
    jsonb_build_object('academy_id', p_academy_id, 'name', p_canonical_name));
  RETURN v_student;
END;
$$;

REVOKE ALL ON FUNCTION public.cmd_create_student FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_create_student TO authenticated;

CREATE OR REPLACE FUNCTION public.cmd_update_student(
  p_student_id uuid,
  p_canonical_name text DEFAULT NULL,
  p_name_latin text DEFAULT NULL,
  p_date_of_birth date DEFAULT NULL,
  p_photo_url text DEFAULT NULL,
  p_school_name text DEFAULT NULL,
  p_grade_level text DEFAULT NULL,
  p_medical_notes text DEFAULT NULL,
  p_allergies text[] DEFAULT NULL,
  p_emergency_contact_name text DEFAULT NULL,
  p_emergency_contact_phone text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS public.academy_students LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE v_student public.academy_students;
BEGIN
  UPDATE public.academy_students SET
    canonical_name = COALESCE(p_canonical_name, canonical_name),
    name_latin = COALESCE(p_name_latin, name_latin),
    date_of_birth = COALESCE(p_date_of_birth, date_of_birth),
    photo_url = COALESCE(p_photo_url, photo_url),
    school_name = COALESCE(p_school_name, school_name),
    grade_level = COALESCE(p_grade_level, grade_level),
    medical_notes = COALESCE(p_medical_notes, medical_notes),
    allergies = COALESCE(p_allergies, allergies),
    emergency_contact_name = COALESCE(p_emergency_contact_name, emergency_contact_name),
    emergency_contact_phone = COALESCE(p_emergency_contact_phone, emergency_contact_phone),
    status = COALESCE(p_status, status),
    notes = COALESCE(p_notes, notes),
    updated_at = now()
  WHERE id = p_student_id
  RETURNING * INTO v_student;

  IF NOT FOUND THEN RAISE EXCEPTION 'student not found'; END IF;
  PERFORM private.write_audit('update_student', 'academy_student', p_student_id,
    jsonb_build_object('name', p_canonical_name));
  RETURN v_student;
END;
$$;

REVOKE ALL ON FUNCTION public.cmd_update_student FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_update_student TO authenticated;

-- Seed a test student for development
INSERT INTO public.academy_students (academy_id, canonical_name, date_of_birth, school_name)
SELECT id, 'Тест Сурагч', '2012-01-15', '1-р Сургууль'
FROM public.academy_profiles
LIMIT 1
ON CONFLICT DO NOTHING;
