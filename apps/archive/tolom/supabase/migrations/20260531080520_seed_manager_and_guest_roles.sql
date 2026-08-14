-- Seed Manager and Guest roles for all existing organizations
-- These are system roles that don't exist yet for orgs created before this migration

INSERT INTO public.roles (
    organization_id, name, description, is_system, created_by, updated_by
)
SELECT
    o.id,
    r.name,
    r.description,
    true,
    o.created_by,
    o.created_by
FROM public.organizations AS o
CROSS JOIN (
    VALUES
    (
        'Manager',
        'Day-to-day operations manager with access to reports and approvals'
    ),
    ('Guest', 'External invoice viewer with limited portal access')
) AS r (name, description)
WHERE NOT EXISTS (
    SELECT 1 FROM public.roles
    WHERE organization_id = o.id AND name = r.name
)
AND o.deleted_at IS null;
