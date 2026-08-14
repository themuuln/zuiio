-- Remove SMS from TOLOM — replace with email-only notifications

-- 1. Drop sms_enabled column from organization_settings
ALTER TABLE organization_settings DROP COLUMN IF EXISTS sms_enabled;

-- 2. Update reminder_logs: remove 'sms' from channel constraint
UPDATE reminder_logs SET channel = 'email' WHERE channel = 'sms';
ALTER TABLE reminder_logs DROP CONSTRAINT IF EXISTS reminder_logs_channel_check;
ALTER TABLE reminder_logs ADD CONSTRAINT reminder_logs_channel_check
  CHECK (channel IN ('email', 'both', 'in_app'));

-- 3. Update customer_communications: remove 'sms' from type constraint
UPDATE customer_communications SET type = 'email' WHERE type = 'sms';
ALTER TABLE customer_communications DROP CONSTRAINT IF EXISTS customer_communications_type_check;
ALTER TABLE customer_communications ADD CONSTRAINT customer_communications_type_check
  CHECK (type IN ('call', 'email', 'in_person', 'note'));
