import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GatewayTool, ToolContext } from "@/providers/types";
import {
	confirmAction,
	rejectAction,
	stageAction,
} from "@/runtime/confirmation";
import { gateWriteTool, summarizeWriteAction } from "@/runtime/write-gate";

vi.mock("server-only", () => ({}));

const { tgSendInlineKeyboard, fbSendInlineKeyboard, waSendInlineKeyboard } =
	vi.hoisted(() => ({
		tgSendInlineKeyboard: vi.fn(() => Promise.resolve()),
		fbSendInlineKeyboard: vi.fn(() => Promise.resolve()),
		waSendInlineKeyboard: vi.fn(() => Promise.resolve()),
	}));

vi.mock("@/channels/telegram", () => ({
	TelegramChannel: class {
		sendInlineKeyboard = tgSendInlineKeyboard;
	},
}));
vi.mock("@/channels/facebook", () => ({
	FacebookChannel: class {
		sendInlineKeyboard = fbSendInlineKeyboard;
	},
}));
vi.mock("@/channels/whatsapp", () => ({
	WhatsAppChannel: class {
		sendInlineKeyboard = waSendInlineKeyboard;
	},
}));

function makeTool(overrides: Partial<GatewayTool> = {}): GatewayTool {
	const execute = vi.fn(async () => ({ success: true, message: "done" }));
	return {
		name: "writeData",
		description: "test write tool",
		parameters: [],
		execute,
		...overrides,
	} as GatewayTool;
}

function makeContext(overrides: Partial<ToolContext> = {}): ToolContext {
	return {
		orgId: "org-1",
		userId: "user-1",
		supabase: {} as never,
		channel: "telegram",
		channelChatId: "111",
		channelUserId: "222",
		...overrides,
	};
}

/** Extract the nonce from the confirm button payload sent on Telegram. */
function lastNonce(): string {
	const call = tgSendInlineKeyboard.mock.calls.at(-1) as [
		string,
		string,
		Array<Array<{ callbackData: string }>>,
	];
	const buttons = call[2];
	const first = buttons?.[0]?.[0];
	if (!first) throw new Error("no confirm buttons sent");
	return first.callbackData.replace("confirm:", "");
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("summarizeWriteAction", () => {
	it("summarizes dataset + operation + id", () => {
		const summary = summarizeWriteAction("writeData", {
			dataset: "work_orders",
			operation: "update",
			id: "wo-1",
		});
		expect(summary).toContain("work_orders");
		expect(summary).toContain("update");
		expect(summary).toContain("wo-1");
	});

	it("counts data fields", () => {
		const summary = summarizeWriteAction("writeData", {
			dataset: "customers",
			operation: "insert",
			data: { name: "A", phone: "B" },
		});
		expect(summary).toContain("2 талбар");
	});
});

describe("gateWriteTool — confirmation gate", () => {
	it("stages the action instead of executing when channel context exists", async () => {
		const tool = makeTool();
		const gated = gateWriteTool(tool, makeContext());

		const result = await gated.execute(
			{ dataset: "x", operation: "insert" },
			makeContext(),
		);

		expect(tool.execute).not.toHaveBeenCalled();
		expect(typeof result).toBe("string");
	});

	it("sends the confirm buttons on Telegram", async () => {
		const tool = makeTool();
		const gated = gateWriteTool(tool, makeContext());

		await gated.execute({}, makeContext());

		expect(tgSendInlineKeyboard).toHaveBeenCalledWith(
			"111",
			expect.stringContaining("Баталгаажуулах"),
			expect.arrayContaining([
				expect.arrayContaining([expect.objectContaining({ text: "✅ Тийм" })]),
			]),
		);
	});

	it("uses quick replies on Messenger", async () => {
		const tool = makeTool();
		const gated = gateWriteTool(
			tool,
			makeContext({
				channel: "messenger",
				pageId: "page-1",
				pageAccessToken: "tok",
			}),
		);

		await gated.execute({}, makeContext({ channel: "messenger" }));

		expect(fbSendInlineKeyboard).toHaveBeenCalledWith(
			"222",
			expect.stringContaining("Баталгаажуулах"),
			expect.any(Array),
		);
	});

	it("executes directly when no channel context (tests/legacy)", async () => {
		const tool = makeTool();
		const gated = gateWriteTool(tool, makeContext());
		const ctx = { orgId: "org-1", userId: "u", supabase: {} as never };

		const result = await gated.execute({ dataset: "x" }, ctx);

		expect(tool.execute).toHaveBeenCalledOnce();
		expect(result).toEqual({ success: true, message: "done" });
	});

	it("returns an error string when the channel send fails", async () => {
		const tool = makeTool();
		const gated = gateWriteTool(tool, makeContext());
		tgSendInlineKeyboard.mockRejectedValueOnce(new Error("network down"));

		const result = await gated.execute({}, makeContext());

		expect(tool.execute).not.toHaveBeenCalled();
		expect(String(result)).toContain("алдаа");
	});
});

describe("staged action lifecycle", () => {
	it("confirmAction re-executes the stored closure with original args", async () => {
		const tool = makeTool();
		const gated = gateWriteTool(tool, makeContext());
		const args = {
			dataset: "customers",
			operation: "insert",
			data: { name: "X" },
		};

		await gated.execute(args, makeContext());
		const nonce = lastNonce();

		const staged = confirmAction(nonce, "111", "222");
		expect(staged).not.toBeNull();
		expect(staged?.toolName).toBe("writeData");

		await staged?.execute?.(staged.args);
		expect(tool.execute).toHaveBeenCalledOnce();
		expect(tool.execute).toHaveBeenCalledWith(args, expect.anything());
	});

	it("confirmAction rejects mismatched chat/user", async () => {
		const tool = makeTool();
		const gated = gateWriteTool(tool, makeContext());
		await gated.execute({}, makeContext());
		const nonce = lastNonce();

		expect(confirmAction(nonce, "999", "222")).toBeNull();
		expect(confirmAction(nonce, "111", "999")).toBeNull();
		// Correct identity still works after mismatched attempts
		expect(confirmAction(nonce, "111", "222")).not.toBeNull();
	});

	it("confirmAction returns null for unknown nonce", () => {
		expect(confirmAction("nope", "111", "222")).toBeNull();
	});

	it("rejectAction removes the staged action", () => {
		const { nonce } = stageAction(
			"writeData",
			{},
			"telegram",
			"111",
			"222",
			"sum",
		);
		rejectAction(nonce);
		expect(confirmAction(nonce, "111", "222")).toBeNull();
	});

	it("stageAction builds confirm/reject buttons", () => {
		const { buttons } = stageAction(
			"writeData",
			{},
			"telegram",
			"111",
			"222",
			"sum",
		);
		expect(buttons[0]?.map((b) => b.text)).toEqual(["✅ Тийм", "❌ Үгүй"]);
	});
});
