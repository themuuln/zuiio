# Organization Module

**Purpose:** Organization overview page with quick-link cards to members, roles, devices, theme, payroll, and settings -- plus sub-routes for member management, role listing, device management, and theme settings.

## File Structure

```
organization/
├── page.tsx                          # Org overview: editable info card, subscription, quick-link cards
├── loading.tsx                       # Loading fallback
├── error.tsx                         # Error boundary
├── members/
│   ├── page.tsx                      # Members management (invite, edit, remove, role change)
│   ├── loading.tsx                   # Loading fallback
│   ├── error.tsx                     # Error boundary
│   ├── types.ts                      # InviteWithEmail type (extends OrgInvite)
│   ├── _member-list.tsx              # Active member list with role selector + edit/remove actions
│   ├── _invite-drawer.tsx            # Side drawer: invite by email/phone/username + role
│   ├── _edit-member-drawer.tsx       # Side drawer: edit name, phone, role, branch
│   └── _pending-invites.tsx          # Pending invite list with copy/resend/cancel
├── roles/
│   └── page.tsx                      # Read-only role cards with member counts
├── devices/
│   └── page.tsx                      # Device registration and management for mechanic tablets
└── settings/
    └── theme/
        └── page.tsx                  # Theme customization (delegates to OrgThemeSettings component)
```

## Pages

### Organization Overview (`page.tsx`)

Dashboard-style card grid:

| Card | Purpose | Action |
|------|---------|--------|
| **Organization** | Edit name/logo, view slug | Inline edit form (zod validated) |
| **Subscription** | Plan type, status, trial dates | Upgrade link or "Current Plan" badge |
| **Members** | Quick access to team | Links to `/members` and `/roles` |
| **Theme** | Appearance customization | Links to `/settings/theme` |
| **Payroll** | Mechanic pay rates | Links to `/dashboard/payroll` |
| **Devices** | Tablet management | Links to `/devices` |
| **Settings** | Business defaults | Links to `/dashboard/settings` |

API: `GET /api/organizations/{id}` + `GET /api/organizations/{id}/subscription`. Edit saves via `PATCH /api/organizations/{id}`.

### Members (`members/page.tsx`)

Full member management page with `useReducer` for batched state:

| Sub-component | Purpose |
|---------------|---------|
| `_member-list.tsx` | Active members: avatar, name, inline role `<Select>`, dropdown (edit/remove) |
| `_invite-drawer.tsx` | Invite drawer: email/phone/username input + role selector. Zod validated |
| `_edit-member-drawer.tsx` | Edit drawer: fullName, phone, role, branch. Zod validated |
| `_pending-invites.tsx` | Pending invites: email, expiry, copy link / resend / cancel actions |

**Data fetching pattern:** Manual `useCallback` loaders (not React Query) -- fetches `/api/profile` for orgId, then loads members, invites, roles, branches in parallel on mount.

**API endpoints used:**

| Action | Method | Endpoint |
|--------|--------|----------|
| Load members | GET | `/api/organizations/{id}/users` |
| Load invites | GET | `/api/organizations/{id}/invites` |
| Load roles | GET | `/api/organizations/{id}/roles` |
| Load branches | GET | `/api/organizations/{id}/branches` |
| Send invite | POST | `/api/organizations/{id}/invites` |
| Cancel invite | DELETE | `/api/organizations/{id}/invites` |
| Resend invite | PATCH | `/api/organizations/{id}/invites` |
| Update member | PATCH | `/api/organizations/{id}/users/{userId}` |
| Remove member | DELETE | `/api/organizations/{id}/users` |

### Roles (`roles/page.tsx`)

Read-only card grid of system and custom roles.

- Fetches roles + users in parallel, counts members per role name
- Color-coded cards per role (Org Owner = blue, Manager = purple, Mechanic = amber, Guest = green)
- System roles marked with a "System" badge
- No create/edit/delete UI -- roles managed at system level

### Devices (`devices/page.tsx`)

Device management for mechanic tablets (bay view).

- `DeviceInfo` interface for registered devices
- Revoke functionality (`handleRevoke`)
- Date formatting for device registration dates

### Theme Settings (`settings/theme/page.tsx`)

Thin wrapper that delegates to `@/components/org-theme-settings` component. Uses `useCurrentOrg()` for org context.

## Conventions

- **No layout.tsx** -- sub-pages are standalone (no shared sidebar like settings)
- **Members use `useReducer`** instead of React Query for batched state updates across 4 parallel data sources
- **Every member action re-fetches** the full list after mutation (no optimistic updates)
- **InviteDrawer** supports multi-locale labels (en/mn) for identifier field
- **Role change** is inline via `<Select>` in the member list -- no confirmation dialog
- All pages use `useTranslations("organization.*")` for i18n

## Dependencies

- `@tanstack/react-query` -- org + subscription data on overview page
- `next-intl` -- translations
- `zod` -- form validation (invite, edit member, org edit)
- `sonner` -- toast notifications
- `@/components/org-theme-settings` -- theme customization component
