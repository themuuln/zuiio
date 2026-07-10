-- Receipt drawer setting for shops that don't show a receipt after checkout.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS has_receipt_drawer BOOLEAN DEFAULT true;
