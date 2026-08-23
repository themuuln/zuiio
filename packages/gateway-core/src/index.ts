export type { ToolParam } from "@zuiio/ai-agent";

export type {
	AgentAudience,
	AiProvider,
	Channel,
	ChannelConnection,
	ChannelType,
	GatewayContext,
	GatewayTool,
	InlineButton,
	IncomingMessage,
	KnowledgeVisibility,
	LinkRecord,
	OutboundIntent,
	ProductAdapter,
	ProductAgentManifest,
	ProductToolExecution,
	ProductType,
	ProviderOptions,
	ResolutionResult,
	SendMessageOptions,
	ToolContext,
	ToolDescriptor,
} from "./types";
export { AiGateway } from "./types";
export type { GatewayPlugin } from "./plugin";
export {
	convertTablesToPlainList,
	markdownToMessengerFormat,
} from "./format";
export {
	type ToolArgumentValidation,
	validateToolArguments,
} from "./validate-tool-arguments";
