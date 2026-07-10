# Tax System Improvements Plan — TOLOM

> Last revised: 2026-06-10
> 
> **Key requirement:** НӨАТ is optional — some companies don't pay it. Default rate = 10%.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Mongolian Tax Rules Research](#2-mongolian-tax-rules-research)
3. [Identified Gaps](#3-identified-gaps)
4. [Proposed Improvements](#4-proposed-improvements)
5. [Implementation Plan](#5-implementation-plan)
6. [Success Criteria](#6-success-criteria)

---

## 1. Current State Analysis

### What Exists Today

| Area | Status | Notes |
|------|--------|-------|
| **Tax rate setting** | ⚠️ Partial | Single `default_tax_rate` in org settings — no toggle to enable/disable |
| **НӨАТ toggle** | ❌ Missing | No way to disable НӨАТ for non-registered businesses |
| **Tax on estimates** | ⚠️ Manual | User manually enters `tax_total` as absolute amount |
| **Tax on invoices** | ⚠️ Partial | `tax_total` field exists but `createInvoiceFromWorkOrder` sets it to `0` |
| **Tax on work orders** | ❌ Missing | No НӨАТ toggle on work order — tax not tracked |
| **Tax on expenses** | ✅ Basic | `tax_amount` field on expenses (manual entry) |
| **PDF rendering** | ✅ Basic | Shows "Tax" label with amount, no rate breakdown |
| **Bay View totals** | ✅ Basic | Shows tax calculation with rate percentage |

### Current Tax Calculation Flow

```
Settings: default_tax_rate = 10 (stored as number)
    ↓
Work order: No НӨАТ toggle — not tracked
    ↓
Estimate creation: User manually enters tax_total (absolute amount)
    ↓
Invoice from work order: tax_total = 0 (no auto-calculation)
    ↓
Standalone invoice: tax_total or tax_rate * subtotal
    ↓
PDF: Shows "Tax: {amount}" if tax_total > 0
```

### Key Issues

1. **НӨАТ not optional** — no toggle for businesses that don't pay НӨАТ
2. **No auto-calculation** — user must manually compute tax amounts
3. **Work order → Invoice loses tax** — `createInvoiceFromWorkOrder` always sets `tax_total: 0`
4. **No НӨАТ toggle on work orders** — can't control tax per work order
5. **No tax name/label** — just "Tax" in English, should be "НӨАТ" for Mongolia
6. **No tax-exempt items** — all items treated the same
7. **No withholding tax (НДШ)** — social insurance not tracked per transaction
8. **No tax reporting** — no way to generate tax reports for filing

---

## 2. Mongolian Tax Rules Research

### 2.1 НӨАТ (VAT) — Value Added Tax

| Rule | Value | Details |
|------|-------|---------|
| **Standard rate** | 10% | Applied to most goods and services |
| **Registration threshold** | ₮50,000,000/year | Businesses exceeding this must register for НӨАТ |
| **Small business exemption** | ₮20,000,000/year | Small businesses under this may be exempt |
| **Auto repair services** | Taxable | All repair services subject to 10% НӨАТ |
| **Parts sales** | Taxable | Auto parts subject to 10% НӨАТ |
| **Labor-only services** | Taxable | Even pure labor is subject to НӨАТ |

### 2.2 НДШ (Social Insurance)

| Rule | Value | Details |
|------|-------|---------|
| **Employer contribution** | 11.5% | Of employee gross salary |
| **Employee contribution** | 10% | Of employee gross salary |
| **Applies to** | Wages only | Not to goods/services sales |

### 2.3 Auto Shop Specific Rules

| Rule | Details |
|------|---------|
| **Parts markup** | No specific markup rules, but must report cost basis |
| **Warranty work** | Still subject to НӨАТ on labor portion |
| **Insurance claims** | НӨАТ applies to total amount billed |
| **Cash transactions** | Same rules as non-cash |

---

## 3. Identified Gaps

### Critical Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| НӨАТ not optional at org level | Non-registered businesses forced to use it | P0 |
| No НӨАТ toggle on work orders | Can't control tax per work order | P0 |
| Work orders don't carry tax to invoices | Tax lost on invoice creation | P0 |
| No tax rate auto-application | Manual calculation errors | P0 |
| No tax name localization | "Tax" instead of "НӨАТ" | P1 |

### Important Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| No per-item tax rates | Can't exempt certain items | P2 |
| No tax report generation | Can't file taxes easily | P2 |
| No tax registration number on invoices | Non-compliant invoices | P2 |

### Nice-to-Have Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| No НДШ tracking | Social insurance separate | P3 | ✅ Section 4.10 |
| No e-invoice integration | Future requirement | P3 | ✅ Section 4.11 |

---

## 4. Proposed Improvements

### Phase 1: Core Tax Fixes (P0)

#### 4.1 Make НӨАТ Optional (Org-Level Toggle)

Add `nuat_enabled` boolean to org settings:

```typescript
// Organization settings
interface OrgSettings {
  // ... existing fields
  nuat_enabled: boolean;      // false by default
  default_tax_rate: number;   // 10 (default)
}
```

**Database migration:**
```sql
ALTER TABLE organization_settings 
  ADD COLUMN nuat_enabled BOOLEAN DEFAULT false;
```

**Files to modify:**
- `src/app/[locale]/dashboard/settings/_business-defaults-form.tsx` — Add toggle
- Database migration

#### 4.2 Add НӨАТ Toggle to Work Orders

Add per-work-order НӨАТ toggle:

```typescript
// work_orders table
interface WorkOrder {
  // ... existing fields
  nuat_enabled: boolean;  // Inherits from org, can override
}
```

**UI:** Add toggle in Bay View work order detail drawer:
```tsx
<div className="flex items-center justify-between">
  <Label>НӨАТ</Label>
  <Switch 
    checked={workOrder.nuat_enabled}
    onCheckedChange={toggleNuat}
  />
</div>
{workOrder.nuat_enabled && (
  <div className="text-sm text-muted-foreground">
    НӨАТ ({taxRate}%): {formatMNT(taxAmount)}
  </div>
)}
```

**Files to modify:**
- `src/components/bay-view-v2/work-order-detail-drawer.tsx`
- `src/lib/services/work-order-service.ts`
- Database migration

#### 4.3 Fix Work Order → Invoice Tax Transfer

**Current behavior:**
```typescript
// invoice-service.ts line ~180
tax_total: 0,  // Always zero!
```

**Proposed behavior:**
```typescript
// Read work order's nuat_enabled flag
// If enabled, calculate tax from subtotal
const taxEnabled = workOrder.nuat_enabled ?? false;
const taxRate = settings?.default_tax_rate ?? 10;
const taxTotal = taxEnabled 
  ? Math.round((subtotal - discountTotal) * taxRate) / 100 
  : 0;

// Use in insert
.insert({
  // ... existing fields
  tax_total: taxTotal,
  total: subtotal - discountTotal + taxTotal,
})
```

**Files to modify:**
- `src/lib/services/invoice-service.ts` — `createInvoiceFromWorkOrder()`

#### 4.4 Auto-Apply Tax Rate on Estimates

**Current behavior:**
```tsx
// estimates/new/page.tsx
const [taxTotal, setTaxTotal] = useState(0);
// User manually enters tax amount
```

**Proposed behavior:**
```tsx
// Auto-calculate tax from org's default_tax_rate
const { data: org } = useCurrentOrg();
const nuatEnabled = org?.settings?.nuat_enabled ?? false;
const defaultTaxRate = org?.settings?.default_tax_rate ?? 10;

// Only calculate if НӨАТ is enabled
const calculatedTax = nuatEnabled
  ? Math.round((subtotal - quoteDiscountTotal) * defaultTaxRate) / 100
  : 0;

// Add НӨАТ toggle for estimates too
const [nuatToggle, setNuatToggle] = useState(nuatEnabled);
const effectiveTax = nuatToggle ? calculatedTax : 0;
```

**Files to modify:**
- `src/app/[locale]/dashboard/estimates/new/page.tsx`
- `src/app/[locale]/dashboard/estimates/[id]/page.tsx` (edit estimate)

#### 4.5 Settings UI — НӨАТ Configuration

**Current behavior:**
```tsx
// _business-defaults-form.tsx
<Input type="number" min="0" max="100" step="0.1" />
```

**Proposed behavior:**
```tsx
// Add НӨАТ toggle + rate
<div className="flex items-center gap-4">
  <div className="flex items-center gap-2">
    <Switch 
      checked={nuatEnabled}
      onCheckedChange={(v) => rhfForm.setValue('nuatEnabled', v)}
    />
    <Label>{locale === 'mn' ? 'НӨАТ татвар' : 'VAT'}</Label>
  </div>
  {nuatEnabled && (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min="0"
        max="100"
        step="0.1"
        defaultValue="10"
        {...rhfForm.register('defaultTaxRate')}
      />
      <span className="text-muted-foreground">%</span>
    </div>
  )}
</div>
```

**Files to modify:**
- `src/app/[locale]/dashboard/settings/_business-defaults-form.tsx`
- `src/app/[locale]/dashboard/settings/page.tsx`

### Phase 2: Enhanced Tax Features (P1)

#### 4.6 Tax Name Localization

Add tax label based on locale:

| Locale | Label | Description |
|--------|-------|-------------|
| `mn` | НӨАТ | Нэмэгдсэн Өртөгт Татвар |
| `en` | VAT | Value Added Tax |

**Files to modify:**
- `src/lib/pdf/invoice-document.tsx` — Replace "Tax" with localized label
- `src/lib/pdf/estimate-document.tsx` — Same
- `src/components/bay-view-v2/_totals-summary.tsx` — Use localized label
- Translation files: `messages/mn.json`, `messages/en.json`

#### 4.7 Tax Registration Number on Invoices

Add organization's tax registration number to PDF:

```tsx
// invoice-document.tsx
{org.tax_id && (
  <Text style={sharedStyles.businessDetail}>
    {locale === 'mn' ? 'Татварын дугаар' : 'Tax ID'}: {org.tax_id}
  </Text>
)}
```

**Files to modify:**
- `src/lib/pdf/invoice-document.tsx`
- `src/lib/pdf/estimate-document.tsx`
- Database: Add `tax_id` field to organizations if not present

#### 4.8 Tax-Exempt Items

Allow marking certain items as tax-exempt:

```typescript
// invoice_items / estimate_items
interface TaxableItem {
  // ... existing fields
  is_tax_exempt: boolean;
  tax_rate: number | null; // Override org rate, null = use org default
}
```

**Database migration:**
```sql
ALTER TABLE invoice_items ADD COLUMN is_tax_exempt BOOLEAN DEFAULT false;
ALTER TABLE invoice_items ADD COLUMN tax_rate DECIMAL(5,2);
ALTER TABLE estimate_items ADD COLUMN is_tax_exempt BOOLEAN DEFAULT false;
ALTER TABLE estimate_items ADD COLUMN tax_rate DECIMAL(5,2);
```

### Phase 3: Reporting (P2)

#### 4.9 Tax Report Generation

Create a tax summary report for filing:

```
НӨАТ Тайлан: 2026 оны 1-р сар
├── НӨАТ-тэй борлуулалт: ₮15,000,000
├── НӨАТ цуглурсан: ₮1,363,636
├── НӨАТ-тэй худалдан авалт: ₮8,000,000
├── НӨАТ төлсөн: ₮727,273
└── НӨАТ төлбөр: ₮636,363
```

**New files:**
- `src/lib/services/tax-report-service.ts`
- `src/app/api/organizations/[id]/reports/tax/route.ts`
- `src/app/[locale]/dashboard/reports/tax/page.tsx`

### Phase 4: Additional Tax Features (P3)

#### 4.10 НДШ (Social Insurance) Tracking

**What is НДШ?**
- Нийгмийн даатгалын шимтгэл = Social Insurance Contribution
- **Employer pays:** 11.5% of employee gross salary
- **Employee pays:** 10% of employee gross salary
- **Applies to:** Wages/salary only, NOT to goods/services sales

**Relevance for Auto Shops:**
- НДШ is a payroll expense, not a sales tax
- Auto shops need to track НДШ for:
  - Accounting: Labor cost breakdown (gross salary + НДШ)
  - Profitability: True cost of mechanic labor
  - Reporting: Payroll tax filings

**Proposed Implementation:**

1. **Add НДШ fields to work orders** (optional labor cost tracking):

```typescript
// work_orders table
interface WorkOrder {
  // ... existing fields
  labor_hours: number | null;     // Total mechanic hours
  labor_cost: number | null;      // Gross labor cost (before НДШ)
  nuat_enabled: boolean;          // НӨАТ on sales (existing)
}
```

2. **Add НДШ settings to org:**

```typescript
// organization_settings
interface OrgSettings {
  // ... existing fields
  ndsh_employer_rate: number;  // 11.5 (default)
  ndsh_employee_rate: number;  // 10 (default)
  ndsh_enabled: boolean;       // false (opt-in)
}
```

3. **Calculate НДШ cost on work orders:**

```typescript
// In work order detail:
const laborCost = workOrder.labor_hours * hourlyRate;
const ndshEmployer = ndshEnabled ? laborCost * 0.115 : 0;
const totalLaborCost = laborCost + ndshEmployer;

// Display in bay view:
// Ажиллын зардал: ₮500,000
// НДШ (11.5%): ₮57,500
// Нийт зардал: ₮557,500
```

4. **Include НДШ in profitability reports:**

```
Ажлын зардлын тооцоо:
├── Ажилчдын цалин: ₮10,000,000
├── НДШ (ажил олгогч): ₮1,150,000
├── НДШ (ажилтан): ₮1,000,000
└── Нийт хөдөлмөрийн зардал: ₮12,150,000
```

**Files to modify:**
- Database: Add НДШ settings to `organization_settings`
- `src/app/[locale]/dashboard/settings/_business-defaults-form.tsx` — Add НДШ settings
- `src/components/bay-view-v2/work-order-detail-drawer.tsx` — Show labor cost + НДШ
- `src/lib/services/report-service/profitability.ts` — Include НДШ in reports

**Why this is P3:**
- НДШ is payroll, not sales tax — most shops handle this in separate payroll software
- Adding it here is nice-to-have for cost tracking, not required for invoicing
- Can be added later without breaking existing functionality

---

#### 4.11 E-Invoice Integration (Э-Баримт)

**What is E-Invoice (Э-Баримт)?**
- Mongolia's electronic invoice system managed by the General Taxation Authority (Татварын ерөнхий газар)
- Required for B2B transactions
- Each invoice must be registered with the tax authority and receive a unique registration number
- System ensures tax compliance and prevents fraud

**Current Status:**
- E-invoice is mandatory for most businesses
- Integration happens via:
  1. **Кассын машин (POS terminal)** — For retail/cash transactions
  2. **Э-Баримт API** — For B2B invoicing
  3. **Татварын machine** — Physical device for some businesses

**How E-Invoice Works:**

```
1. Business creates invoice in TOLOM
2. TOLOM sends invoice data to E-Barimt API
3. E-Barimt validates and registers invoice
4. Returns: registration_number, qr_code, validation_url
5. Invoice displays: Э-Баримт дугаар, QR code
6. Customer can verify at ebarimt.mn
```

**Proposed Implementation:**

1. **Add E-Invoice settings to org:**

```typescript
// organization_settings
interface OrgSettings {
  // ... existing fields
  einvoice_enabled: boolean;       // false (opt-in)
  einvoice_api_key: string | null; // API key from tax authority
  einvoice_merchant_id: string | null; // Merchant ID
  einvoice_endpoint: string;       // API endpoint URL
}
```

2. **Add E-Invoice fields to invoices:**

```typescript
// invoices table
interface Invoice {
  // ... existing fields
  einvoice_registration_id: string | null;  // From E-Barimt
  einvoice_qr_code: string | null;          // QR code data
  einvoice_status: string | null;           // pending, registered, failed
  einvoice_registered_at: string | null;    // When registered
}
```

3. **E-Invoice service:**

```typescript
// src/lib/services/einvoice-service.ts
export async function registerEInvoice(invoiceId: string, orgId: string) {
  const org = await getOrgSettings(orgId);
  if (!org.einvoice_enabled) return null;

  const invoice = await getInvoice(invoiceId);
  
  // Build E-Barimt payload
  const payload = {
    merchantId: org.einvoice_merchant_id,
    invoiceNumber: invoice.invoice_number,
    invoiceDate: invoice.issued_at,
    totalAmount: invoice.total,
    taxAmount: invoice.tax_total,
    items: invoice.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      amount: item.total_price,
    })),
  };

  // Call E-Barimt API
  const response = await fetch(org.einvoice_endpoint + '/register', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${org.einvoice_api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  
  // Store registration
  await supabase.from('invoices').update({
    einvoice_registration_id: result.registrationId,
    einvoice_qr_code: result.qrCode,
    einvoice_status: 'registered',
    einvoice_registered_at: new Date().toISOString(),
  }).eq('id', invoiceId);

  return result;
}
```

4. **Display E-Invoice info on PDF:**

```tsx
// invoice-document.tsx
{invoice.einvoice_registration_id && (
  <View style={sharedStyles.einvoiceSection}>
    <Text style={sharedStyles.einvoiceLabel}>Э-Баримт</Text>
    <Text style={sharedStyles.einvoiceNumber}> 
      №{invoice.einvoice_registration_id}
    </Text>
    {invoice.einvoice_qr_code && (
      <Image src={invoice.einvoice_qr_code} style={sharedStyles.qrCode} />
    )}
  </View>
)}
```

5. **Auto-register on invoice send:**

```typescript
// When invoice status changes to 'sent'
if (org.einvoice_enabled && invoice.einvoice_status !== 'registered') {
  await registerEInvoice(invoiceId, orgId);
}
```

**Files to modify:**
- Database: Add E-Invoice fields
- `src/lib/services/einvoice-service.ts` — New service
- `src/lib/services/invoice-service.ts` — Auto-register on send
- `src/lib/pdf/invoice-document.tsx` — Show registration ID + QR
- `src/app/[locale]/dashboard/settings/_business-defaults-form.tsx` — E-Invoice settings

**Why this is P3:**
- E-Invoice is mandatory but many small shops still use manual processes
- Integration requires API credentials from tax authority (external dependency)
- Can be added as a premium feature later
- Existing invoices work fine without it — just not compliant for B2B

**External Dependencies:**
- Tax authority API documentation
- API key registration process
- Testing with sandbox environment

---

## 5. Implementation Plan

### Phase 1: Core Tax Fixes (2-3 days)

| Task | Files | Effort |
|------|-------|--------|
| Add НӨАТ toggle to org settings | DB migration, `_business-defaults-form.tsx` | M |
| Add НӨАТ toggle to work orders | DB migration, `work-order-detail-drawer.tsx`, `work-order-service.ts` | M |
| Fix work order → invoice tax transfer | `invoice-service.ts` | S |
| Auto-apply tax on estimates | `estimates/new/page.tsx`, `estimates/[id]/page.tsx` | M |
| Update settings UI with tax name | `_business-defaults-form.tsx` | S |

### Phase 2: Enhanced Features (2-3 days)

| Task | Files | Effort |
|------|-------|--------|
| Tax name localization (НӨАТ vs VAT) | PDF docs, bay view, translations | M |
| Tax registration number on invoices | PDF docs, org settings | S |
| Tax-exempt items (per-line override) | DB migration, services, UI | L |
| НӨАТ toggle on estimates | Estimate pages | S |

### Phase 3: Reporting (2-3 days)

| Task | Files | Effort |
|------|-------|--------|
| Tax report service | New service file | M |
| Tax report API route | New route | S |
| Tax report page | New page | M |

### Phase 4: Additional Features (3-5 days)

| Task | Files | Effort |
|------|-------|--------|
| НДШ settings + labor cost tracking | DB migration, settings UI, bay view | M |
| НДШ in profitability reports | Report service | S |
| E-Invoice settings | DB migration, settings UI | M |
| E-Invoice service + API integration | New service file | L |
| E-Invoice display on PDFs | PDF documents | S |
| Auto-register on invoice send | Invoice service | S |

### Total Estimated Effort: 9-14 days

---

## 6. Success Criteria

### Phase 1

- [ ] НӨАТ toggle exists in org settings (default: off)
- [ ] НӨАТ toggle exists on work orders (inherits from org)
- [ ] Work orders correctly transfer tax to invoices (only if НӨАТ enabled)
- [ ] Estimates auto-calculate tax when НӨАТ is enabled
- [ ] Settings shows "НӨАТ" label for Mongolian locale
- [ ] All existing tests pass

### Phase 2

- [ ] PDFs show "НӨАТ" instead of "Tax" for Mongolian locale
- [ ] Tax registration number appears on invoices
- [ ] Users can mark items as tax-exempt
- [ ] Tax calculation respects exempt items
- [ ] НӨАТ toggle works on estimates

### Phase 3

- [ ] Tax report shows total НӨАТ collected and paid
- [ ] Report can be exported as CSV/PDF
- [ ] Report covers any date range

### Phase 4

- [ ] НДШ settings exist in org (opt-in, default rates)
- [ ] Work orders show labor cost + НДШ breakdown
- [ ] Profitability reports include НДШ
- [ ] E-Invoice settings exist in org (API key, merchant ID)
- [ ] Invoices can be registered with E-Barimt
- [ ] PDF shows E-Barimt registration ID + QR code
- [ ] Auto-register on invoice send (if enabled)

---

## Appendix: Code Snippets

### Auto-calculate tax in createInvoiceFromWorkOrder

```typescript
// In invoice-service.ts, after calculating subtotal:

// Fetch work order and org settings
const { data: workOrder } = await supabase
  .from("work_orders")
  .select("nuat_enabled")
  .eq("id", workOrderId)
  .single();

const { data: settings } = await supabase
  .from("organization_settings")
  .select("default_tax_rate")
  .eq("organization_id", orgId)
  .single();

const nuatEnabled = workOrder?.nuat_enabled ?? false;
const taxRate = Number(settings?.default_tax_rate ?? 10);
const taxTotal = nuatEnabled
  ? Math.round((subtotal - discountTotal) * taxRate) / 100
  : 0;
const total = subtotal - discountTotal + taxTotal;

// Use in insert
.insert({
  // ... existing fields
  tax_total: taxTotal,
  total,
  balance_due: total,
})
```

### Localized tax label

```typescript
// In PDF components:
const taxLabel = locale === 'mn' ? 'НӨАТ' : 'VAT';

// In totals section (only show if tax > 0):
{invoice.tax_total > 0 && (
  <View style={sharedStyles.totalRow}>
    <Text style={sharedStyles.totalRowLabel}>{taxLabel} ({taxRate}%)</Text>
    <Text style={sharedStyles.totalRowValue}>
      {formatAmount(invoice.tax_total, currency)}
    </Text>
  </View>
)}
```

### НӨАТ toggle on work order detail drawer

```tsx
// In bay-view-v2/work-order-detail-drawer.tsx
import { Switch } from '@/components/ui/switch';

<div className="flex items-center justify-between px-4 py-2">
  <div className="flex flex-col">
    <Label className="text-sm font-medium">НӨАТ</Label>
    <span className="text-xs text-muted-foreground">
      {locale === 'mn' ? 'Нэмэгдсэн Өртөгт Татвар' : 'Value Added Tax'}
    </span>
  </div>
  <Switch 
    checked={workOrder.nuat_enabled}
    onCheckedChange={handleNuatToggle}
  />
</div>
```
