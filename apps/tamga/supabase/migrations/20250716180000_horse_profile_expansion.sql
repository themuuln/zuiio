-- Horse profile expansion: add parent linkage, Mongolian-specific fields,
-- and restore missing fields for offline cache parity.
--
-- All new columns are nullable for backward compatibility.

-- Parent lineage linkage (self-referencing FKs)
ALTER TABLE horses ADD COLUMN IF NOT EXISTS sire_id UUID REFERENCES horses(id);
ALTER TABLE horses ADD COLUMN IF NOT EXISTS dam_id UUID REFERENCES horses(id);

-- Mongolian-specific fields
ALTER TABLE horses ADD COLUMN IF NOT EXISTS coat_color TEXT;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS breed_lineage TEXT;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS "sum" TEXT;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS markings JSONB;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS tamga_brand_clan TEXT;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS tamga_brand_generation INT;

-- Restore fields missing from Supabase (present in Dart model but no column)
ALTER TABLE horses ADD COLUMN IF NOT EXISTS registration_date TIMESTAMPTZ;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS tamga_verified BOOLEAN DEFAULT false;
ALTER TABLE horses ADD COLUMN IF NOT EXISTS state_verified BOOLEAN DEFAULT false;

-- Indexes for parent linkage lookups
CREATE INDEX IF NOT EXISTS idx_horses_sire_id ON horses(sire_id);
CREATE INDEX IF NOT EXISTS idx_horses_dam_id ON horses(dam_id);
CREATE INDEX IF NOT EXISTS idx_horses_breed_lineage ON horses(breed_lineage);
CREATE INDEX IF NOT EXISTS idx_horses_region ON horses(region);
