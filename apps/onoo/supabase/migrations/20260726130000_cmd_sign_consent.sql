-- ============================================================================
-- Phase 11 step: cmd_sign_consent / cmd_withdraw_consent SECURITY DEFINER
-- functions, hardened RLS for guardian self-service consent signing.
-- ============================================================================

-- ── 1. cmd_sign_consent ─────────────────────────────────────────────────────
-- Guardian signs a consent template for their child via the authenticated
-- session. Validates authority + template existence + no duplicate active sign.

CREATE OR REPLACE FUNCTION public.cmd_sign_consent(
  p_template_id uuid,
  p_student_id uuid,
  p_signed_text text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_guardian_id uuid;
  v_guardian_name text;
  v_guardian_phone text;
  v_template public.academy_consent_templates;
  v_record_id uuid;
  v_ip inet;
BEGIN
  -- 1. Resolve the authenticated guardian who is verified for this student
  SELECT ag.id, ag.name, ag.phone
    INTO v_guardian_id, v_guardian_name, v_guardian_phone
  FROM public.academy_guardians ag
  JOIN public.academy_student_guardians sg ON sg.guardian_id = ag.id
  WHERE ag.user_id = (SELECT auth.uid())
    AND sg.student_id = p_student_id
    AND sg.authority_status = 'verified';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ONOO_NOT_AUTHORIZED: Та энэ хүүхдийн асран хамгаалагч эсэхийг баталгаажуулаагүй байна.';
  END IF;

  -- 2. Verify the template exists, is active, and belongs to the child's academy
  SELECT * INTO v_template
  FROM public.academy_consent_templates
  WHERE id = p_template_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ONOO_TEMPLATE_NOT_FOUND: Зөвшөөрлийн загвар олдсонгүй эсвэл идэвхгүй байна.';
  END IF;

  -- 3. Verify template academy matches student's academy
  IF NOT EXISTS (
    SELECT 1 FROM public.academy_students
    WHERE id = p_student_id AND academy_id = v_template.academy_id
  ) THEN
    RAISE EXCEPTION 'ONOO_MISMATCH: Зөвшөөрлийн загвар энэ хүүхдэд хамаарахгүй байна.';
  END IF;

  -- 4. Prevent duplicate active signatures for the same template + student
  IF EXISTS (
    SELECT 1 FROM public.academy_consent_records
    WHERE template_id = p_template_id
      AND student_id = p_student_id
      AND is_withdrawn = false
  ) THEN
    RAISE EXCEPTION 'ONOO_ALREADY_SIGNED: Та аль хэдийн энэ зөвшөөрөлд гарын үсэг зурсан байна.';
  END IF;

  -- 5. Capture client IP from the request context if available
  BEGIN
    v_ip := inet(current_setting('request.headers')::json ->> 'x-forwarded-for');
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
  END;

  -- 6. Insert the signed consent record
  INSERT INTO public.academy_consent_records
    (template_id, student_id, guardian_id, signed_text, ip_address)
  VALUES
    (p_template_id, p_student_id, v_guardian_id,
     COALESCE(p_signed_text, v_guardian_name), v_ip)
  RETURNING id INTO v_record_id;

  RETURN jsonb_build_object(
    'record_id', v_record_id,
    'template_id', p_template_id,
    'student_id', p_student_id,
    'status', 'signed'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cmd_sign_consent FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_sign_consent TO authenticated;

COMMENT ON FUNCTION public.cmd_sign_consent IS
  'Академийн зөвшөөрлийн загварт асран хамгаалагч гарын үсэг зурах. Зөвхөн баталгаажуулсан асран хамгаалагч өөрийн хүүхдийн зөвшөөрөлд гарын үсэг зурж болно.';

-- ── 2. cmd_withdraw_consent ───────────────────────────────────────────────────
-- Guardian withdraws a previously-signed consent record.
-- Only the guardian who signed (or another verified guardian of the same
-- student) may withdraw.

CREATE OR REPLACE FUNCTION public.cmd_withdraw_consent(
  p_record_id uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_student_id uuid;
  v_is_guardian boolean;
BEGIN
  -- 1. Verify the user is a verified guardian of the student this record
  --    belongs to
  SELECT s.id INTO v_student_id
  FROM public.academy_consent_records r
  JOIN public.academy_students s ON s.id = r.student_id
  WHERE r.id = p_record_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ONOO_RECORD_NOT_FOUND: Зөвшөөрлийн бүртгэл олдсонгүй.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.academy_guardians ag
    JOIN public.academy_student_guardians sg ON sg.guardian_id = ag.id
    WHERE ag.user_id = (SELECT auth.uid())
      AND sg.student_id = v_student_id
      AND sg.authority_status = 'verified'
  ) INTO v_is_guardian;

  IF NOT v_is_guardian THEN
    RAISE EXCEPTION 'ONOO_NOT_AUTHORIZED: Та энэ хүүхдийн баталгаажуулсан асран хамгаалагч биш байна.';
  END IF;

  -- 2. Verify the record is currently active (not already withdrawn)
  IF EXISTS (
    SELECT 1 FROM public.academy_consent_records
    WHERE id = p_record_id AND is_withdrawn = true
  ) THEN
    RAISE EXCEPTION 'ONOO_ALREADY_WITHDRAWN: Энэ зөвшөөрөл аль хэдийн татагдсан байна.';
  END IF;

  -- 3. Withdraw the consent record
  UPDATE public.academy_consent_records
  SET is_withdrawn = true, withdrawn_at = now()
  WHERE id = p_record_id;

  RETURN jsonb_build_object(
    'record_id', p_record_id,
    'status', 'withdrawn',
    'withdrawn_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cmd_withdraw_consent FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cmd_withdraw_consent TO authenticated;

COMMENT ON FUNCTION public.cmd_withdraw_consent IS
  'Өмнө зурсан зөвшөөрлөө татах. Зөвхөн баталгаажуулсан асран хамгаалагч өөрийн хүүхдийн зөвшөөрлийг татаж болно.';
