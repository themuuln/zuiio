# Zatly Roadmap

> Source of truth for product strategy, feature scope, sprint planning, pricing direction, and market research
> Version: 1.0.0 | Updated: 2026-06-19
> Related docs: [masterPlan.md](../masterPlan.md)

---

## Purpose

This document is the canonical roadmap for Zatly.

It should answer:

- What product are we actually building?
- Which customer are we building for first?
- Which features matter now vs later?
- What is the pricing direction?
- What are the current sprints and priorities?
- What market research changed the roadmap?

Future product research should be appended here first, then reflected into sprint priorities.

---

## Product Thesis

Zatly should not be built as a generic chatbot builder.

Zatly should be built as:

**A Messenger-first commerce and customer operations platform for Mongolian businesses, with ERP/CRM/inventory integration as the core moat, and AI operators layered on top once the data layer is reliable.**

This means:

- The short-term wedge is **Mongolia-first Messenger commerce**
- The medium-term moat is **business-system integration**
- The long-term moat is **AI acting on trusted business context**

If we only ship "ManyChat in Mongolian," we can win initial attention.

If we ship "business operations through Messenger," we can build a durable product.

---

## Product Principles

1. Every automation should be able to use real business data.
2. Every major feature should map to a concrete business workflow.
3. Localization means language, onboarding, templates, support, and payments.
4. AI should follow data reliability, permissions, and audit logs.
5. Integrations are core product, not a late add-on.
6. Sell outcomes, not empty flexibility.

---

## Customer Focus

### Primary ICP: Social-commerce retail

- Apparel
- Cosmetics
- Electronics
- Gifts
- Small retail chains

Why:

- Heavy Messenger usage
- Clear need for product, inventory, order, and promo workflows
- Fastest path to measurable ROI

### Secondary ICP: Service businesses

- Clinics
- Salons
- Auto service
- Education/admissions

Why:

- Strong fit for lead qualification, booking, reminders, and handoff
- Higher value per conversation

### Third ICP: Agencies and implementation partners

- ManyChat resellers
- Marketing agencies
- ERP/CRM implementers

Why:

- Distribution leverage
- White-label and API demand
- Deployment multiplier

---

## Core Positioning

### What we are

- Messenger-first customer operations
- CRM-lite plus automation plus operator handoff
- Integration layer for business systems
- Mongolia-first business workflow product

### What we are not

- Generic AI FAQ bot only
- Global omni-channel suite on day one
- Pure marketing funnel clone
- Developer-first orchestration framework

---

## Market Gaps We Should Exploit

### Gaps in ManyChat-like tools

- Strong on growth automation, weaker on ERP/CRM/inventory workflows
- Pricing tends to punish customer growth
- AI is often shallow or workflow-light
- Localization depth is weak in smaller markets

### Gaps in AI-agent tools

- Strong on knowledge retrieval, weaker on Messenger-native commerce flows
- Usually weak on inbox operations and social-channel workflows
- Often not designed for local SMB onboarding

### Gaps in omni-channel chatbot platforms

- Broad features, but generic positioning
- High complexity for small businesses
- Weak local-market packaging

### Zatly opportunity

Own the category:

**"Messenger commerce OS for Mongolian businesses."**

Then expand into:

**"Customer operations platform for emerging-market commerce teams."**

---

## Business Workflows To Win First

These are the workflows that should drive the roadmap.

### Retail workflows

1. Product inquiry -> price and stock answer
2. Product recommendation -> guided selection
3. Order inquiry -> order status answer
4. Branch inquiry -> nearest branch and availability
5. Promotion inquiry -> campaign and coupon flow
6. Human escalation -> operator takes over with full context

### Service workflows

1. FAQ and qualification
2. Appointment request
3. Schedule follow-up
4. Reminder and no-show prevention
5. Staff handoff

### CRM workflows

1. Lead capture
2. Lead scoring or qualification
3. Owner assignment
4. Pipeline stage update
5. Re-engagement

---

## Feature Pillars

### Pillar 1: Channel and automation foundation

- Messenger connection
- Flow builder
- Flow execution runtime
- Conditions, delays, tags, fields, actions
- Template library
- Broadcasts and follow-up rules

### Pillar 2: Contacts and operator workflows

- Contact profiles
- Contact timeline
- Tags and lists
- Unified inbox
- Assignment and notes
- Manual takeover and pause states

### Pillar 3: Business data layer

- Canonical customer model
- Product catalog
- Inventory view
- Orders
- Appointments
- Invoices
- CRM ownership and pipeline

### Pillar 4: Integration platform

- Connector framework
- Auth and credentials
- Webhook ingestion
- Sync jobs
- Mapping layer
- Read and write actions
- Health dashboard
- Auditability

### Pillar 5: Localization and launch packaging

- Mongolian UI
- Local onboarding
- Mongolian templates
- Local payment rails
- Mobile-first operator flows

### Pillar 6: AI operator layer

- Inbox reply assist
- Knowledge-grounded answers
- Structured business-context answers
- Suggested actions
- Controlled auto-actions

### Pillar 7: Monetization and distribution

- Subscription plans
- Integration-gated tiers
- Agency plans
- White-label controls
- Setup and managed service offers

---

## Roadmap Order

### Phase 0: Product reset

Goal:

- Lock positioning and wedge before feature sprawl continues

Exit criteria:

- 10 design partners
- 3 chosen verticals
- 5 highest-value workflows per vertical
- Positioning and demo narrative finalized

### Phase 1: Trust baseline

Goal:

- Make the product safe for real customer and business-system data

Exit criteria:

- Auth coverage complete
- Rate limits in place
- Audit logs and RBAC defined
- Core tests and CI running

### Phase 2: Wedge MVP

Goal:

- Deliver a usable Messenger commerce and customer-ops MVP

Exit criteria:

- Messenger connected
- Automation built and executed
- Contact captured
- Human handoff works
- Business outcomes logged

### Phase 3: Integration moat

Goal:

- Ship ERP/CRM/inventory connectivity as the primary differentiator

Exit criteria:

- Canonical schema defined
- Two live integrations
- Observable sync system
- Flow actions can read business data safely

### Phase 4: Vertical packs

Goal:

- Package repeatable solutions, not generic tooling

Exit criteria:

- 3 sellable vertical packs
- Templates, setup checklist, metrics, demo flows

### Phase 5: Mongolia launch

Goal:

- Fully localize and prove local retention

Exit criteria:

- Mongolian UI
- Mongolian templates
- Local support assets
- Local payments where viable
- 5 live customers

### Phase 6: AI operator layer

Goal:

- Layer AI onto trusted business context

Exit criteria:

- Agent assist live
- Knowledge retrieval live
- Structured business context injection live
- AI actions gated and logged

### Phase 7: Expansion

Goal:

- Expand only after wedge, integration, and retention are real

Exit criteria:

- Instagram and WhatsApp justified by customer pull
- Public API ready
- Regional expansion playbook exists

---

## Sprint Plan

This section is the operational plan.

### Sprint 1: Production hardening

Focus:

- Security fixes
- Environment cleanup
- Production readiness

Status:

- `✅ DONE` API route auth
- `✅ DONE` Input validation
- `✅ DONE` `.env.local` gitignore
- `✅ DONE` Flow builder polish
- `⏳ TODO` Move Facebook credentials from `.data/` to DB with encryption
- `⏳ TODO` Resolve lockfile conflict
- `⏳ TODO` Add error pages
- `⏳ TODO` Unify Graph API version
- `⏳ TODO` Suppress raw Supabase error text

### Sprint 2: Testing and reliability

Focus:

- CI
- Test coverage
- Runtime safety

Status:

- `⏳ TODO` Vitest coverage for API routes
- `⏳ TODO` Playwright coverage for critical flows
- `⏳ TODO` GitHub Actions pipeline
- `⏳ TODO` Rate limiting on webhook and auth paths
- `⏳ TODO` Complete flow runtime execution
- `⏳ TODO` Retry, idempotency, and dead-letter handling for jobs/webhooks

### Sprint 3: Wedge MVP foundations

Focus:

- Inbox
- contact operations
- business objects
- operator workflow

Status:

- `⏳ TODO` Unified inbox with assignment and takeover
- `⏳ TODO` Contact timeline and owner model
- `⏳ TODO` Canonical business objects: customer, product, order, appointment, invoice
- `⏳ TODO` Operator actions in flows
- `⏳ TODO` Automation outcome logging
- `⏳ TODO` Broadcast safety rules

### Sprint 4: Integration platform

Focus:

- Canonical schema
- adapter framework
- first-party system connectors

Status:

- `⏳ TODO` External entity schema and mapping model
- `⏳ TODO` Connector framework
- `⏳ TODO` ERP adapter
- `⏳ TODO` CRM adapter
- `⏳ TODO` Inventory read actions
- `⏳ TODO` Order read actions
- `⏳ TODO` Writeback actions with approval controls
- `⏳ TODO` Integration health dashboard

### Sprint 5: Vertical solution packs

Focus:

- Sellable use-case packaging

Status:

- `⏳ TODO` Retail pack templates
- `⏳ TODO` Service pack templates
- `⏳ TODO` Lead-routing pack templates
- `⏳ TODO` Business-type onboarding wizard
- `⏳ TODO` Vertical metrics and demo scripts

### Sprint 6: Mongolia launch

Focus:

- Localization
- onboarding
- payments
- local GTM

Status:

- `⏳ TODO` Full Mongolian UI
- `⏳ TODO` Mongolian template library
- `⏳ TODO` Mongolian docs and videos
- `⏳ TODO` Local pricing presentation
- `⏳ TODO` QPay, SocialPay, MonPay evaluation and integration plan
- `⏳ TODO` Agency and reseller partner program
- `⏳ TODO` Mobile-first operator improvements

### Sprint 7: AI assist

Focus:

- AI for operators first

Status:

- `⏳ TODO` Knowledge retrieval layer
- `⏳ TODO` Structured business-context injection
- `⏳ TODO` Inbox reply assist
- `⏳ TODO` AI action suggestions
- `⏳ TODO` AI policy guardrails

### Sprint 8: Expansion readiness

Focus:

- API
- adjacent channels
- distribution scale

Status:

- `⏳ TODO` Public API and docs
- `⏳ TODO` Agency controls
- `⏳ TODO` Instagram messaging support
- `⏳ TODO` WhatsApp support
- `⏳ TODO` Web chat widget

---

## Detailed Feature Backlog

### Core automation

- Delay nodes
- Condition nodes
- Action runtime
- Sequence automations
- Rules engine
- A/B testing
- Folder management
- Execution logs UI

### Contacts and CRM-lite

- Contact import
- Contact detail editing
- Tags
- Lists
- Timeline
- Owner assignment
- Pause automation state
- Subscription state

### Inbox and operator tools

- Unified inbox
- Assignment queue
- Internal notes
- Handoff states
- SLA views
- Notifications

### Integration features

- Credential management
- Connector auth flows
- Mapping UI
- Field permissions
- Sync health
- Manual replay
- Read actions
- Write actions

### Growth and distribution

- Comment-to-DM automation
- Template marketplace or library
- Share automation
- Agency partner tools
- White-label option

### Analytics

- Node analytics
- Automation outcome analytics
- Funnel conversion by template
- Integration health analytics
- Operator response analytics

### AI

- Knowledge base
- RAG pipelines
- Reply assist
- Suggested next actions
- Flow generation
- Translation
- Appointment assistance

### Platform expansion

- Instagram
- WhatsApp
- Web chat
- SMS
- Public API

---

## Pricing Strategy

### Pricing principles

1. Do not copy contact-based pricing as the main value story.
2. Keep pricing predictable.
3. Charge more for business-system connectivity and operator value.
4. Keep entry pricing easy for Mongolian SMBs.
5. Leave room for service revenue while the product matures.

### Recommended packaging direction

#### Starter

- Messenger automation basics
- Flow builder
- Contacts
- Basic templates
- Small team usage

Best for:

- Small businesses testing Messenger automation

#### Growth

- Everything in Starter
- Unified inbox
- Team workflows
- More templates
- Outcome analytics

Best for:

- Businesses actively operating sales or support through Messenger

#### Commerce / Ops

- Everything in Growth
- ERP/CRM integrations
- Inventory and order actions
- Advanced permissions
- Audit logs

Best for:

- Businesses running real operations through Zatly

#### Agency

- Multi-workspace controls
- Client management
- Branding options
- Deployment support
- Partner pricing

Best for:

- Resellers and implementation partners

### Monetization levers

- Base subscription
- Additional seats
- Integration tier access
- AI usage or AI operator package
- Managed onboarding/setup
- Agency plan
- White-label or private deployment

### Local-market pricing direction

Keep Mongolia pricing lower than global plans, but do not underprice the integration moat.

Meaning:

- Lower entry point is fine
- Integration-enabled plans should still be meaningfully premium
- Managed setup can be a strong revenue source early

---

## Metrics

### Product health

- API auth coverage
- Test coverage
- CI pass rate
- Flow execution success rate

### Business-value metrics

- Time to first automation
- Time to first business-data answer
- Human handoff success rate
- Sync success rate
- Leads created from automations
- Orders influenced by automations
- Booking completion rate

### Market metrics

- Design partners signed
- Live customers
- Gross retention
- Partner-sourced customers
- Average time to onboarding completion

### AI metrics

- Reply assist adoption
- AI suggestion acceptance rate
- AI hallucination incident count
- AI action approval rate

---

## Research Log

Append new research here with date, source, insight, and roadmap implication.

### 2026-06-19

Topic:

- Global market gap review for ManyChat-like, omni-channel, and AI-agent products

Sources to track continuously:

- ManyChat pricing and product pages: https://manychat.com/pricing
- UChat pricing and partner positioning: https://www.uchat.com.au/pricing
- Voiceflow positioning and pricing: https://www.voiceflow.com/pricing
- Botpress pricing and AI platform packaging: https://botpress.com/pricing
- WATI pricing and WhatsApp commerce positioning: https://www.wati.io/pricing/
- Chatfuel pricing and product positioning: https://chatfuel.com/pricing

Insights:

- ManyChat-like products remain strongest in social growth automation and template-led onboarding.
- AI-native tools are stronger in knowledge retrieval and agent workflows than in Messenger-native commerce operations.
- Broad omni-channel tools compete on channel breadth, but often at the cost of simplicity and local-market depth.
- The strongest durable gap for Zatly is not language alone; it is business-system integration plus local workflow packaging.

Roadmap implications:

- Move integrations into the main roadmap, not late expansion.
- Prioritize inbox, handoff, customer context, and business objects before generic AI features.
- Build AI as an operator layer over trusted business data, not as a thin chatbot add-on.

---

## Review Process

### This doc should be updated when

- A sprint starts
- A sprint ends
- A major feature is added or cut
- Pricing strategy changes
- Research changes roadmap priorities
- A new integration target is selected

### Update rules

1. Update this file first.
2. If needed, reflect implementation detail in supporting docs.
3. Append research findings to the Research Log with date and source.
4. Keep sprint status current.
5. Log meaningful shipped work in the Execution Log.

---

## Execution Log

Use this as the lightweight running history of shipped work and roadmap-relevant changes.

| Date | Sprint / Phase | Work Done |
|------|----------------|-----------|
| 2026-06-20 | Node Design System | Created NodeWrapper base component providing consistent header bar (colored accent strip + icon + label), border/shadow/selection ring, and body content slot. Migrated all 11 node types to use NodeWrapper. NodeGhost now uses NodeWrapper for consistent drag preview. Added NodeWrapper tests (9 cases). |
| 2026-06-20 | Node Design System | Redesigned handle system: created HandleColors.ts with color constants (blue=standard, green=success/Yes, red=failure/No, purple=button). All nodes now use color-coded handles via getHandleStyle(). Updated globals.css with larger 12px handles, crosshair cursor, scale(1.3) hover, currentColor glow, and handlePulse animation for valid-target pulse. ConditionNode Yes at left:30% (green), No at left:70% (red). AbTest variant handles show tooltip labels on hover. Button handles colored purple. Added HandleColors unit tests (5 cases). |
| 2026-06-19 | Roadmap | Created `docs/ROADMAP.md` as the single source of truth for strategy, features, sprint plan, pricing direction, metrics, and research tracking. Retired duplicate planning trackers. |
| 2026-06-19 | Sprint 1 | Canvas smoothness optimization: memoized all 11 node components, reduced drag re-renders, tuned React Flow zoom/drag thresholds, removed expensive blur effects, and fixed a pre-existing `NodeContextMenu` type issue. |
| 2026-06-15 | Sprint 1 | Flow builder polish: drag ghost preview, loading skeletons, toasts, rubber band select, edge reconnect, sticky notes, inline edit, keyboard shortcut sheet, validation states, edge labels, alignment toolbar, snap guides, edge context menu, modal editor, and node resize. |
| 2026-06-15 | Templates | Template library milestone: added `flow_templates`, template APIs, built-in templates, template browser, template save/apply flows, and validation coverage. |
| 2026-06-15 | Sprint 1 | Fixed sidebar sub-items not clickable by extending sub-item click handling in the sidebar navigation components. |
| 2026-06-15 | Sprint 1 | Fixed React Flow crash from nodes missing `position` by applying a defensive fallback before rendering `<ReactFlow>`. |

---

## Current Decision Summary

Right now, Zatly should optimize for:

1. Production trust and reliability
2. Messenger commerce workflows
3. ERP/CRM/inventory integration
4. Vertical packaging
5. Mongolia-first launch
6. AI assist on top of trusted data

Anything that does not strengthen one of those six areas should be deprioritized.
