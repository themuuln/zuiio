-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

-- Also verify the function is accessible to the API role
GRANT EXECUTE ON FUNCTION public.get_full_dashboard_data(uuid, text, uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_full_dashboard_data(uuid, text, uuid, date, date) TO service_role;