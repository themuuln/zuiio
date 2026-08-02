-- Keep reporting and historical inventory queries compatible with the core schema.
-- The core migration creates these columns before later feature migrations can
-- add the relationship and soft-delete semantics used by the dashboard.

ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sales_salesperson_id_fkey'
      AND conrelid = 'public.sales'::regclass
  ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_salesperson_id_fkey
      FOREIGN KEY (salesperson_id)
      REFERENCES public.profiles(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END
$$;

-- Restore relationships that were skipped when the core schema had already
-- created the columns without foreign-key constraints.
DO $$
DECLARE
  relationship RECORD;
BEGIN
  FOR relationship IN
    SELECT *
    FROM (
      VALUES
        ('public.products'::text, 'products_brand_id_fkey'::text, 'brand_id'::text, 'public.brands'::text, 'id'::text, 'SET NULL'::text),
        ('public.stock_movements'::text, 'stock_movements_warehouse_id_fkey'::text, 'warehouse_id'::text, 'public.warehouses'::text, 'id'::text, 'SET NULL'::text),
        ('public.profiles'::text, 'profiles_role_id_fkey'::text, 'role_id'::text, 'public.roles'::text, 'id'::text, 'SET NULL'::text),
        ('public.sale_items'::text, 'sale_items_variant_id_fkey'::text, 'variant_id'::text, 'public.product_variants'::text, 'id'::text, 'SET NULL'::text),
        ('public.stock_movements'::text, 'stock_movements_variant_id_fkey'::text, 'variant_id'::text, 'public.product_variants'::text, 'id'::text, 'SET NULL'::text),
        ('public.sales'::text, 'sales_branch_id_fkey'::text, 'branch_id'::text, 'public.branches'::text, 'id'::text, 'RESTRICT'::text),
        ('public.expenses'::text, 'expenses_branch_id_fkey'::text, 'branch_id'::text, 'public.branches'::text, 'id'::text, 'RESTRICT'::text),
        ('public.stock_movements'::text, 'stock_movements_branch_id_fkey'::text, 'branch_id'::text, 'public.branches'::text, 'id'::text, 'RESTRICT'::text),
        ('public.profiles'::text, 'profiles_branch_id_fkey'::text, 'branch_id'::text, 'public.branches'::text, 'id'::text, 'SET NULL'::text),
        ('public.contacts'::text, 'contacts_customer_segment_id_fkey'::text, 'customer_segment_id'::text, 'public.customer_segments'::text, 'id'::text, 'SET NULL'::text),
        ('public.sales'::text, 'sales_bank_account_id_fkey'::text, 'bank_account_id'::text, 'public.bank_accounts'::text, 'id'::text, 'SET NULL'::text),
        ('public.expenses'::text, 'expenses_bank_account_id_fkey'::text, 'bank_account_id'::text, 'public.bank_accounts'::text, 'id'::text, 'SET NULL'::text),
        ('public.stock_movements'::text, 'stock_movements_production_material_id_fkey'::text, 'production_material_id'::text, 'public.production_materials'::text, 'id'::text, 'SET NULL'::text),
        ('public.stock_movements'::text, 'stock_movements_created_by_fkey'::text, 'created_by'::text, 'public.profiles'::text, 'id'::text, 'SET NULL'::text)
    ) AS rows(table_name, constraint_name, column_name, referenced_table, referenced_column, delete_action)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = relationship.constraint_name
        AND conrelid = relationship.table_name::regclass
    ) THEN
      EXECUTE format(
        'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s (%I) ON DELETE %s NOT VALID',
        relationship.table_name,
        relationship.constraint_name,
        relationship.column_name,
        relationship.referenced_table,
        relationship.referenced_column,
        relationship.delete_action
      );
    END IF;
  END LOOP;
END
$$;