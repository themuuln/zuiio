# Appointments

**Purpose:** Appointment management — list today's appointments with status filtering, inline status updates, deletion, and a create sheet.

## File Structure

```
appointments/
├── page.tsx          # Main appointments list page (~257 lines)
└── _create-drawer.tsx # AppointmentCreateDrawer — modal wrapper for AppointmentForm
```

## Key Components

- `AppointmentsPage` — Main page. Fetches today's appointments, supports status filter dropdown, inline status change, and deletion. Opens create sheet via button.
- `AppointmentCreateSheet` — Responsive modal wrapping `AppointmentForm`. Props: `open`, `onOpenChange`, `orgId`, `onCreated`.

## Data Flow

- **API endpoints:**
  - `GET /api/organizations/{orgId}/appointments?date={today}&branch_id={branchId}` — list appointments
  - `PATCH /api/organizations/{orgId}/appointments/{id}` — update status (body: `{ status }`)
  - `DELETE /api/organizations/{orgId}/appointments/{id}` — delete/cancel appointment
- **React Query hooks:**
  - `useCurrentOrg()` — current org ID
  - `useQuery({ queryKey: ["appointments", orgId, today, branchFilter] })` — inline query (not a shared hook)
  - `useMutation` — status update and delete, both invalidate `["appointments"]` query key
- **Query client:** Uses `useQueryClient()` directly for `invalidateQueries`.

## State Management

- **Zustand:** `useSelectedBranchId()` for branch filtering.
- **Local state:** `statusFilter` (string), `createOpen` (boolean for create sheet).
- **No dedicated query hook:** Appointments uses inline `useQuery`/`useMutation` instead of shared hooks in `src/lib/queries/`.

## Conventions

- Date is always today (`new Date().toISOString().split("T")[0]`).
- Status filter options are hardcoded inline: `scheduled`, `checked_in`, `in_progress`, `completed`, `cancelled`, `no_show`, `requested`.
- `STATUS_LABELS` is declared as an empty object but the Select items are generated from a hardcoded object literal — the labels come from i18n (`t("status_" + value)`).
- Status change and delete mutations both invalidate the same query key (`["appointments"]`), triggering a refetch.
- Toast notifications on success/failure via `sonner`.
- `AppointmentForm` is imported from `@/components/appointments/appointment-form` (shared component).

## Dependencies

- Shared components: `Button`, `Card`, `Empty`, `Select`, `Separator`, `Skeleton`, `Typography`
- `AppointmentForm` from `@/components/appointments/appointment-form`
- `ResponsiveFormModal` from `@/components/ui/responsive-form-modal`
- `useCurrentOrg` from `@/lib/queries/use-organization`
- `useSelectedBranchId` from `@/lib/stores`
- Types: `Appointment`, `AppointmentStatus` from `@/lib/types`
- Sub-route of dashboard — inherits auth, sidebar, and brand theme from dashboard layout.
