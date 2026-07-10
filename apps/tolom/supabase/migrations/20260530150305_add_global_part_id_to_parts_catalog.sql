-- Add global_part_id reference to parts_catalog
ALTER TABLE parts_catalog
  ADD COLUMN global_part_id UUID REFERENCES global_parts_catalog(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_parts_catalog_global_part
  ON parts_catalog(global_part_id);

-- Prevent duplicate forks of the same global part within the same organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_parts_catalog_org_global_part
  ON parts_catalog(organization_id, global_part_id)
  WHERE deleted_at IS NULL;
