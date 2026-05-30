-- Add global_service_id reference to service_catalog
ALTER TABLE service_catalog
  ADD COLUMN global_service_id UUID REFERENCES global_services_catalog(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_service_catalog_global_service
  ON service_catalog(global_service_id);

-- Prevent duplicate forks of the same global service within the same organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_catalog_org_global_service
  ON service_catalog(organization_id, global_service_id)
  WHERE deleted_at IS NULL;
