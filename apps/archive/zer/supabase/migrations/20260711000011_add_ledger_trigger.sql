-- Prevent UPDATE/DELETE on customer_account_entries via trigger
-- (defense-in-depth: RLS already omits UPDATE/DELETE policies)
CREATE OR REPLACE FUNCTION public.prevent_ledger_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'customer_account_entries is append-only';
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_cae_no_update
  BEFORE UPDATE ON public.customer_account_entries
  FOR EACH ROW EXECUTE FUNCTION public.prevent_ledger_mutation();

CREATE TRIGGER trg_cae_no_delete
  BEFORE DELETE ON public.customer_account_entries
  FOR EACH ROW EXECUTE FUNCTION public.prevent_ledger_mutation();
