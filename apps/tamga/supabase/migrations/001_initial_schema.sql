-- ============================================================
-- Tamga — Initial Schema
-- Version: 1 (2026-05-23)
-- 
-- Offline-first horse management for Mongolian horse owners.
-- Every table has created_at/updated_at for sync conflict resolution.
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "moddatetime"; -- updated_at triggers

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name      TEXT NOT NULL,
  phone             TEXT UNIQUE,
  region            TEXT,             -- аймаг/сум
  avatar_url        TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free'
                    CHECK (subscription_tier IN ('free', 'pro', 'breeder', 'stable')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Profile бүртгүүлэхэд автоматаар үүсгэх
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Хэрэглэгч'),
    NEW.phone
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- HORSES
-- ============================================================
CREATE TABLE horses (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  gender                TEXT NOT NULL
                        CHECK (gender IN ('stallion', 'mare', 'gelding', 'foal')),
  coat                  TEXT NOT NULL,
  birth_year            INTEGER NOT NULL CHECK (birth_year >= 1990 AND birth_year <= EXTRACT(YEAR FROM now())),
  microchip_id          TEXT,
  registration_no       TEXT,
  notes                 TEXT DEFAULT '',
  photo_urls            TEXT[] DEFAULT '{}',
  is_owned_by_household BOOLEAN DEFAULT true,
  lineage_root_id       UUID REFERENCES horses(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_horses_owner ON horses(owner_id);
CREATE INDEX idx_horses_name ON horses(name);
CREATE INDEX idx_horses_lineage_root ON horses(lineage_root_id);

CREATE TRIGGER trg_horses_updated_at
  BEFORE UPDATE ON horses
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================
-- PEDIGREE / LINEAGE
-- ============================================================
CREATE TABLE pedigree_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id    UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  parent_id   UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  relation    TEXT NOT NULL CHECK (relation IN ('sire', 'dam')),
  verified    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(horse_id, parent_id)
);

CREATE INDEX idx_pedigree_horse ON pedigree_links(horse_id);
CREATE INDEX idx_pedigree_parent ON pedigree_links(parent_id);

-- INBREEDING COEFFICIENT SUPPORT: pedigree_links дээр cyclic check
CREATE OR REPLACE FUNCTION check_pedigree_cycle()
RETURNS TRIGGER AS $$
BEGIN
  -- 3 үеээс дээш гарахад cyclic байгаа эсэхийг шалгах
  IF EXISTS (
    WITH RECURSIVE ancestors AS (
      SELECT parent_id AS id, 1 AS depth
      FROM pedigree_links WHERE horse_id = NEW.parent_id
      UNION ALL
      SELECT pl.parent_id, a.depth + 1
      FROM pedigree_links pl
      INNER JOIN ancestors a ON pl.horse_id = a.id
      WHERE a.depth < 10
    )
    SELECT 1 FROM ancestors WHERE id = NEW.horse_id
  ) THEN
    RAISE EXCEPTION 'Цус ойртолтын мөчлөг илэрлээ. Pedigree дээр cycle үүсгэх боломжгүй.'
      USING HINT = 'Check pedigree_links for the new pair (horse_id, parent_id)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_pedigree_cycle_check
  BEFORE INSERT ON pedigree_links
  FOR EACH ROW EXECUTE FUNCTION check_pedigree_cycle();

-- ============================================================
-- HEALTH LOGS (vaccination, deworming, treatment, vet visit)
-- ============================================================
CREATE TABLE health_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id    UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  log_type    TEXT NOT NULL CHECK (log_type IN (
                'vaccination', 'deworming', 'treatment', 'vet_visit'
              )),
  date        DATE NOT NULL,
  notes       TEXT,
  medicament  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_health_horse ON health_logs(horse_id);
CREATE INDEX idx_health_date ON health_logs(date);
CREATE INDEX idx_health_type ON health_logs(log_type);

CREATE TRIGGER trg_health_logs_updated_at
  BEFORE UPDATE ON health_logs
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================
-- FARRIER LOGS (shoeing, trimming, treatment)
-- ============================================================
CREATE TABLE farrier_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id      UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  log_type      TEXT NOT NULL CHECK (log_type IN (
                  'shoeing', 'trimming', 'treatment'
                )),
  date          DATE NOT NULL,
  notes         TEXT,
  cost          INTEGER CHECK (cost IS NULL OR cost >= 0),  -- төгрөгөөр
  farrier_name  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_farrier_horse ON farrier_logs(horse_id);
CREATE INDEX idx_farrier_date ON farrier_logs(date);

CREATE TRIGGER trg_farrier_logs_updated_at
  BEFORE UPDATE ON farrier_logs
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================
-- REMINDERS (recurring schedules)
-- ============================================================
CREATE TABLE reminder_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id        UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  owner_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reminder_type   TEXT NOT NULL CHECK (reminder_type IN (
                    'vaccination', 'deworming', 'farrier', 'registration'
                  )),
  interval_days   INTEGER NOT NULL CHECK (interval_days > 0),
  last_done       DATE,
  next_due        DATE NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reminders_horse ON reminder_templates(horse_id);
CREATE INDEX idx_reminders_next_due ON reminder_templates(next_due)
  WHERE is_active = true;

CREATE TRIGGER trg_reminders_updated_at
  BEFORE UPDATE ON reminder_templates
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================
-- DOCUMENTS (vault)
-- ============================================================
CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id      UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  owner_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doc_type      TEXT NOT NULL CHECK (doc_type IN (
                  'vet_cert', 'insurance', 'registration', 'microchip', 'other'
                )),
  title         TEXT NOT NULL,
  storage_path  TEXT NOT NULL,  -- Supabase Storage bucket path
  file_size     BIGINT CHECK (file_size IS NULL OR file_size >= 0), -- bytes
  mime_type     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_horse ON documents(horse_id);
CREATE INDEX idx_documents_owner ON documents(owner_id);

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================
-- EVENTS / TOURNAMENTS
-- ============================================================
CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id        UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  owner_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL CHECK (event_type IN (
                    'race', 'competition', 'exhibition', 'training'
                  )),
  title           TEXT NOT NULL,
  location        TEXT,
  date            DATE NOT NULL,
  result          TEXT,
  prize_amount    INTEGER CHECK (prize_amount IS NULL OR prize_amount >= 0),
  notes           TEXT,
  photo_urls      TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_horse ON events(horse_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_type ON events(event_type);

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================
-- MARKETPLACE
-- ============================================================
CREATE TABLE market_listings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id          UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  seller_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  price_amount      INTEGER NOT NULL CHECK (price_amount >= 0),
  currency          TEXT NOT NULL DEFAULT 'MNT'
                    CHECK (currency IN ('MNT', 'USD')),
  sale_type         TEXT NOT NULL CHECK (sale_type IN ('sale', 'lease', 'trade')),
  status            TEXT NOT NULL DEFAULT 'published'
                    CHECK (status IN ('draft', 'published', 'withdrawn', 'sold')),
  location_label    TEXT,
  discipline_tags   TEXT[] DEFAULT '{}',
  media_urls        TEXT[] DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_market_status ON market_listings(status)
  WHERE status = 'published';
CREATE INDEX idx_market_seller ON market_listings(seller_id);
CREATE INDEX idx_market_price ON market_listings(price_amount);
CREATE INDEX idx_market_location ON market_listings(location_label);

CREATE TRIGGER trg_market_listings_updated_at
  BEFORE UPDATE ON market_listings
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================
-- CO-OWNERSHIP
-- ============================================================
CREATE TABLE co_ownerships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horse_id    UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  owner_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_pct   INTEGER NOT NULL CHECK (share_pct > 0 AND share_pct <= 100),
  role        TEXT DEFAULT 'owner',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(horse_id, owner_id)
);

CREATE INDEX idx_coownership_horse ON co_ownerships(horse_id);
CREATE INDEX idx_coownership_owner ON co_ownerships(owner_id);

CREATE TRIGGER trg_co_ownerships_updated_at
  BEFORE UPDATE ON co_ownerships
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Нэг моринд эздийн хувь нийлбэр 100-аас хэтрэхгүй байх
CREATE OR REPLACE FUNCTION check_ownership_total()
RETURNS TRIGGER AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(share_pct), 0) INTO total
  FROM co_ownerships
  WHERE horse_id = NEW.horse_id;
  IF total > 100 THEN
    RAISE EXCEPTION 'Эздийн хувь нийлбэр % -аар 100-аас хэтэрсэн', total;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_coownership_total_check
  AFTER INSERT OR UPDATE ON co_ownerships
  FOR EACH ROW EXECUTE FUNCTION check_ownership_total();

-- ============================================================
-- SUBSCRIPTIONS (managed server-side, verified via webhook)
-- ============================================================
CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
                  UNIQUE,
  tier            TEXT NOT NULL CHECK (tier IN ('pro', 'breeder', 'stable')),
  store_platform  TEXT NOT NULL CHECK (store_platform IN ('appstore', 'playstore')),
  store_tx_id     TEXT NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_active ON subscriptions(profile_id)
  WHERE is_active = true;

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE horses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedigree_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE farrier_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_ownerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles: зөвхөн өөрийн profile-г харна
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Horses: эзэн эсвэл co-owner харна
CREATE POLICY "Horses select for owner or co-owner"
  ON horses FOR SELECT
  USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT horse_id FROM co_ownerships WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Horses insert by owner"
  ON horses FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Horses update by owner"
  ON horses FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Horses delete by owner"
  ON horses FOR DELETE
  USING (owner_id = auth.uid());

-- Бусад table: өөрийн өгөгдөл эсвэл co-owner-ийн
-- (Template pattern — co-ownership check-ийг давтаж болохгүйн тулд
--  ирээдүйд Supabase Multi-tenant extension эсвэл helper function ашиглаж болно)

CREATE POLICY "Pedigree select for horse owner"
  ON pedigree_links FOR SELECT
  USING (
    horse_id IN (SELECT id FROM horses WHERE owner_id = auth.uid())
    OR horse_id IN (
      SELECT co.horse_id FROM co_ownerships co WHERE co.owner_id = auth.uid()
    )
  );

CREATE POLICY "Health logs select for horse owner"
  ON health_logs FOR SELECT
  USING (
    horse_id IN (SELECT id FROM horses WHERE owner_id = auth.uid())
    OR horse_id IN (
      SELECT co.horse_id FROM co_ownerships co WHERE co.owner_id = auth.uid()
    )
  );

-- Marketplace: published бүгд харна, засах/устгах зөвхөн seller
CREATE POLICY "Market listings select published for all"
  ON market_listings FOR SELECT
  USING (status = 'published' OR seller_id = auth.uid());

CREATE POLICY "Market listings insert by seller"
  ON market_listings FOR INSERT
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Market listings update by seller"
  ON market_listings FOR UPDATE
  USING (seller_id = auth.uid());

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('horse-photos', 'horse-photos', true),
  ('documents', 'documents', false),
  ('market-media', 'market-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Horse photos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'horse-photos');

CREATE POLICY "Horse photos insert by owner"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'horse-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Documents select by owner"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Market media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'market-media');

-- ============================================================
-- SUBSCRIPTION TIER ENFORCEMENT (Edge Functions эсвэл API Gateway-д)
-- ============================================================
-- Free tier: зөвхөн 1 horse
CREATE OR REPLACE FUNCTION check_free_tier_horse_limit()
RETURNS TRIGGER AS $$
DECLARE
  tier TEXT;
  count INTEGER;
BEGIN
  SELECT subscription_tier INTO tier
  FROM profiles WHERE id = NEW.owner_id;

  IF tier = 'free' THEN
    SELECT COUNT(*) INTO count
    FROM horses WHERE owner_id = NEW.owner_id;
    IF count >= 1 THEN
      RAISE EXCEPTION 'Free багцад зөвхөн 1 морь бүртгэх боломжтой. Pro багц руу шинэчилнэ үү.'
        USING ERRCODE = '22000';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_free_tier_horse_limit
  BEFORE INSERT ON horses
  FOR EACH ROW EXECUTE FUNCTION check_free_tier_horse_limit();
