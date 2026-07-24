-- Add has_variants flag to products so the catalog/list can show a
-- "Варианттай" badge without N+1 variant queries.
-- Kept in sync by a trigger whenever product_variants rows are inserted/deleted.

ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION sync_product_has_variants()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  target_product uuid;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    target_product := NEW.product_id;
  ELSE
    target_product := OLD.product_id;
  END IF;

  UPDATE products p
  SET has_variants = (
    SELECT EXISTS (
      SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id
    )
  )
  WHERE p.id = target_product;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_product_has_variants ON product_variants;
CREATE TRIGGER trg_sync_product_has_variants
  AFTER INSERT OR UPDATE OR DELETE
  ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_has_variants();

-- Backfill existing products that already have variants.
UPDATE products p
SET has_variants = (
  SELECT EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id)
);
