# @zuiio/gateway-core

Shared types and interfaces for the agent-gateway plugin system. This package defines the contract between the barebone middleware and channel plugins.

## Exports

| Export | Type | Description |
|---|---|---|
| `Channel` | interface | Generic channel adapter interface |
| `IncomingMessage` | interface | Normalized incoming message from any channel |
| `InlineButton` | interface | Button in an inline keyboard / quick reply |
| `SendMessageOptions` | interface | Options for sending a channel message |
| `GatewayContext` | interface | Resolved context for a gateway request |
| `ChannelConnection` | interface | Channel connection record |
| `ResolutionResult` | interface | Result of resolving a chat/user to an org |
| `ToolContext` | interface | Context injected into every tool execution |
| `GatewayTool` | interface | Enhanced tool with gateway context |
| `AiProvider` | interface | AI provider contract |
| `AiGateway` | class | Gateway dispatcher with fallback |
| `ProviderOptions` | interface | LLM provider configuration |
| `AgentAudience` | type | "internal" \| "customer" |
| `ChannelType` | type | Supported channel identifiers |
| `ProductType` | type | Supported product identifiers |
| `KnowledgeVisibility` | type | Knowledge source visibility |
| `LinkRecord` | interface | Legacy Telegram link record |

## Plugin contract

Channel plugins import `Channel` from this package and implement it. Plugin packages should export:
- `createChannel(config?)`: Channel factory
- Channel-specific resolvers, formatting, and utilities

## Dependencies

- `@zuiio/ai-agent` — for `ToolParam` type (used in `GatewayTool`)
- `@zuiio/capture` — used by `AiGateway` for error capture
- `@supabase/supabase-js` (peer) — for `SupabaseClient` usage in `ToolContext`
