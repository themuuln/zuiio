-- Ownership transfers table
CREATE TABLE IF NOT EXISTS ownership_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  horse_id UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  from_owner_id UUID NOT NULL REFERENCES auth.users(id),
  to_owner_id UUID REFERENCES auth.users(id),
  to_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'cancelled'
  transfer_code TEXT NOT NULL, -- 6-digit code for verification
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE ownership_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dev: transfers select" ON public.ownership_transfers
  FOR SELECT USING (
    from_owner_id = '11111111-1111-1111-1111-111111111111'
    OR to_owner_id = '11111111-1111-1111-1111-111111111111'
    OR from_owner_id = auth.uid()
    OR to_owner_id = auth.uid()
  );

CREATE POLICY "Dev: transfers insert" ON public.ownership_transfers
  FOR INSERT WITH CHECK (
    from_owner_id = '11111111-1111-1111-1111-111111111111'
    OR from_owner_id = auth.uid()
  );

CREATE POLICY "Dev: transfers update" ON public.ownership_transfers
  FOR UPDATE USING (
    from_owner_id = '11111111-1111-1111-1111-111111111111'
    OR to_owner_id = '11111111-1111-1111-1111-111111111111'
    OR from_owner_id = auth.uid()
    OR to_owner_id = auth.uid()
  );

-- Index for efficient lookups
CREATE INDEX idx_ownership_transfers_from_owner ON ownership_transfers(from_owner_id);
CREATE INDEX idx_ownership_transfers_to_owner ON ownership_transfers(to_owner_id);
CREATE INDEX idx_ownership_transfers_horse ON ownership_transfers(horse_id);
CREATE INDEX idx_ownership_transfers_status ON ownership_transfers(status);
