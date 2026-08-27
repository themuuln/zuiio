import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ToolContext } from "@/providers/types";

const mocks = vi.hoisted(() => {
	const maybeSingle = vi.fn();
	const chain: Record<string, ReturnType<typeof vi.fn>> = {};
	chain.insert = vi.fn(async () => ({ error: null }));
	chain.delete = vi.fn(() => chain);
	chain.eq = vi.fn(() => chain);
	chain.gt = vi.fn(() => chain);
	chain.select = vi.fn(() => chain);
	chain.maybeSingle = maybeSingle;
	return {
		maybeSingle,
		service: { from: vi.fn(() => chain) },
	};
});

vi.mock("@zuiio/capture", () => ({ capture: vi.fn() }));
vi.mock("@/lib/supabase", () => ({
	createServiceClient: vi.fn(() => mocks.service),
}));

describe("durable customer confirmation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.maybeSingle.mockResolvedValue({
			data: {
				nonce: "nonce-1",
				organization_id: "org-1",
				user_id: "user-1",
				product_type: "zer",
				tool_name: "checkoutCartWithQpay",
				args: { contact_name: "Бат" },
				summary: "QPay захиалга",
				channel: "messenger",
				channel_chat_id: "page-1",
				channel_user_id: "sender-1",
			},
			error: null,
		});
	});

	it("stores the organization and channel identity with the action", async () => {
		const { stagePersistentAction } = await import("@/runtime/confirmation");
		const context: ToolContext = {
			orgId: "org-1",
			userId: "user-1",
			supabase: {} as never,
			productType: "zer",
			channel: "messenger",
			channelChatId: "page-1",
			channelUserId: "sender-1",
		};

		const result = await stagePersistentAction(
			"checkoutCartWithQpay",
			{ contact_name: "Бат" },
			"QPay захиалга",
			context,
		);

		expect(result.buttons[0]?.[0]?.callbackData).toMatch(/^confirm:/);
		expect(mocks.service.from).toHaveBeenCalledWith("agent_pending_actions");
	});

	it("atomically consumes the action only for its organization and sender", async () => {
		const { confirmStoredAction } = await import("@/runtime/confirmation");

		const result = await confirmStoredAction(
			"nonce-1",
			"org-1",
			"page-1",
			"sender-1",
		);

		expect(result).toMatchObject({
			persistent: true,
			toolName: "checkoutCartWithQpay",
			organizationId: "org-1",
			args: { contact_name: "Бат" },
		});
	});
});
