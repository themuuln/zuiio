-- ============================================================================
-- Academy profiles — Phase 10a Academy foundation MVP
-- ============================================================================

-- Extends organizations for academy-specific settings
CREATE TABLE IF NOT EXISTS public.academy_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  logo_url text,
  contact_phone text,
  contact_email text,
  timezone text DEFAULT 'Asia/Ulaanbaatar',
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (organization_id)
);

-- Programs/courses offered by an academy
CREATE TABLE IF NOT EXISTS public.academy_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academy_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  age_group text,
  price_mnt numeric(10,2),
  duration_weeks smallint,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Trainers/coaches
CREATE TABLE IF NOT EXISTS public.academy_trainers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academy_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  photo_url text,
  specialties text[],
  bio text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Locations/courts
CREATE TABLE IF NOT EXISTS public.academy_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academy_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  city text,
  hours text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- RLS: authenticated users can read; admin write done through commands
ALTER TABLE public.academy_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_locations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all academy data (admin filter done in app)
CREATE POLICY read_academy_profiles ON public.academy_profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY read_academy_programs ON public.academy_programs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY read_academy_trainers ON public.academy_trainers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY read_academy_locations ON public.academy_locations
  FOR SELECT TO authenticated USING (true);

-- Admin writes handled via SECURITY DEFINER commands (Phase 10a+)
-- For now, allow authenticated insert/update/delete (admin-only routes)
-- TODO(10a): Replace with cmd_* functions for production
CREATE POLICY write_academy_profiles ON public.academy_profiles
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY update_academy_profiles ON public.academy_profiles
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY write_academy_programs ON public.academy_programs
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY update_academy_programs ON public.academy_programs
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_academy_programs ON public.academy_programs
  FOR DELETE TO authenticated USING (true);
CREATE POLICY write_academy_trainers ON public.academy_trainers
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY update_academy_trainers ON public.academy_trainers
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_academy_trainers ON public.academy_trainers
  FOR DELETE TO authenticated USING (true);
CREATE POLICY write_academy_locations ON public.academy_locations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY update_academy_locations ON public.academy_locations
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY delete_academy_locations ON public.academy_locations
  FOR DELETE TO authenticated USING (true);

-- Seed a default academy profile for development
INSERT INTO public.academy_profiles (organization_id, name)
SELECT id, 'Тест Академи'
FROM public.organizations
LIMIT 1
ON CONFLICT (organization_id) DO NOTHING;
