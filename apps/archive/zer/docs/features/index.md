---
title: Features
desc: Overview of all features
---

# Features

## Core Business Operations

### Sales

Create and manage sales with line-item entry, multi-line product selection, automatic stock validation, and real-time inventory deduction. Supports cash, card, and mobile banking payments. Salesperson tracking and commission calculation.

### Purchases

Record purchase orders from suppliers. Inventory is automatically updated on confirmation.

### Expenses

Track business expenses with category, amount, date, and receipt attachment.

### Returns

Handle product returns with automatic stock reconciliation.

## Inventory Management

### Products

Full product catalog with name, SKU, barcode, pricing (cost, wholesale, retail), category assignment, and warehouse stock levels.

### Categories

Organize products into hierarchical categories.

### Warehouses

Multi-warehouse support with stock tracking per location. Warehouse detail drawer shows inventory by product.

### Stock Movements

Track inventory movements (in/out/transfer) between warehouses with reason codes.

## Documents

### Invoices

Generate invoices with customer details, line items, totals, and PDF download. Shareable via public link.

### Quotations

Create price quotations for customers, convertible to invoices or sales.

### Discounts

Configure percentage or fixed-amount discounts, applicable to products or entire sales.

## Financial

### Accounting

Double-entry accounting system with:

- Chart of accounts (manageable via create/edit drawers)
- Journal entries with debit/credit line items
- RLS policies for organization-level isolation

### Commissions

Staff commission tracking based on sales performance with payout history and drill-down.

### Reports

Dashboard of charts and KPIs:

- Financial summary
- Product revenue and margin analysis
- Expense breakdown (donut chart)
- Stock movement trends
- Pending sales tracking
- Commission summary

## Point of Sale (Shop)

Barcode-aware POS interface with:

- Barcode scanning input
- Product catalog browsing
- Cart management
- Receipt printing (thermal printer friendly via `@media print`)
- Sales history
- Customer and staff assignment

## Settings & Administration

### Organization

Profile editing, theme customization (logo, colors, fonts).

### User Management

Invite, list, and manage organization users.

### Roles & Permissions

Role-based access control with granular permission editor, role CRUD, and `<PermissionGate>` component for conditional UI rendering.

### Notifications

Configure Telegram bot notifications and email (SMTP) reporting.

### Theme

Custom theme configuration with CSS variable injection — logo, primary colors, font family.

### Audit Log

Track all user actions with timestamp, user, and action details.

## Data Export

CSV export for: customers, expenses, inventory, products, reports, sales, and suppliers. Exports generated server-side via API routes.

## Automation

- Daily email reports via cron endpoint
- Telegram notifications for key events
- Database-level triggers for audit logging
- RLS policies for multi-tenant data isolation

## Auth & Security

- Supabase Auth with email/password
- Password reset flow
- Organization-scoped data access (RLS policies)
- Superadmin-only restricted settings (SMTP config)
- Role-based permission checks on every page/action
