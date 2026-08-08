-- 014_notification_preferences_fix.sql
-- Add missing notification preference columns to profiles

-- Add geofence alerts preference (was hardcoded to true in Dart)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS notify_geofence_alerts BOOLEAN DEFAULT true;

-- Add payment notifications preference (partially added in 010)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS notify_payment_notifications BOOLEAN DEFAULT true;

-- Update the update_notification_preferences() RPC to include new columns
-- Keep RETURNS JSONB and authentication guard from existing RPC
CREATE OR REPLACE FUNCTION update_notification_preferences(
  p_notifications_enabled BOOLEAN DEFAULT NULL,
  p_notify_health_reminders BOOLEAN DEFAULT NULL,
  p_notify_breeding_alerts BOOLEAN DEFAULT NULL,
  p_notify_market_updates BOOLEAN DEFAULT NULL,
  p_notify_subscription_expiry BOOLEAN DEFAULT NULL,
  p_notify_geofence_alerts BOOLEAN DEFAULT NULL,
  p_notify_payment_notifications BOOLEAN DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Authentication required');
  END IF;

  UPDATE profiles SET
    notifications_enabled = COALESCE(p_notifications_enabled, notifications_enabled),
    notify_health_reminders = COALESCE(p_notify_health_reminders, notify_health_reminders),
    notify_breeding_alerts = COALESCE(p_notify_breeding_alerts, notify_breeding_alerts),
    notify_market_updates = COALESCE(p_notify_market_updates, notify_market_updates),
    notify_subscription_expiry = COALESCE(p_notify_subscription_expiry, notify_subscription_expiry),
    notify_geofence_alerts = COALESCE(p_notify_geofence_alerts, notify_geofence_alerts),
    notify_payment_notifications = COALESCE(p_notify_payment_notifications, notify_payment_notifications)
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add missing geofence_alerts DELETE policy
CREATE POLICY "Geofence alerts delete by owner" ON geofence_alerts
  FOR DELETE USING (
    geofence_id IN (SELECT id FROM search_areas WHERE owner_id = auth.uid())
  );
