-- Add contact status tracking for daily call list workflow
-- Contact statuses: pending (default), called-scheduled, called-no-answer, skipped

ALTER TABLE vehicle_service_schedules
ADD COLUMN contact_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN contacted_at TIMESTAMPTZ;

-- Add check constraint for valid contact statuses
ALTER TABLE vehicle_service_schedules
ADD CONSTRAINT vehicle_service_schedules_contact_status_check
CHECK (contact_status IN ('pending', 'called-scheduled', 'called-no-answer', 'skipped'));

-- Add index for filtering by contact status
CREATE INDEX idx_vehicle_service_schedules_contact_status
ON vehicle_service_schedules(organization_id, contact_status)
WHERE deleted_at IS NULL;

-- Add index for due date filtering (for today's call list)
CREATE INDEX idx_vehicle_service_schedules_next_due_date
ON vehicle_service_schedules(organization_id, next_due_date)
WHERE deleted_at IS NULL AND next_due_date IS NOT NULL;
