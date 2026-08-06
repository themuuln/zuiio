# Tolom — Ubiquitous Language / Domain Glossary

Refines the root `CONTEXT.md` (one level up) for the auto-repair domain.
Definitions here win for Tolom-specific terms.

## Core Concepts

- **Organization** — The tenant: an auto repair shop. Every query is `organization_id`-scoped and RLS-protected.
- **Work Order** — A repair job for one vehicle at one shop. The central entity of the product. Never call it "job", "ticket", or "order" ("order" in Tolom means a parts sales order).
- **Bay** — A physical workshop slot in the bay view. Work orders and appointments are scheduled onto bays. Never call it "lift" or "station".
- **Bay View** — The scheduling surface where work orders and appointments occupy bays.
- **Appointment** — A scheduled vehicle visit, later converted into a work order.
- **Vehicle** — A customer's vehicle: plate, make/model, VIN, year. Mongolian phone/plate/VIN validators live in `@zuiio/core`.
- **Customer** — The person who owns the vehicle or pays for the work. Not "user" or "client".
- **Part** — A stockable inventory item used in repairs. Shared inventory code may call it "product"; prefer "part" in Tolom context.
- **Service** — A labor line item on a work order (for example "Oil Change") with its own price. Distinct from Part.
- **Estimate** — A pre-work price proposal. Never "quote".
- **Mechanic** — A shop employee assigned to work orders; helpers are mechanics additionally assigned to a work order.
- **ITP** — Mongolia's periodic vehicle technical inspection (техникийн үзлэг). ITP reminders are scheduled customer notifications.
- **Invoice** — A billing document for a work order: number, status, subtotal, total, amount paid, balance due, and issue/due/paid dates. Customers see invoices in the portal.
- **Portal** — The customer-facing web area (token-authenticated) where customers view their work orders and invoices.
- **Attachment** — A photo or document stored on a work order (storage-backed).
- **Ledger** — Append-only record for parts inventory and financial entries. Never update quantity in place.
- **DetailDrawer** — The side panel (side="right") used for every detail/edit/add/action view. Never use raw `Sheet`/`Dialog` for these.

## Preferred Terms

- "work order" — not "job", "ticket", "repair order"
- "bay" — not "lift", "station", "workshop slot"
- "estimate" — not "quote"
- "customer" — not "client", "user"
- "mechanic" — not "technician", "worker"
- "part" in repair context — not "product" (except inside shared inventory code)
- "work order ID" — not "WOID"

## Naming Conventions

- Tables: `work_orders`, `appointments`, `bays`, `vehicles`, `customers`, `parts` — `snake_case`, always with `organization_id`.
- i18n: every user-facing string exists in both `mn.json` and `en.json`.
- API routes use `createRouteHandler`/`createSimpleRouteHandler`; mutations use `useOrgMutation`.
- Services in `src/lib/services/`; query hooks in `src/lib/queries/`.
- Files kebab-case; components PascalCase; hooks `use` prefix.
