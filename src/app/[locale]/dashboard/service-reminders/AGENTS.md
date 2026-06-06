# Service Reminders

**Purpose:** Manage recurring service schedules for vehicles — create/edit/delete schedules, send pending reminders, view reminder history logs.

## File Structure
```
service-reminders/
├── page.tsx    # Full page: schedule table, add/edit dialogs, config sheet, reminder logs tab
├── error.tsx   # Sentry error boundary
└── loading.tsx # Spinner skeleton
```

## Key Components

- **`ServiceRemindersPage`** — Entry point. Two tabs: "Schedule List" (CRUD table) and "Reminder Logs" (history).
- **`ScheduleRow`** — Table row for a service schedule. Shows vehicle, service name, interval (months/km), last service date, next due date (overdue/soon highlighting), reminder toggle, edit/delete buttons.
- **`ReminderLogsTab`** — Separate component. Displays reminder send history with vehicle, service, type, channel, status, scheduled/sent dates.
- **Add Dialog** — Form with vehicle combobox, service name, interval months/km, last service date, next due date.
- **Edit Dialog** — Edit service name, intervals, notes, and reminder enabled toggle.
- **Config Sheet** — Org-level settings: default reminder channel (in_app/email/both) and auto-enable toggle.
- **`StatusBadge`** / **`ChannelBadge`** — Visual badges for reminder status (pending/sent/failed/cancelled) and channel (email/in_app/both).

## Data Flow

| Hook | Purpose |
|------|---------|
| `useServiceSchedules(orgId, undefined, branchFilter)` | Fetch all schedules for org |
| `useCreateServiceSchedule(orgId)` | Mutate: create schedule |
| `useUpdateServiceSchedule(orgId)` | Mutate: update schedule |
| `useDeleteServiceSchedule(orgId)` | Mutate: delete schedule |
| `useReminderLogs(orgId, undefined, branchFilter)` | Fetch reminder send history |
| `useVehicles(orgId)` | Vehicle list for combobox |
| `useOrgSettings(orgId)` | Org reminder config (default channel, auto-enable) |
| `useUpdateOrgSettings(orgId)` | Mutate: save org reminder config |

**Action buttons:**
- **Sync History** (`POST /api/organizations/{orgId}/service-reminders/sync-history`) — Generates reminders from work order history.
- **Send Pending** (`POST /api/organizations/{orgId}/service-reminders/send-pending`) — Sends all pending reminders.

## Reminder Types & Triggers

- **service_due** — Scheduled reminder when next due date approaches.
- **service_overdue** — Alert when next due date has passed.
- **custom** — Manually created schedule.

## Conventions

- Branch filter via `useSelectedBranchId()` (Zustand). `"all"` = no branch filter.
- Overdue dates highlighted in red with AlertCircle icon. Due-soon (within 7 days) highlighted in amber.
- Date formatting uses `mn-MN` locale.
- Config state synced from org settings on first load via `useRef` flag.
- Sidebar tabs: "due-soon" (overdue/due-soon counts) and "history" (recent reminder sends).

## Dependencies

- `@/components/ui/combobox` — Vehicle search combobox
- `@/components/ui/date-picker` — Date picker for service dates
- `@/components/sidebar-tabs/*` — StatusSummary, RecentList
- `@/lib/queries/use-org-settings` — Org reminder settings
- `@/lib/queries/use-service-reminders` — All schedule/log hooks
- `@/lib/queries/use-vehicles` — Vehicle list
