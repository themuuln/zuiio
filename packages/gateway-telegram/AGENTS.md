# @zuiio/gateway-telegram

Telegram Bot channel plugin for the agent-gateway middleware.

## Exports

| Export | Type | Description |
|---|---|---|
| `TelegramChannel` | class | Channel adapter implementing `Channel` from `@zuiio/gateway-core` |
| `resolveOrgFromChatUser` | function | Mode A resolver — shared bot, links Telegram chat+user to org |
| `resolveOrgFromBotKey` | function | Mode B resolver — custom bot per org |
| `setupBotProfile` | function | Set bot name, description, and commands |
| `onUserLinked` | function | Post-link commands setup for a chat |
| `onWelcome` | function | Pre-link commands for new users |
| `startTypingLoop` | function | Typing indicator refresh loop |
| `markdownToTelegramHtml` | function | Markdown → Telegram HTML |
| `markdownToMessengerFormat` | function | Markdown → Messenger/WhatsApp format |
| `convertTablesToPlainList` | function | Table → plain text list |
| `convertMarkdownToRichBlocks` | function | Table → Telegram RichBlockTable blocks |

## Dependencies

- `@zuiio/gateway-core` — for `Channel`, `GatewayContext`, `ResolutionResult` types
- `@zuiio/capture` — for error tracking
- `@supabase/supabase-js` (dev) — for type support in resolvers

## Env vars

- `TELEGRAM_BOT_TOKEN` — required
