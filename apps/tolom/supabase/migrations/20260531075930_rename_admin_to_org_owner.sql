-- Rename the "Admin" system role to "Org Owner" for clarity
-- Phase 1 of RBAC system: administrative users are now "Org Owners"
UPDATE public.roles SET name = 'Org Owner'
WHERE name = 'Admin';
