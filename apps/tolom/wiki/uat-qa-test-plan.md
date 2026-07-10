# TOLOM — UAT/QA Test Plan

> **Version**: 1.0
> **Date**: 2026-05-19
> **Scope**: Full-stack end-to-end testing across all modules
> **Stack**: Next.js 16.2.6 · Supabase · PostgreSQL · agent-browser v0.27.0

---

## Test Environment

| Parameter | Value |
|-----------|-------|
| App URL | `http://localhost:3000` |
| Locale | `/mn` (Mongolian) |
| Supabase | Remote project `fhzuolncswccxkcqzclg` |
| Auth | Supabase Auth (email/password) |
| Browser | Chromium via agent-browser |

### Test Credentials

> **Note**: Create test users via the Supabase MCP or auth flow before running tests.

| Role | Email | Purpose |
|------|-------|---------|
| Admin | `admin@tolom.test` | Full access, multi-tenant test |
| Mechanic | `mechanic@tolom.test` | Limited role, WO assignment |

---

## Module 1: Authentication Flow

### TC-AUTH-01: Login Page Render
- **Precondition**: Clear session
- **Action**: Navigate to `/mn/auth/login`
- **Expected**: Login form renders with email/password fields, submit button, signup link, forgot password link
- **Verification**: Snapshot page, check for form elements

### TC-AUTH-02: Successful Login
- **Precondition**: Valid credentials exist
- **Action**: Fill email + password, click submit
- **Expected**: Redirected to `/mn/dashboard` after login
- **Verification**: Dashboard renders, no auth errors in console, user menu shows name

### TC-AUTH-03: Login with Invalid Credentials
- **Precondition**: —
- **Action**: Fill wrong email/password, submit
- **Expected**: Error message displayed, no redirect
- **Verification**: Error toast or inline message visible

### TC-AUTH-04: Unauthenticated Access Redirect
- **Precondition**: Clear session
- **Action**: Navigate to `/mn/dashboard/work-orders`
- **Expected**: Redirected to `/mn/auth/login` with return URL
- **Verification**: Login page renders after navigation

### TC-AUTH-05: Signup Flow
- **Precondition**: —
- **Action**: Navigate to `/mn/auth/signup`, fill all required fields
- **Expected**: Signup completes, email confirmation shown or auto-login
- **Verification**: Dashboard or confirmation page renders

### TC-AUTH-06: Signout
- **Precondition**: Authenticated
- **Action**: Navigate to `/mn/auth/signout`
- **Expected**: Session cleared, redirected to login
- **Verification**: Login page renders, dashboard inaccessible

### TC-AUTH-07: Select Organization (Multi-Org)
- **Precondition**: User belongs to multiple orgs
- **Action**: Login → select org from list
- **Expected**: Dashboard loads with org-specific data
- **Verification**: Dashboard data matches selected org

### TC-AUTH-08: Forgot + Reset Password
- **Precondition**: —
- **Action**: Navigate to `/mn/auth/forgot-password`, enter email
- **Expected**: Confirmation shown, reset link sent
- **Verification**: Success message displayed

---

## Module 2: Customer CRM

### TC-CUST-01: Customer List Page
- **Precondition**: Authenticated, at least one customer exists
- **Action**: Navigate to `/mn/dashboard/customers`
- **Expected**: Customer list renders with search, pagination, columns (name, phone, vehicles, last visit)
- **Verification**: Snapshot page, verify table structure

### TC-CUST-02: Customer List Empty State
- **Precondition**: Auth in org with 0 customers
- **Action**: Navigate to `/mn/dashboard/customers`
- **Expected**: Empty state shown with "Add Customer" CTA
- **Verification**: Empty state message present

### TC-CUST-03: Create Customer
- **Precondition**: —
- **Action**: Navigate to `/mn/dashboard/customers/new`, fill first name, phone, submit
- **Expected**: Customer created, redirected to customer detail or list
- **Verification**: New customer appears in list

### TC-CUST-04: Create Customer Validation
- **Precondition**: —
- **Action**: Submit customer form empty
- **Expected**: Validation errors shown for required fields
- **Verification**: Error messages visible inline

### TC-CUST-05: Search Customer by Phone
- **Precondition**: Customers exist
- **Action**: Use search bar, enter partial phone number
- **Expected**: Matching customers shown, results filter in real-time
- **Verification**: Search results match phone query

### TC-CUST-06: Search Customer by Name
- **Precondition**: Customers exist
- **Action**: Use search bar, enter name
- **Expected**: Matching customers shown
- **Verification**: Search results match name query

### TC-CUST-07: Customer Detail Page
- **Precondition**: Customer exists with vehicles + WO history
- **Action**: Navigate to `/mn/dashboard/customers/[id]`
- **Expected**: Detail shows customer info, vehicle list, service history, recent WO
- **Verification**: All sections render, data is org-scoped

### TC-CUST-08: Edit Customer
- **Precondition**: Customer exists
- **Action**: Edit customer fields, save
- **Expected**: Changes saved, detail page reflects updates
- **Verification**: Updated fields shown correctly

### TC-CUST-09: Delete Customer (Soft)
- **Precondition**: Customer exists
- **Action**: Delete customer
- **Expected**: Customer soft-deleted, removed from list
- **Verification**: Customer no longer in active list, `deleted_at` set in DB

### TC-CUST-10: Duplicate Phone Rejection
- **Precondition**: Customer with phone `99112233` exists
- **Action**: Create new customer with same phone
- **Expected**: Error shown, creation rejected
- **Verification**: Error toast: "already exists"

---

## Module 3: Vehicle Management

### TC-VEH-01: Vehicle List Page
- **Precondition**: Vehicles exist
- **Action**: Navigate to `/mn/dashboard/vehicles`
- **Expected**: Vehicle list renders with plate, make, model, year, owner columns
- **Verification**: Table renders with data

### TC-VEH-02: Create Vehicle
- **Precondition**: —
- **Action**: Navigate to `/mn/dashboard/vehicles/new`, fill plate, make, model, year, submit
- **Expected**: Vehicle created, redirected to detail
- **Verification**: Detail shows all entered data

### TC-VEH-03: Plate Number Duplicate Detection
- **Precondition**: Vehicle with plate `001УБА` exists
- **Action**: Create vehicle with same plate
- **Expected**: Error shown, duplicate rejected
- **Verification**: Error message about duplicate plate

### TC-VEH-04: Plate Number Search
- **Precondition**: Vehicles exist with known plates
- **Action**: Use search bar, enter partial plate
- **Expected**: Matching vehicles shown
- **Verification**: Results match plate query

### TC-VEH-05: Vehicle Detail + Service History
- **Precondition**: Vehicle has completed work orders
- **Action**: Navigate to `/mn/dashboard/vehicles/[id]`
- **Expected**: Detail shows vehicle info, owner, service history timeline
- **Verification**: Service history renders with WO references

### TC-VEH-06: Link Vehicle to Customer
- **Precondition**: Customer exists
- **Action**: Create vehicle with customer owner
- **Expected**: Vehicle linked to customer, visible in customer detail
- **Verification**: Customer detail shows vehicle

---

## Module 4: Work Order Lifecycle (CRITICAL PATH)

### TC-WO-01: Work Order List
- **Precondition**: Work orders exist
- **Action**: Navigate to `/mn/dashboard/work-orders`
- **Expected**: List renders with status badges, customer, vehicle, mechanic, total columns
- **Verification**: Snapshot, verify status badges render correctly

### TC-WO-02: Create Work Order
- **Precondition**: Customer + vehicle exist
- **Action**: Navigate to `/mn/dashboard/work-orders/new`, select customer, vehicle, add complaint, create
- **Expected**: WO created with status "New", status history entry created
- **Verification**: Detail page shows WO with "New" status

### TC-WO-03: Create WO with Customer Quick-Create
- **Precondition**: —
- **Action**: Create WO, quick-add customer inline
- **Expected**: Customer created and selected in same flow
- **Verification**: WO created with new customer linked

### TC-WO-04: Add Service to WO
- **Precondition**: WO exists in "New" or "Diagnosing" status
- **Action**: Add service from catalog with quantity, verify price
- **Expected**: Service added as line item, total updated
- **Verification**: Service visible in detail, total recalculated

### TC-WO-05: Add Service with Price Memory
- **Precondition**: Service has previous price history
- **Action**: Add service — verify "last sold price" hint visible
- **Expected**: Price input shows "last: ₮XXX" hint from history
- **Verification**: Price memory hint renders below price field

### TC-WO-06: Add Part to WO
- **Precondition**: WO exists
- **Action**: Add manual part with name, quantity, price
- **Expected**: Part added as line item with final_price calculation
- **Verification**: Part visible in detail

### TC-WO-07: Add Part with Inventory Deduction
- **Precondition**: WO exists, part has inventory
- **Action**: Add part with `part_id` from catalog
- **Expected**: Part added, inventory_movement created with type "sale"
- **Verification**: Inventory balance decreases, movement ledger updated

### TC-WO-08: Assign Mechanic
- **Precondition**: WO exists, mechanic user exists
- **Action**: Assign mechanic to WO
- **Expected**: Mechanic assigned, mechanic_assignment created, WO.mechanic_id updated
- **Verification**: Detail shows mechanic name

### TC-WO-09: Status Transition (New → Diagnosing → In Progress)
- **Precondition**: WO in "New"
- **Action**: Change status to Diagnosing, then to In Progress
- **Expected**: Status updates, status_history entries created for each transition
- **Verification**: Detail shows status history with all transitions

### TC-WO-10: Status Transition with Notes
- **Precondition**: WO in progress
- **Action**: Change status, add mechanic notes
- **Expected**: Notes saved with status history entry
- **Verification**: Notes appear in status history

### TC-WO-11: Complete Work Order
- **Precondition**: WO has services, parts, mechanic assigned
- **Action**: Change status to "Completed"
- **Expected**: WO completed, `completed_at` set, service schedules auto-created
- **Verification**: Detail shows "Completed" status, `vehicle_service_schedules` created

### TC-WO-12: Cancel Work Order (Soft Delete)
- **Precondition**: WO exists
- **Action**: Cancel WO
- **Expected**: Status set to "Cancelled", `deleted_at` set
- **Verification**: WO not in active list, status history shows "Cancelled"

### TC-WO-13: Work Order Detail - Status History Ledger
- **Precondition**: WO has multiple status changes
- **Action**: View WO detail
- **Expected**: Immutable status history timeline shown with timestamps
- **Verification**: All status transitions visible in order

### TC-WO-14: WO Discount Calculation
- **Precondition**: WO has services
- **Action**: Add service with discount amount + discount percentage
- **Expected**: `final_price` = (unit_price × quantity) - discount_amount - (% discount), grand_total recalculated
- **Verification**: Correct pricing shown in detail

### TC-WO-15: WO Total Never Below Zero
- **Precondition**: WO service with discount > price
- **Action**: Verify grand total
- **Expected**: Grand total clamped to minimum 0
- **Verification**: Total displays 0, not negative

### TC-WO-16: Service History Auto-Update
- **Precondition**: WO completed
- **Action**: Check vehicle service history
- **Expected**: Completed WO appears in vehicle service history
- **Verification**: Vehicle detail shows WO in history

---

## Module 5: Service Catalog

### TC-SVC-01: Service Catalog List
- **Precondition**: Services exist
- **Action**: Navigate to `/mn/dashboard/services`
- **Expected**: Service list renders with name, category, default price, active status
- **Verification**: Table renders correctly

### TC-SVC-02: Create Service
- **Precondition**: —
- **Action**: Create service with name, category, default price
- **Expected**: Service created, appears in catalog
- **Verification**: New service in list

### TC-SVC-03: Edit Service Price
- **Precondition**: Service exists
- **Action**: Update default price
- **Expected**: Price updated, new price in catalog
- **Verification**: Updated price shown

### TC-SVC-04: Service Price History
- **Precondition**: Service has price changes
- **Action**: View price history for service
- **Expected**: Ordered list of price changes with timestamps
- **Verification**: All price changes visible chronologically

### TC-SVC-05: Delete Service (Soft)
- **Precondition**: Service exists
- **Action**: Delete service
- **Expected**: Soft-deleted (`deleted_at` set)
- **Verification**: Service no longer in active list

---

## Module 6: Inventory Management

### TC-INV-01: Parts Catalog List
- **Precondition**: Parts exist
- **Action**: Navigate to `/mn/dashboard/inventory`
- **Expected**: Parts list with name, category, default price, stock level, popularity score
- **Verification**: Table renders with stock info

### TC-INV-02: Create Part
- **Precondition**: —
- **Action**: Navigate to inventory, create part with name, category, unit, default price
- **Expected**: Part created, appears in catalog
- **Verification**: New part in list

### TC-INV-03: Stock Movement (Purchase In)
- **Precondition**: Part exists
- **Action**: Record stock-in movement (purchase), quantity 10
- **Expected**: Movement recorded, inventory balance updated
- **Verification**: Balance shows +10 for part

### TC-INV-04: Stock Movement (Sale Out / Adjustment)
- **Precondition**: Part has stock
- **Action**: Record stock-out movement (sale or adjustment)
- **Expected**: Movement recorded, balance decreased
- **Verification**: Balance reflects deduction

### TC-INV-05: Low Stock Alert
- **Precondition**: Part below minimum threshold
- **Action**: Navigate to `/mn/dashboard/inventory/alerts`
- **Expected**: Low stock items displayed with current quantity vs threshold
- **Verification**: Alert list shows understocked parts

### TC-INV-06: Set Stock Threshold
- **Precondition**: Part exists
- **Action**: Set minimum quantity threshold
- **Expected**: Threshold saved
- **Verification**: Threshold visible in part detail

### TC-INV-07: Suppliers List
- **Precondition**: Suppliers exist
- **Action**: Navigate to `/mn/dashboard/inventory/suppliers`
- **Expected**: Supplier list with name, phone, contact info
- **Verification**: Table renders

### TC-INV-08: Create Purchase Order
- **Precondition**: Supplier + parts exist
- **Action**: Create PO with supplier, line items
- **Expected**: PO created with status "Pending"
- **Verification**: PO appears in list

### TC-INV-09: Receive Purchase Order
- **Precondition**: PO in "Pending" status
- **Action**: Receive PO items
- **Expected**: PO status updated, inventory_movements created with type "purchase"
- **Verification**: Stock balance increased, PO status changed to "Received"

### TC-INV-10: Part Price History
- **Precondition**: Part has been sold before
- **Action**: Check part detail
- **Expected**: Part price history visible with last sold price info
- **Verification**: Price history renders

---

## Module 7: Dashboard & Reports

### TC-DASH-01: Dashboard Load
- **Precondition**: Data exists
- **Action**: Navigate to `/mn/dashboard`
- **Expected**: KPI cards (revenue, active WO, customers), charts (revenue trend, WO status distribution), recent WO table
- **Verification**: All widgets render with data, no loading spinners stuck

### TC-DASH-02: Dashboard Period Filter
- **Precondition**: —
- **Action**: Switch between Today / Week / Month / All time periods
- **Expected**: Dashboard data updates for selected period
- **Verification**: KPI values change per period

### TC-DASH-03: Dashboard Loading State
- **Precondition**: Slow connection (simulate)
- **Action**: Navigate to dashboard
- **Expected**: Skeleton loaders shown during data fetch
- **Verification**: Skeleton components visible while loading

### TC-DASH-04: Dashboard Error State
- **Precondition**: Network failure
- **Action**: Load dashboard with API failing
- **Expected**: Error card with retry button shown
- **Verification**: Error state + retry functionality works

### TC-DASH-05: Daily Timeline Panel
- **Precondition**: WO status changes today
- **Action**: View dashboard
- **Expected**: Right-side timeline shows status changes with timestamps, mechanic names
- **Verification**: Timeline renders events chronologically

### TC-DASH-06: Daily Revenue Goal
- **Precondition**: —
- **Action**: View dashboard
- **Expected**: Daily goal card with progress bar, inline edit option
- **Verification**: Goal display renders correctly

### TC-DASH-07: Mechanic Daily Report
- **Precondition**: Mechanic has completed WOs today
- **Action**: Navigate to `/mn/dashboard/mechanic`
- **Expected**: Daily report shows WO count, revenue, services count, parts count
- **Verification**: Report data matches actual WO data

### TC-DASH-08: Mechanic Weekly Report
- **Precondition**: Mechanic has completed WOs this week
- **Action**: Navigate to weekly report
- **Expected**: 7-day breakdown with aggregated totals
- **Verification**: Daily breakdown shows correct per-day data

### TC-DASH-09: Mechanic Monthly Report
- **Precondition**: Mechanic has completed WOs this month
- **Action**: Navigate to monthly report
- **Expected**: Monthly totals for the selected mechanic
- **Verification**: Report data correct

### TC-DASH-10: End-of-Day Summary
- **Precondition**: WOs completed today
- **Action**: View end-of-day summary
- **Expected**: Mechanic-by-mechanic breakdown with totals
- **Verification**: Summary matches individual mechanic reports

### TC-DASH-11: Mechanic Selector Filter
- **Precondition**: Multiple mechanics exist
- **Action**: Select specific mechanic from filter
- **Expected**: Dashboard/report data filtered to that mechanic
- **Verification**: Only selected mechanic's data shown

---

## Module 8: Multi-Tenant Security

### TC-SEC-01: RLS Data Isolation (Customers)
- **Precondition**: Two orgs with separate customer data
- **Action**: Org A user logs in → sees only Org A customers. Org B user → only Org B.
- **Expected**: No cross-org data leakage
- **Verification**: Customer lists contain only org-scoped data

### TC-SEC-02: RLS Direct URL Access Prevention
- **Precondition**: Org A user knows Org B customer ID
- **Action**: Attempt to access `/mn/dashboard/customers/[org-b-customer-id]`
- **Expected**: 404 or 403 error, not Org B's data
- **Verification**: Error page shown, no data leaked

### TC-SEC-03: Unauthenticated API Access
- **Precondition**: No session
- **Action**: Call `/api/organizations/[id]/customers` directly
- **Expected**: 401 Unauthorized
- **Verification**: API returns error status

### TC-SEC-04: Cross-Org API Access
- **Precondition**: Org A user, Org B data
- **Action**: API call with Org B's organization_id
- **Expected**: Empty result or 403
- **Verification**: No Org B data returned

### TC-SEC-05: Subscription Guard (Expired)
- **Precondition**: Organization with expired subscription
- **Action**: Login as member of expired org
- **Expected**: Redirected to subscription page or shown expired notice
- **Verification**: Subscription expired dialog shown

---

## Module 9: Service Reminders

### TC-REM-01: Service Reminders Page
- **Precondition**: Vehicle service schedules exist
- **Action**: Navigate to `/mn/dashboard/service-reminders`
- **Expected**: Schedule list with vehicle, service, next due date/odometer
- **Verification**: Table renders correctly

### TC-REM-02: Auto-Sync on WO Completion
- **Precondition**: WO completed with services
- **Action**: Complete a WO with services that have catalog intervals
- **Expected**: `vehicle_service_schedules` created/updated for each service
- **Verification**: Schedule appears on service-reminders page

### TC-REM-03: Sync from History
- **Precondition**: Completed WOs without schedules
- **Action**: Click "Sync from history" button
- **Expected**: Past completed WOs scanned, schedules created
- **Verification**: New schedules appear for historical WOs

---

## Module 10: Finance & Invoices

### TC-FIN-01: Finance Page
- **Precondition**: Payments exist
- **Action**: Navigate to `/mn/dashboard/finance`
- **Expected**: Payment list with amount, method, date, status
- **Verification**: Table renders

### TC-FIN-02: Invoice View
- **Precondition**: Work orders exist
- **Action**: View invoice for a WO
- **Expected**: Invoice renders with services, parts, totals
- **Verification**: Invoice structure correct

### TC-FIN-03: Public Invoice Share
- **Precondition**: Invoice exists
- **Action**: Access `/invoice/[public-token]`
- **Expected**: Public invoice renders without auth
- **Verification**: Invoice visible to unauthenticated user

---

## Module 11: Organization & Settings

### TC-ORG-01: Organization Settings
- **Precondition**: —
- **Action**: Navigate to `/mn/dashboard/organization`
- **Expected**: Org settings page with name, slug, logo upload
- **Verification**: Settings render correctly

### TC-ORG-02: Branch Management
- **Precondition**: —
- **Action**: View branches in org settings
- **Expected**: Branch list, auto-created main branch shown
- **Verification**: At least one branch exists

### TC-ORG-03: Team Members
- **Precondition**: Multiple users in org
- **Action**: Navigate to `/mn/dashboard/organization/members`
- **Expected**: Member list with roles (Admin, Mechanic)
- **Verification**: Member table renders

### TC-ORG-04: Invite User
- **Precondition**: —
- **Action**: Invite new user by email
- **Expected**: Invite created, link sent
- **Verification**: Invite appears in member list

---

## Execution Protocol

### Running Tests with agent-browser

```bash
# 1. Install agent-browser (if not already)
agent-browser install

# 2. Launch browser session
agent-browser open http://localhost:3000

# 3. Navigate and interact
agent-browser snapshot -i              # Discover interactive elements
agent-browser fill @e<N> "value"       # Fill form fields
agent-browser click @e<N>              # Click elements
agent-browser screenshot --annotate    # Visual verification

# 4. Verify
agent-browser console_messages         # Check for errors

# 5. Cleanup
agent-browser close
```

### Running Backend Verification (Supabase MCP)

```bash
# Check table data
supabase-tolom_execute_sql(query="SELECT * FROM customers WHERE organization_id='org-1'")

# Check RLS policies
supabase-tolom_get_advisors(type="security")

# Check migrations applied
supabase-tolom_list_migrations()
```

### Running DevTools Checks

```bash
# Check for runtime errors
nextjs_call port=3000 toolName="get_errors"

# Get all routes
nextjs_call port=3000 toolName="get_routes"
```

---

## Pass/Fail Criteria

| Criteria | Requirement |
|----------|-------------|
| **Functional** | All test cases pass against live app |
| **Observable** | 0 console errors, 0 API 5xx errors |
| **Pass/Fail** | Each TC is binary (pass/fail) with evidence |

---

## Test Evidence Collection

For each test case, collect:
1. Screenshot (before/after for state-changing actions)
2. Console error log
3. API response (for backend tests)
4. Database query result (for data integrity tests)

---

*End of UAT/QA Test Plan*
