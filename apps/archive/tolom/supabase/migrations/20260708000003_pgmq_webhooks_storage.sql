-- Migration: P2 pgmq + Database Webhooks + Storage Policies
-- Enables async message queue, triggers for notifications, and storage RLS

-- ============================================================
-- 1. Enable pgmq (Postgres Message Queue)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgmq;


-- ============================================================
-- 2. Create pgmq queues (idempotent via DO/EXCEPTION)
-- ============================================================
DO $$ BEGIN PERFORM pgmq.create('notifications'); EXCEPTION WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('pdf_generation'); EXCEPTION WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('webhooks'); EXCEPTION WHEN duplicate_table THEN NULL; END $$;


-- ============================================================
-- 3. Helper: queue a notification message
-- ============================================================
CREATE OR REPLACE FUNCTION queue_notification(
  p_org_id uuid,
  p_type text,
  p_payload jsonb
) RETURNS void AS $$
BEGIN
  PERFORM pgmq.send('notifications', jsonb_build_object(
    'org_id', p_org_id,
    'type', p_type,
    'payload', p_payload,
    'created_at', now()
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 4. Consumer: process one notification message per invocation
-- ============================================================
CREATE OR REPLACE FUNCTION process_notification_queue()
RETURNS void AS $$
DECLARE
  _msg record;
BEGIN
  -- Read one message with 30-second visibility timeout
  SELECT * INTO _msg FROM pgmq.read('notifications', 1, 30);

  IF _msg IS NULL THEN
    RETURN;
  END IF;

  -- Call the telegram-notify-owners Edge Function via pg_net
  PERFORM net.http_post(
    url := current_setting('app.settings.edge_function_url', true) || '/telegram-notify-owners',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := _msg.message::text
  );

  -- Delete the processed message
  PERFORM pgmq.delete('notifications', _msg.msg_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 5. Schedule notification consumer — every minute
-- ============================================================
DO $$ BEGIN
  PERFORM cron.schedule(
    'process_notifications',
    '* * * * *',
    'SELECT process_notification_queue()'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================
-- 6. Trigger: queue notification on work order status change
-- ============================================================
CREATE OR REPLACE FUNCTION notify_work_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM queue_notification(
      NEW.organization_id,
      'work_order_status_changed',
      jsonb_build_object(
        'work_order_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'bay_number', NEW.bay_number
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_work_order_status ON work_orders;
CREATE TRIGGER trg_notify_work_order_status
  AFTER UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_work_order_status_change();


-- ============================================================
-- 7. Trigger: alert when inventory drops below threshold
-- ============================================================
CREATE OR REPLACE FUNCTION check_low_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Alert when stock drops to or below threshold of 5 units
  IF NEW.quantity_on_hand <= 5 AND (OLD.quantity_on_hand IS NULL OR OLD.quantity_on_hand > 5) THEN
    PERFORM queue_notification(
      NEW.organization_id,
      'low_inventory_alert',
      jsonb_build_object(
        'part_id', NEW.part_id,
        'current_stock', NEW.quantity_on_hand
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_low_inventory ON inventory_balances;
CREATE TRIGGER trg_check_low_inventory
  AFTER UPDATE ON inventory_balances
  FOR EACH ROW
  EXECUTE FUNCTION check_low_inventory();


-- ============================================================
-- 8. Storage RLS policies — org-scoped upload/delete, public read
-- ============================================================

-- org-logos
DROP POLICY IF EXISTS "org_logos_read" ON storage.objects;
CREATE POLICY "org_logos_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'org-logos');

DROP POLICY IF EXISTS "org_logos_upload" ON storage.objects;
CREATE POLICY "org_logos_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'org-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT slug FROM organizations WHERE id = get_user_organization_id()
    )
  );

DROP POLICY IF EXISTS "org_logos_delete" ON storage.objects;
CREATE POLICY "org_logos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'org-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT slug FROM organizations WHERE id = get_user_organization_id()
    )
  );

-- work-order-photos
DROP POLICY IF EXISTS "work_order_photos_read" ON storage.objects;
CREATE POLICY "work_order_photos_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'work-order-photos');

DROP POLICY IF EXISTS "work_order_photos_upload" ON storage.objects;
CREATE POLICY "work_order_photos_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'work-order-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT slug FROM organizations WHERE id = get_user_organization_id()
    )
  );

DROP POLICY IF EXISTS "work_order_photos_delete" ON storage.objects;
CREATE POLICY "work_order_photos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'work-order-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT slug FROM organizations WHERE id = get_user_organization_id()
    )
  );

-- part-photos
DROP POLICY IF EXISTS "part_photos_read" ON storage.objects;
CREATE POLICY "part_photos_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'part-photos');

DROP POLICY IF EXISTS "part_photos_upload" ON storage.objects;
CREATE POLICY "part_photos_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'part-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT slug FROM organizations WHERE id = get_user_organization_id()
    )
  );

DROP POLICY IF EXISTS "part_photos_delete" ON storage.objects;
CREATE POLICY "part_photos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'part-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT slug FROM organizations WHERE id = get_user_organization_id()
    )
  );
