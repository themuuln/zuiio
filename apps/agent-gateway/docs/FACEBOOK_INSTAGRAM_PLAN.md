# Facebook / Instagram / Messenger Integration Plan

> **Status:** Planning — Code foundation in progress, Meta admin deferred pending Business Verification documents
> **Last Updated:** 2026-07-07
> **Owner:** Agent Gateway team

---

## 1. Overview

Extend the agent-gateway from Telegram-only to a **multi-channel AI agent platform**. Any Zuiio product org owner (Zer, Tolom, Zatly, future products) will be able to connect their Facebook Page and Instagram Business account, and the gateway handles messages through the same AI agent pipeline.

### What We're Building

```
Messenger ─┐
            ├──▶ Webhook ──▶ Gateway ──▶ AI Provider ──▶ Tools ──▶ Supabase
Instagram ──┘       │           │
                    │           ├── Rate Limit Check
Telegram ──────────┘           ├── Budget Check
                                ├── Session Load
                                └── Org Resolution
```

### Key Constraints

| Constraint | Detail |
|---|---|
| **24-hour messaging window** | Can only reply within 24h of user's last message. Business replies do NOT extend the window. |
| **Instagram rate limit** | 200 automated DMs/hour per account within any open 24h window |
| **Meta App Review** | All permissions require App Review for production (~3-7 business days each) |
| **Business Verification** | Required before App Review. ~14 business days. English docs only. |
| **Messenger UI** | Button Template (max 3 buttons), Quick Replies (max 11), Postbacks |
| **Instagram UI** | Quick Replies only. No button templates. No message editing. |
| **Message Tags** | Deprecated Feb 2026 for Messenger. One-Time Notifications replace them. |

---

## 2. Meta Platform Setup

### 2.1 Prerequisites

1. **Facebook Developer Account** — developers.facebook.com (free, needs FB account)
2. **Business-type App** — must be Business, not Consumer
3. **Business Manager Portfolio** — business.facebook.com
4. **Business Verification** — English company documents required (Mongolian NOT supported — need official translation)
5. **Messenger Product** — added to the app
6. **Instagram Product** — added to the app

### 2.2 Required Permissions

| Permission | Purpose | Advanced Access Required? |
|---|---|---|
| `pages_messaging` | Messenger read/send | Yes |
| `pages_show_list` | List managed pages | Yes |
| `pages_manage_metadata` | Webhook subscriptions | Yes |
| `pages_read_engagement` | Read conversations/insights | Yes |
| `instagram_basic` | IG account info | Yes |
| `instagram_manage_messages` | IG DM read/send | Yes |

### 2.3 Timeline

| Step | Time | Status |
|---|---|---|
| Create FB Developer Account + Business App | Day 0 | ✅ Can do now |
| Create Business Manager Portfolio | Day 0 | ✅ Can do now |
| Submit Business Verification | Day 1-14 | ⏳ **Deferred** — waiting for English company certificate |
| Add Messenger + Instagram products | Day 0 | ✅ Can do now |
| Build webhook + OAuth (dev mode, 25 test users) | Day 1-7 | ✅ **In progress** |
| Submit App Review | Day 14+ | ⏳ Blocked on Business Verification |
| App Review approval | Day 21-28 | ⏳ Blocked |
| Switch to Advanced Access / Live | Day 28+ | ⏳ Blocked |
| Annual Data Use Checkup | Yearly | ⏳ Future |

**Total: ~4 weeks minimum from Business Verification submission.**

### 2.4 App Review Video Demo Requirements

When submitting App Review, record a screen capture showing:

- **Focus on requested permissions only** — don't request unnecessary ones
- **No audio required** — reviewers don't listen
- **Show the app in action** — not slides or presentations
- **Increase cursor size** — make actions easy to follow
- **Provide trigger phrase** — let reviewers interact with the bot
- **Webhook must be live** — responding 200 OK within 20 seconds
- **Resolution ≤ 1440px wide**
- **Match submission notes** — video must demonstrate exactly what you described

---

## 3. Architecture

### 3.1 Database Schema

#### New Table: `channel_connections`

Replaces `telegram_links` + `custom_bots` with a unified channel-agnostic table.

```sql
-- 007_channel_connections.sql
CREATE TABLE IF NOT EXISTS channel_connections (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel           text NOT NULL CHECK (channel IN ('telegram', 'messenger', 'instagram', 'whatsapp')),
  channel_user_id   text NOT NULL,        -- PSID, IGSID, telegram user_id, phone number
  channel_chat_id   text NOT NULL,        -- page_id, telegram chat_id, phone number
  page_id           text,                 -- FB/IG page ID (for messenger/instagram)
  page_name         text,                 -- display name
  page_access_token text,                 -- encrypted page access token
  token_expires_at  timestamptz,          -- token expiry (null for system user tokens)
  product_type      text NOT NULL CHECK (product_type IN ('tolom', 'zer')),
  user_id           text,                 -- Zuiio user_id (for Mode A linking)
  bot_key           text,                 -- custom bot key (for Mode B)
  is_active         boolean DEFAULT true,
  webhook_subscribed_at timestamptz,      -- when webhook was subscribed
  last_user_message_at timestamptz,       -- for 24h window tracking
  metadata          jsonb DEFAULT '{}',   -- channel-specific data
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),

  UNIQUE(organization_id, channel, channel_chat_id, channel_user_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_connections_org
  ON channel_connections(organization_id);

CREATE INDEX IF NOT EXISTS idx_channel_connections_page
  ON channel_connections(page_id) WHERE page_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_channel_connections_active
  ON channel_connections(channel, channel_chat_id, channel_user_id)
  WHERE is_active = true;
```

#### Migration: Alter Existing Tables

```sql
-- Add generic columns to agent_sessions
ALTER TABLE agent_sessions ADD COLUMN channel text DEFAULT 'telegram';
ALTER TABLE agent_sessions ADD COLUMN channel_chat_id text;
ALTER TABLE agent_sessions ADD COLUMN channel_user_id text;

-- Backfill from existing telegram columns
UPDATE agent_sessions SET
  channel_chat_id = telegram_chat_id::text,
  channel_user_id = telegram_user_id::text;

-- Add generic columns to agent_audit_log
ALTER TABLE agent_audit_log ADD COLUMN channel text DEFAULT 'telegram';
ALTER TABLE agent_audit_log ADD COLUMN channel_chat_id text;
ALTER TABLE agent_audit_log ADD COLUMN channel_user_id text;

-- Backfill
UPDATE agent_audit_log SET
  channel_chat_id = chat_id::text,
  channel_user_id = telegram_user_id::text;
```

#### Data Migration: Copy Existing Records

```sql
-- Copy telegram_links to channel_connections
INSERT INTO channel_connections (
  organization_id, channel, channel_user_id, channel_chat_id,
  product_type, user_id, is_active, created_at, updated_at
)
SELECT
  organization_id,
  'telegram',
  telegram_user_id::text,
  telegram_chat_id::text,
  product_type,
  user_id,
  is_active,
  linked_at,
  last_active_at
FROM telegram_links
ON CONFLICT DO NOTHING;

-- Copy custom_bots to channel_connections (Mode B)
-- Note: custom_bots don't have per-user links, they're org-level
-- These will be matched by bot_key in the webhook handler
```

### 3.2 Type System

```typescript
// src/gateway/types.ts
export interface GatewayContext {
  orgId: string;
  userId: string;
  productType: "tolom" | "zer";
  channel: "telegram" | "messenger" | "instagram" | "whatsapp";
  channelChatId: string;    // was chatId: number
  channelUserId: string;    // was telegramUserId: number
  pageId?: string;          // FB/IG page ID (for messenger/instagram)
  pageAccessToken?: string; // for sending replies
}
```

### 3.3 Channel Adapter

```typescript
// src/channels/facebook.ts
export class FacebookChannel implements Channel {
  async sendMessage(chatId: string, text: string, options?: SendMessageOptions): Promise<void> {
    // POST https://graph.facebook.com/v25.0/{pageId}/messages
    // recipient.id = chatId (PSID or IGSID)
    // message.text = text
  }

  async sendInlineKeyboard(chatId: string, text: string, buttons: InlineButton[][]): Promise<void> {
    // Messenger: Button Template (max 3 buttons) or Quick Replies (max 11)
    // Instagram: Quick Replies only
    // Fallback: numbered list with text
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    // No-op for FB/IG (no callback queries)
  }

  async editMessageText(chatId: string, messageId: number, text: string): Promise<void> {
    // No message editing on FB/IG — send new message instead
  }
}
```

### 3.4 Webhook Route

```typescript
// src/app/api/facebook/webhook/route.ts

// GET: Meta webhook verification
// POST: Handle incoming messages from Messenger + Instagram

// Security:
// 1. Validate X-Hub-Signature-256 (HMAC-SHA256 with App Secret)
// 2. Use constant-time comparison (crypto.timingSafeEqual)
// 3. Use raw request body (not JSON.parse/re-stringify)

// Routing:
// 1. Parse payload: { object: "page", entry: [...] }
// 2. For each entry: entry.id = page_id
// 3. Look up channel_connections by page_id
// 4. Determine channel: "messenger" or "instagram"
// 5. Extract sender ID from entry.messaging[0].sender.id
// 6. Route to agent pipeline
```

### 3.5 OAuth Flow

```
1. Org owner clicks "Connect Facebook Page" in dashboard
2. Redirect to Facebook OAuth:
   - scope: pages_messaging, pages_show_list, instagram_basic, instagram_manage_messages
   - state: signed token with orgId
3. Callback receives code → exchange for user access token
4. Exchange for long-lived token (60 days)
5. Fetch pages: GET /me/accounts?fields=id,name,access_token
6. User selects page from list
7. Check if IG account is linked: GET /{page_id}?fields=instagram_business_account
8. Store in channel_connections:
   - page_id, page_name, page_access_token (encrypted)
   - organization_id from state token
   - token_expires_at
9. Subscribe page to webhook:
   - POST /{page_id}/subscribed_apps
   - subscribed_fields: messages,messaging_postbacks
10. If Instagram linked: also subscribe IG messages
```

### 3.6 Confirmation Gate

Channel-aware confirmation for write tools:

| Channel | UI Component | Max Options |
|---|---|---|
| Telegram | Inline Keyboard | Unlimited |
| Messenger | Quick Replies | 11 |
| Instagram | Quick Replies | 11 |

```typescript
// src/runtime/confirmation.ts
export async function sendConfirmation(
  ctx: GatewayContext,
  toolName: string,
  args: Record<string, unknown>,
  confirmId: string,
): Promise<void> {
  switch (ctx.channel) {
    case "telegram":
      // Current: inline keyboard with ✅ Баталгаажуулах / ❌ Цуцлах
      break;
    case "messenger":
    case "instagram":
      // Quick Replies: "✅ Баталгаажуулах" / "❌ Цуцлах"
      break;
  }
}
```

### 3.7 24-Hour Window Handling

```typescript
// Before processing any message:
const lastMessage = connection.last_user_message_at;
const hoursSinceLastMessage = (Date.now() - new Date(lastMessage).getTime()) / (1000 * 60 * 60);

if (hoursSinceLastMessage > 24) {
  // Window expired — send re-engagement prompt
  await channel.sendMessage(chatId,
    "Бидэнтэй харилцахаар ахиад мессеж бичнэ үү. 😊"
  );
  return; // Do NOT process through AI pipeline
}
```

---

## 4. Token Management

### 4.1 Token Types

| Type | Lifetime | Use Case |
|---|---|---|
| Short-lived user token | 1-2 hours | OAuth exchange only |
| Long-lived user token | 60 days | Org owner connecting their page |
| Long-lived page token | 60 days (from user token) | Stored in channel_connections |
| System User token | Permanent | Your own app pages (if needed) |

### 4.2 Refresh Strategy

1. **Automatic refresh:** Check `token_expires_at` daily via cron job
2. **Refresh flow:** Use expired long-lived token to get new long-lived token (Graph API allows this within 30 days of expiry)
3. **Alert on failure:** Notify org owner if refresh fails
4. **Revoke on disconnect:** Clear token when org owner disconnects page

### 4.3 Encryption

Store `page_access_token` encrypted at rest:
- Use AES-256-GCM with key from `FB_TOKEN_ENCRYPTION_KEY` env var
- Encrypt on write, decrypt on read
- Treat token like a password — never log it

---

## 5. Security

### 5.1 Webhook Validation

```typescript
import crypto from "crypto";

function validateWebhookSignature(
  rawBody: string,
  signature: string | null,
  appSecret: string,
): boolean {
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  const expected = `sha256=${expectedSignature}`;

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected),
  );
}
```

### 5.2 Security Checklist

- [ ] Validate X-Hub-Signature-256 on every webhook
- [ ] Use constant-time comparison (crypto.timingSafeEqual)
- [ ] Use raw request body (disable body parser for webhook route)
- [ ] Store page_access_token encrypted at rest
- [ ] Never log tokens or sensitive webhook data
- [ ] Validate state parameter in OAuth callback
- [ ] Use HTTPS only for webhook URLs
- [ ] Implement rate limiting per channel

---

## 6. Implementation Phases

### Phase 1: Foundation (Can do now)

| Task | Files | Effort |
|---|---|---|
| DB migration: channel_connections table | `supabase/migrations/007_channel_connections.sql` | Medium |
| Generalize GatewayContext types | `src/gateway/types.ts`, `src/channels/types.ts` | Medium |
| Update session/audit for generic columns | `src/state/session.ts`, `src/state/audit.ts` | Medium |
| Facebook channel adapter | `src/channels/facebook.ts` | Medium |
| Webhook route + HMAC validation | `src/app/api/facebook/webhook/route.ts` | Medium |
| OAuth flow | `src/app/api/facebook/connect/route.ts`, `callback/route.ts` | Medium |
| Channel-aware confirmation gate | `src/runtime/confirmation.ts` | Low |
| 24h window handling | `src/gateway/agent-handler.ts` | Low |
| Tests | `tests/unit/facebook.test.ts`, `tests/integration/facebook-webhook.test.ts` | Medium |

### Phase 2: Meta Admin (Deferred)

| Task | Blocked By | Timeline |
|---|---|---|
| Business Verification | English company certificate | ~14 business days |
| App Review submission | Business Verification | ~3-7 business days |
| Permission requests | App Review | Same |
| Switch to Advanced Access | All reviews pass | After approval |

### Phase 3: Production Hardening

| Task | When |
|---|---|
| Token refresh cron job | After Phase 1 |
| Per-channel rate limits | After Phase 1 |
| Handover Protocol (bot ↔ human) | After Phase 2 |
| Message delivery tracking | After Phase 2 |
| Monitoring + alerting | After Phase 2 |

---

## 7. Environment Variables

```bash
# Facebook/Meta
FB_APP_ID=                    # Facebook App ID
FB_APP_SECRET=                # Facebook App Secret
FB_VERIFY_TOKEN=              # Webhook verification token
FB_GRAPH_API_VERSION=v25.0    # Graph API version
FB_OAUTH_REDIRECT_URI=        # OAuth callback URL
FB_TOKEN_ENCRYPTION_KEY=      # AES-256-GCM key for token encryption
```

---

## 8. References

- [Messenger Platform Docs](https://developers.facebook.com/docs/messenger-platform/)
- [Instagram Messaging API](https://developers.facebook.com/docs/instagram-api/messaging)
- [Permissions Reference](https://developers.facebook.com/docs/permissions/)
- [App Review Guide](https://developers.facebook.com/docs/app-review/)
- [Webhook Security](https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verify-requests)
- [Zatly Facebook App Requirements](../../apps/zatly/docs/facebook-app-requirements.md) — reference for Meta setup

---

## 9. Open Questions

1. **Should we support Handover Protocol from day 1?** (allows org owners to take over conversations from bot)
2. **Instagram DM Lists** — Meta paused new access in Feb 2024. Should we plan for this?
3. **WhatsApp channel** — already has a skeleton adapter. When to wire it up?
4. **Multi-product support** — should an org connect different pages for Zer vs Tolom, or one page serves all products?
