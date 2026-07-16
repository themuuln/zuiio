# Telegram Bot Menu UX Plan

## Research Summary

Based on deep research from Telegram official docs, BotHero, grammY, and industry best practices.

---

## Key Findings

### 1. Command Menu Best Practices

| Metric | Recommendation |
|--------|----------------|
| **Optimal command count** | 5-8 commands (first 6 visible without scroll) |
| **First command gets** | 40-50% of all taps |
| **Second command gets** | 20-25% of taps |
| **Engagement decision** | Happens in first 4-8 words of description |
| **Menu updates** | Should rotate quarterly based on analytics |

### 2. Three Interaction Methods

| Method | Best For | Use Case |
|--------|----------|----------|
| **Commands** (`/start`) | Admin, settings, quick actions | Persistent menu, power users |
| **Inline Keyboards** | Menu navigation, choices | Contextual actions, no chat clutter |
| **Reply Keyboards** | Primary navigation, data collection | Persistent access, mobile-first |

### 3. Scoped Commands (Per-User Menus)

Telegram supports **different command lists for different users** via `setMyCommands` with `scope` parameter:

```typescript
// Unlinked user - minimal
await setMyCommands([
  { command: "start", description: "🚀 Холбогдох" },
  { command: "help", description: "❓ Тусламж" },
], { scope: { type: "default" } });

// Linked user - full
await setMyCommands([
  { command: "start", description: "🚀 Холбогдох" },
  { command: "help", description: "❓ Тусламж" },
  { command: "switch", description: "🔄 Байгууллага солих" },
  { command: "link", description: "🔗 Кодоор холбогдох" },
], { scope: { type: "chat", chat_id: chatId } });
```

### 4. Command Naming Best Practices

| Weak | Strong | Why |
|------|--------|-----|
| `/book` "Book appointment" | "Get your spot — takes 30 seconds" | Sets time expectation |
| `/help` "Get help" | "Quick answers to common questions" | Promises specific outcome |
| `/contact` "Contact us" | "Talk to a real human right now" | Addresses concern |

### 5. Anti-Patterns to Avoid

- ❌ More than 8 commands (dilutes engagement ~12% per extra command)
- ❌ `/feedback` as top-level (nobody opens bot to leave feedback)
- ❌ `/settings` unless SaaS product
- ❌ Duplicate commands (`/help` AND `/support` AND `/faq`)
- ❌ Vanity commands (`/about-our-story`)

---

## Recommended Architecture for Zuiio Bot

### Current State
- 4 commands: `/start`, `/help`, `/switch`, `/link`
- All users see same menu
- Menu button type: `commands`

### Proposed Enhancement

#### Phase 1: Scoped Commands (Immediate)

**Unlinked users see:**
```
/start — 🚀 Холбогдох эхлэх
/help — ❓ Ботын боломжууд
```

**Linked users see:**
```
/start — 🚀 Холбогдох
/help — ❓ Ботын боломжууд
/switch — 🔄 Байгууллага солих
/link — 🔗 Кодоор холбогдох
```

**Implementation:**
1. Update `onWelcome()` to set minimal commands
2. Update `onUserLinked()` to set full commands with chat scope
3. Use `setMyCommands` with `scope: { type: "chat", chat_id: chatId }`

#### Phase 2: Inline Keyboard Menus (Future)

Replace text-heavy responses with inline keyboards:

```
👋 Сайн байна уу! {orgName} руу тавтай морил.

Танд ямар тусламж хэрэгтэй вэ?
```
```
[📊 Өнөөдрийн орлого] [📋 Ажлын захиалга]
[👥 Харилцагчид] [💰 Зардал]
[⚙️ Тохиргоо]
```

**Benefits:**
- No typing required
- Visual, intuitive
- Contextual actions
- Clean chat interface

#### Phase 3: Dynamic Menu Button (Future)

For linked users, switch menu button to web_app if mini app deployed:

```typescript
// Linked user - open dashboard
await setChatMenuButton({
  chat_id: chatId,
  menu_button: { 
    type: "web_app", 
    text: "📊 Dashboard",
    web_app: { url: "https://app.zuiiotech.com" }
  }
});
```

---

## Implementation Plan

### Step 1: Update bot-ux.ts

```typescript
import "server-only";
import { capture } from "@zuiio/capture";

const TELEGRAM_API = "https://api.telegram.org/bot";

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is required");
  return token;
}

async function api(method: string, body: Record<string, unknown>): Promise<void> {
  const token = getBotToken();
  const res = await fetch(`${TELEGRAM_API}${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "unknown");
    capture(new Error(`Telegram ${method} failed: ${res.status} ${err}`), {
      context: "agent-gateway: bot profile",
    });
  }
}

/** Set the bot's global commands (for all users) */
export async function setupBotProfile(): Promise<void> {
  await api("setMyName", { name: "Zuiio AI" });

  await api("setMyDescription", {
    description:
      "Zer ба Tolom системийн AI туслах бот.\n" +
      "Өөрийн бизнесийн өгөгдөлтэй натурал хэлээр ярилцаж, " +
      "борлуулалт, захиалга, харилцагч, санхүүгийн мэдээллээ аваарай.",
  });

  await api("setMyShortDescription", {
    short_description: "Zer & Tolom бизнесийн AI туслах",
  });

  // Default commands for all users (unlinked)
  await api("setMyCommands", {
    commands: [
      { command: "start", description: "🚀 Холбогдох эхлэх" },
      { command: "help", description: "❓ Ботын боломжууд" },
    ],
    scope: { type: "default" },
  });

  console.log("✅ Bot profile setup complete");
}

/** Called when a user first opens the bot (unlinked). Shows minimal commands. */
export async function onWelcome(chatId: number): Promise<void> {
  // Set minimal commands for this user
  await api("setMyCommands", {
    commands: [
      { command: "start", description: "🚀 Холбогдох эхлэх" },
      { command: "help", description: "❓ Ботын боломжууд" },
    ],
    scope: { type: "chat", chat_id: chatId },
  });

  // Set commands-type menu button
  await api("setChatMenuButton", {
    chat_id: chatId,
    menu_button: { type: "commands" },
  });
}

/** Called after a user links their account. Shows full commands. */
export async function onUserLinked(chatId: number): Promise<void> {
  // Set full commands for linked user
  await api("setMyCommands", {
    commands: [
      { command: "start", description: "🚀 Холбогдох" },
      { command: "help", description: "❓ Ботын боломжууд" },
      { command: "switch", description: "🔄 Байгууллага солих" },
      { command: "link", description: "🔗 Кодоор холбогдох" },
    ],
    scope: { type: "chat", chat_id: chatId },
  });

  // Set commands-type menu button
  await api("setChatMenuButton", {
    chat_id: chatId,
    menu_button: { type: "commands" },
  });
}
```

### Step 2: Update Command Descriptions

Make descriptions more engaging:

| Current | Proposed |
|---------|----------|
| `/start — 🚀 Холбогдож эхлэх` | `/start — 🚀 Холбогдох эхлэх` |
| `/help — ❓ Тусламж, боломжууд` | `/help — ❓ Ботын боломжууд` |
| `/switch — 🔄 Байгууллага солих` | `/switch — 🔄 Байгууллага солих` |
| `/link — 🔗 Кодоор холбогдох` | `/link — 🔗 Кодоор холбогдох` |

### Step 3: Add Analytics (Future)

Track command usage to optimize menu:

```typescript
// In webhook route
if (text.startsWith("/")) {
  const command = text.split(" ")[0];
  await supabase.from("agent_command_log").insert({
    org_id: context.orgId,
    user_id: userId,
    command: command,
    chat_type: chatType,
  });
}
```

---

## Metrics to Track

1. **Command tap rate**: Which commands get used? Kill anything below 5% after 30 days.
2. **Flow completion rate**: Of people who tap `/start`, how many complete linking?
3. **Time-to-first-command**: How quickly after `/start` does user tap something else? Under 10s is strong.
4. **Handoff rate**: How often does `/help` end with "Talk to a person"?

---

## Expected Outcomes

| Metric | Current | After Phase 1 | After Phase 2 |
|--------|---------|---------------|---------------|
| Menu relevance | Low (same for all) | High (scoped) | Very High (inline) |
| Click-through | Unknown | +30-50% | +50-70% |
| User confusion | Medium | Low | Very Low |
| Support tickets | Baseline | -20% | -40% |

---

## References

- [Telegram Bot Features](https://core.telegram.org/bots/features)
- [Bot Commands](https://core.telegram.org/api/bots/commands)
- [Bot Menu Button](https://core.telegram.org/api/bots/menu)
- [BotHero Guide](https://blog.bothero.ai/telegram-bot-commands-the-small-business-command-menu-that-turns-casual-messages-into-qualified-leads-and-resolved-tickets)
- [grammY Menu Plugin](https://grammy.dev/plugins/menu)
