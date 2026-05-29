-- Allow authenticated users to insert new car brands and models
-- These are global reference tables — any user can add custom entries.

CREATE POLICY "car_brands_insert_auth" ON public.car_brands
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "car_models_insert_auth" ON public.car_models
  FOR INSERT TO authenticated WITH CHECK (true);
