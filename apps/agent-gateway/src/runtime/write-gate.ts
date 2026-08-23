import "server-only";

import type { GatewayTool } from "@zuiio/gateway-core";
import type { ToolDependencies } from "@/gateway/tool-dependencies";
import { createGatewayControlClient } from "@/lib/gateway-control-client";
import { createPendingActionRepository } from "@/state/pending-action-repository";
import {
	type PendingActionRepository,
	stagePendingAction,
} from "./confirmation";

export function summarizeWriteAction(
	toolName: string,
	args: Record<string, unknown>,
): string {
	const dataset = args.dataset ? ` "${args.dataset}"` : "";
	const operation = args.operation ? ` — ${args.operation}` : "";
	const id = args.id ? ` #${args.id}` : "";
	const data = args.data && typeof args.data === "object" ? args.data : null;
	const fieldCount = data ? Object.keys(data as object).length : 0;
	const fields = fieldCount > 0 ? ` (${fieldCount} талбар)` : "";
	return `${toolName}${dataset}${operation}${id}${fields}`;
}

let _repository: PendingActionRepository | null = null;

function pendingActionRepository(): PendingActionRepository {
	_repository ??= createPendingActionRepository(createGatewayControlClient());
	return _repository;
}

/**
 * Durable confirmation gate. The staged action plus its confirmation
 * quick-replies live in the control plane, so a cold restart can still
 * complete or reject the action. No channel adapter runs here.
 */
export function gateWriteTool(
	tool: GatewayTool,
	dependencies: ToolDependencies,
): GatewayTool {
	if (tool.effect !== "write" || tool.approval !== "required") {
		throw new Error(`WRITE_TOOL_REQUIRES_APPROVAL: ${tool.name}`);
	}
	return {
		...tool,
		execute: async (args) => {
			try {
				await stagePendingAction({
					repository: pendingActionRepository(),
					context: {
						externalOrganizationId: dependencies.externalOrganizationId,
						userId: dependencies.userId,
						productType: dependencies.productType,
						audience: dependencies.audience,
						conversationId: dependencies.conversationId,
						traceId: dependencies.traceId,
					},
					tool,
					arguments: args,
					summary: summarizeWriteAction(tool.name, args),
				});
			} catch {
				return "Баталгаажуулах санал үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.";
			}
			return "Хэрэглэгчид баталгаажуулах санал илгээгдлээ. Тэдний хариултыг хүлээнэ үү. Үйлдлийг бүү давтаарай.";
		},
	};
}
