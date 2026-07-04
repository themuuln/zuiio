-- Payment Notification Preferences — Add payment notification column
-- Version: 10 (2026-06-06)
-- Adds notify_payment_notifications column to profiles
-- and extends update_notification_preferences() RPC.

-- ── 1. Add payment notification column to profiles ────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notify_payment_notifications BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN profiles.notify_payment_notifications IS 'Payment verification and subscription activation notifications';

-- ── 2. Drop and recreate update_notification_preferences() RPC ─
-- Extended with p_notify_payment_notifications parameter.
CREATE OR REPLACE FUNCTION update_notification_preferences(
  p_notifications_enabled BOOLEAN DEFAULT NULL,
  p_notify_health_reminders BOOLEAN DEFAULT NULL,
  p_notify_breeding_alerts BOOLEAN DEFAULT NULL,
  p_notify_market_updates BOOLEAN DEFAULT NULL,
  p_notify_subscription_expiry BOOLEAN DEFAULT NULL,
  p_notify_payment_notifications BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;

  UPDATE profiles
  SET
    notifications_enabled = COALESCE(p_notifications_enabled, notifications_enabled),
    notify_health_reminders = COALESCE(p_notify_health_reminders, notify_health_reminders),
    notify_breeding_alerts = COALESCE(p_notify_breeding_alerts, notify_breeding_alerts),
    notify_market_updates = COALESCE(p_notify_market_updates, notify_market_updates),
    notify_subscription_expiry = COALESCE(p_notify_subscription_expiry, notify_subscription_expiry),
    notify_payment_notifications = COALESCE(p_notify_payment_notifications, notify_payment_notifications),
    updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'notifications_enabled', COALESCE(p_notifications_enabled, (SELECT notifications_enabled FROM profiles WHERE id = v_user_id)),
    'notify_health_reminders', COALESCE(p_notify_health_reminders, (SELECT notify_health_reminders FROM profiles WHERE id = v_user_id)),
    'notify_breeding_alerts', COALESCE(p_notify_breeding_alerts, (SELECT notify_breeding_alerts FROM profiles WHERE id = v_user_id)),
    'notify_market_updates', COALESCE(p_notify_market_updates, (SELECT notify_market_updates FROM profiles WHERE id = v_user_id)),
    'notify_subscription_expiry', COALESCE(p_notify_subscription_expiry, (SELECT notify_subscription_expiry FROM profiles WHERE id = v_user_id)),
    'notify_payment_notifications', COALESCE(p_notify_payment_notifications, (SELECT notify_payment_notifications FROM profiles WHERE id = v_user_id))
  );
END;
$$;
