---
title: Project Structure
desc: Directory tree architecture
---

# Project Structure

```
zer/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── (auth)/                 # Auth pages (login, register, password reset)
│   │   ├── (dashboard)/            # Dashboard pages (authenticated)
│   │   │   ├── accounting/         # Double-entry accounting
│   │   │   ├── audit/              # Activity history log
│   │   │   ├── commissions/        # Staff commission tracking
│   │   │   ├── customers/          # Customer management
│   │   │   ├── discounts/          # Discount management
│   │   │   ├── expenses/           # Expense tracking
│   │   │   ├── inventory/          # Inventory, warehouses, categories, movements
│   │   │   ├── invoices/           # Invoice management
│   │   │   ├── products/           # Product catalog + bulk import
│   │   │   ├── purchases/          # Purchase orders
│   │   │   ├── quotations/         # Price quotations
│   │   │   ├── reports/            # Charts and KPI reports
│   │   │   ├── returns/            # Return management
│   │   │   ├── sales/              # Sales management
│   │   │   ├── settings/           # Organization settings (users, roles, SMTP, etc.)
│   │   │   ├── shop/               # Point of Sale (POS)
│   │   │   ├── suppliers/          # Supplier management
│   │   │   ├── dashboard-shell.tsx # Sidebar + header layout
│   │   │   ├── dashboard-client.tsx# Dashboard content
│   │   │   └── actions.ts          # Shared dashboard actions
│   │   ├── [slug]/                 # Public per-org product pages
│   │   ├── api/                    # API route handlers (cron, export, email)
│   │   ├── auth/                   # Auth callback handler
│   │   ├── landing/                # Marketing/landing page
│   │   ├── r/                      # Receipt/invoice share links
│   │   ├── update-password/        # Password update page
│   │   ├── layout.tsx              # Root layout
│   │   ├── globals.css             # Global Tailwind styles
│   │   ├── error.tsx               # Global error boundary
│   │   └── not-found.tsx           # 404 page
│   ├── components/
│   │   ├── accounting/             # Account + journal entry drawers
│   │   ├── categories/             # Category CRUD drawers
│   │   ├── customers/              # Customer CRUD drawers
│   │   ├── discounts/              # Discount CRUD drawers
│   │   ├── erp/                    # Shared ERP components (KPIs, stat cards, export, etc.)
│   │   ├── expenses/               # Expense drawers
│   │   ├── inventory/              # Movement + warehouse drawers
│   │   ├── invoices/               # Invoice drawers
│   │   ├── landing/                # Landing page sections (hero, features, etc.)
│   │   ├── products/               # Product CRUD drawers
│   │   ├── purchases/              # Purchase drawers
│   │   ├── quotations/             # Quotation drawers
│   │   ├── reports/                # Chart components
│   │   ├── returns/                # Return drawers
│   │   ├── roles/                  # Roles & permissions UI
│   │   ├── sales/                  # Sale drawers
│   │   ├── settings/               # Settings form components
│   │   ├── shop/                   # POS components (barcode, cart, receipt, etc.)
│   │   ├── suppliers/              # Supplier CRUD drawers
│   │   ├── ui/                     # shadcn/ui components (60+ primitives)
│   │   ├── permission-gate.tsx     # RBAC conditional rendering
│   │   └── ...
│   ├── lib/                        # Business logic, utilities, types
│   │   ├── supabase/               # Supabase client helpers (server, browser, admin)
│   │   ├── query/                  # TanStack Query hooks + realtime subscriptions
│   │   ├── actions/                # Shared server actions
│   │   ├── export/                 # CSV/XLSX generation utilities
│   │   ├── email/                  # Email service (Nodemailer)
│   │   ├── pdf/                    # PDF generation (pdf-lib, jsPDF)
│   │   ├── notification/           # Telegram notification service
│   │   ├── branding.ts             # Brand CSS generation
│   │   ├── constants.ts            # App constants
│   │   └── utils.ts                # Utility functions
│   └── middleware.ts               # Next.js middleware (auth, routing)
├── supabase/
│   └── migrations/                 # Database migration files
├── docs/                           # VitePress documentation
├── e2e/                            # Playwright + CodeceptJS E2E tests
├── tests/                          # Unit tests
├── public/                         # Static assets
└── scripts/                        # Utility scripts
```
