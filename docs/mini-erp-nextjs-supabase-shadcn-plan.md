# Mini-ERP SaaS Plan

> **Product:** A lightweight ERP SaaS for Mongolian small businesses  
> **Stack:** Next.js 15 (App Router), Supabase, shadcn/ui, Tailwind CSS, TypeScript  
> **Audience:** Solo-founder / early-stage startup team  
> **Status:** Planning document — not yet implemented

---

## 1. Product Concept

Build a **mini-ERP** that helps Mongolian small businesses manage daily operations without the complexity of traditional ERPs. Focus on three core pillars:

1. **Inventory & Products** — track stock, suppliers, and product catalogs
2. **Sales & Orders** — record sales, manage orders, and issue simple invoices
3. **Cash & Expenses** — log cash flow, expenses, and basic financial snapshots

The product is **Mongolia-first**: supports Mongolian Tugrik (MNT), Mongolian language UI, local tax norms, and mobile-first usage patterns common among small-business owners.

---

## 2. Target Customers

| Segment | Description | Pain Point |
|---------|-------------|------------|
| Small retail shops | Corner stores, kiosks, small supermarkets | No affordable inventory tracking; Excel is error-prone |
| Wholesale distributors | Local distributors supplying shops | Need simple order management and customer ledgers |
| Service businesses | Repair shops, small clinics, salons | Need appointment + billing in one place |
| Solo entrepreneurs | Individual importers, online sellers | Need cash flow visibility without accountant costs |

**Primary persona:** A shop owner who manages stock, sales, and cash daily using notebooks or spreadsheets. They want a simple mobile-friendly tool that works offline when internet is spotty.

---

## 3. MVP Scope

### In Scope

- User registration and organization (business) creation
- Product catalog with categories
- Stock-in / stock-out tracking
- Simple sales recording (cash / bank transfer / invoice)
- Expense logging
- Basic dashboard with daily summary cards
- Multi-user access with role-based permissions
- Mongolian Tugrik (MNT) currency formatting
- Mobile-responsive UI

### Out of Scope (Post-MVP)

- Full accounting (general ledger, double-entry bookkeeping)
- Payroll and HR modules
- Multi-currency support beyond MNT
- E-commerce integrations
- Advanced analytics and forecasting
- API for third-party integrations
- Offline PWA sync (keep simple responsive web first)

---

## 4. Architecture

```
┌─────────────────────────────────────────┐
│           Next.js 15 App Router           │
│  ┌─────────┐ ┌─────────┐ ┌─────────────┐  │
│  │  Pages  │ │  API  │ │ Server      │  │
│  │  (RSC)  │ │ Routes│ │ Actions     │  │
│  └─────────┘ └─────────┘ └─────────────┘  │
│              shadcn/ui + Tailwind         │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│              Supabase                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │PostgreSQL│ │  Auth   │ │ Storage │  │
│  │  (RLS)  │ │(OAuth+PW)│ │(Images) │  │
│  └─────────┘ └─────────┘ └─────────┘  │
└─────────────────────────────────────────┘
```

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Next.js App Router | Server Components reduce client JS; native async data fetching |
| Supabase | Managed Postgres + Auth + Storage; RLS simplifies authorization |
| shadcn/ui | Copy-paste components; full styling control; no runtime dependency lock-in |
| Server Actions | Form submissions and mutations without explicit API routes |
| No ORM | Use raw SQL via Supabase client; simpler for small schemas, easier RLS reasoning |

---

## 5. Route Structure

```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── forgot-password/page.tsx
├── (dashboard)/
│   ├── layout.tsx              # Sidebar + header shell
│   ├── page.tsx                # Dashboard home
│   ├── products/
│   │   ├── page.tsx            # Product list
│   │   └── new/page.tsx        # Add product
│   ├── inventory/
│   │   ├── page.tsx            # Stock levels
│   │   └── movements/page.tsx  # Stock-in/out history
│   ├── sales/
│   │   ├── page.tsx            # Sales list
│   │   └── new/page.tsx        # Record sale
│   ├── expenses/
│   │   ├── page.tsx            # Expense list
│   │   └── new/page.tsx        # Log expense
│   ├── customers/
│   │   └── page.tsx            # Customer directory
│   ├── suppliers/
│   │   └── page.tsx            # Supplier directory
│   └── settings/
│       ├── organization/page.tsx
│       └── users/page.tsx
├── api/                        # Minimal API routes (webhooks, exports)
└── layout.tsx
```

---

## 6. Database Plan

### 6.1 MVP Database Tables

```sql
-- Organizations (tenants)
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  currency text default 'MNT',
  created_at timestamptz default now()
);

-- Users (managed by Supabase Auth, extended here)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  organization_id uuid references organizations on delete set null,
  role text check (role in ('owner','admin','staff')) default 'staff',
  created_at timestamptz default now()
);

-- Product catalog
create table categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations on delete cascade not null,
  category_id uuid references categories on delete set null,
  name text not null,
  sku text,
  barcode text,
  unit text default 'ширхэг',
  cost_price numeric(12,2) default 0,
  sale_price numeric(12,2) default 0,
  current_stock numeric(12,2) default 0,
  min_stock numeric(12,2) default 0,
  created_at timestamptz default now()
);

-- Stock movements
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations on delete cascade not null,
  product_id uuid references products on delete cascade not null,
  type text check (type in ('in','out','adjustment')) not null,
  quantity numeric(12,2) not null,
  unit_cost numeric(12,2),
  reference text,
  notes text,
  created_by uuid references profiles,
  created_at timestamptz default now()
);

-- Customers & Suppliers
create table contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations on delete cascade not null,
  type text check (type in ('customer','supplier')) not null,
  name text not null,
  phone text,
  email text,
  address text,
  balance numeric(12,2) default 0,
  created_at timestamptz default now()
);

-- Sales
create table sales (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations on delete cascade not null,
  contact_id uuid references contacts on delete set null,
  sale_date date default current_date not null,
  total_amount numeric(12,2) not null,
  paid_amount numeric(12,2) default 0,
  payment_method text check (payment_method in ('cash','bank_transfer','invoice','card')) default 'cash',
  status text check (status in ('completed','pending','cancelled')) default 'completed',
  notes text,
  created_by uuid references profiles,
  created_at timestamptz default now()
);

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references sales on delete cascade not null,
  product_id uuid references products on delete set null,
  quantity numeric(12,2) not null,
  unit_price numeric(12,2) not null,
  total_price numeric(12,2) not null
);

-- Expenses
create table expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations on delete cascade not null,
  category text not null,
  amount numeric(12,2) not null,
  expense_date date default current_date not null,
  description text,
  payment_method text default 'cash',
  created_by uuid references profiles,
  created_at timestamptz default now()
);
```

### 6.2 Indexes

```sql
create index idx_products_org on products(organization_id);
create index idx_stock_movements_org on stock_movements(organization_id);
create index idx_sales_org_date on sales(organization_id, sale_date);
create index idx_contacts_org on contacts(organization_id);
create index idx_expenses_org_date on expenses(organization_id, expense_date);
```

---

## 7. Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **Owner** | Full access; can delete organization; manage billing |
| **Admin** | Manage users, products, inventory, sales, expenses; read all reports |
| **Staff** | Record sales, add expenses, view products and stock; cannot delete records or manage users |

---

## 8. Supabase RLS Model

Every table has `organization_id`. All queries are scoped to the user's current organization.

```sql
-- Helper: get current user's organization
CREATE OR REPLACE FUNCTION get_current_organization()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT organization_id FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example RLS policies for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_org_isolation"
  ON products
  FOR ALL
  USING (organization_id = get_current_organization());

-- Profiles: users can read profiles in same org
CREATE POLICY "profiles_org_read"
  ON profiles
  FOR SELECT
  USING (organization_id = get_current_organization());

-- Profiles: users can only update their own profile
CREATE POLICY "profiles_self_update"
  ON profiles
  FOR UPDATE
  USING (id = auth.uid());
```

### RLS Rules Summary

| Table | Read | Insert | Update | Delete |
|-------|------|--------|--------|--------|
| organizations | owner only | — | owner only | owner only |
| profiles | same org | auth trigger | self + admin | — |
| categories | same org | same org | same org | admin+ |
| products | same org | same org | same org | admin+ |
| stock_movements | same org | same org | — | admin+ |
| contacts | same org | same org | same org | admin+ |
| sales | same org | same org | same day | admin+ |
| sale_items | same org | same org | — | cascade |
| expenses | same org | same org | same day | admin+ |

---

## 9. User Flows

### 9.1 Onboarding Flow

```
Landing page → Sign up (email/password or Google)
  → Create organization (business name)
    → Invite team (optional skip)
      → Quick setup wizard:
        1. Add first category
        2. Add first 3 products
        3. Record opening stock
      → Dashboard
```

### 9.2 Daily Sale Flow

```
Dashboard → "New Sale" button
  → Select customer (or walk-in)
    → Add products (search by name / scan barcode)
      → Set quantities, auto-calculate total
        → Select payment method (cash / bank / invoice)
          → Save → Stock auto-decrements → Print or share receipt
```

### 9.3 Stock-in Flow

```
Inventory → "Stock In" button
  → Select supplier (optional)
    → Add products received
      → Set quantities and unit costs
        → Save → Stock auto-increments → Update supplier balance if on credit
```

### 9.4 End-of-Day Flow

```
Dashboard → View today's summary cards
  → Sales total, expense total, net cash position
    → Drill into sales list for the day
      → Export to PDF (optional)
```

---

## 10. MVP Pages & UI Plan

| Page | Purpose | Key shadcn Components |
|------|---------|----------------------|
| Dashboard | Daily snapshot | Cards, Tabs, Badge, Skeleton |
| Product List | Browse/search products | Table, Input, Button, DropdownMenu |
| New Product | Add/edit product | Form, Input, Select, Dialog |
| Inventory | Stock overview | Table, Badge, Progress |
| Stock Movement | Record in/out | Form, Select, DataTable |
| New Sale | Record a sale | Form, Command (product search), Sheet |
| Sales List | View past sales | Table, DatePicker, Badge |
| Expenses | Log and view expenses | Table, Form, Select |
| Contacts | Customers & suppliers | Table, Tabs, Avatar |
| Settings | Org & user management | Form, Card, Switch, Dialog |

---

## 11. shadcn/ui Component Plan

### Install List

```bash
npx shadcn add button card input label select table tabs dialog sheet badge avatar dropdown-menu command popover date-picker skeleton switch toast separator
```

### Component Usage Map

| Component | Where Used |
|-----------|-----------|
| `button` | Everywhere |
| `card` | Dashboard stats, settings panels |
| `input` / `label` | All forms |
| `select` | Category picker, payment method, role selector |
| `table` | All list views (products, sales, expenses) |
| `tabs` | Dashboard segments, contact types |
| `dialog` | Confirmations, quick-add modals |
| `sheet` | Mobile filters, new sale sidebar |
| `badge` | Status indicators (paid, pending, low stock) |
| `avatar` | User list in settings |
| `dropdown-menu` | Row actions (edit, delete, print) |
| `command` | Product search in sale form |
| `popover` | Date pickers, quick menus |
| `date-picker` | Sale date, expense date filters |
| `skeleton` | Loading states for all pages |
| `switch` | Settings toggles |
| `toast` | Success / error feedback |
| `separator` | Settings layout |

---

## 12. Backend Logic Boundaries

### Server Actions (Next.js)

All mutations go through Server Actions. No direct client-side Supabase inserts/updates for transactional data.

```typescript
// app/(dashboard)/sales/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createSale(formData: SaleFormData) {
  const supabase = await createClient();
  
  // 1. Insert sale
  // 2. Insert sale_items
  // 3. Decrement product stock
  // 4. Create stock_movement records
  // 5. Update contact balance if on credit
  
  revalidatePath('/sales');
  revalidatePath('/dashboard');
  revalidatePath('/inventory');
}
```

### What Lives in Supabase

| Layer | Responsibility |
|-------|---------------|
| **RLS policies** | Row-level organization isolation |
| **Database triggers** | Auto-update `products.current_stock` on stock_movement insert |
| **Database functions** | `get_current_organization()`, reporting aggregates |
| **Storage buckets** | Product images, receipt PDFs |

### What Lives in Next.js

| Layer | Responsibility |
|-------|---------------|
| **Server Actions** | All mutations, multi-step transactions |
| **API Routes** | Webhooks (if any), PDF generation, CSV export |
| **Server Components** | Data fetching for pages |
| **Client Components** | Interactive forms, search, filters, toasts |

---

## 13. Pricing Plan

| Tier | Price | Limits |
|------|-------|--------|
| **Free** | ₮0 | 1 user, 100 products, 500 sales/month, no exports |
| **Standard** | ₮29,900/mo | 3 users, unlimited products & sales, exports, priority support |
| **Pro** | ₮79,900/mo | 10 users, multi-location (post-MVP), advanced reports, API access (post-MVP) |

**Billing:** Integrate Mongolian payment gateways (QPay, SocialPay, bank transfer) post-MVP. Start with manual bank transfer verification for paid tiers.

---

## 14. Build Phases

### Phase 1: Foundation (Weeks 1–2)

- [ ] Next.js project setup with shadcn/ui
- [ ] Supabase project + initial migrations
- [ ] Auth (login, register, logout)
- [ ] Organization creation flow
- [ ] Basic dashboard shell with sidebar

### Phase 2: Catalog & Inventory (Weeks 3–4)

- [ ] Categories CRUD
- [ ] Products CRUD with image upload
- [ ] Stock movement recording
- [ ] Product list with search

### Phase 3: Sales & Customers (Weeks 5–6)

- [ ] Contacts (customers + suppliers) CRUD
- [ ] Sale recording with line items
- [ ] Sale list with filters
- [ ] Basic receipt print view

### Phase 4: Cash & Expenses (Weeks 7–8)

- [ ] Expense logging
- [ ] Dashboard summary cards (today, this week, this month)
- [ ] Simple reports (sales by period, top products)

### Phase 5: Polish & Launch (Weeks 9–10)

- [ ] Role-based UI hiding
- [ ] Mobile responsiveness pass
- [ ] Onboarding wizard
- [ ] Performance optimization
- [ ] Beta launch with 5 pilot businesses

---

## 15. Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Framework | Next.js 15 App Router | RSC, Server Actions, file-based routing |
| Styling | Tailwind CSS + shadcn/ui | Rapid UI development, consistent design system |
| Database | Supabase PostgreSQL | Managed, RLS, Auth, Storage in one platform |
| Auth | Supabase Auth | OAuth + email/password out of the box |
| State Management | URL state + React state | No global state library needed for MVP |
| Forms | React Hook Form + Zod | Type-safe validation, minimal boilerplate |
| Queries | Supabase client in Server Components | Simple, no ORM overhead |
| Hosting | Vercel (frontend) + Supabase (backend) | Serverless, scalable, free tier generous |
| Images | Supabase Storage | Simple bucket policies, CDN delivery |

---

## 16. What Not to Build First

Avoid these until after MVP validation:

1. **Full double-entry accounting** — keep it cash-based and simple
2. **Multi-location / multi-warehouse** — single location per org for MVP
3. **Barcode scanner hardware integration** — manual entry + search first
4. **E-commerce or POS hardware** — web-based sales recording only
5. **Real-time sync / offline PWA** — responsive web app first
6. **Advanced analytics / forecasting** — basic summaries only
7. **White-label / reseller portal** — single SaaS brand first
8. **Mobile native apps** — mobile web is sufficient for validation

---

## 17. Final Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI components | shadcn/ui |
| Forms | React Hook Form + Zod |
| Backend / Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| File storage | Supabase Storage |
| Hosting | Vercel |
| Source control | GitHub |

---

## 18. Roadmap

| Phase | Timeline | Focus |
|-------|----------|-------|
| MVP | Months 1–3 | Core ERP features for single-location businesses |
| Beta | Month 4 | Pilot with 5–10 Mongolian small businesses |
| v1.0 | Months 5–6 | Polish, onboarding, payment integration |
| v1.5 | Months 7–9 | Multi-location, purchase orders, advanced reports |
| v2.0 | Year 2 | API, integrations (accounting software), mobile app |

---

## 19. Final Advice

1. **Start with one customer type.** Pick small retail shops first; don't try to serve everyone.
2. **Mongolian language from day one.** UI must feel native. Use i18n setup even if starting with Mongolian only.
3. **Mobile-first design.** Most users will operate from a phone behind the counter.
4. **Optimize for speed.** A shop owner should record a sale in under 30 seconds.
5. **Talk to users weekly.** The difference between a usable ERP and a forgotten one is 5 real customer conversations.
6. **Delay billing integration.** Verify willingness to pay via manual bank transfer before building automated billing.
7. **Keep the schema simple.** Every new table is a new RLS policy to maintain. Resist feature creep.
8. **Measure one metric.** Track daily active users (DAU) per organization. If they don't open it daily, the product isn't sticky.

---

*Document version: 1.0*  
*Last updated: 2026-05-22*

