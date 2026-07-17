CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  horse_id UUID NOT NULL REFERENCES horses(id),
  listing_type TEXT NOT NULL CHECK (listing_type IN ('sale', 'lease', 'stud')),
  price_mnt BIGINT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired')),
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active listings
CREATE POLICY "Listings view active" ON public.listings
  FOR SELECT USING (status = 'active' OR seller_id = auth.uid());

-- Sellers can manage their own (with dev bypass)
CREATE POLICY "Listings manage own" ON public.listings
  FOR ALL USING (
    seller_id = '11111111-1111-1111-1111-111111111111'
    OR seller_id = auth.uid()
  );
