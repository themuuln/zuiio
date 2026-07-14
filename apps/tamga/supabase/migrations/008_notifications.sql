-- ============================================================
-- Push Notification System — user_devices + notification prefs
-- Version: 8 (2026-06-05)
--
-- Adds user_devices table for FCM token storage and
-- notification preference columns to profiles.
-- ============================================================

-- ── 1. Create user_devices table ─────────────────────────────
-- Stores FCM tokens for push notification delivery.
-- One row per device (unique on user_id + fcm_token).
CREATE TABLE IF NOT EXISTS user_devices (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fcm_token     TEXT NOT NULL,
  platform      TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web', 'macos')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One token per device per user
  UNIQUE (user_id, fcm_token)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_devices_user
  ON user_devices(user_id);

CREATE INDEX IF NOT EXISTS idx_user_devices_token
  ON user_devices(fcm_token);

-- ── 2. RLS policies for user_devices ────────────────────────
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Users can read their own device tokens
CREATE POLICY "user_devices: users read own"
  ON user_devices FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own device tokens
CREATE POLICY "user_devices: users insert own"
  ON user_devices FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own device tokens (last_seen_at refresh)
CREATE POLICY "user_devices: users update own"
  ON user_devices FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own device tokens (sign-out cleanup)
CREATE POLICY "user_devices: users delete own"
  ON user_devices FOR DELETE
  USING (user_id = auth.uid());

-- Service role can delete any device token (admin cleanup)
CREATE POLICY "user_devices: service role full access"
  ON user_devices FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── 3. Add notification preferences to profiles ─────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notify_health_reminders BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notify_breeding_alerts BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notify_market_updates BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notify_subscription_expiry BOOLEAN NOT NULL DEFAULT true;

-- ── 4. RPC: register_device() ───────────────────────────────
-- Upserts a device token. Called from the app after FCM init.
CREATE OR REPLACE FUNCTION register_device(
  p_fcm_token TEXT,
  p_platform TEXT
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

  -- Upsert device token
  INSERT INTO user_devices (user_id, fcm_token, platform, last_seen_at)
  VALUES (v_user_id, p_fcm_token, p_platform, now())
  ON CONFLICT (user_id, fcm_token)
  DO UPDATE SET last_seen_at = now(), platform = p_platform;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id
  );
END;
$$;

-- ── 5. RPC: unregister_device() ─────────────────────────────
-- Removes a device token. Called on sign-out.
CREATE OR REPLACE FUNCTION unregister_device(
  p_fcm_token TEXT
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

  DELETE FROM user_devices
  WHERE user_id = v_user_id AND fcm_token = p_fcm_token;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id
  );
END;
$$;

-- ── 6. RPC: update_notification_preferences() ───────────────
-- Updates notification preference columns on profiles.
CREATE OR REPLACE FUNCTION update_notification_preferences(
  p_notifications_enabled BOOLEAN DEFAULT NULL,
  p_notify_health_reminders BOOLEAN DEFAULT NULL,
  p_notify_breeding_alerts BOOLEAN DEFAULT NULL,
  p_notify_market_updates BOOLEAN DEFAULT NULL,
  p_notify_subscription_expiry BOOLEAN DEFAULT NULL
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
    updated_at = now()
  WHERE owner_id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'notifications_enabled', COALESCE(p_notifications_enabled, (SELECT notifications_enabled FROM profiles WHERE owner_id = v_user_id)),
    'notify_health_reminders', COALESCE(p_notify_health_reminders, (SELECT notify_health_reminders FROM profiles WHERE owner_id = v_user_id)),
    'notify_breeding_alerts', COALESCE(p_notify_breeding_alerts, (SELECT notify_breeding_alerts FROM profiles WHERE owner_id = v_user_id)),
    'notify_market_updates', COALESCE(p_notify_market_updates, (SELECT notify_market_updates FROM profiles WHERE owner_id = v_user_id)),
    'notify_subscription_expiry', COALESCE(p_notify_subscription_expiry, (SELECT notify_subscription_expiry FROM profiles WHERE owner_id = v_user_id))
  );
END;
$$;

-- ── 7. Add comments for documentation ───────────────────────
COMMENT ON TABLE user_devices IS 'Stores FCM tokens for push notification delivery, one row per device';
COMMENT ON COLUMN user_devices.user_id IS 'References auth.users — the device owner';
COMMENT ON COLUMN user_devices.fcm_token IS 'Firebase Cloud Messaging token for this device';
COMMENT ON COLUMN user_devices.platform IS 'Device platform: ios, android, web, macos';
COMMENT ON COLUMN user_devices.last_seen_at IS 'Last time this token was refreshed or seen';

COMMENT ON COLUMN profiles.notifications_enabled IS 'Master toggle for all push notifications';
COMMENT ON COLUMN profiles.notify_health_reminders IS 'Vaccination and farrier reminders';
COMMENT ON COLUMN profiles.notify_breeding_alerts IS 'Breeding due date alerts';
COMMENT ON COLUMN profiles.notify_market_updates IS 'Market listing updates';
COMMENT ON COLUMN profiles.notify_subscription_expiry IS 'Subscription expiry warnings';
