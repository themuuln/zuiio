# ManyChat Competitor Plan — Zatly × Agent-Gateway × Zer/Tolom

> **Status:** Planning + gap analysis. Research date 2026-08-06.
> **Goal:** turn the current stack into a ManyChat-class Facebook/Instagram marketing + AI customer-service platform for Mongolian SMBs, with agent-gateway as the execution brain and zatly as the visual builder.

---

## 1. Competitor Research (What They Offer)

### ManyChat — the benchmark (Instagram-first, FB Messenger second)
| Category | Features |
|---|---|
| **Builder** | Visual Flow Builder (drag-drop), Quick Automations (guided), 10+ node types (send message, question, condition, delay, A/B test, set field, action), templates, JSON ads, keywords |
| **Triggers** | DM keywords, comment keywords (Comment-to-DM), Story mentions/replies, Messenger ref URLs, QR codes, ad clicks (JSON), welcome message, menu/button postbacks |
| **Growth tools** | FB Comments Growth Tool, Instagram comment auto-DM, Messenger Ref URL, QR code, Customer Chat widget (website), Overlay/embed widgets, SMS widget |
| **Marketing** | Sequences (nurture), Broadcasts (1-to-many, audience-filtered), scheduled messages, giveaways |
| **AI** | AI-powered replies inside flows (AI node), AI-assisted flow building, LLM handling of free-form questions |
| **CS/CRM** | Live Chat inbox (agent replies + labels + notes + assignment), contact CRM (custom fields, tags, segments), Handover Protocol |
| **Analytics** | Funnel reports, broadcast stats, growth stats, conversation volume |
| **Channels** | Instagram, Facebook Messenger, WhatsApp, Telegram, TikTok, Email, SMS |

### Respond.io — the AI customer-service benchmark
- **AI Agents** that handle full conversations 24/7, with **Knowledge Training** (FAQs, PDFs) and intent-based routing
- Unified **omnichannel inbox** (WhatsApp, Messenger, IG, Telegram, LINE, email) with agent handoff, shift management
- No-code **workflow builder**, CRM sync (HubSpot/Salesforce), broadcasts
- Differentiator vs ManyChat: *service-first* (handoff, inbox, knowledge) rather than marketing-first

### Chatfuel / SleekFlow — SMB middle ground
- Chatfuel: no-code builder + AI Business Assistant, appointment scheduling + reminders, lead capture, official Meta Business Partner
- SleekFlow: social-commerce (in-chat product catalogs, payment links, Shopify sync) + inbox + AI replies

### Takeaway for Zatly
ManyChat wins on **growth tools + builder UX**; Respond.io wins on **AI service + handoff**; nobody serves **Mongolian-language SMBs with Zer/Tolom business-data tools**. That's the wedge: combine ManyChat's builder with agent-gateway's AI + Zer/Tolom tooling — e.g., a Messenger customer can book a repair slot in Tolom or check an invoice in Zer inside the chat, with the visual flow builder controlling the UX and the AI handling free-form questions.

---

## 2. Current State vs Target (Gap Analysis)

### What already exists
| Capability | Where | Status |
|---|---|---|
| Visual flow builder (10 node types) | zatly (React Flow canvas, zustand, undo/redo, templates ×5) | ✅ Built |
| Flow execution engine (all 10 node types) | agent-gateway `src/flow-executor/` (interpreter, persistence, outbox, analytics) | ✅ Built, 100% tested |
| AI Reply node → real LLM | agent-gateway `nodes/ai-reply.ts` | ✅ Built |
| Messenger/IG channel adapter + webhook (HMAC, 24h window, sender actions, quick replies, confirmation gate) | agent-gateway `channels/facebook.ts` + `api/facebook/*` | ✅ Built |
| OAuth page connect (token-verified) | agent-gateway `api/facebook/{start,connect,callback,select}` | ✅ Built |
| Publish contract zatly → gateway | `POST /api/flow/publish` (types.ts: "Flow Schema (what Zatly publishes)") | ✅ Built |
| Handoff/briefing/knowledge tables | agent-gateway `agent_handoff_*`, `agent_knowledge_sources` | ✅ Built (Telegram) |
| Zer/Tolom link UI (Telegram) | zer `settings-content.tsx`, `telegram-link.tsx` | ✅ Built |
| Token refresh cron | agent-gateway `cron/refresh-meta-tokens` | ✅ Built |
| Competitive research + Meta requirements | zatly `masterPlan.md`, `docs/facebook-app-requirements.md` | ✅ Built |

### What is BROKEN / blocking (deployment — see FACEBOOK_INSTAGRAM_PLAN.md §1.5)
1. Migrations 007+ not applied to production Supabase
2. Production build is ~Jul 19 (pre-Aug-2 code); `/api/facebook/start` 404s
3. `FB_APP_ID`, `FB_OAUTH_REDIRECT_URI`, `NEXT_PUBLIC_FACEBOOK_APP_ID`, `FB_GRAPH_API_VERSION` missing from prod env; verify token mismatch
4. zatly submodule not checked out; its own Supabase project deleted; standalone deployment dead

### Feature gaps vs ManyChat (post-deployment roadmap)
| Priority | Feature | ManyChat parity | Build plan |
|---|---|---|---|
| P0 | **Connect Page from Zer/Tolom settings** (FB + IG) | ✅ core | ✅ **zer done (2026-08-06)**: `settings/facebook-actions.ts` (service-role reads + token-verified OAuth start) + `facebook-link-card.tsx` rendered in `settings-content.tsx`; gateway `/api/facebook/select` returns a server-configured `returnUrl` so the user lands back in zer. ✅ **tolom done**: `_facebook-section.tsx` + `api/facebook/{connect,connections}` routes + i18n (en/mn), registered in settings sections |
| P0 | **zatly publish → gateway** | core | ✅ **done (2026-08-06)**: zatly `api/flow/publish` now forwards to gateway `/api/flow/publish` via `src/lib/flowMapper.ts` (React Flow → gateway schema, drops `note` nodes, derives triggerKeywords); requires `orgId` (org binding — see Open Decisions). zatly is now a proper monorepo workspace member (nested lockfile/workspace files removed, root lockfile is source of truth) |
| P0 | **Keywords UI** (zatly sidebar buttons are dead) | core | ✅ already wired — automation cards show keyword chips, trigger filter exists, app-sidebar Rules section navigates to the rules tab |
| P1 | **Live Chat Inbox with human handoff** | ✅ | Use existing `agent_handoff_config/events`; new Inbox page in zatly (replace static placeholder): conversation list, assign, take-over (Handover Protocol on Messenger via `pass_thread_control`), notes, labels |
| P1 | **Broadcasts** (scheduled 1-to-many) | ✅ | zatly has `scheduled_messages` infra; gateway has `async_jobs` + cron. Build composer: audience filter → send via `FacebookChannel` per connection; track delivery |
| P1 | **Sequences** (time-delayed nurture) | ✅ | delay node exists; add per-contact sequence state (extend `scheduled_messages`/async_jobs), pause/resume UI |
| P1 | **Analytics UI** | ✅ | gateway `flow-executor/analytics.ts` + zatly analytics API exist; build funnel dashboard (triggered → engaged → converted) |
| P2 | **Growth tools** | ✅ | Comment-to-DM (FB comments webhook field), IG Story mentions, Messenger Ref URL, QR code generator (one-time notification / ref trigger), website chat widget (gateway already has `webchat_widgets` migration) |
| P2 | **AI service polish** | Respond.io parity | Knowledge training UI (gateway `agent_knowledge_sources` exists — add FAQ/PDF upload + retrieval), sentiment/tone, AI escalation to human |
| P2 | **Audience/segments** | ✅ | zatly contacts + custom fields exist (`setField` node); build segment builder UI (tags, fields, activity) for broadcasts |
| P3 | **Messenger Menu / persistent menu** | ✅ | `messenger_profile` API (`/me/messenger_profile`): set persistent menu, get started button, greeting |
| P3 | **Instagram DM Lists** | ⚠️ paused by Meta (Feb 2024) | Do not build; monitor |
| P3 | **Giveaways, appointment scheduling** | ✅ | Templates on top of existing nodes; appointment = flow + calendar tool |

---

## 3. Target Architecture

```
┌─────────────────────────────┐      ┌──────────────────────────────────────────────┐
│  zatly (builder + console)  │      │  agent-gateway (execution brain)             │
│  ─────────────────────      │      │  ──────────────────────────────              │
│  Flow Canvas (React Flow)   │      │  /api/flow/publish ◀── publish (x-api-key)   │
│  Keywords / Sequences UI    │      │  flow-executor: 10 node types                │
│  Broadcasts composer        │      │    · aiReply → LLM (system prompt, tools)    │
│  Inbox (live chat + handoff)│      │    · delay/action/abTest/condition…          │
│  Analytics dashboard        │      │  webhooks:                                   │
│  Templates ×5               │      │    · /api/facebook/webhook (MSG+IG, HMAC)    │
│  Settings: pages, menu      │      │    · /api/telegram/[botKey]/webhook          │
└─────────────────────────────┘      │    · /api/whatsapp/webhook (skeleton)        │
        │                            │  channels: FacebookChannel (Graph v25.0)     │
        │  webhook events            │  agents: system prompt per audience          │
        │  + Graph API replies       │  tools: read/write data (Zer/Tolom),         │
        ▼                            │    confirmation gate, budget, rate limit     │
┌─────────────────────────────┐      │  state: sessions, flows, outbox, async jobs  │
│  Meta (FB Page + IG acct)   │      │  handoff: agent_handoff_*, knowledge sources │
└─────────────────────────────┘      └──────────────────────────────────────────────┘
        ▲                                          ▲
        │  "Connect Page" button                   │  compact link token
┌───────┴──────────────────────────────────────────┴────────┐
│  zer / tolom settings (per-org)                            │
│  → /api/link/generate → /api/facebook/start → OAuth → page │
│  → channel_connections row (org-scoped, token-verified)    │
└────────────────────────────────────────────────────────────┘
```

### Integration contracts (already defined in code — wire them)
1. **zatly → gateway publish**: `POST {AGENT_GATEWAY_URL}/api/flow/publish` with `{ automationId, orgId, productType, nodes, edges, channel, triggerKeywords, metadata }`, auth `x-api-key: AGENT_GATEWAY_API_SECRET`. Node kinds must match `FlowNodeKind` (`start|sendMessage|askQuestion|condition|setField|delay|action|cardCarousel|aiReply|abTest`). zatly's React Flow nodes need a thin mapper (React Flow `{id,type,position,data}` → gateway `FlowNode`) — same node `type` names already.
2. **zer/tolom → gateway OAuth**: `POST /api/link/generate` (existing, returns compact token) → `POST {AGENT_GATEWAY_URL}/api/facebook/start {token}` → `redirectUrl` → user grants → `callback` → `GET /link/select?orgId&productType` page → user picks page → gateway subscribes webhook + stores connection. `product_type` in `channel_connections` already supports `zer`/`tolom` (and gateway supports `zatly`).
3. **Meta → gateway**: single webhook endpoint handles Messenger + Instagram (routed by page/IG business-account id). Already built.
4. **gateway → zer/tolom data**: `getSupabaseForProduct("tolom")` / `"zer"` service clients + `getProductTools()` — already built. Extend with zatly-org connections if a product type `zatly` needs its own DB.
5. **gateway → product apps (status reads)**: `GET /api/facebook/connections?orgId=…` (x-api-key, safe fields only) — new 2026-08-06, used by tolom's settings section; zer reads via its own service-role server action.

### Suggested repo work (in order)
1. Check out zatly submodule (or absorb it into the monorepo — recommended; see §5 note) and fix its deploy story.
2. zatly: replace `api/flow/publish` + Edge Function engine with gateway publish + webhook removal; wire Keywords sidebar.
3. zer/tolom: add "Холбох Facebook хуудас" connect card next to the Telegram link card in settings (mirror `telegram-link.tsx`).
4. gateway: none required for P0 (already built) — just deploy (migrations + env + release).
5. zatly: Inbox (handoff), Broadcasts, Analytics UI (P1).
6. Growth tools (P2): comments webhook fields (`comments`, `story_mentions`) + ref URL/QR endpoints.

---

## 4. UX Recommendations (best-in-class for this stack)

**Onboarding (connect a page in ≤3 clicks)**
- In Zer/Tolom settings: one card "AI туслахыг Facebook/Instagram-д холбох" with a single button; explain 24h window + data use in Mongolian before the OAuth consent screen (Meta requires clarity; users convert better).
- After connect: auto-create a starter flow from the zatly template list (welcome + FAQ + AI fallback), so the page works the moment it's connected.
- Show connection status (active / token expiring <7d / disconnected) with one-click re-connect — gateway `refresh-meta-tokens` cron already handles renewal; surface its failures in the UI.

**Builder UX (zatly)**
- Keep the ManyChat paradigm: left palette of node types, click-to-add, snap grid; group nodes into "Marketing" (sendMessage/cardCarousel/abTest) vs "Logic" (condition/setField/delay) vs "AI" (aiReply) in the palette.
- Flow-level test button: "Туршилт" — opens a chat simulator that runs the flow against the interpreter with a fake PSID, showing each node's messages (huge for trust; no Meta round-trip).
- Validation breadcrumbs: unconnected edges, missing start node, unreachable nodes, duplicate keywords — displayed as inline badges, not blocking save.
- AI Reply node editor: pick model, temperature, system prompt with variable autocomplete (`{{first_name}}`, `{{field}}`), "AI-free" fallback message when provider is down.

**Chat UX (Messenger/IG side)**
- Typing indicator (sender actions) on every AI/flow response — already implemented (`sendSenderAction`).
- Channel-aware rendering: buttons on Messenger, quick replies on IG, numbered list fallback (already in `sendInlineKeyboard`).
- 24h window: before the window closes, prompt the user with a One-Time Notification / re-engagement CTA; when the window expires, reply with the re-engagement message (implemented) instead of silently failing.
- Confirmation gate for write actions: "✅ Баталгаажуулах / ❌ Цуцлах" quick replies on both channels (implemented) — never execute destructive actions from chat without it.

**Inbox / handoff UX**
- Conversation list with unread badges, PSID→contact name resolution (custom fields), AI-vs-human badge per conversation.
- One-tap "Дуусгах" (take over): Handover Protocol `pass_thread_control` on Messenger so the bot stops replying; AI resumes via "Дахин AI-д өгөх" button.
- Agent reply suggestions from the AI (Respond.io-style): the AI drafts, the human approves — best of both worlds.

**Analytics**
- Per-flow funnel: triggered → started → completed (gateway analytics exists; zatly has an analytics API; build the chart UI with shadcn/ui charts).
- Broadcast report: delivered / opened / replied / converted per audience segment.

---

## 5. Notes & Open Decisions

- **The gateway is invisible (white-label principle)**: end users never see "agent-gateway", "gateway", or its brand — they see **their product** (Zer, Tolom, Zatly, …) with Facebook/Instagram built in. Concretely:
  - Page connect starts inside the product's settings (zer card exists; tolom/zatly next)
  - The gateway-hosted OAuth pages (`/link/select`, `/link`) are product-branded from the `productType` in the verified token — the `PRODUCT_NAMES` map in `src/app/link/select/page.tsx` is the single place to extend for new products; page titles are neutral ("Холболт")
  - Meta's OAuth requires the redirect to stay on the gateway origin (state cookie), but that's an implementation detail — copy, headings, and the return URL always bring the user back into the product
  - Future: if a product wants full white-label (own domain), host a thin callback proxy on the product domain that forwards the code to the gateway — documented here as an option, not needed today
- **zatly submodule**: ✅ checked out (2026-08-06) and integrated into the monorepo workspace — nested `pnpm-lock.yaml`/`pnpm-workspace.yaml` removed, root lockfile is the single source of truth; 152 tests green. Remaining: GitHub remote auth for future submodule pulls, and the decision whether to keep it a submodule or absorb it as a plain directory (still recommended — the gateway integration makes them one product; see the `absorb-submodule-into-app` pattern). Its standalone Supabase project was deleted; flows now publish to the gateway DB.
- **Org model**: `channel_connections.product_type` supports `zer`/`tolom`; a `zatly` product type or org-level page ownership must be decided before P1 (multi-product pages).
- **Meta constraints**: 24h window; IG rate limit 200 DMs/h; message tags deprecated Feb 2026 (use One-Time Notifications); Instagram DM Lists paused by Meta — these shape what growth tools are legal to build.
- **App Review video**: record once the dev-mode E2E works (webhook live + flow + confirmation gate demo, ≤1440px, cursor visible, trigger phrase in notes).

---

## 6. Status Refresh — 2026-08-25

Post-Business-Verification pass. Sources: code audit (this date), Meta docs
(Graph v25/v26), ManyChat community release notes (Q1–Q2 2026).

### Shipped since 2026-08-06
| Feature | Where |
|---|---|
| Production deploy live (health, FB webhook, token-verified start all verified) | Vercel `agent-gateway` |
| **FB comment auto-reply agent** (public AI reply + Private Reply DM, loop-safe, keyword filter, per-org config in `channel_connections.metadata.comment_reply`) | `src/gateway/comment-agent.ts` |
| `feed` webhook field + comment scopes (`pages_manage_engagement`, `pages_read_engagement`, `pages_read_user_content`) | `channels/facebook.ts`, `lib/facebook-scopes.ts` |
| Prompt-injection hardening, output redaction, tool validation | commit `ae6f4312e` |
| Connect-flow CORS/OAuth fixes for product-app embedding (Bujin/zer) | commits `da53b93df`–`9981f67b1` |

### Remaining gaps vs ManyChat (re-prioritized)
| # | Gap | ManyChat parity | Status / build note |
|---|---|---|---|
| 1 | **Live Chat Inbox** (conversation list, human take-over via `pass_thread_control`, labels/notes) | ✅ core | Backend exists (`agent_handoff_*`, dashboard `handoffs/[id]/resolve`); no inbox UI. Highest-value gap — service use case |
| 2 | **Broadcasts** composer (audience filter → send → delivery stats) | ✅ core | Infra exists (`async_jobs`, `FacebookChannel`); no UI. Constraint: Meta killed Messenger recurring notifications (2026-02) — send within 24h window or HUMAN_AGENT/UTILITY tags only |
| 3 | **KB management UI** (FAQ/PDF upload, retrieval preview w/ source attribution) | ✅ (Knowledge + AI Playground) | `agent_knowledge_sources` + search exist; management is curl-only (`POST /api/dashboard/kb`) |
| 4 | **AI Behavior analog** (persona/tone/guardrails editor) | ✅ (AI Behavior, 2026-04) | `agent_context_profiles` + `loadAgentProfile` exist; profile API route exists — needs a real editor UI |
| 5 | **Sequences** (per-contact nurture state, pause/resume) | ✅ | delay node + `async_jobs` exist; no per-contact sequence state |
| 6 | **Analytics/funnel UI** (triggered→engaged→converted) | ✅ | `flow-executor/analytics.ts` + usage/quota APIs exist; no charts |
| 7 | **Growth tools**: IG Story mentions, Messenger Ref URL (`m.me/ref`), QR generator, JSON ads | ✅ | Comment-to-DM ✅ (FB only); rest unbuilt |
| 8 | **IG comment + DM parity** | ✅ (ManyChat is IG-first) | IG comments arrive on `instagram` webhook object — separate subscription/flow; unbuilt |
| 9 | **Persistent menu / Get Started / greeting** (`/me/messenger_profile`) | ✅ | Cheap win, high polish |
| 10 | **Contact CRM** (custom fields, tags, segments) | ✅ | Wedge: use zer/tolom business DB as the CRM instead of a parallel contact store — nobody else can do this |
| 11 | **WhatsApp activation** | ✅ | Adapter + webhook skeleton only; WhatsApp Marketing Messages now GA at ManyChat (2026-04) — rising priority |
| 12 | **PDF/document send in DMs** | ✅ (2026 Q1) | `Channel.sendDocument?` optional; FB adapter lacks it |
| 13 | **Flow test simulator** (fake-PSID playground) | ✅ (AI Playground) | UX rec §4; builds trust before Meta round-trip |

### Recommended build order (post-App-Review)
1. Inbox (take-over) → 2. Broadcasts (24h-window) → 3. KB UI + profile editor →
4. messenger_profile polish → 5. Analytics → 6. Sequences → 7. IG parity → 8. WhatsApp.

### Meta constraints shaping the roadmap (2026)
- Messenger recurring notifications (Marketing Messages) **deprecated 2026-02-10** — broadcasts must respect the 24h window or use remaining valid tags.
- Deprecated tags `CONFIRMED_EVENT_UPDATE` / `ACCOUNT_UPDATE` / `POST_PURCHASE_UPDATE` error from 2026-04-27.
- Graph v25.0 supported until 2028-07-29 (v26.0 current since 2026-07-29) — no forced upgrade yet.
- IG DM Lists still paused by Meta — do not build (unchanged from §2).
