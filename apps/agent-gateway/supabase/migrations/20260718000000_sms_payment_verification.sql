-- SMS Payment Verification system
-- Receives SMS from Android forwarder, parses with AI, matches against pending payments

-- Received SMS messages from Android forwarder
CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,           -- SMS sender (e.g., 'KhanBank', 'Golomt')
  message TEXT NOT NULL,          -- Raw SMS text
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  parsed JSONB,                  -- AI-parsed fields: { amount, sender_name, reference, bank, type }
  parsed_at TIMESTAMPTZ,
  parse_error TEXT,               -- If AI parsing failed
  matched_payment_id UUID,       -- Link to sms_payments if matched
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Parsed payment records (one per verified payment)
CREATE TABLE IF NOT EXISTS sms_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  sms_message_id UUID REFERENCES sms_messages(id),
  bank TEXT NOT NULL,             -- 'khanbank', 'golomt', 'tdb', etc.
  amount NUMERIC NOT NULL,        -- Payment amount in MNT
  sender_name TEXT,               -- Who sent the money
  sender_account TEXT,            -- Sender account number (if available)
  reference TEXT,                 -- Invoice/order reference
  transaction_type TEXT DEFAULT 'incoming', -- 'incoming' or 'outgoing'
  status TEXT NOT NULL DEFAULT 'pending',   -- 'pending', 'matched', 'confirmed', 'rejected'
  matched_invoice_id TEXT,        -- External invoice ID if matched
  confidence NUMERIC,            -- AI match confidence 0-1
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SMS parsing templates (per-bank regex patterns)
CREATE TABLE IF NOT EXISTS sms_parsing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank TEXT NOT NULL,             -- 'khanbank', 'golomt', etc.
  sender_pattern TEXT NOT NULL,   -- Regex to match SMS sender
  amount_pattern TEXT,            -- Regex to extract amount
  reference_pattern TEXT,         -- Regex to extract reference
  sender_name_pattern TEXT,       -- Regex to extract sender name
  example_sms TEXT,               -- Example SMS for documentation
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sms_messages_org ON sms_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_received ON sms_messages(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_payments_org ON sms_payments(org_id);
CREATE INDEX IF NOT EXISTS idx_sms_payments_status ON sms_payments(status);
CREATE INDEX IF NOT EXISTS idx_sms_payments_amount ON sms_payments(amount);

-- RLS policies
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_parsing_templates ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "service_all_sms_messages" ON sms_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all_sms_payments" ON sms_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all_sms_templates" ON sms_parsing_templates FOR ALL USING (true) WITH CHECK (true);

-- Seed Khan Bank SMS template (example - update with real SMS format)
INSERT INTO sms_parsing_templates (bank, sender_pattern, example_sms)
VALUES (
  'khanbank',
  '^(KhanBank|Khan Bank|Хаан Банк)',
  'Таны дансанд 100,000₮ орлого орлоо. Илгээгч: БАТ-ЭРДЭНЭ. Утга: ИНВОЙС-1234. Үлдэгдэл: 500,000₮'
)
ON CONFLICT DO NOTHING;
