import { describe, expect, it } from "vitest";

describe("handleSendMessage", () => {
	it("sends a plain text message", async () => {
		const { handleSendMessage } = await import(
			"@/flow-executor/nodes/send-message"
		);

		const result = await handleSendMessage(
			{ run: { id: "run-1", fields: {} } } as never,
			{ data: { message: "Hello, user!" } },
		);

		expect(result.action).toEqual({ type: "next" });
		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].text).toBe("Hello, user!");
	});

	it("interpolates {{field}} placeholders with run field values", async () => {
		const { handleSendMessage } = await import(
			"@/flow-executor/nodes/send-message"
		);

		const result = await handleSendMessage(
			{ run: { id: "run-1", fields: { name: "Бат" } } } as never,
			{ data: { message: "Сайн байна уу, {{name}}?" } },
		);

		expect(result.messages[0].text).toBe("Сайн байна уу, Бат?");
	});

	it("leaves unresolved placeholders intact", async () => {
		const { handleSendMessage } = await import(
			"@/flow-executor/nodes/send-message"
		);

		const result = await handleSendMessage(
			{ run: { id: "run-1", fields: { name: "Alice" } } } as never,
			{ data: { message: "Hi {{name}}, your code is {{code}}" } },
		);

		expect(result.messages[0].text).toBe("Hi Alice, your code is {{code}}");
	});

	it("sends message with buttons", async () => {
		const { handleSendMessage } = await import(
			"@/flow-executor/nodes/send-message"
		);

		const result = await handleSendMessage(
			{ run: { id: "run-1", fields: {} } } as never,
			{
				data: {
					message: "Choose an option:",
					buttons: [
						{ id: "btn1", text: "Yes" },
						{ id: "btn2", text: "No" },
					],
				},
			},
		);

		expect(result.messages).toHaveLength(1);
		const msg = result.messages[0];
		expect(msg.text).toBe("Choose an option:");
		expect(msg.buttons).toHaveLength(2);
		expect(msg.buttons?.[0]).toEqual({
			text: "Yes",
			callbackData: "flow:run-1:btn1",
		});
		expect(msg.buttons?.[1]).toEqual({
			text: "No",
			callbackData: "flow:run-1:btn2",
		});
	});

	it("uses actionValue over id for callback data when available", async () => {
		const { handleSendMessage } = await import(
			"@/flow-executor/nodes/send-message"
		);

		const result = await handleSendMessage(
			{ run: { id: "run-1", fields: {} } } as never,
			{
				data: {
					message: "Pick one:",
					buttons: [
						{
							id: "btn1",
							text: "Option A",
							actionValue: "opt_a",
						},
					],
				},
			},
		);

		expect(result.messages[0].buttons?.[0].callbackData).toBe(
			"flow:run-1:opt_a",
		);
	});

	it("handles empty message gracefully", async () => {
		const { handleSendMessage } = await import(
			"@/flow-executor/nodes/send-message"
		);

		const result = await handleSendMessage(
			{ run: { id: "run-1", fields: {} } } as never,
			{ data: { message: "" } },
		);

		expect(result.messages[0].text).toBe("");
	});
});

describe("interpolateFields", () => {
	it("replaces single field", async () => {
		const mod = await import("@/flow-executor/nodes/send-message");

		// Access the internal function via the module
		type FlowContext = { run: { id: string; fields: Record<string, string> } };
		type NodeData = {
			data: {
				message: string;
				buttons?: Array<{
					id: string;
					text: string;
					actionType?: string;
					actionValue?: string;
				}>;
			};
		};

		const result = await mod.handleSendMessage(
			{ run: { id: "r1", fields: { user: "Test" } } } as FlowContext,
			{ data: { message: "Hello {{user}}" } } as NodeData,
		);

		expect(result.messages[0].text).toBe("Hello Test");
	});
});
