# Adding Channels

Channels are messaging adapters that abstract the bot platform. Currently only Telegram is implemented. This guide explains how to add a new channel (e.g., WhatsApp, Discord, Slack).

## Channel Interface

Every channel implements the `Channel` interface from `src/channels/types.ts`:

```typescript
interface Channel {
  sendMessage(
    chatId: number | string,
    text: string,
    options?: SendMessageOptions,
  ): Promise<void>;

  sendInlineKeyboard(
    chatId: number | string,
    text: string,
    buttons: InlineButton[][],
  ): Promise<void>;

  answerCallbackQuery(
    callbackQueryId: string,
    text?: string,
  ): Promise<void>;

  editMessageText(
    chatId: number | string,
    messageId: number,
    text: string,
  ): Promise<void>;
}
```

### Supporting Types

```typescript
interface InlineButton {
  text: string;
  callbackData: string;
}

interface SendMessageOptions {
  parseMode?: "HTML" | "Markdown";
  replyToMessageId?: number;
}

interface IncomingMessage {
  chatId: number;
  userId: number;
  text?: string;
  callbackQuery?: {
    id: string;
    data: string;
    messageId: number;
  };
  voiceFileId?: string;
}
```

## Step-by-Step

### 1. Create the channel file

```typescript
// src/channels/whatsapp.ts

import type { Channel, InlineButton, SendMessageOptions } from "./types";

export class WhatsAppChannel implements Channel {
  private apiToken: string;
  private phoneNumberId: string;

  constructor(config?: { token?: string; phoneNumberId?: string }) {
    this.apiToken = config?.token ?? process.env.WHATSAPP_TOKEN ?? "";
    this.phoneNumberId = config?.phoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
  }

  async sendMessage(
    chatId: number | string,
    text: string,
    options?: SendMessageOptions,
  ): Promise<void> {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: chatId.toString(),
          type: "text",
          text: { body: text },
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text().catch(() => "unknown");
      throw new Error(`WhatsApp send failed: ${res.status} ${err}`);
    }
  }

  async sendInlineKeyboard(
    chatId: number | string,
    text: string,
    buttons: InlineButton[][],
  ): Promise<void> {
    // WhatsApp doesn't support inline keyboards natively.
    // Convert to list messages or button messages.
    const flatButtons = buttons.flat();
    const bodyText = `${text}\n\n${flatButtons.map((b, i) => `${i + 1}. ${b.text}`).join("\n")}`;
    await this.sendMessage(chatId, bodyText);
  }

  async answerCallbackQuery(
    callbackQueryId: string,
    text?: string,
  ): Promise<void> {
    // WhatsApp doesn't have callback queries.
    // This is a no-op for WhatsApp.
  }

  async editMessageText(
    chatId: number | string,
    messageId: number,
    text: string,
  ): Promise<void> {
    // WhatsApp doesn't support message editing.
    // Send a new message instead.
    await this.sendMessage(chatId, text);
  }
}
```

### 2. Parse incoming messages

Create a webhook handler that converts platform-specific updates to `IncomingMessage`:

```typescript
// src/channels/whatsapp-webhook.ts

import type { IncomingMessage } from "./types";

export function parseWhatsAppUpdate(body: unknown): IncomingMessage | null {
  const data = body as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: Array<{
            id: string;
            from: string;
            text?: { body: string };
          }>;
        };
      }>;
    }>;
  };

  const message = data.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) return null;

  return {
    chatId: Number(message.from),
    userId: Number(message.from),
    text: message.text?.body,
  };
}
```

### 3. Create a webhook route

```typescript
// src/app/api/whatsapp/webhook/route.ts

import { NextResponse } from "next/server";
import { WhatsAppChannel } from "@/channels/whatsapp";
import { parseWhatsAppUpdate } from "@/channels/whatsapp-webhook";
import { resolveOrgFromChatUser } from "@/gateway/mode-a";

export const dynamic = "force-dynamic";

const channel = new WhatsAppChannel();

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  const message = parseWhatsAppUpdate(body);

  if (!message) {
    return NextResponse.json({ ok: true });
  }

  // Validate WhatsApp signature
  const signature = request.headers.get("x-hub-signature-256");
  if (!isWhatsAppSignatureValid(request, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Process message through the same agent pipeline
  // ... (similar to Telegram webhook)

  return NextResponse.json({ ok: true });
}
```

### 4. Handle platform-specific features

Some platforms have features others don't:

| Feature | Telegram | WhatsApp | Discord | Slack |
|---|---|---|---|---|
| Inline buttons | ✅ | ❌ (list messages) | ✅ (components) | ✅ (blocks) |
| Message editing | ✅ | ❌ | ✅ | ✅ |
| Callback queries | ✅ | ❌ | ✅ (interactions) | ✅ (actions) |
| Voice messages | ✅ | ✅ | ✅ | ✅ |
| Group chats | ✅ | ✅ | ✅ | ✅ |

For unsupported features, provide graceful fallbacks:
- Inline keyboards → numbered list with instruction to reply
- Message editing → send new message
- Callback queries → no-op or use reply-based flow

## Mapping IncomingMessage

The `IncomingMessage` interface is Telegram-centric. For other platforms:

```typescript
interface IncomingMessage {
  chatId: number;      // WhatsApp: phone number; Discord: channel ID
  userId: number;      // WhatsApp: phone number; Discord: user ID
  text?: string;       // Message text
  callbackQuery?: {    // Only for platforms with button callbacks
    id: string;
    data: string;
    messageId: number;
  };
  voiceFileId?: string; // Platform-specific voice file reference
}
```

Map platform-specific IDs to numbers. If IDs don't fit in numbers (e.g., Discord snowflakes), consider changing the type to `string` — but this requires updating the `Channel` interface and all implementations.

## Testing

Test channels by mocking the platform API:

```typescript
it("WhatsAppChannel sends message", async () => {
  const channel = new WhatsAppChannel({
    token: "test-token",
    phoneNumberId: "123456",
  });

  // Mock fetch
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

  await channel.sendMessage("1234567890", "Hello");
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("graph.facebook.com"),
    expect.objectContaining({
      body: expect.stringContaining("Hello"),
    }),
  );
});
```
