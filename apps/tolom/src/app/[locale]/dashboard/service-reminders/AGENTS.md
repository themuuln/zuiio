# Service Reminders

**Purpose:** Daily call list for reception — track which customers need service calls, mark contact status, and manage recurring service schedules for vehicles.

## File Structure

```
service-reminders/
├── page.tsx                 # Full page: summary cards, schedule table with filters, add/edit dialogs, config sheet, reminder logs tab
├── _utils.ts                # Shared helpers: formatDate, getScheduleDueStatus, formatVehicleLabel, formatInterval
├── _badges.tsx              # StatusBadge, ChannelBadge, DueStatusBadge (color-coded variants)
├── _schedule-row.tsx        # Table row with customer info, phone, contact status dropdown, due status badge
├── _add-schedule-dialog.tsx # Form dialog: vehicle combobox, service name, intervals, dates
├── _edit-schedule-dialog.tsx# Edit dialog: service name, intervals, notes, reminder toggle
├── _delete-confirm-dialog.tsx # Confirmation dialog showing vehicle/service being deleted
├── _action-buttons.tsx      # Sync History + Send Pending (with text labels on wider screens)
├── _config-drawer.tsx       # Org-level settings: default channel, auto-enable toggle
├── _reminder-logs-tab.tsx   # Reminder history with search, status/channel filters
├── error.tsx                # Sentry error boundary
└── loading.tsx              # Spinner skeleton
```

## Key Components

- **`ServiceRemindersPage`** — Entry point. Summary KPI cards (total, overdue, due soon, reminders off). Two tabs: "Schedules" (daily call list) and "Reminder Logs" (filtered history).
- **`ScheduleRow`** — Table row with vehicle, service name, customer name, phone (tap-to-call), interval, last/next due dates, `DueStatusBadge`, contact status dropdown (Scheduled/No Answer/Skipped), edit/delete.
- **`ReminderLogsTab`** — Filterable history: search by vehicle/service, filter by status (pending/sent/failed/cancelled) and channel (in_app/email/both).
- **Add Dialog** — Form with vehicle combobox, service name, interval months/km, last service date, next due date.
- **Edit Dialog** — Edit service name, intervals, notes, and reminder enabled toggle.
- **Config Sheet** — Org-level settings: default reminder channel (in_app/email/both) and auto-enable toggle.
- **`DueStatusBadge`** — Color-coded badge: destructive for overdue, secondary for due-soon, outline for scheduled/no-date.

## Shared Utils (`_utils.ts`)

| Helper | Purpose |
|--------|---------|
| `getScheduleDueStatus(item)` | Returns `"overdue"`, `"due-soon"`, `"scheduled"`, or `"no-date"` |
| `formatDate(dateStr)` | Locale-formatted date string (mn-MN) |
| `formatVehicleLabel(vehicle)` | `"Make Model Plate"` or `"—"` |
| `formatInterval(months, km)` | `"6mo / 5,000km"` or `"—"` |
| `parsePositiveInt(value)` | Safe integer parse with null fallback |

## Data Flow

| Hook | Purpose |
|------|---------|
| `useServiceSchedules(orgId, undefined, branchFilter)` | Fetch all schedules with customer data |
| `useCreateServiceSchedule(orgId)` | Mutate: create schedule |
| `useUpdateServiceSchedule(orgId)` | Mutate: update schedule |
| `useDeleteServiceSchedule(orgId)` | Mutate: delete schedule |
| `useUpdateContactStatus(orgId)` | Mutate: update contact status (pending/called-scheduled/called-no-answer/skipped) |
| `useReminderLogs(orgId, undefined, branchFilter)` | Fetch reminder send history |
| `useVehicles(orgId)` | Vehicle list for combobox |
| `useOrgSettings(orgId)` | Org reminder config (default channel, auto-enable) |
| `useUpdateOrgSettings(orgId)` | Mutate: save org reminder config |

**Action buttons:**

- **Sync History** (`POST /api/organizations/{orgId}/service-reminders/sync-history`) — Generates reminders from work order history.
- **Send Pending** (`POST /api/organizations/{orgId}/service-reminders/send-pending`) — Sends all pending reminders.

## Contact Status Workflow

For reception daily call list:

1. **View today's calls** — Overdue and due-soon items are highlighted with red/orange badges
2. **Call customer** — Phone number is clickable (tap-to-call)
3. **Update status** — Click the checkmark icon to select:
   - **Called - Scheduled** (green) — Customer confirmed appointment
   - **Called - No Answer** (amber) — Couldn't reach customer
   - **Skipped** (gray) — Skip this customer for now
4. **Status persists** — Contact status and timestamp are saved for tracking

## Filtering

**Schedule table filters:**

- **Search** — Matches vehicle (make/model/plate) or service name
- **Status filter** — All / Overdue / Due Soon
- **Reminder filter** — All / With Reminders / Without Reminders

**Reminder logs filters:**

- **Search** — Matches vehicle (make/model/plate) or service name
- **Status filter** — All / Pending / Sent / Failed / Cancelled
- **Channel filter** — All / In-App / Email / Both

## Database Schema

**Migration:** `20260610050652_add_contact_status_to_service_schedules.sql`

Adds to `vehicle_service_schedules`:

- `contact_status TEXT NOT NULL DEFAULT 'pending'` — CHECK constraint: pending, called-scheduled, called-no-answer, skipped
- `contacted_at TIMESTAMPTZ` — Timestamp of last contact attempt

**API Query:** Joins `vehicles` → `customers` to include customer name and phone in schedule responses.

## Conventions

- Branch filter via `useSelectedBranchId()` (Zustand). `"all"` = no branch filter.
- Summary cards derive counts from schedule data (no extra API calls).
- Sidebar tabs: "due-soon" (overdue/due-soon counts) and "history" (recent reminder sends).
- All dates formatted with `mn-MN` locale via `formatDate()` from `_utils.ts`.
- Contact status updates use optimistic UI with rollback on error.

## Dependencies

- `@/components/ui/combobox` — Vehicle search combobox
- `@/components/ui/date-picker` — Date picker for service dates
- `@/components/ui/dropdown-menu` — Contact status dropdown
- `@/components/ui/select` — Filter dropdowns
- `@/components/ui/tooltip` — Notes hover tooltip
- `@/lib/queries/use-org-settings` — Org reminder settings
- `@/lib/queries/use-service-reminders` — All schedule/log hooks
- `@/lib/queries/use-vehicles` — Vehicle list
