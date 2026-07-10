# Admin Panel

**Purpose:** SaaS admin dashboard for managing organizations, sellers, marketing campaigns, and platform analytics.

## File Structure
```
admin/
├── page.tsx              # Main admin dashboard with analytics & navigation
├── sellers/page.tsx      # Seller management & org assignments
├── marketing/page.tsx    # Marketing campaign management
├── error.tsx             # Sentry error boundary
└── loading.tsx           # Spinner skeleton
```

## Roles

| Role | Access |
|------|--------|
| `super_admin` | Full access to all admin features |
| `seller` | View assigned organizations |
| `marketing_manager` | Manage marketing campaigns |

## Key Components

- **`AdminPage`** — Entry point. Shows role badge, stats, and navigation cards to sellers/marketing.
- **`SellersPage`** — Seller management. Super admins can assign/remove orgs. Sellers see their assigned orgs.
- **`MarketingPage`** — Campaign CRUD. Create email/SMS/push campaigns with stats.

## Data Flow

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/me` | GET | Check admin role (returns `isAdmin`, `isSuperAdmin`, `role`) |
| `/api/admin/organizations` | GET | List all organizations (super_admin only) |
| `/api/admin/sellers` | GET | List seller assignments |
| `/api/admin/sellers/assign` | POST | Assign seller to org (super_admin only) |
| `/api/admin/sellers/assign/[id]` | DELETE | Remove assignment (super_admin only) |
| `/api/admin/marketing/campaigns` | GET/POST | List/create campaigns |
| `/api/admin/marketing/campaigns/[id]` | PATCH/DELETE | Update/delete campaign |
| `/api/admin/stats` | GET | Platform analytics (super_admin only) |

## Database Tables

- `super_admins` — Admin users with `role` column (super_admin, seller, marketing_manager)
- `seller_assignments` — Maps sellers to organizations
- `marketing_campaigns` — Campaign records with stats

## Conventions

- Access gated by role via `checkAdminRole()` from admin-service.
- Uses React Query for data fetching.
- UI follows design system tokens.

## Dependencies

- `@/lib/services/admin-service` — All admin service functions
- `@/lib/api-handler` — Route handlers
