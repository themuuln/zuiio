-- subscription_history: захиалгын түвшин өөрчлөлтийн түүх.
-- Subscription tier change audit trail.

CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_tier TEXT CHECK (old_tier IN ('free', 'pro', 'breeder', 'stable')),
  new_tier TEXT NOT NULL CHECK (new_tier IN ('free', 'pro', 'breeder', 'stable')),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_reason TEXT DEFAULT 'manual',
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_sub_history_user ON subscription_history(user_id);
