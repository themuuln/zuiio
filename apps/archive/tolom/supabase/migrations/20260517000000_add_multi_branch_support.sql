-- 20260517000000_add_multi_branch_support.sql
-- Multi-branch support: branch limits, inter-branch transfers, branch-level RLS
-- Uses existing get_user_organization_id() helper from phase0 foundation

-- 1. Add branch_limit to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS branch_limit INT NOT NULL DEFAULT 1;

-- 2. Add is_active to branches
ALTER TABLE branches ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 3. Create stock_transfers table
CREATE TABLE IF NOT EXISTS stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  from_branch_id UUID REFERENCES branches(id),
  to_branch_id UUID NOT NULL REFERENCES branches(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_transit', 'received', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID NOT NULL,
  approved_by UUID,
  received_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- 4. Create stock_transfer_items table
CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts_catalog(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create branch_user_permissions table
CREATE TABLE IF NOT EXISTS branch_user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  user_id UUID NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT true,
  can_manage_users BOOLEAN NOT NULL DEFAULT false,
  can_view_other_branches BOOLEAN NOT NULL DEFAULT false,
  can_approve_transfers BOOLEAN NOT NULL DEFAULT false,
  can_override_discounts BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, branch_id, user_id)
);

-- 6. Enable RLS on new tables
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_user_permissions ENABLE ROW LEVEL SECURITY;

-- 7. Branch-level RLS policies

-- Stock transfers: org-scoped
CREATE POLICY "stock_transfers_org_isolation" ON stock_transfers
  FOR ALL USING (organization_id = (SELECT get_user_organization_id()));

-- Stock transfer items: through transfer org
CREATE POLICY "stock_transfer_items_org_isolation" ON stock_transfer_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM stock_transfers
      WHERE stock_transfers.id = stock_transfer_items.transfer_id
      AND stock_transfers.organization_id = (SELECT get_user_organization_id())
    )
  );

-- Branch user permissions: org-scoped
CREATE POLICY "branch_user_permissions_org_isolation" ON branch_user_permissions
  FOR ALL USING (organization_id = (SELECT get_user_organization_id()));

-- 8. Branch-level columns on existing tables

-- Vehicles: track which branch last serviced this vehicle
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_service_branch_id UUID REFERENCES branches(id);

-- 9. Add triggers for updated_at on new tables that need it
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON stock_transfers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON branch_user_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_transfers_org ON stock_transfers(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON stock_transfers(status);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_transfer ON stock_transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS idx_branch_user_permissions_user ON branch_user_permissions(user_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_last_service_branch ON vehicles(last_service_branch_id);
