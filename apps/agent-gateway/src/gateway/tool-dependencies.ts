import type { SupabaseClient } from "@supabase/supabase-js";
import type {
	AgentAudience,
	ChannelType,
	ProductType,
	ToolContext,
} from "@zuiio/gateway-core";

/** Private product-data dependencies. Never pass this object to a provider. */
export interface ToolDependencies {
	supabase: SupabaseClient;
	externalOrganizationId: string;
	userId: string;
	productType: ProductType;
	audience: AgentAudience;
	channel: ChannelType;
	channelChatId: string;
	channelUserId: string;
	conversationId: string;
	traceId: string;
}

export function toToolContext(
	dependencies: ToolDependencies,
): ToolContext {
	return {
		externalOrganizationId: dependencies.externalOrganizationId,
		userId: dependencies.userId,
		productType: dependencies.productType,
		audience: dependencies.audience,
		conversationId: dependencies.conversationId,
		traceId: dependencies.traceId,
	};
}
