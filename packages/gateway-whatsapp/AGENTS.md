# @zuiio/gateway-whatsapp

WhatsApp Cloud API channel plugin for the agent-gateway middleware.

## Exports

| Export | Type | Description |
|---|---|---|
| `WhatsAppChannel` | class | Channel adapter implementing `Channel` from `@zuiio/gateway-core` |

## Dependencies

- `@zuiio/gateway-core` — for `Channel` types and `markdownToMessengerFormat`
- `@zuiio/capture` — for error tracking

## Env vars

- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_APP_ID`
