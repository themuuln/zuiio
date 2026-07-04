# Zatly — Project Tracker

> **Strategic reference**: [`masterPlan.md`](../masterPlan.md) — product overview, competitive analysis, pricing, architecture
> **Version**: 0.2.0 | **Updated**: 2026-06-15

---

## Current Sprint — Sprint 1: Production Hardening 🔧

**Focus**: Security fixes + dev infrastructure | **Goal**: Make the app production-safe
**Estimated**: June 15–22, 2026
**Strategic context** (from [competitive research](masterPlan.md#14-competitive-landscape)):
- ManyChat's 2026 pricing overhaul proves users will switch if a better option exists — but we must be production-safe first
- #1 risk from competitive analysis: "No API route auth" exposes all user data. Cannot launch without fixing
- This sprint eliminates the top 8 security risks identified in Section 15 of masterPlan.md

| Status | Task | Epic | Notes |
|--------|------|------|-------|
| ✅ DONE | API route auth (session validation on all routes) | Sec | |
| ✅ DONE | Input validation (zod schemas on API routes) | Sec | |
| ✅ DONE | Add `.env.local` to `.gitignore` | Sec | |
| ✅ DONE | Flow builder polish (drag ghost, toasts, skeletons, inline edit, edge ctx menu, modal editor, resize, alignment toolbar, snap guides, validation states, handle tooltips, edge labels) | UX/P | Phases A–E complete |
| ⏳ TODO | Move Facebook credentials from `.data/` to DB (encrypted) | Sec | |
| ⏳ TODO | Resolve lockfile conflict (npm vs pnpm) | Infra | |
| ⏳ TODO | Add error pages (`error.tsx`, `not-found.tsx`) | UX | |
| ⏳ TODO | Unify Graph API version (v21.0 → v25.0) | Sec | |
| ⏳ TODO | Suppress raw Supabase error text in API responses | Sec | |

---

## Sprint 2 — Dev Infrastructure & Testing 🧪

**Focus**: Test coverage, CI/CD, monitoring | **Dependencies**: Sprint 1 done
**Strategic context**: 
- ManyChat support is "email-only with 4-5 day response times" — our smaller codebase lets us move faster and ship more reliably
- Botpress had a major pricing revamp (May 2026) going per-conversation billing — CI/CD lets us iterate faster than enterprise competitors
- Zero tests currently is a launch blocker per our own risk assessment

| Status | Task | Epic | Priority |
|--------|------|------|----------|
| ⏳ TODO | Set up Vitest unit tests for API routes | Test | P0 |
| ⏳ TODO | Set up Playwright E2E tests for critical flows | Test | P1 |
| ⏳ TODO | Add GitHub Actions CI (lint → typecheck → test) | Infra | P1 |
| ⏳ TODO | Add rate limiting to webhook + auth endpoints | Sec | P1 |
| ⏳ TODO | Complete flow engine execution (delay, action at runtime) | Core | P1 |

---

## Sprint 3 — Mongolian Market Launch 🇲🇳

**Focus**: Localization + templates + go-to-market | **Dependencies**: Sprint 1–2 done
**Target**: Q3 2026
**Strategic context** (from [Mongolia market deep dive](masterPlan.md#149-mongolian-market-deep-dive)):
- **Zero competitors**: No self-serve visual flow builder exists in Mongolian. Nathouse and BZP are just ManyChat resellers. GreenSoft does custom dev only. Botsify has an MN landing page but English-only.
- **2.7M Facebook users**, 2.3M Messenger users, 83% internet penetration — and not one Mongolian-language bot builder
- Mongolian-language content outperforms English 4:1 to 8:1 — localization is the single biggest differentiator
- Facebook Groups (not Pages) are the primary commerce channels — our community strategy must target groups
- ManyChat resellers Nathouse and BZP could become Zatly partners if we offer better economics
- Gateway to Central Asia: Kazakhstan and Kyrgyzstan have similar language/culture patterns

| Status | Task | Epic | Priority |
|--------|------|------|----------|
| ⏳ TODO | Full Mongolian language UI (i18n) | MN | P0 |
| ⏳ TODO | Mongolian-language pre-built templates | MN | P1 |
| ⏳ TODO | Localized onboarding (docs, video tutorials, tooltips) | MN | P1 |
| ⏳ TODO | Mongolian payment gateway (QPay, SocialPay, MonPay) | MN | P1 |
| ⏳ TODO | Facebook Group community building | MN-PR | P1 |
| ⏳ TODO | Agency partner program (target Nathouse, BZP, etc.) | MN-PR | P1 |
| ⏳ TODO | Mobile-optimized builder (96% mobile MN traffic) | MN | P1 |
| ⏳ TODO | Low-bandwidth mode for rural areas | MN | P2 |
| ⏳ TODO | Mongolian-market pricing tier (~$5–50/mo) | Biz | P1 |
| ⏳ TODO | Micro-influencer partnerships | MN-PR | P2 |
| ⏳ TODO | Contact import (CSV/JSON) | Core | P1 |
| ⏳ TODO | Multi-page Facebook connection | Core | P2 |

---

## Sprint 4 — Growth Features 🚀

**Target**: Late Q3 2026
**Strategic context**:
- ManyChat's #1 strength is its **template library** (massive, 10-min setup) — Zatly must reach parity to compete
- **Comment-to-DM automation** is ManyChat's flagship feature and the main reason people choose it. Must-have for launch
- Node analytics dashboard is a **unique opportunity** — per-node preview stats already exist but no competitor offers real per-node analytics
- UChat has 166 templates; ManyChat has hundreds. We need at least 20 well-designed ones for credible launch

| Status | Task | Epic | Priority |
|--------|------|------|----------|
| ⏳ TODO | Sequence automations (drip campaigns) | Growth | P1 |
| ⏳ TODO | Template library (20+ pre-built flows) | Growth | P1 |
| ⏳ TODO | Node analytics dashboard (real data) | Growth | P1 |
| ⏳ TODO | Rules engine (event → condition → action) | Growth | P2 |
| ⏳ TODO | Automation folder management | Growth | P2 |
| ⏳ TODO | Comment-to-DM automation | Growth | P1 |
| ⏳ TODO | A/B testing for messages | Growth | P2 |
| ⏳ TODO | Email notifications (admin notify action) | Growth | P2 |

---

## Sprint 5 — AI Differentiation 🤖

**Target**: Q4 2026
**Strategic context**:
- ManyChat's "AI Step" ($29/mo add-on) is **keyword matching, not real AI** — this is the #2 user complaint after pricing. Zatly can leapfrog with real LLM + RAG
- Voiceflow already has knowledge base training + LLM integration — they're the bar for AI features
- Botpress recently bundled AI spend into conversation pricing (May 2026) — they're commoditizing AI, so Zatly must too
- A Flow Builder Assistant (generate flows from "I want a lead capture bot") would be **unique in the market** — no competitor offers this
- Auto-translate flows is a **critical differentiator** for the Mongolian market and beyond — ManyChat/Chatfuel require manual duplication per language

| Status | Task | Epic | Priority |
|--------|------|------|----------|
| ⏳ TODO | Knowledge base / RAG integration (train on website, PDFs, docs) | AI | P1 |
| ⏳ TODO | Real LLM integration (GPT/Claude — beat ManyChat's fake AI) | AI | P1 |
| ⏳ TODO | AI Flow Builder Assistant (generate flows from NL description) | AI | P2 |
| ⏳ TODO | Smart reply suggestions | AI | P2 |
| ⏳ TODO | Auto-translate flows to multiple languages | AI | P2 |
| ⏳ TODO | Voice note processing (Instagram voice DMs) | AI | P3 |
| ⏳ TODO | In-chat appointment booking | AI | P2 |

---

## Sprint 6 — Monetization 💰

**Target**: Q4 2026

| Status | Task | Epic | Priority |
|--------|------|------|----------|
| ⏳ TODO | Stripe subscription integration | Biz | P1 |
| ⏳ TODO | Tiered feature gating (free → starter → pro → business → agency) | Biz | P1 |
| ⏳ TODO | Self-hosted license tier ($299 flat) | Biz | P1 |
| ⏳ TODO | Agency plans (multi-tenant) | Biz | P2 |
| ⏳ TODO | White-label option | Biz | P2 |

---

## Sprint 7 — Platform Expansion 🌐

**Target**: Q1 2027

| Status | Task | Epic | Priority |
|--------|------|------|----------|
| ⏳ TODO | Instagram Messaging support | Expand | P1 |
| ⏳ TODO | WhatsApp Business API integration | Expand | P1 |
| ⏳ TODO | Web chat widget | Expand | P2 |
| ⏳ TODO | SMS integration (Twilio) | Expand | P3 |
| ⏳ TODO | Public API for custom integrations | Expand | P2 |

---

## Backlog — Uncategorized Items

| Status | Task | Source | Notes |
|--------|------|--------|-------|
| 📋 PENDING | Execution logs UI | masterPlan.md | |
| 📋 PENDING | Share automation with other users | masterPlan.md | API route exists |
| 📋 PENDING | Browser notifications for bot events | masterPlan.md | |
| 📋 PENDING | CSV/JSON template import | masterPlan.md | |
| 📋 PENDING | Rate limiting dashboard | masterPlan.md | |
| 📋 PENDING | Audit log for automation changes | masterPlan.md | |
| 📋 PENDING | Email/password reset flow | masterPlan.md | |
| 📋 PENDING | OAuth with Google/GitHub | masterPlan.md | |

---

## Key Metrics & KPIs

| Metric | Current | Target | Notes |
|--------|---------|--------|-------|
| Test coverage | ~5% (type tests only) | >70% | After Sprint 2 |
| API routes with auth | 0% | 100% | After Sprint 1 |
| Flow builder DnD node types | 10 | 12+ | After Sprint 4 |
| Languages supported | 1 (en) | 2 (en + mn) | After Sprint 3 |
| CI pipeline | None | Green on push | After Sprint 2 |

---

## Session Log

| Date | Sprint | Work Done |
|------|--------|-----------|
| 2026-06-15 | Sprint 1 | Drag ghost preview, placement animation, loading skeletons, toast notifications, rubber band select, edge reconnect, micro-interaction CSS, empty states, sticky notes (NoteNode), inline editing (SendMessage/AskQuestion), keyboard shortcut cheat sheet, drop zone indicator, node validation states, handle tooltips, edge labels (Yes/No), alignment toolbar, snap alignment guides, edge context menu, modal editor (Condition/AiReply), node resize (SendMessage/CardCarousel) |
| 2026-06-15 | — | Created planning/TRACKER.md with 7 sprints, strategic context from research, backlog, KPIs, session log. Created .factory/AGENTS.md with instructions to update tracker after tasks and reference competitive research for prioritization. Added strategic context blocks linking each sprint to specific competitor weaknesses. |
| 2026-06-15 | Templates | **Save as Template**: Added "Save as Template" button to FlowCanvas toolbar (enabled only when active automation exists). Created SaveAsTemplateDialog with name/description/category form, required name validation, POST /api/templates submission with success toast and error handling. **Use Template**: Verified existing AutomationWorkspace onUseTemplate calls POST /api/templates/:id/apply and navigates to builder on success, shows error on failure. 11 new Vitest tests for the dialog. |

---

## How to Use

- **Status**: `✅ DONE` / `🔵 IN PROGRESS` / `⏳ TODO` / `📋 PENDING` / `🚫 BLOCKED`
- **Priority**: P0 = launch blocker, P1 = high, P2 = medium, P3 = nice-to-have
- **Epic key**: `Sec` = Security, `Infra` = Infrastructure, `Test` = Testing, `UX` = Design/UI, `Core` = Core features, `MN` = Mongolian market, `MN-PR` = Mongolia GTM/PR, `Growth` = Growth features, `AI` = AI, `Biz` = Business/Monetization, `Expand` = Platform expansion
- On sprint start, move items from backlog into the current sprint table
- After completing a session, append to the Session Log
