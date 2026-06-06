# Admin Panel

**Purpose:** Super-admin dashboard for managing all organizations — subscription plans, trial status, and org overview.

## File Structure
```
admin/
├── page.tsx    # Full page: org list, plan management, trial extension
├── error.tsx   # Sentry error boundary
└── loading.tsx # Spinner skeleton
```

## Key Components

- **`AdminPage`** — Entry point. Checks super-admin status via `GET /api/admin/me`. Non-super-admins see an access-denied screen. Super-admins see the full org management table.
- **Org Table** — Lists all organizations with columns: name/slug, plan badge, status badge, and action buttons.
- **Plan Buttons** — Row of 4 buttons (starter/pro/business/enterprise). Active plan is highlighted. Clicking switches the org's subscription plan.
- **Extend Trial Button** — Resets trial for an org.

## Data Flow

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/me` | GET | Check if current user is super-admin |
| `/api/admin/organizations` | GET | List all organizations with subscriptions |
| `/api/admin/organizations/{orgId}/subscription` | PATCH | Change plan type (body: `{ planType, status: "active" }`) |
| `/api/admin/organizations/{orgId}/subscription` | PATCH | Extend trial (body: `{ action: "extend" }`) |

- Data fetched via raw `fetch()` + `useState` on mount (AbortController for cleanup).
- Org list state updated optimistically after plan change.

## Plan & Status Values

| Plan | Badge Color |
|------|-------------|
| `starter` | Slate |
| `pro` | Blue |
| `business` | Purple |
| `enterprise` | Amber |

| Status | Badge Color |
|--------|-------------|
| `active` | Emerald |
| `trial` | Cyan |
| `cancelled` | Red |
| `expired` | Rose |

## Conventions

- Access gated by `isSuperAdmin` from `/api/admin/me`.
- UI text in English (not i18n via `useTranslations` — uses `t()` but labels are in English).
- Footer note: "Changes take effect immediately. Plan limits are not enforced yet."
- Uses `AdminOrg` type from `@/lib/services/admin-service`.
- No sub-component files — everything inline in `page.tsx`.

## Dependencies

- `@/lib/services/admin-service` — AdminOrg type
- No React Query hooks — raw fetch pattern
