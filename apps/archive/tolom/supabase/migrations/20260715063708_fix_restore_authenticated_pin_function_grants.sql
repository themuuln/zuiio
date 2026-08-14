-- Restore authenticated EXECUTE on PIN-related functions.
-- These are security definer functions (run as postgres), so the authenticated
-- role only needs EXECUTE permission to invoke them. The tighten_function_grants
-- migration incorrectly revoked this, breaking the PIN login flow.

GRANT EXECUTE ON FUNCTION public.set_primary_organization(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_organization_bay_view_pin(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_organization_bay_view_pin(uuid, text) TO authenticated;