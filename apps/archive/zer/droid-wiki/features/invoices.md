# Invoices

Active contributors: themuuln

## Purpose

The Invoices module handles invoice creation, listing, detail viewing, public sharing, and payment recording. Invoices are generated automatically when a sale is completed (via `createInvoiceFromSale`), or can be created manually for ad-hoc billing. Each invoice supports a shareable public link via a cryptographically random token for customer access without authentication.

## Directory Layout

| Path | Type | Purpose |
|---|---|---|
| `src/app/(dashboard)/invoices/page.tsx` | Server Component | Fetches invoices, contacts, products with branch filter |
| `src/app/(dashboard)/invoices/invoices-content.tsx` | Client Component | Manages drawer state, renders table or empty state |
| `src/app/(dashboard)/invoices/actions.ts` | Server Actions | `createInvoice`, `createInvoiceShareLink`, `updateInvoiceStatus` |
| `src/app/(dashboard)/invoices/new/page.tsx` | Server Component | Redirects to `/invoices?create=true` |
| `src/app/(dashboard)/invoices/[id]/page.tsx` | Server Component | Standalone invoice detail page for direct links |
| `src/app/(dashboard)/invoices/[id]/invoice-detail-client.tsx` | Client Component | Share link generation and status badge UI |
| `src/app/r/invoice/[token]/page.tsx` | Server Component | Public invoice view (no auth required) |
| `src/components/invoices/invoice-create-drawer.tsx` | Client Component | Slide-in drawer with invoice creation form |
| `src/components/invoices/invoice-detail-drawer.tsx` | Client Component | Slide-in drawer with invoice detail, status change, share link |
| `src/lib/invoicing.ts` | Server Utility | `createInvoiceFromSale` -- auto-generates invoice after sale |

## Key Abstractions

| Abstraction | Type | Purpose |
|---|---|---|
| `InvoiceRow` | Type | Row shape for the invoices table (number, dates, contact, amounts, status) |
| `InvoiceCreateDrawer` | Component | Drawer with contact combobox, line items, date pickers, notes |
| `InvoiceDetailDrawer` | Component | Drawer with invoice metadata, items table, status select, share dialog |
| `InvoiceDetailClient` | Component | Client-side status badge and share link dialog for standalone detail page |
| `createInvoice` | Server Action | Creates invoice with auto-generated number, contact, items |
| `createInvoiceFromSale` | Server Utility | Automatically generates invoice from a completed sale with share token |
| `createInvoiceShareLink` | Server Action | Generates a random 32-byte hex token for public sharing |
| `updateInvoiceStatus` | Server Action | Changes invoice status (pending/paid/partially_paid/overdue/cancelled) |

## How It Works

### Invoice Creation from Sales (Automatic)

When a sale is completed (via the sales module or after converting a quotation to a sale), `createInvoiceFromSale` in `src/lib/invoicing.ts` is called. This retrieves the sale and its items, then generates:

1. An invoice number via the `generate_invoice_number` database RPC
2. A share token (32 random bytes as hex) for public receipt access
3. The invoice record with `sale_id` linkage, status set to `paid`
4. Invoice items copied from sale items

Failures are logged but do not roll back the sale -- the sale is already committed when invoicing runs.

### Manual Invoice Creation

1. User clicks "Шинэ нэхэмжлэл" button or navigates to `/invoices?create=true`
2. `InvoiceCreateDrawer` opens with a react-hook-form + zod form
3. User fills in:
   - **Contact** -- combobox with creatable inline option (new contact created on the fly)
   - **Issue date** and **Due date** -- date pickers
   - **Line items** -- dynamic field array with product combobox, description, quantity, unit price
   - **Variant picker** -- appears when a selected product has variant groups
   - **Notes** -- optional textarea
4. Total amount computed reactively from line items
5. On submit, `createInvoice` server action runs:
   - Validates input, optionally creates a new contact via `findOrCreateContact`
   - Generates invoice number via `generate_invoice_number` RPC
   - Inserts invoice + invoice_items in two Supabase queries
   - Logs audit event
   - Calls `revalidateEntities(["invoices"])`
   - Redirects to the new invoice's detail page (`/invoices/[id]`)

### Invoice List View

The list page shows invoices in a `Card` with a `Table`. Columns: invoice number, issue date, due date, contact name, total amount (right-aligned), and status badge. Clicking a row opens the `InvoiceDetailDrawer`.

Status badges use Mongolian labels: "Хүлээгдэж буй" (pending), "Төлөгдсөн" (paid), "Хэсэгчилсэн" (partially_paid), "Хугацаа хэтэрсэн" (overdue), "Цуцлагдсан" (cancelled). An empty state with an `ErpEmptyState` component is shown when no invoices exist.

### Public Invoice Sharing (Token-Based)

```mermaid
flowchart LR
    A[User clicks Хуваалцах] --> B[createInvoiceShareLink]
    B --> C[randomBytes 32 hex token]
    C --> D[Update invoice.token in DB]
    D --> E[Return token to client]
    E --> F[Construct share URL: /r/invoice/{token}]
    F --> G[User copies link to clipboard]
    G --> H[Customer opens link]
    H --> I[PublicInvoicePage: fetch by token]
    I --> J[Render items, totals, org name]
```

The share feature:
- Generates a cryptographically random 32-byte hex token stored on the `invoices` table
- The public route at `src/app/r/invoice/[token]/page.tsx` uses a service-role Supabase client (bypasses RLS) to look up the invoice by token
- There is no authentication -- anyone with the link can view the invoice
- The public page shows: invoice details, items table, total amounts, contact info, org name
- If the token is invalid, a 404 is returned

### Payment Recording

Status changes are handled via `updateInvoiceStatus` server action, accessible from both:
- The `InvoiceDetailDrawer` (slide-in) -- a `NativeSelect` dropdown with all status options
- The standalone `InvoiceDetailPage` -- via the detail page

Available statuses: `pending`, `paid`, `partially_paid`, `overdue`, `cancelled`. When status changes:
1. The action fetches the current invoice to verify branch access
2. Updates the status
3. Logs an audit event with old and new status values
4. Revalidates the "invoices" entity cache

```mermaid
flowchart TD
    subgraph "Invoice Creation"
        A[Sale completed] --> B[createInvoiceFromSale]
        B --> C[Fetch sale + items]
        C --> D[Generate invoice number]
        D --> E[Generate share token]
        E --> F[Insert invoice + items]
    end

    subgraph "Manual Creation"
        G[User opens create drawer] --> H[Fill form: contact, dates, items]
        H --> I[createInvoice server action]
        I --> J[Generate number + insert]
    end

    subgraph "Sharing"
        K[User clicks Хуваалцах] --> L[createInvoiceShareLink]
        L --> M[Token stored on invoice]
        M --> N[Public URL: /r/invoice/{token}]
        N --> O[Anyone can view without login]
    end

    subgraph "Payment Recording"
        P[Status dropdown in drawer/page] --> Q[updateInvoiceStatus]
        Q --> R[Update DB + audit log + revalidate]
    end
```

## Key Source Files

| File | Role |
|---|---|
| `src/app/(dashboard)/invoices/page.tsx` | Server: fetches invoices, contacts, products |
| `src/app/(dashboard)/invoices/invoices-content.tsx` | Client: manages state, table, drawers |
| `src/app/(dashboard)/invoices/actions.ts` | Server Actions: create, share, update status |
| `src/components/invoices/invoice-create-drawer.tsx` | Drawer: invoice creation form with line items |
| `src/components/invoices/invoice-detail-drawer.tsx` | Drawer: detail view with status change and share |
| `src/app/(dashboard)/invoices/[id]/page.tsx` | Server: standalone detail page |
| `src/app/(dashboard)/invoices/[id]/invoice-detail-client.tsx` | Client: share dialog on detail page |
| `src/app/r/invoice/[token]/page.tsx` | Server: public invoice view (no auth) |
| `src/lib/invoicing.ts` | Utility: auto-invoice generation from sales |
