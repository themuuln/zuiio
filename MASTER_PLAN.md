Master Plan: Auto Repair ERP / Garage OS called TOLOM

Development Plan + Pricing Plan Only

The correct direction is not “garage CRM.” The scalable direction is:

A vertical operating system for auto service businesses
Work orders + vehicle history + inventory + payments + staff + reporting + integrations + later marketplace/data layers.

A unicorn outcome is not possible from Mongolia-only garage subscriptions. The product/pricing architecture must be designed so it can expand into regional SaaS, parts procurement, fleet maintenance, payments, AI estimates, and data/API layers later.

I’ll keep this strictly to development and pricing.

⸻

1. Core Product Strategy

Product Name Internally

Use a simple internal name:

TOLOM

External name can change later.

Product Category

Do not build it as a generic ERP.

Build it as:

Auto Repair Operating System

Go-to-market can start narrower:

Tablet-first auto service CRM for startup garages

This is not a different product.

It is the first sellable wedge of the same Garage OS:

- tablet-primary workflow
- car CRM with strong vehicle history
- fast service entry
- mechanic-focused reporting
- pricing memory for inconsistent real-world service and part prices

That means every feature should support one of these workflows:

1. Customer comes in.
2. Vehicle is identified.
3. Issue is recorded.
4. Work order is created.
5. Mechanic is assigned.
6. Parts/services are added.
7. Inventory changes.
8. Invoice is generated.
9. Payment is recorded.
10. Customer gets reminder.
11. Owner sees performance.

If a feature does not support that chain, delay it.

⸻

2. Recommended Stack

V1 Stack

Frontend: Next.js
Backend: Supabase
Database: PostgreSQL
Auth: Supabase Auth
Storage: Supabase Storage
Security: Supabase RLS
Hosting: Vercel
Primary device: Tablet web app / PWA
Mobile: PWA first
Flutter: V2 or V3

Supabase is still a strong fit because it gives you Postgres, Auth, Storage, Realtime, Edge Functions, and a managed platform. Current Supabase pricing starts with a free tier, with Pro shown at $25/month plus compute scaling options, so early infrastructure cost can stay low.  ￼

Vercel is suitable for the Next.js dashboard, but you should watch usage-based cost as the product scales. Vercel’s pricing page shows Hobby, Pro, and Enterprise plans, and Pro includes usage credit across resources.  ￼

Use Next.js server-side logic for sensitive operations. Next.js API routes are server-side bundles and do not increase the client-side bundle size.  ￼

Use Supabase Row Level Security from day one. Supabase’s own documentation says RLS should always be enabled on tables in exposed schemas, especially when browser clients access the database.  ￼

Use Flutter later only for offline-heavy mechanic workflows. Flutter’s official offline-first guidance says offline apps need local and remote data sources, with repositories acting as the single source of truth.  ￼

For price calculations below, I’ll use approximately $1 = ₮3,576, based on the Bank of Mongolia’s May 10, 2026 USD/MNT daily rate.  ￼

⸻

3. Development Philosophy

The Most Important Rule

Do not build a custom app for each garage.

Build:

One core product
+ settings
+ feature flags
+ add-ons
+ plan limits
+ integration modules

Bad path:

Garage A wants custom invoice.
Garage B wants custom inventory.
Garage C wants custom mechanic flow.
You hard-code everything.
You become an agency.

Correct path:

Invoice templates
Configurable service categories
Configurable workflow statuses
Role permissions
Branch settings
Optional add-ons

This is what makes it scalable.

Startup Execution Mode Right Now

For the first version, package the system as a startup-friendly tablet product without breaking the long-term architecture.

That means:

- keep the same multi-tenant foundation
- keep the same RLS rules
- keep the same ledger mindset
- simplify the first sellable workflow to admin + mechanic
- optimize the first UI for tablet usage at the front desk and in the garage
- prioritize car CRM, service pricing memory, and mechanic performance reports before wider ERP depth

⸻

4. Product Architecture

Core Architecture

Garage OS
│
├── Core Platform
│   ├── Organizations
│   ├── Branches
│   ├── Users
│   ├── Roles
│   ├── Permissions
│   ├── Audit logs
│   └── Billing plans
│
├── Garage Operations
│   ├── Customers
│   ├── Vehicles
│   ├── Car CRM
│   ├── Appointments
│   ├── Work orders
│   ├── Services
│   ├── Mechanics
│   └── Service history
│
├── Startup Operating Layer
│   ├── Tablet check-in workspace
│   ├── Service catalog with default pricing
│   ├── Service and part price memory
│   ├── Mechanic selector + workload view
│   ├── Daily timeline panel
│   └── Fast service summary and closing flow
│
├── Inventory
│   ├── Parts
│   ├── Stock
│   ├── Suppliers
│   ├── Purchase orders
│   ├── Stock movements
│   └── Low-stock alerts
│
├── Finance
│   ├── Estimates
│   ├── Invoices
│   ├── Payments
│   ├── Discounts
│   ├── Taxes
│   └── Revenue reports
│
├── Customer Retention
│   ├── SMS reminders
│   ├── Service due dates
│   ├── Follow-ups
│   └── Customer return tracking
│
├── Integrations
│   ├── QPay
│   ├── SMS provider
│   ├── Accounting export
│   ├── Messenger later
│   └── API access
│
└── Advanced Platform
    ├── Mobile mechanic app
    ├── Fleet management
    ├── Parts marketplace
    ├── AI estimate assistant
    ├── Predictive maintenance
    └── BI / analytics

⸻

5. Database Foundation

Every major table must support multi-tenancy.

Required Columns

id
organization_id
branch_id
created_by
updated_by
created_at
updated_at
deleted_at

Core Tables

organizations
branches
users
roles
permissions
organization_users
subscription_plans
feature_flags
audit_logs

Customer + Vehicle Tables

customers
vehicles
vehicle_owners
vehicle_service_history
vehicle_photos
vehicle_documents

Vehicle Data Rules For The Startup CRM Layer

Must-have vehicle fields:

- plate_number (example: 9999 UNA)
- make / mark
- model
- year
- VIN / chassis number when available
- color
- engine
- fuel_type
- transmission
- odometer
- customer phone number

Good-to-have vehicle fields:

- trim / series (example: Lexus RX)
- drivetrain
- body type
- license expiry or inspection notes
- last visit date
- next recommended service date
- internal notes / tags

Work Order Tables

work_orders
work_order_services
work_order_parts
work_order_photos
work_order_notes
work_order_status_history
mechanic_assignments
service_catalog
service_price_history
part_price_history
mechanic_daily_reports
mechanic_period_reports

Inventory Tables

parts
part_categories
suppliers
stock_locations
inventory_balances
inventory_movements
purchase_orders
purchase_order_items
stock_adjustments

Finance Tables

estimates
estimate_items
invoices
invoice_items
payments
refunds
discounts
tax_rules
cash_register_sessions

Retention Tables

reminders
reminder_templates
notification_logs
service_intervals
customer_followups

Integration Tables

integration_accounts
qpay_transactions
sms_messages
webhook_events
api_keys
external_sync_logs

⸻

6. Critical Backend Design

Do Not Store Inventory as a Simple Quantity

Bad:

parts.quantity = 15

Good:

inventory_movements
- part_id
- movement_type
- quantity
- source_type
- source_id
- created_by

Then calculate balance from movements or maintain a derived balance table.

Why?

Because you need to know:

* who used the part
* for which work order
* when it was used
* whether it was sold, wasted, adjusted, returned, or transferred

This is one of the most important product gaps.

⸻

Use Ledgers

You need at least 4 ledgers:

1. Work order status ledger
2. Inventory movement ledger
3. Payment ledger
4. Audit ledger

This protects the system from messy real-world garage behavior.

Pricing Memory Rules

The startup CRM version must still save as much pricing history as possible.

Store at least:

- base service cost
- discount_amount_mnt
- discount_percent
- quantity
- final sold price
- last sold price
- vehicle make / model context
- part last sold price
- work order and mechanic reference

Why?

Because many mechanics do not know the correct price, prices are inconsistent, and Lexus RX work can be priced differently from another vehicle even for the same service.

The system should auto-suggest values from recent history, but always allow admin override.

⸻

Business Logic Placement

Use this structure:

Supabase Postgres:
- source of truth
- relational integrity
- RLS
- triggers only for unavoidable database-side rules
Next.js server:
- invoice calculation
- work order mutations
- payment verification
- inventory deduction
- report aggregation
- permission checks beyond RLS
Supabase Edge Functions:
- QPay webhooks
- SMS webhooks
- scheduled reminder jobs
- lightweight external API callbacks
Frontend:
- UI only
- no trusted business logic

Supabase Edge Functions are appropriate for webhooks, authenticated/public HTTP endpoints, transactional emails, and similar integration tasks.  ￼

⸻

7. Development Roadmap

Phase 0 — Foundation

Duration

2 weeks

Goal

Build the base platform correctly before product features.

Features

- Supabase project setup
- Next.js app setup
- Auth
- Organizations
- Branches
- Users
- Roles
- Permissions
- RLS policies
- Audit logs
- File storage buckets
- Basic dashboard shell
- Error logging
- Backup/export structure

Output

A secure multi-tenant skeleton.

Do Not Build Yet

- Flutter
- AI
- Advanced analytics
- Messenger
- Marketplace

Completion Gate

You should be able to create:

Organization A
Organization B
Users in both
Branch in each
Separate data access

No user from Organization A should ever see Organization B’s data.

⸻

Phase 1 — Tablet-First Startup CRM

Duration

6–8 weeks

Goal

A startup garage can run its core car CRM and service-entry workflow on a tablet with minimal typing.

Features

- Tablet-first interface for front desk and garage use
- Customer records
- Vehicle records
- Plate number field
- VIN/chassis field
- Car make / model / year / odometer / engine / transmission fields
- Fast plate-number search and duplicate detection
- Work order creation
- Work order status
- Assign mechanic
- Add services
- Service catalog with default price
- Service line quantity
- Discount in tugrik
- Discount in percentage
- Last sold price column
- Vehicle-specific price memory
- Add parts manually
- Part last sold price column
- Vehicle service history
- Basic dashboard
- Mechanic selector on the top right for report and dashboard filtering
- Timeline panel on the right side for service progress and daily activity
- Daily report per mechanic
- Weekly report per mechanic
- Monthly report per mechanic
- End-of-day closing summary
- Smart default values and auto-fill from recent work
- Touch-friendly UX for tablet use

Roles For The Startup Version

Admin
Mechanic

Startup UX / QoL Rules

- large touch targets
- auto-fill customer and vehicle data from prior visits
- default service prices from service catalog
- show last sold price beside editable current price
- remember recent values by vehicle make / model and service type
- minimize typing for mechanics
- keep important filters visible without deep navigation
- use defaults first, then manual override

Do Not Build In Phase 1

- invoice workflow
- payment flow
- QPay
- SMS reminders
- advanced inventory control
- supplier management
- purchase orders
- accounting export
- multi-branch operations
- approval workflows
- Flutter app
- AI features

Phase 1 Delivery Order

1. Tablet shell + admin/mechanic roles
2. Customer and vehicle CRM
3. Plate-number search + duplicate prevention
4. Work order flow + mechanic assignment
5. Service catalog + service/part pricing memory
6. Auto-fill, defaults, and touch-first UX polish
7. Mechanic reports + right-side timeline + end-of-day summary

MVP Statuses

New
Diagnosing
In Progress
Ready for Pickup
Completed
Cancelled

Output

A focused Phase 1 product that handles car CRM, service entry, mechanic assignment, pricing memory, and mechanic reporting on tablet.

Completion Gate

A garage should be able to complete this flow:

Customer arrives
→ vehicle registered
→ work order created
→ mechanic assigned
→ service added
→ suggested prices appear from history
→ service totals reviewed
→ mechanic report updates
→ service history saved

Suggested Sellable Price

Implementation: ₮2M
Monthly: ₮299k

⸻

Phase 2 — Inventory + Staff Control

Duration

8–10 weeks

Goal

Move from “record keeping” to “business control.”

Features

- Parts catalog
- Inventory movement ledger
- Stock in / stock out
- Low stock alerts
- Supplier records
- Purchase orders
- Stock adjustments
- Mechanic performance
- Mechanic commission rules
- Labor tracking
- Parts used per mechanic
- Profit per work order
- Revenue by service category

Output

Now the product solves owner-level pain, not just admin work.

Completion Gate

Owner can answer:

Which parts are missing?
Which mechanic completed the most work?
Which service makes the most profit?
Which work orders lost money?
How much stock was used this week?

Suggested Sellable Price

Implementation: ₮8M
Monthly: ₮699k

⸻

Phase 3 — Payments + Reminders + Reports

Duration

6–8 weeks

Goal

Turn the system into a revenue engine.

Features

- QPay integration
- Payment confirmation
- SMS reminder module
- Service interval reminders
- Oil change reminder
- Customer follow-up schedule
- Revenue dashboard
- Inventory valuation
- Profit reports
- Daily closing report
- Cash register session
- Export to Excel

Output

The software now helps increase repeat customers and reduce leakage.

Completion Gate

Owner can see:

Daily revenue
Unpaid invoices
Low stock
Upcoming reminders
Completed work
Mechanic output
Repeat customer activity

Suggested Sellable Price

Implementation: ₮10M–₮15M
Monthly: ₮899k–₮1.2M

⸻

Phase 4 — Multi-Branch + Accounting Layer

Duration

3–4 months

Goal

Serve larger service centers.

Features

- Multi-branch dashboard
- Branch-level permissions
- Branch inventory
- Stock transfer between branches
- Centralized customer database
- Multi-branch reports
- Approval workflows
- Expense tracking
- Accounting export
- Payroll/commission export
- Manager approval for discounts
- Manager approval for stock adjustments

Output

This becomes a real ERP for auto service chains.

Completion Gate

A business with 2–5 branches can operate from one dashboard.

Suggested Sellable Price

Implementation: ₮20M+
Monthly: From ₮1.5M

⸻

Phase 5 — Mechanic Mobile App

Duration

3–5 months

Goal

Make mechanics use the system without touching the admin dashboard.

Build With

Flutter
Local database
Sync queue
Photo compression
Push notifications
Offline drafts

Mechanic App Features

- Mechanic login
- Assigned jobs
- Job details
- Add notes
- Add photos
- Update job status
- Add parts used
- Add time spent
- Offline draft updates
- Sync when online

Offline Rules

Offline should support only:

- View assigned jobs cached earlier
- Add photos
- Add notes
- Update status
- Add used parts
- Create local draft

Offline should not support:

- Final invoice
- Payment confirmation
- Stock transfer approval
- Discount approval
- User permission changes

Suggested Add-On Price

Implementation: ₮15M–₮40M
Monthly: +₮500k–₮1.5M

⸻

Phase 6 — Platform Expansion

Duration

6–12 months

Goal

Move from SaaS to platform economics.

Modules

- Parts supplier portal
- Fleet maintenance portal
- Warranty claim workflow
- Insurance repair workflow
- API access
- Advanced BI
- AI estimate assistant
- Predictive maintenance engine

Why This Matters

Garage SaaS alone has a ceiling.

Platform modules create bigger revenue streams:

Subscription revenue
+ transaction revenue
+ API revenue
+ fleet revenue
+ supplier revenue
+ AI usage revenue

Suggested Enterprise Price

Implementation: ₮50M–₮150M+
Monthly: ₮3M–₮10M+
Transaction fees: optional

⸻

8. Development Gap Matrix

Gap	Why It Matters	Product Solution	Phase
Messy customer records	Garages lose repeat customers	Customer + vehicle history	Phase 1
No repair history	Hard to upsell or diagnose	Service history per vehicle	Phase 1
No work order discipline	Jobs get forgotten	Work order workflow	Phase 1
Inventory leakage	Parts disappear or get misused	Inventory movement ledger	Phase 2
Mechanic accountability	Owner cannot measure staff	Mechanic assignment + performance	Phase 2
No repeat reminders	Customers do not return	SMS/service interval reminders	Phase 3
Payment confusion	Unpaid invoices get lost	Payment status + QPay	Phase 3
Multi-branch chaos	Larger shops need control	Branch system + transfer	Phase 4
Poor mechanic adoption	Mechanics hate admin dashboards	Flutter mechanic app	Phase 5
Internet instability	Shops may lose access	Offline mechanic mode	Phase 5
Limited Mongolia revenue	Local market alone is small	Platform modules	Phase 6
Customization trap	Kills scalability	Settings + feature flags	All phases
Low pricing ceiling	SaaS alone caps growth	Add-ons + usage + enterprise	All phases

⸻

9. Feature Priority System

Every feature should be scored before building.

Score Formula

Feature Score =
Revenue Impact
+ Retention Impact
+ Operational Pain
+ Reusability
- Development Complexity
- Support Complexity

Build First

High revenue impact
High reuse across garages
Low support complexity

Delay

One customer wants it
Hard to maintain
Not reusable
Requires manual support

⸻

10. Must-Have Technical Rules

Rule 1: Multi-Tenant From Day One

Every table:

organization_id
branch_id

Rule 2: RLS From Day One

No RLS = no SaaS.

Rule 3: Audit Everything Important

Audit:

invoice edits
payment edits
stock adjustments
discounts
deleted records
user permission changes

Rule 4: Never Delete Financial Records

Use:

cancelled
voided
refunded
deleted_at

Do not hard-delete.

Rule 5: Inventory Must Be Ledger-Based

Never just update stock quantity directly.

Rule 6: Reports Must Come From Clean Events

Do not calculate reports from messy frontend state.

Rule 7: Custom Work Must Become a Module

If one customer pays for a custom feature, build it as reusable.

⸻

11. Recommended Development Team

Lean Team

1 full-stack developer
1 product/operator person
1 part-time designer
1 part-time QA/tester

Better Team

1 backend/full-stack lead
1 frontend developer
1 product designer
1 QA/support person
1 part-time mobile developer later

Do Not Hire Early

AI engineer
DevOps engineer
Flutter developer full-time
Data scientist

Not needed until later.

⸻

12. Development Cost Estimate

If You Build Yourself

Cash cost can stay low.

Approximate monthly infrastructure early:

Supabase: low-cost paid tier
Vercel: low-cost paid tier
Domain/email/tools
SMS/QPay costs only when used

Real cost is your time.

If Outsourced Locally

Approximate build cost:

Product Stage	Estimated Dev Cost
MVP	₮20M–₮50M
Inventory + reports	₮40M–₮90M
Multi-branch ERP	₮80M–₮200M
Flutter mechanic app	₮40M–₮120M
Full platform	₮250M+

If you are capable of building, do not outsource the core. Outsource only small isolated parts.

⸻

13. Pricing Strategy

You should support three pricing models, but push one as the default.

Best Default

Hybrid = implementation + monthly subscription

Why?

Because Mongolian customers often want “implementation,” but you need recurring revenue.

Psychological Foundation

TOLOM pricing is designed around how Mongolian garage owners actually make decisions:

1. Anchoring Effect — Enterprise pricing exists to make Pro feel reasonable
2. Compromise Effect — Pro is the psychological target (middle = safe)
3. Loss Aversion — Market “stop losing money” not “better dashboard”
4. Price = Quality Signal — Cheap software creates distrust in Mongolia
5. Setup Fees Increase Trust — Call it “Implementation & Onboarding”
6. Endowment Effect — Deep onboarding creates psychological ownership
7. Cognitive Load — Public website shows ONLY 4 plans

The highest-performing SaaS companies win because they understand buyer fear, status signaling, loss aversion, trust, risk reduction, identity, and decision psychology.

The strongest pricing question is not “How much is the software worth?” but “How expensive is the customer’s chaos?”

⸻

14. SaaS Pricing Plans

SaaS Tier 1 — Core

Target

Small garages just starting out.

Price

₮299,000 / month

Included

1 branch
3 users
Tablet-primary workflow
Customer records
Vehicle records
Car CRM with plate-number search
Work orders
Service history
Service catalog with default pricing
Service and part last sold price memory
Admin + mechanic roles
Mechanic daily / weekly / monthly reports
Service summary and totals review
Basic reports
Email support

Limits

Up to 300 work orders/month
Up to 1,000 customers
Up to 1GB storage
No inventory
No QPay
No SMS automation
No advanced reports

Purpose

This plan should be useful, but intentionally limited.

It should push serious garages toward Pro.

For go-to-market, this can be sold as the startup tablet CRM package without changing the core platform direction.

⸻

SaaS Tier 2 — Pro

Target

Most garages.

Price

₮699,000 / month

Included

1 branch
10 users
Everything in Core
Inventory management
Parts tracking
Supplier records
Low-stock alerts
Mechanic assignment
Mechanic performance
Advanced reports
SMS reminders
QPay integration
Payment history
Dashboard analytics
Priority support

Limits

Up to 1,500 work orders/month
Up to 10,000 customers
Up to 10GB storage
1 branch only

Purpose

This should be your main plan.

Make this the best value.

⸻

SaaS Tier 3 — Business

Target

Multi-branch or serious service center.

Price

₮1,590,000 / month

Included

Up to 3 branches
25 users
Everything in Pro
Multi-branch dashboard
Branch inventory
Stock transfer
Advanced permissions
Accounting export
Approval workflows
API access
BI dashboard
Custom invoice templates
Dedicated onboarding

Limits

Up to 5,000 work orders/month
Up to 50,000 customers
Up to 50GB storage

Purpose

This plan anchors value and captures bigger customers.

⸻

SaaS Tier 4 — Enterprise

Target

Large chains, dealerships, fleets.

Price

₮3M–₮10M+ / month

Included

Unlimited or negotiated branches
Custom user limits
Dedicated database option
Advanced API
Accounting integration
Fleet management
SLA
Custom reporting
Security review
Dedicated support
Custom workflows

Setup

₮30M–₮150M+

⸻

15. Hybrid Pricing Plans

This should be your main pricing model.

Hybrid Core

Implementation: ₮2M
Monthly: ₮299k

Includes

Deployment
Tablet-first onboarding
Basic customization
Service catalog and pricing setup
Staff training
Data import template
Core SaaS features

⸻

Hybrid Pro

Implementation: ₮8M
Monthly: ₮699k

Includes

Everything in Core
Inventory setup
Service category setup
Mechanic workflow setup
QPay setup
SMS setup
Report configuration
Initial data migration

⸻

Hybrid Business

Implementation: ₮20M+
Monthly: From ₮1.59M

Includes

Everything in Pro
Multi-branch setup
Branch inventory
Approval workflows
Advanced permissions
Accounting export
BI dashboard
Custom invoice templates
Dedicated onboarding

⸻

Hybrid Enterprise

Implementation: Custom
Monthly: Custom

Includes

Custom implementation
Custom integrations
Fleet module
Dedicated environment option
Advanced analytics
API access
Priority SLA
Custom reporting
Dedicated support

⸻

16. One-Time License Pricing

Use this only when customers hate SaaS.

But protect yourself.

One-Time Basic

₮12M
Support: ₮250k/month

Includes

1 branch
Customer records
Vehicle records
Work orders
Service summary and totals review
Mechanic and daily closing reports
Installation
Basic training

⸻

One-Time Pro

₮28M
Support: ₮700k/month

Includes

Everything in Basic
Inventory
Mechanic tracking
Advanced reports
SMS reminders
Payment history
Up to 3 branches

⸻

One-Time Enterprise

₮60M–₮200M+
Support: ₮1.5M–₮5M/month

Includes

Multi-branch
Accounting integration
Approval workflows
Custom reports
Custom integrations
Dedicated support

⸻

Source Code Rule

Do not include source code by default.

If they want source code:

3x–5x project price

Example:

₮28M Pro license
Source code buyout: ₮84M–₮140M

Otherwise you destroy your own product business.

⸻

17. Add-On Pricing

Add-ons are where profit grows.

SMS Reminder Module

₮80k–₮200k/month
+ actual SMS cost

Includes:

Oil change reminders
Appointment reminders
Pickup reminders
Follow-up messages

⸻

QPay Integration

Implementation: ₮1M–₮3M
Monthly: ₮50k–₮150k

⸻

Accounting Integration

Implementation: ₮5M–₮20M
Monthly: ₮300k–₮1M

Depends on the accounting system.

⸻

Mechanic Mobile App

Implementation: ₮15M–₮40M
Monthly: ₮500k–₮1.5M

⸻

Advanced BI Dashboard

Implementation: ₮5M–₮15M
Monthly: ₮300k–₮800k

⸻

Fleet Management Module

Implementation: ₮10M–₮30M
Monthly: ₮500k–₮2M

Or price per vehicle:

₮5k–₮20k / vehicle / month

⸻

AI Estimate Assistant

Implementation: ₮20M–₮60M
Monthly: ₮1M+
Usage fee per estimate

Example:

₮500–₮2,000 per AI estimate

⸻

API Access

₮300k–₮1M/month

For:

fleet companies
parts suppliers
insurance partners
accounting systems
custom dashboards

⸻

Dedicated Deployment

Implementation: ₮10M–₮30M
Monthly: ₮1M–₮3M

Only for large customers.

⸻

Data Migration

Small: ₮500k–₮1.5M
Medium: ₮2M–₮5M
Large: ₮5M–₮20M

⸻

Custom Report

₮500k–₮3M per report

⸻

Custom Workflow

₮3M–₮15M

Only accept this if it can become reusable.

⸻

18. Pricing Psychology Without Being Cringy

Use Three Main Plans

Core
Pro
Business

Pro should be the default choice.

Structure Value Like This

Core = record keeping
Pro = control and profit
Business = scale and management

Do Not Make Core Too Cheap

If Core is ₮99k, weak customers will consume support and kill margins.

Better:

Core: ₮299k
Pro: ₮699k
Business: ₮1.59M

Use Setup Fees to Filter Serious Buyers

Implementation protects you from customers who are not committed.

Use Annual Plans

Pay 10 months, get 12 months

Example:

Pro monthly: ₮699k
Pro annual: ₮6.99M/year

That improves cash flow.

Setup Discount Rule

Never discount monthly heavily.

Discount setup instead.

Good:

Implementation ₮8M → ₮5M
Monthly stays ₮699k

Bad:

Monthly ₮699k → ₮399k forever

Recurring revenue is the asset.

⸻

19. Gross Margin Planning

Target Long-Term Gross Margin

75%–85%

Estimated Monthly Cost to Serve

These are internal planning estimates.

Plan	Monthly Price	Infra + Support Cost	Gross Margin
Core	₮299k	₮60k–₮90k	70%–80%
Pro	₮699k	₮120k–₮200k	71%–83%
Business	₮1.59M	₮300k–₮500k	68%–81%
Enterprise	₮3M+	variable	70%+ target

If support cost gets too high, your product is too complicated.

⸻

20. Plan Limits

Limits should be tied to business value, not just users.

Use these levers:

Branches
Users
Work orders/month
Storage
SMS volume
API calls
Advanced reports
Inventory locations
Approval workflows
Integrations
Support SLA

Recommended Limits

Limit	Core	Pro	Business
Branches	1	1	3
Users	3	10	25
Work orders/month	300	1,500	5,000
Customers	1,000	10,000	50,000
Storage	1GB	10GB	50GB
Inventory	No	Yes	Yes
SMS reminders	No	Yes	Yes
QPay	Add-on	Included	Included
API	No	No	Yes
Multi-branch	No	No	Yes
BI	No	Basic	Advanced

⸻

21. Revenue Expansion Plan

This is pricing/product only.

Stage 1 — SaaS Revenue

Garage pays monthly.

Example:

100 garages × ₮699k = ₮69.9M/month
≈ ₮838.8M/year
≈ $234k ARR

Good business, not unicorn.

⸻

Stage 2 — Enterprise Revenue

Larger service centers pay setup + monthly.

Example:

20 business clients × ₮1.59M/month = ₮31.8M/month
10 enterprise clients × ₮5M/month = ₮50M/month

Total:

₮81.8M/month
≈ ₮981.6M/year
≈ $275k ARR

Still not unicorn.

⸻

Stage 3 — Regional SaaS

To become venture-scale, the same product must work outside Mongolia.

Example:

10,000 garages × $149/month = $1.49M MRR
= $17.88M ARR

Bigger, but still likely not unicorn by itself.

⸻

Stage 4 — Platform Revenue

This is where the upside appears.

Add:

Parts marketplace
Fleet management
Payments
AI estimates
API/data layer
Insurance/warranty workflows

Example pricing model:

SaaS: $20M ARR
Parts/platform fees: $30M ARR
Fleet/data/API: $20M ARR
AI/automation: $10M ARR
Enterprise: $20M ARR

Total:

$100M ARR

That is the type of scale needed for a unicorn-style outcome.

⸻

22. Product Expansion Pricing

Parts Marketplace Module

Product

Garages order parts from suppliers inside the system.

Pricing

Supplier monthly fee: ₮300k–₮2M
Transaction fee: 1%–3%
Premium supplier placement: monthly fee

Development Needed

Supplier portal
Catalog
Part availability
Garage order flow
Purchase order sync
Delivery status
Supplier invoice

⸻

Fleet Maintenance Module

Product

Companies manage fleets and assign vehicles to service centers.

Pricing

₮5k–₮20k per vehicle/month
or
₮1M–₮10M/month per fleet customer

Development Needed

Fleet company dashboard
Vehicle groups
Maintenance schedules
Service approvals
Budget limits
Repair history
Branch/vendor assignment

⸻

Insurance / Warranty Workflow

Product

Repair approvals, photos, estimate, claim documentation.

Pricing

Implementation: ₮20M–₮100M
Monthly: ₮2M–₮10M
Per claim fee: optional

Development Needed

Claim file
Photo evidence
Estimate approval
Repair authorization
Status tracking
Document export
API

⸻

AI Estimate Assistant

Product

Image + damage notes → suggested labor/parts estimate.

Pricing

Monthly platform fee: ₮1M+
Per estimate: ₮500–₮2,000
Enterprise custom model: ₮20M+ setup

Development Needed

Image upload
Damage annotation
Estimate suggestion
Parts/service suggestion
Confidence score
Human approval
Model feedback loop

⸻

API/Data Layer

Product

External systems integrate with your garage/fleet data.

Pricing

Basic API: ₮300k/month
Pro API: ₮1M/month
Enterprise API: custom

Development Needed

API keys
Scopes
Rate limits
Webhook events
API logs
Developer documentation
Sandbox environment

⸻

23. Final Recommended Pricing Table

Primary Hybrid Pricing (Psychologically Optimized)

Plan	Implementation	Monthly	Best For	Psychological Role
Core	₮2M	₮299k	Small garage	Safe entry anchor
Pro	₮8M	₮699k	Serious garage	Main conversion target
Business	₮20M+	From ₮1.59M	Multi-branch shop	Premium anchor
Enterprise	Custom	Custom	Chains, fleets, dealerships	Value ceiling anchor

Public Website Rules:
- Show ONLY these 4 plans
- Display order: Enterprise → Business → Pro → Core (left to right)
- Pro must be visually dominant (bigger, brighter, centered)
- Never show one-time pricing or add-ons publicly
- All add-ons and custom work are internal sales only

SaaS-Only Pricing

Plan	Monthly	Annual
Core	₮299k	₮2.99M
Pro	₮699k	₮6.99M
Business	₮1.59M	₮15.9M
Enterprise	Custom	Custom

One-Time Pricing

Plan	One-Time	Support
Basic	₮12M	₮250k/month
Pro	₮28M	₮700k/month
Enterprise	₮60M–₮200M+	₮1.5M–₮5M/month

⸻

24. What To Build First

Build this exact order:

1. Multi-tenant foundation
2. Auth + roles + branches
3. Tablet-first dashboard shell
4. Customers
5. Vehicles + plate-number lookup
6. Work orders
7. Services + pricing memory
8. Service totals review
9. Service history
10. Mechanic daily / weekly / monthly reports
11. Inventory ledger
12. Mechanic tracking
13. Payments
14. SMS reminders
15. Advanced reports
16. Multi-branch
17. Accounting export
18. Flutter mechanic app
19. Fleet module
20. Supplier/parts module
21. AI estimate module

Do not change this order unless real usage proves otherwise.

⸻

25. The Clean “Unicorn-Compatible” Version

Product Development Path

Tablet-first Car CRM
→
Garage OS
→ Garage ERP
→ Multi-branch Auto Service Platform
→ Fleet Maintenance Platform
→ Parts Procurement Network
→ Insurance/Warranty Workflow Layer
→ AI Maintenance Intelligence Platform

Pricing Path

₮299k/month SaaS
→ ₮699k/month Pro
→ ₮1.59M/month Business
→ ₮3M–₮10M/month Enterprise
→ transaction fees
→ per-vehicle pricing
→ API pricing
→ AI usage pricing
→ supplier marketplace pricing

That is the path from small software product to scalable vertical platform.
