-- Update get_public_stats to return landing page metrics
-- shops: active organizations
-- vehiclesServiced: total work orders
-- satisfaction: avg customer satisfaction * 20 (to %) or default 98

CREATE OR REPLACE FUNCTION public.get_public_stats()
 RETURNS json
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT json_build_object(
    'shops', (SELECT count(*) FROM organizations WHERE is_active = true AND deleted_at IS NULL),
    'vehiclesServiced', (SELECT count(*) FROM work_orders WHERE deleted_at IS NULL),
    'satisfaction', (
      CASE
        WHEN (SELECT count(*) FROM service_completion_data WHERE customer_satisfaction IS NOT NULL) > 0
        THEN ROUND((SELECT avg(customer_satisfaction) * 20 FROM service_completion_data WHERE customer_satisfaction IS NOT NULL)::numeric, 0)::int
        ELSE 98
      END
    )
  );
$function$;
