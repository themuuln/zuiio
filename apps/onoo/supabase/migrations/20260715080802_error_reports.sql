-- Task 2.10: Public error reports
CREATE TABLE IF NOT EXISTS public.public_error_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
  player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  message text NOT NULL CHECK (char_length(message) BETWEEN 5 AND 500),
  contact text,
  created_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  reporter_hash text NOT NULL
);

-- RLS: no public select; insert only via SECURITY DEFINER function
ALTER TABLE public.public_error_reports ENABLE ROW LEVEL SECURITY;

-- Security definer function with rate limiting
CREATE OR REPLACE FUNCTION public.cmd_report_public_error(
  p_game_id uuid,
  p_player_id uuid,
  p_message text,
  p_contact text,
  p_reporter_hash text
) RETURNS public.public_error_reports
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_today_count bigint;
  v_report public.public_error_reports;
BEGIN
  -- Rate limit: max 5 reports per reporter_hash per day
  SELECT count(*) INTO v_today_count
  FROM public.public_error_reports
  WHERE reporter_hash = p_reporter_hash
    AND created_at >= (now() AT TIME ZONE 'UTC')::date;

  IF v_today_count >= 5 THEN
    RAISE EXCEPTION 'Too many reports today';
  END IF;

  INSERT INTO public.public_error_reports (game_id, player_id, message, contact, reporter_hash)
  VALUES (p_game_id, p_player_id, p_message, p_contact, p_reporter_hash)
  RETURNING * INTO v_report;

  RETURN v_report;
END;
$$;

-- Grant execute to anon (public endpoint)
GRANT EXECUTE ON FUNCTION public.cmd_report_public_error TO anon;
