// Types
export type {
	AgentAudience,
	ChannelConnection,
	ChannelType,
	GatewayContext,
	GatewayTool,
	InlineButton,
	IncomingMessage,
	KnowledgeVisibility,
	ProductType,
	ProviderOptions,
	ResolutionResult,
	SendMessageOptions,
	ToolContext,
} from "./types";

export type { AiProvider } from "./types";

// Classes
export { AiGateway } from "./types";

// Interfaces
export type { Channel } from "./types";

// Plugin
export type { GatewayPlugin } from "./plugin";

// Shared formatting utilities (used by multiple channel plugins)
export { markdownToMessengerFormat, convertTablesToPlainList } from "./format";
