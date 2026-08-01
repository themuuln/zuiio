-- Tamga: Add remaining tables for Flutter→RN migration
-- Applied via Supabase MCP on 2026-07-17

-- Lost horse reports
CREATE TABLE IF NOT EXISTS lost_horses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id),
  horse_id UUID REFERENCES horses(id),
  horse_name TEXT NOT NULL,
  description TEXT,
  last_seen_lat DOUBLE PRECISION,
  last_seen_lng DOUBLE PRECISION,
  last_seen_location TEXT,
  contact_phone TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'lost',
  reward_amount NUMERIC DEFAULT 0,
  sighting_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lost_horses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all lost horses" ON lost_horses FOR SELECT USING (true);
CREATE POLICY "Users can insert their own lost horses" ON lost_horses FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their own lost horses" ON lost_horses FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete their own lost horses" ON lost_horses FOR DELETE USING (auth.uid() = owner_id);

-- Co-ownership
CREATE TABLE IF NOT EXISTS co_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID REFERENCES horses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT DEFAULT 'viewer',
  invited_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE co_owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Horse owners can view co-owners" ON co_owners FOR SELECT USING (
  horse_id IN (SELECT id FROM horses WHERE owner_id = auth.uid())
  OR user_id = auth.uid()
);
CREATE POLICY "Horse owners can manage co-owners" ON co_owners FOR ALL USING (
  horse_id IN (SELECT id FROM horses WHERE owner_id = auth.uid())
);

-- Digital certificates
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id UUID REFERENCES horses(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  issued_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view certificates for their horses" ON certificates FOR SELECT USING (
  horse_id IN (SELECT id FROM horses WHERE owner_id = auth.uid())
);
CREATE POLICY "Users can manage certificates for their horses" ON certificates FOR ALL USING (
  owner_id = auth.uid()
);

-- Tournament profiles
CREATE TABLE IF NOT EXISTS tournament_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  horse_id UUID REFERENCES horses(id),
  tournament_name TEXT NOT NULL,
  placement TEXT,
  date DATE,
  notes TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tournament_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public tournament profiles" ON tournament_profiles FOR SELECT USING (is_public = true);
CREATE POLICY "Users can manage their own tournament profiles" ON tournament_profiles FOR ALL USING (auth.uid() = user_id);

-- Listing boosts
CREATE TABLE IF NOT EXISTS listing_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  tier TEXT DEFAULT 'featured',
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  payment_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE listing_boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own boosts" ON listing_boosts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own boosts" ON listing_boosts FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_lost_horses_status ON lost_horses(status);
CREATE INDEX idx_lost_horses_owner ON lost_horses(owner_id);
CREATE INDEX idx_co_owners_horse ON co_owners(horse_id);
CREATE INDEX idx_co_owners_user ON co_owners(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_horse_id ON certificates(horse_id);
CREATE INDEX idx_tournament_profiles_user ON tournament_profiles(user_id);
CREATE INDEX idx_tournament_profiles_horse ON tournament_profiles(horse_id);
CREATE INDEX idx_listing_boosts_listing ON listing_boosts(listing_id);
CREATE INDEX idx_listing_boosts_user ON listing_boosts(user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_lost_horses_updated_at BEFORE UPDATE ON lost_horses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
