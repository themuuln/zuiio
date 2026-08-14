-- Explicitly revoke direct anonymous execution from existing Supabase ACLs.
REVOKE EXECUTE ON FUNCTION public.redeem_gift_card(UUID, UUID, NUMERIC, UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.evaluate_promotions(UUID, JSONB, NUMERIC) FROM anon;
