-- =============================================
-- Gift Cards System
--
-- Prepaid gift cards with balance tracking.
-- Separate from gift_options (packaging add-ons).
-- =============================================

-- =============================================
-- 1. Add gift card permissions to app_permission enum
-- =============================================
DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'gift_cards.create';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'gift_cards.read';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'gift_cards.update';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'gift_cards.delete';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 2. Gift Cards table
-- =============================================
CREATE TABLE IF NOT EXISTS public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  initial_balance NUMERIC(12, 2) NOT NULL CHECK (initial_balance > 0),
  current_balance NUMERIC(12, 2) NOT NULL CHECK (current_balance >= 0),
  currency_code TEXT NOT NULL DEFAULT 'MNT',
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  recipient_name TEXT,
  recipient_email TEXT,
  sender_name TEXT,
  message TEXT,
  issued_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, code)
);

-- =============================================
-- 3. Gift Card Transactions (top-ups, redemptions)
-- =============================================
CREATE TABLE IF NOT EXISTS public.gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('issuance', 'topup', 'redemption', 'expiry', 'adjustment')),
  amount NUMERIC(12, 2) NOT NULL,
  balance_before NUMERIC(12, 2) NOT NULL,
  balance_after NUMERIC(12, 2) NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  note TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- 4. Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_gift_cards_org ON public.gift_cards(organization_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON public.gift_cards(organization_id, code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_active ON public.gift_cards(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_gct_gift_card ON public.gift_card_transactions(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_gct_org ON public.gift_card_transactions(organization_id);

-- =============================================
-- 5. RLS
-- =============================================
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;


-- =============================================
-- 6. Function: validate and redeem gift card
-- =============================================
CREATE OR REPLACE FUNCTION public.redeem_gift_card(
  p_gift_card_id UUID,
  p_organization_id UUID,
  p_amount NUMERIC,
  p_sale_id UUID,
  p_user_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_redeem_amount NUMERIC;
BEGIN
  -- Lock the gift card row for update
  SELECT current_balance INTO v_current_balance
  FROM public.gift_cards
  WHERE id = p_gift_card_id
    AND organization_id = p_organization_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Бэлгийн карт олдсонгүй эсвэл идэвхгүй байна.');
  END IF;

  v_redeem_amount := LEAST(p_amount, v_current_balance);

  -- Update balance
  UPDATE public.gift_cards
  SET current_balance = v_current_balance - v_redeem_amount
  WHERE id = p_gift_card_id;

  -- Record transaction
  INSERT INTO public.gift_card_transactions
    (gift_card_id, organization_id, transaction_type, amount, balance_before, balance_after, reference_type, reference_id, created_by)
  VALUES
    (p_gift_card_id, p_organization_id, 'redemption', v_redeem_amount, v_current_balance, v_current_balance - v_redeem_amount, 'sale', p_sale_id, p_user_id);

  RETURN json_build_object(
    'success', true,
    'redeemed_amount', v_redeem_amount,
    'remaining_balance', v_current_balance - v_redeem_amount
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_gift_card(UUID, UUID, NUMERIC, UUID, UUID) TO authenticated;

-- =============================================
-- 7. Grants
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_cards TO authenticated;
GRANT SELECT, INSERT ON public.gift_card_transactions TO authenticated;
