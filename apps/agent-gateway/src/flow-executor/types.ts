/**
 * Flow Executor — Type Definitions
 *
 * Defines the schema for published flows, execution state, and node results.
 * Designed to be channel-agnostic: the same flow runs on Telegram, Messenger,
 * WhatsApp, or any future channel.
 *
 * Flow lifecycle:
 *   Zatly draft → publish → immutable FlowVersion stored in DB
 *   Message arrives → resolve org → find active flow → create ConversationRun
 *   Interpreter walks graph node by node → node handlers execute → channel sends reply
 */

// ─── Flow Schema (what Zatly publishes) ──────────────────────────────────────

/** All supported node types in the flow graph. */
export type FlowNodeKind =
	| "start"
	| "sendMessage"
	| "askQuestion"
	| "condition"
	| "setField"
	| "delay"
	| "action"
	| "cardCarousel"
	| "aiReply"
	| "abTest";

/** Trigger type for the start node. */
export type FlowTrigger = "default" | "keyword" | "button" | "ref";

/** A single node in the flow graph. */
export interface FlowNode {
	id: string;
	type: FlowNodeKind;
	data: FlowNodeData;
}

/** Node data — discriminated by type. */
export type FlowNodeData =
	| StartNodeData
	| SendMessageNodeData
	| AskQuestionNodeData
	| ConditionNodeData
	| SetFieldNodeData
	| DelayNodeData
	| ActionNodeData
	| CardCarouselNodeData
	| AiReplyNodeData
	| AbTestNodeData;

export interface StartNodeData {
	label: string;
	trigger: FlowTrigger;
	keywords?: string[];
}

export interface SendMessageNodeData {
	label: string;
	message: string;
	buttons?: FlowButton[];
}

export interface AskQuestionNodeData {
	label: string;
	question: string;
	saveToField: string;
	buttons?: FlowButton[];
}

export interface ConditionNodeData {
	label: string;
	field: string;
	operator: "equals" | "contains" | "gt" | "lt" | "exists";
	value: string;
}

export interface SetFieldNodeData {
	label: string;
	field: string;
	value: string;
}

export interface DelayNodeData {
	label: string;
	duration: number;
	unit: "seconds" | "minutes" | "hours";
}

export interface ActionNodeData {
	label: string;
	actionType: "tag" | "subscribe" | "unsubscribe" | "notify" | "webhook";
	value: string;
}

export interface CardCarouselNodeData {
	label: string;
	cards: FlowCard[];
}

export interface AiReplyNodeData {
	label: string;
	systemPrompt: string;
	model: string;
	contextSize: number;
	temperature: number;
}

export interface AbTestNodeData {
	label: string;
	variants: AbTestVariant[];
}

/** A button in a message node. */
export interface FlowButton {
	id: string;
	text: string;
	actionType?: string;
	actionValue?: string;
}

/** A card in a card carousel node. */
export interface FlowCard {
	id: string;
	title: string;
	subtitle: string;
	imageUrl: string;
	buttons: Array<{
		id: string;
		text: string;
		type: "postback" | "url";
		value: string;
	}>;
}

/** A variant in an A/B test node. */
export interface AbTestVariant {
	id: string;
	weight: number;
	message: string;
}

/** An edge connecting two nodes. */
export interface FlowEdge {
	id: string;
	source: string;
	target: string;
	/** Condition evaluation result for conditional edges (true/false). */
	label?: string;
}

/** A published, immutable flow version. This is what the executor runs. */
export interface FlowVersion {
	/** Unique version ID (UUID). */
	id: string;
	/** The org this flow belongs to. */
	orgId: string;
	/** Product type (zer, tolom, zatly, etc.) */
	productType: string;
	/** The flow graph. */
	nodes: FlowNode[];
	edges: FlowEdge[];
	/** Which channel this flow is for. Null = any channel. */
	channel?: string;
	/** Trigger keyword(s) for keyword-triggered flows. */
	triggerKeywords?: string[];
	/** Flow metadata from Zatly. */
	metadata?: {
		name?: string;
		description?: string;
		publishedAt?: string;
		version?: number;
	};
}

// ─── Execution State ──────────────────────────────────────────────────────────

/** Status of a conversation run. */
export type RunStatus =
	| "active"
	| "waiting"
	| "delayed"
	| "completed"
	| "failed"
	| "expired";

/** A single conversation run through a flow. */
export interface ConversationRun {
	/** Unique run ID (UUID). */
	id: string;
	/** The flow version this run is executing. */
	flowVersionId: string;
	/** The org this run belongs to. */
	orgId: string;
	/** Channel identifiers. */
	channel: string;
	channelChatId: string;
	channelUserId: string;
	/** Current execution state. */
	status: RunStatus;
	/** The node ID the run is currently at or waiting on. */
	currentNodeId: string;
	/** Collected field values (from SetField nodes, AskQuestion responses). */
	fields: Record<string, string>;
	/** Which A/B variant was assigned (experiment_id → variant_id). */
	assignments: Record<string, string>;
	/** When the run started. */
	startedAt: string;
	/** When the run last progressed. */
	updatedAt: string;
	/** When the run expires (24h from last user message for Messenger). */
	expiresAt: string;
	/** Channel-specific metadata (page access token, etc.). */
	channelMeta?: Record<string, unknown>;
}

/** A pending wait state (for AskQuestion or Delay nodes). */
export interface WaitState {
	/** Unique wait ID (UUID). */
	id: string;
	/** The conversation run this wait belongs to. */
	runId: string;
	/** The node type we're waiting on. */
	waitType: "question_response" | "delay" | "button_callback";
	/** For delays: when to resume. */
	scheduledAt?: string;
	/** For questions: the expected input pattern. */
	expectedInput?: string;
	/** For button callbacks: the callback data pattern. */
	callbackPattern?: string;
	/** Created at. */
	createdAt: string;
}

// ─── Node Execution Results ───────────────────────────────────────────────────

/** Result of executing a single node. */
export interface NodeResult {
	/** What to do next. */
	action: NodeAction;
	/** Messages to send to the channel. */
	messages: OutboundMessage[];
	/** Updated fields to persist. */
	fieldUpdates?: Record<string, string>;
	/** A/B assignment to persist. */
	assignment?: { experimentId: string; variantId: string };
	/** Side effects to execute (webhooks, notifications). */
	sideEffects?: SideEffect[];
}

/** What the interpreter should do after a node executes. */
export type NodeAction =
	| { type: "next" }
	| { type: "branch"; edgeLabel: string }
	| { type: "wait"; waitType: WaitState["waitType"]; scheduledAt?: string }
	| { type: "end" }
	| { type: "error"; reason: string };

/** A message to send to the user via the channel. */
export interface OutboundMessage {
	/** Message text (HTML for Messenger, Markdown for Telegram). */
	text: string;
	/** Optional buttons (inline keyboard / quick replies). */
	buttons?: Array<{ text: string; callbackData: string }>;
	/** Optional cards for carousel. */
	cards?: FlowCard[];
}

/** A side effect to execute after node completion. */
export type SideEffect =
	| { type: "webhook"; url: string; payload: Record<string, unknown> }
	| { type: "tag"; tag: string }
	| { type: "notify"; message: string }
	| { type: "setField"; field: string; value: string };

// ─── Interpreter Context ──────────────────────────────────────────────────────

/** Context passed to the interpreter on each step. */
export interface FlowContext {
	/** The published flow version being executed. */
	flow: FlowVersion;
	/** The current conversation run. */
	run: ConversationRun;
	/** The original user message text. */
	userMessage: string;
	/** Callback data if this is a button callback. */
	callbackData?: string;
	/** Channel adapter for sending messages. */
	channel: {
		sendMessage(
			chatId: string,
			text: string,
			options?: {
				parseMode?: string;
				quickReplies?: Array<{ text: string; callbackData: string }>;
			},
		): Promise<void>;
	};
	/** Supabase client for persistence. */
	supabase: import("@supabase/supabase-js").SupabaseClient;
	/** AI provider for aiReply nodes (optional, injected by gateway). */
	aiProvider?: {
		runWithTools(params: {
			system: string;
			userMessage: string;
			maxRounds: number;
		}): Promise<string>;
	};
}

// ─── Outbox ───────────────────────────────────────────────────────────────────

/** A message queued for delivery via the outbox pattern. */
export interface OutboxEntry {
	id: string;
	runId: string;
	channel: string;
	channelChatId: string;
	payload: OutboundMessage;
	status: "pending" | "sent" | "failed";
	retryCount: number;
	maxRetries: number;
	createdAt: string;
	sentAt?: string;
	error?: string;
}
