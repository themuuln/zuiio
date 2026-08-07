# Phase 11 — Guardian Self-Service and Commerce

> **Status:** Deferred. This is an execution plan, not authorization to start implementation.
>
> **Gate:** Phase 11 begins only after Academy Gate 2 passes. See `docs/features/academy-management.md` for the operational-pilot exit criteria.

## Outcome

A verified guardian can sign in, see only the children for whom they have active authority, complete registration and consent actions, and view an auditable payment history. Payment state remains server-authoritative: verified QPay callbacks—not a browser or a guardian action—settle invoices. Staff retain operational and finance controls.

## Scope

| Area | Phase 11 delivery |
|---|---|
| Guardian identity | Reusable guardian authentication, identity-to-guardian linking, recovery, suspension, and immediate access revocation |
| Family access | One guardian can switch between authorized children; no child, medical, or payment data crosses an academy or authority boundary |
| Registration and consent | Guardian submits an enrollment request, reviews immutable consent text, signs the current version, and can withdraw future optional consent |
| Commerce | Invoice and payment history, authenticated receipt access, verified QPay settlement, partial/overpayment handling, refunds, and reconciliation |
| Notices | Existing announcements/reminders are shown only to the authenticated guardian's academy and authorized children |

## Explicit non-goals

- Direct coach–guardian messaging, social feeds, push notifications, public child profiles, athlete identity linking, and federation features.
- A browser-driven “mark paid” action, client-side payment verification, or direct guardian writes to operational/financial tables.
- A custom SMS/OTP implementation or storage of OTP secrets in Onoo.
- Offline attendance, multi-location scheduling, extended reporting, and QR check-in.

## Gate 3 entry record

Before code starts, the named product, security, operations, finance, and support owners must record these decisions in the dated decision log:

1. **Gate 2 evidence:** four consecutive operating weeks; ≥70% attendance recorded within 24 hours; no cross-tenant, medical-access, or unrecoverable-attendance incident; auditable consent/settlement actions; successful retention, anonymization, and backup-restore drill; operator score ≥8/10.
2. **Authentication provider:** approved phone-auth provider, OTP abuse controls and cost limit, delivery/recovery flow, number-change process, and support escalation. Supabase Auth may be used only after its current phone-auth behavior, provider configuration, and rate limits are verified.
3. **Guardian authority:** who may grant, dispute, revoke, or restore access; how shared custody and a child reaching adulthood are handled; whether a guardian can correct a child profile versus requesting staff review.
4. **Commerce authority:** QPay merchant/API version, callback signature or server-to-server verification contract, settlement source of truth, receipt numbering, refund approver/SLA, and reconciliation owner.
5. **Privacy and retention:** approved Mongolian consent, receipts/refunds retention period, support access policy, and guardian-facing incident/contact copy.

No migration, provider credential, or real minor data may be introduced until this record is approved.

## Current-system findings that the plan must remediate

| Finding | Evidence | Required treatment |
|---|---|---|
| Guardian identity is only a nullable `academy_guardians.user_id`; the student–guardian link has no verified/revoked authority state. | `20260723040000_phase10b_student_profiles.sql` | Add an explicit, auditable authority model before guardian reads are exposed. |
| Existing academy guardian/student/consent/payment policies use `USING (true)` for every authenticated user. | `20260723040000_phase10b_student_profiles.sql`, `20260723045000_all_remaining_phases.sql` | Replace them with tenant, staff-role, or verified-guardian predicates. A logged-in guardian must never inherit staff-wide access. |
| `otp_secret` is stored on `academy_guardians`. | `20260723045000_all_remaining_phases.sql` | Stop writing it and remove it only through an approved migration after confirming it contains no production data. Provider-owned OTP secrets never enter this database. |
| `/academy/enroll` and `cmd_public_enroll` directly create an active student and enrollment from anonymous input. | `src/app/academy/enroll/page.tsx`, `src/app/api/academy/enroll/route.ts`, `20260726120000_public_academy_enrollment.sql` | Replace it with a bounded registration-intent workflow; it must not reveal guardian IDs or grant account access. Keep all writes in reviewed commands. |
| Current QPay tables model a pending/paid invoice but not a canonical immutable settlement/refund ledger. | `20260723045000_all_remaining_phases.sql` | Define an append-only payment-event/reconciliation contract before presenting payment history to guardians. |

## Delivery sequence

### 0. Boundary hardening and data contract

**Precedes every guardian-facing route.**

1. Write a migration that introduces the authoritative guardian-access record. It must identify guardian, student, academy, relationship, authority status, verification actor/evidence, grant/revoke timestamps, and an immutable audit trail. Preserve the existing `academy_student_guardians` data through a reversible backfill; do not infer authority from phone-number equality.
2. Create narrowly scoped `cmd_*` commands for staff-issued invitations, guardian claim/verification, authority grant/revoke, enrollment-request submission/review, consent sign/withdraw, payment settlement, and refund. Privileged functions require `SECURITY DEFINER`, an empty `search_path`, `PUBLIC` execution revoked, explicit grants, caller authorization, and audit writes.
3. Replace broad academy RLS policies with a role matrix: academy staff receive only their academy operational scope; finance roles never receive medical fields; guardians receive only active, verified links; suspended/revoked users receive no rows. Expose guardian dashboard data through security-invoker views or narrow RPCs—never base-table browser queries.
4. Convert anonymous enrollment from direct active-record creation into a rate-limited registration intent with an opaque confirmation reference. Staff approval or an authenticated verified guardian completes enrollment. Do not return internal guardian/student/enrollment IDs to an anonymous browser.
5. Regenerate `src/lib/database.types.ts` through the supported generator after every schema migration; never patch it manually.

**Exit criteria:** PostgreSQL/RLS tests prove cross-academy denial, guardian A cannot read guardian B's child, revoked access disappears, finance cannot read medical data, anonymous enrollment cannot create active enrollment, and all commands are idempotent where retries are possible.

### 1. Guardian identity and multi-child home — `T-11.1`

1. Implement the approved provider-auth callback/session flow using the current Supabase Auth guidance; do not use `academy_guardians.otp_secret`.
2. Link an authenticated user to an existing guardian only after phone verification plus the approved guardian-authority check. Linking or relinking is an audited command, never an automatic match.
3. Add `/guardian` as a server-rendered account shell and `/guardian/children/[studentId]` for a selected authorized child. Redirect unauthenticated visitors to the provider flow and return 404/forbidden without revealing whether a child exists.
4. Add a narrow guardian-home projection: child identity, active enrollments, attendance summary, pending/current consent state, upcoming invoice balance, and published relevant announcements. Exclude medical notes, other guardians' data, internal staff notes, payment provider payloads, and audit details.
5. Provide Mongolian-first empty, revoked-access, expired-session, and no-active-child states at 360px.

**Exit criteria:** a linked guardian can switch only among their children; a suspended/revoked guardian loses access immediately; an authenticated non-guardian receives no data; RTL/integration tests prove row isolation; browser coverage proves login → dashboard → child switch → logout.

### 2. Registration and consent — `T-11.2`

1. Replace the current public enrollment success flow with a registration status model: draft/submitted/requires-review/approved/declined/cancelled. Enforce eligibility, duplicate prevention, capacity reservation, waitlist ordering, and expiry in transactional commands.
2. Reuse current guardian authorization to show only offerings for that academy and only the guardian's own registration requests.
3. Serve a versioned, immutable consent text snapshot. Signing records signer identity, current template version, timestamp, request/session context, and approved evidence. A later template version never rewrites old signed text.
4. Provide guardian correction/review only for approved fields; medical and staff-only changes become review requests. Separate operational, media-release, and future-publication consent scopes.
5. Support withdrawal of future optional consent while retaining required historical consent/financial evidence.

**Exit criteria:** duplicate/replay/expired registration requests are safe; capacity and waitlist rules stay correct under concurrent requests; consent version history remains immutable; withdrawal blocks future optional use; component, integration, and E2E tests cover the happy path and each rejection state.

### 3. Commerce and verified settlement — `T-11.3` with `T-10d.2`

1. Define the canonical payment contract before UI work: invoice, immutable payment event, allocation, unapplied balance, refund event, provider reconciliation record, and receipt. Do not mutate an invoice total to hide overpayments or refunds.
2. Implement QPay invoice creation and callback/server-to-server verification only with the approved merchant contract. Verify provider identity, callback freshness/replay protection, amount, MNT currency, merchant invoice reference, and academy scope before one idempotent settlement command runs.
3. Keep provider secrets and raw callback payloads server-only. Callback failure, timeout, expiry, duplicate delivery, or provider outage leaves the invoice’s payment method and balance unchanged.
4. Expose a guardian payment-history projection with only the guardian's authorized children, invoice status/balance, settled receipt metadata, and refund status. Generate receipts only after authorized settlement.
5. Add finance-only settlement correction/refund workflows and an operational reconciliation runbook. Guardian-facing refund requests never directly modify the ledger.

**Exit criteria:** forged/replayed callbacks fail; duplicate valid callbacks create one settlement; partial payment, overpayment, expiry, timeout, refund, and provider failure preserve correct balances; guardian receipt access is row-scoped; integration tests use a provider adapter mock at the server boundary and real Postgres authorization tests.

### 4. Announcements and reminders — `T-11.4` (already implemented)

Keep the existing staff-authored announcement capability. Before enabling guardian delivery, add guardian projection/RLS coverage so target audience, academy, program, publication status, and guardian authority all filter the result. Do not add push delivery or direct messaging in this phase.

## Planned artifact map

| Order | Artifact | Action |
|---|---|---|
| 0 | `docs/decisions/` entry | Record the Gate 3 approvals above before implementation. |
| 1 | `supabase/migrations/<timestamp>_guardian_authority_and_registration.sql` | Guardian authority, registration intent, guarded commands, RLS replacement, data backfill. |
| 2 | `supabase/migrations/<timestamp>_guardian_commerce_ledger.sql` | Payment-event/refund/reconciliation contract and verified QPay commands. |
| 3 | `src/app/guardian/**` | New server-rendered guardian dashboard and child detail pages. |
| 4 | `src/app/api/guardian/**` | Authenticated, Zod-validated guardian actions only; no direct table mutation. |
| 5 | `src/app/api/academy/enroll/route.ts` and `src/app/academy/enroll/page.tsx` | Replace anonymous direct active enrollment with registration intent/status. |
| 6 | `src/app/admin/api/academy/**` | Staff review, authority, finance, and refund commands following existing admin route conventions. |
| 7 | `src/lib/database.types.ts` | Regenerate after migrations. |
| 8 | `src/test/**`, `e2e/**` | Add RLS, command, component, and end-to-end contracts described above. |
| 9 | `docs/runbook.md` | Add provider outage, callback replay, reconciliation, refund, account recovery, and guardian-access incident procedures. |

## Task-registry normalization

Task-registry normalization is completed by this plan: `INDEX.md` and `pm-manifest.yaml` now use the canonical IDs below. This plan is the authoritative task specification until Gate 3 entry; create per-task files from its corresponding section when work is authorized.

| Canonical ID | Scope | Status |
|---|---|---|
| `T-11.1` | Guardian authentication, authority, and multi-child dashboard | not started |
| `T-11.2` | Registration and consent management | not started |
| `T-11.3` | Guardian commerce: payment history, receipts, refunds, reconciliation; depends on `T-10d.2` | not started |
| `T-11.4` | Announcements and reminders | done |

`T-10d.1` duplicates `T-11.1`; mark it superseded by `T-11.1` rather than implementing both. `T-10d.2` remains the provider-verification prerequisite for `T-11.3`; the other Phase 10d work remains deferred.

## Verification gate

For every implementation task, run the relevant unit/component test, real-Postgres integration/RLS test, Playwright guardian flow, changed-file diagnostics, `pnpm test:all`, and repository FastGate (`pnpm run verify`). Exercise at minimum:

- authenticated guardian ↔ child/academy row isolation;
- revoked/suspended guardian access;
- expired and replayed registration/consent links;
- concurrent capacity/waitlist transitions;
- immutable consent version and withdrawal;
- QPay callback authenticity, replay, mismatch, timeout, partial payment, overpayment, refund, and provider-outage behavior;
- receipt visibility and finance/medical role boundaries;
- mobile 360px guardian home and no-data/error states.

## Dependencies and release order

`Gate 2 exit` → `Gate 3 decision record` → `boundary hardening` → `T-11.1` → `T-11.2` → `T-10d.2` → `T-11.3` → guardian-filtered `T-11.4` delivery.

Phase 12 identity linking remains blocked until this phase proves the guardian authority, consent, privacy, and support model in production.
