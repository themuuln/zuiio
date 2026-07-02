---
date: 2026-05-30T01:03:44+0800
author: Temuulen Undrakhbayar
commit: 6453e18
branch: main
repository: tolom
topic: "Centralized Authentication System"
tags: [intent, frd, auth, supabase, google-oauth, multi-project, mobile]
status: complete
last_updated: 2026-05-30T01:15:00+0800
last_updated_by: Temuulen Undrakhbayar
---

# FRD: Centralized Authentication System

## Summary
Build a centralized login system using one shared Supabase project as the identity store. Users register once with Google OAuth or email/password, and can access all of the developer's projects (starting with Tolom) with the same account. A separate web-only login app provides the branded login/signup/profile experience, with query-param redirects back to the originating project. Mobile apps (React Native, Flutter) bypass the login app and use the Supabase SDK directly.

## Problem & Intent
"I build multiple projects and users have to register separately for each one — I want one account across all of them." The developer wants a single identity layer so users register once and access everything, without maintaining separate auth in each project. This also eliminates the need to rebuild auth from scratch on every new project.

## Goals
- One Supabase project serves as the central user database for all projects
- Users register once with Google OAuth or email/password
- All projects (web and mobile) point to the same Supabase project for auth
- A separate, minimal web login app provides the branded login/signup/profile experience
- Mobile apps use the Supabase SDK directly (no login app involvement)
- Query-param redirect flow for web projects: project sends user to login app, login app sends them back with a session
- Centralized email verification via Resend (free tier: 100 emails/day)

## Non-Goals
- Building a custom auth service (Supabase handles sessions, JWTs, token refresh)
- True SSO (shared sessions across projects) — this is centralized login, not enterprise SSO
- Syncing user data between separate Supabase projects
- Multi-project user dashboard or project selector
- Custom JWT issuance or token exchange
- Phone OTP / SMS verification (costs money, no free unlimited provider exists)
- Supporting more than Tolom immediately — future projects will be added later
- Apple Sign-In in initial scope ($99/year Apple Developer account required)

## Functional Requirements

### Phase 1 — Core Auth (initial build)
1. The system SHALL provide a central Supabase project with Google OAuth and email/password enabled
2. The system SHALL provide a separate web-only login app with login, signup, and profile pages
3. The login app SHALL accept a `?redirect_to=` query parameter and redirect the user back after successful authentication
4. Projects SHALL authenticate users by pointing their Supabase client to the central Supabase project (shared URL + anon key)
5. The system SHALL store minimal identity data: email, full name, avatar URL
6. Each project SHALL manage its own user profile/organization data separately from the central identity
7. The signup flow SHALL create the user in the central Supabase auth schema
8. The login app SHALL support both Google OAuth sign-in and email/password sign-in
9. Email verification SHALL use Resend as the SMTP provider (free: 100/day, 3,000/month)
10. Password reset flow SHALL work via Supabase email templates sent through Resend

### Phase 2 — Security Hardening (after core is stable)
11. The system SHALL support TOTP-based 2FA (Google Authenticator, Authy, etc.) via Supabase's built-in MFA
12. 2FA enrollment SHALL be optional initially, with RLS enforcement via `aal2` JWT claim for sensitive operations
13. The system SHALL support Apple Sign-In (requires $99/year Apple Developer account)
14. Passkey support SHALL be added when Supabase stabilizes the API (currently experimental)

### Mobile Platform Support
15. Mobile apps (React Native, Flutter) SHALL use the Supabase SDK directly — no login app involvement
16. Mobile apps SHALL register deep link URL schemes (e.g., `tolom://auth/callback`) in Supabase's redirect URL allowlist
17. Mobile OAuth flow SHALL use the system browser for Google consent, then deep link back to the app

## Non-Functional Requirements
- **Performance**: Login/redirect flow should complete in < 3 seconds on standard connection
- **Security**: Standard Supabase auth security (email confirmation, password hashing, session management, CSRF protection). Central auth is the most critical security layer — all projects depend on it.
- **Free tier constraints**: 50,000 MAU, 100 emails/day (Resend), no SMS/phone OTP. All features must work within free tier limits.
- **UX / Accessibility**: Minimal, clean login page. No complex branding. Accessible form inputs, keyboard navigable, screen reader friendly.
- **Reliability**: If the central Supabase is down, all projects' auth fails — acceptable for current scale (free tier, personal projects)
- **Mobile compatibility**: Auth must work seamlessly on iOS and Android via Supabase native SDKs

## Constraints & Assumptions
- Free tier Supabase project — 50,000 MAU, 500MB database, limited compute
- Free tier Resend — 100 emails/day, 3,000/month (sufficient for email confirmation + password reset)
- The login app is a separate repository/deployment (web only, not part of Tolom's codebase)
- Tolom already has a complete auth system — it will be migrated to use the central Supabase project as a follow-up
- Projects on different domains cannot share cookies directly — each project runs its own Supabase client pointing to the central project
- Supabase manages session tokens, JWT signing, and refresh automatically
- Google OAuth is configured in the Supabase dashboard (not in application code)
- Phone OTP is excluded — no free unlimited SMS provider exists. Twilio costs ~$0.008/msg. Add later when revenue allows.
- Apple Sign-In requires $99/year Apple Developer account — defer until revenue justifies cost
- Passkeys are experimental in Supabase — defer until API is stable
- This is centralized login, NOT true SSO — each project maintains its own session independently

## Acceptance Criteria

### Phase 1 — Core Auth
- [ ] Central Supabase project exists with Google OAuth and email/password enabled
- [ ] Resend is configured as SMTP provider in Supabase dashboard
- [ ] Login app is deployed and accessible at a stable URL
- [ ] Login page shows Google sign-in button and email/password form
- [ ] Signup page creates a new user in the central Supabase project
- [ ] Email confirmation works for email/password signups (via Resend)
- [ ] Password reset flow works (via Resend)
- [ ] Profile page displays and allows editing of name and avatar
- [ ] After login, user is redirected back to the originating project via `?redirect_to=` parameter
- [ ] Tolom can authenticate users by pointing its Supabase client to the central project's URL + anon key
- [ ] A user registered via Google can log in via email/password (and vice versa) if the email matches

### Phase 2 — Security Hardening
- [ ] 2FA enrollment page shows QR code for authenticator app
- [ ] Login flow challenges for TOTP code when 2FA is enrolled
- [ ] RLS policies enforce `aal2` for sensitive operations
- [ ] Passkey registration and sign-in work when API is stable
- [ ] Apple Sign-In button works on login page

### Mobile
- [ ] Tolom mobile app authenticates via Supabase SDK directly
- [ ] Deep link callback works for OAuth on iOS and Android
- [ ] Session persists in secure storage across app restarts

## Recommended Approach
Create a new Supabase project as the central identity store. Configure Google OAuth and Resend SMTP in the dashboard. Build a standalone Next.js login app (web-only) with login/signup/profile pages. Each downstream project (starting with Tolom) points its Supabase client to the central project's URL and anon key. Mobile apps use the Supabase native SDKs directly. The login app uses `?redirect_to=` query params for the web redirect flow.

## Supabase Auth — What's Included Free

| Feature | Free? | Notes |
|---------|-------|-------|
| Google OAuth | ✅ Yes | Unlimited users |
| Email/password | ✅ Yes | Unlimited users |
| Email OTP | ✅ Yes | Via Resend SMTP |
| Session management | ✅ Yes | JWT, refresh tokens, cookies |
| TOTP 2FA (MFA) | ✅ Yes | Basic MFA included |
| Passkeys | ✅ Yes | Experimental API |
| Phone OTP / SMS | ❌ No | Requires paid SMS provider ($0.008/msg) |
| Phone MFA | ❌ No | $75/month on Pro plan |
| SAML 2.0 SSO | ❌ No | $599/month Team plan |
| Apple Sign-In | ⚠️ $99/yr | Free to use, but Apple Developer account costs $99/year |

## Decisions

### Shared Supabase project as identity store
**Question**: "How should projects integrate with the central auth?"
**Recommended**: Shared Supabase project — all projects point to same URL + anon key
**Chosen**: Shared Supabase project
**Rationale**: Simplest path — one user database, no sync service, no custom auth service to maintain

### Google OAuth + email/password
**Question**: "Which authentication methods should the centralized system support?"
**Recommended**: Google only — simplest, no password management needed
**Chosen**: Google + email/password
**Rationale**: Provides flexibility for users who prefer email/password, while Google OAuth is the primary flow

### No phone OTP
**Question**: "Can we do phone OTP for free with unlimited users?"
**Recommended**: No free option exists. Twilio costs ~$0.008/msg. Skip for now.
**Chosen**: Skip phone OTP entirely
**Rationale**: No free unlimited SMS provider. $0.008/msg adds up. Add when revenue allows.

### Minimal identity data
**Question**: "What user data should be shared across projects?"
**Recommended**: Minimal identity only — email, name, avatar
**Chosen**: Minimal identity only
**Rationale**: Each project manages its own profile data. Central auth only handles identity.

### Separate login app (web-only)
**Question**: "The custom branded login page — where does it live?"
**Recommended**: In Tolom's codebase
**Chosen**: Separate login app (web only)
**Rationale**: Decoupled from any single project, reusable across all web projects. Mobile apps bypass it.

### Login + signup + profile
**Question**: "What pages does the separate login app need?"
**Recommended**: Login-only
**Chosen**: Login + signup + profile
**Rationale**: Users need to register and manage their identity independently of projects

### Query param redirect
**Question**: "After a user logs in at the login app, how do they get back to the project they came from?"
**Recommended**: Query param redirect — `?redirect_to=https://tolom.com/dashboard`
**Chosen**: Query param redirect
**Rationale**: Simple, stateless, works across any project without pre-registration

### Supabase client + cookies for session sharing
**Question**: "How do projects share the login session across different domains?"
**Recommended**: Supabase client + cookies — each project has its own Supabase client pointing to the central project
**Chosen**: Supabase client + cookies
**Rationale**: Standard Supabase pattern — no custom JWT or token exchange needed

### Resend for email delivery
**Question**: "What SMTP provider for email confirmation and password reset?"
**Recommended**: Resend — free tier: 100/day, 3,000/month, 1 custom domain
**Chosen**: Resend
**Rationale**: Best free tier for transactional email. Clean API. Supabase supports custom SMTP.

### 2FA as Phase 2
**Question**: "Should we include 2FA in the initial build?"
**Recommended**: Yes, TOTP 2FA is free and important for security
**Chosen**: Phase 2 — after core auth is stable
**Rationale**: Core auth first, then harden. TOTP is free on Supabase, ~1 day build time.

### Passkeys deferred
**Question**: "Should we include passkeys?"
**Recommended**: Wait — Supabase passkey API is experimental
**Chosen**: Deferred until Supabase marks as stable
**Rationale**: API may change without notice. When stable, it's a 2-3 hour addition.

### Apple Sign-In deferred
**Question**: "Should we include Apple Sign-In?"
**Recommended**: Defer — $99/year Apple Developer account required
**Chosen**: Phase 2 (when revenue allows)
**Rationale**: $99/year tax not justified for personal projects with no revenue.

### Centralized login, not true SSO
**Question**: "Is this SSO?"
**Recommended**: No — this is centralized login. Each project has its own session.
**Chosen**: Centralized login (not true SSO)
**Rationale**: True SSO is an enterprise problem. Centralized login gives 90% of the benefit for 10% of the complexity.

### Free tier
**Question**: "What's the hosting/budget constraint?"
**Recommended**: Free tier
**Chosen**: Free tier
**Rationale**: Sufficient for development and early users

### Minimal branding
**Question**: "What should the login app look like?"
**Recommended**: Minimal/clean
**Chosen**: Minimal/clean
**Rationale**: Utility, not a product — clean and functional

### Tolom only now
**Question**: "How many projects need to connect to the central auth right now?"
**Recommended**: Tolom only now
**Chosen**: Tolom only now
**Rationale**: Build the system, prove it works with Tolom, add projects later

### Mobile support from day one
**Question**: "Should mobile apps be supported?"
**Recommended**: Yes — plan for mobile deep links and SDK usage from the start
**Chosen**: Yes, mobile support from day one
**Rationale**: Tolom will have a Flutter mobile app. Auth must work on mobile.

## Open Questions
- How does Tolom's existing auth (email/password, organizations, RLS) migrate to the central Supabase project? This is a separate effort from building the central auth.
- What happens when a user registers in Tolom (which creates an org) vs. registers in the login app (which doesn't)? The signup flow needs to handle both paths.
- Should the login app issue a session that works across all projects simultaneously, or does each project maintain its own session independently? (Answer: each project has its own session — this is centralized login, not SSO.)

## Suggested Follow-ups
- Tolom migration: update Tolom's Supabase client to point to the central project, migrate existing users, test RLS policies still work
- Deep link configuration: register `tolom://auth/callback` and future app URL schemes in Supabase's redirect URL allowlist
- User profile sync: if a user updates their name in the login app, how does that propagate to Tolom's profiles table?
- Cost monitoring: set up Supabase usage alerts for when free tier limits approach (50K MAU, 500MB DB)

## References
- Tolom auth architecture: `src/lib/supabase/`, `src/app/[locale]/auth/`, `src/proxy.ts`
- Supabase SSR docs: https://supabase.com/docs/guides/auth/server-side/nextjs
- Google OAuth setup: https://supabase.com/docs/guides/auth/social-login/auth-google
- Apple OAuth setup: https://supabase.com/docs/guides/auth/social-login/auth-apple
- Supabase MFA docs: https://supabase.com/docs/guides/auth/auth-mfa
- Supabase Passkeys docs: https://supabase.com/docs/guides/auth/passkeys
- Resend pricing: https://resend.com/pricing (free: 100/day, 3K/month)
- Supabase pricing: https://supabase.com/pricing (free: 50K MAU)
