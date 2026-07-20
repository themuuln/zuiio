import { describe, expect, it } from "vitest";

describe("handleAskQuestion", () => {
	it("returns a wait action with the question as message", async () => {
		const { handleAskQuestion } = await import(
			"@/flow-executor/nodes/ask-question"
		);

		const result = await handleAskQuestion(
			{ run: { id: "run-1", fields: {} } } as never,
			{
				data: {
					question: "What is your name?",
					saveToField: "userName",
				},
			},
		);

		expect(result.action).toEqual({
			type: "wait",
			waitType: "question_response",
		});
		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].text).toBe("What is your name?");
		expect(result.fieldUpdates).toEqual({ _awaitingField: "userName" });
	});

	it("interpolates {{field}} placeholders in the question", async () => {
		const { handleAskQuestion } = await import(
			"@/flow-executor/nodes/ask-question"
		);

		const result = await handleAskQuestion(
			{ run: { id: "run-1", fields: { name: "Болд" } } } as never,
			{
				data: {
					question: "Hello {{name}}, what is your email?",
					saveToField: "email",
				},
			},
		);

		expect(result.messages[0].text).toBe("Hello Болд, what is your email?");
	});

	it("includes buttons with flow callback data", async () => {
		const { handleAskQuestion } = await import(
			"@/flow-executor/nodes/ask-question"
		);

		const result = await handleAskQuestion(
			{ run: { id: "run-123", fields: {} } } as never,
			{
				data: {
					question: "Choose color:",
					saveToField: "color",
					buttons: [
						{ id: "red", text: "Red" },
						{ id: "blue", text: "Blue", actionValue: "blue-option" },
					],
				},
			},
		);

		expect(result.messages[0].buttons).toHaveLength(2);
		expect(result.messages[0].buttons?.[0]).toEqual({
			text: "Red",
			callbackData: "flow:run-123:red",
		});
		expect(result.messages[0].buttons?.[1]).toEqual({
			text: "Blue",
			callbackData: "flow:run-123:blue-option",
		});
	});

	it("skips the question if the field already has a value", async () => {
		const { handleAskQuestion } = await import(
			"@/flow-executor/nodes/ask-question"
		);

		const result = await handleAskQuestion(
			{
				run: {
					id: "run-1",
					fields: { userName: "ExistingValue", _awaitingField: "" },
				},
			} as never,
			{
				data: {
					question: "What is your name?",
					saveToField: "userName",
				},
			},
		);

		expect(result.action).toEqual({ type: "next" });
		expect(result.messages).toHaveLength(0);
	});

	it("leaves unresolved placeholders intact", async () => {
		const { handleAskQuestion } = await import(
			"@/flow-executor/nodes/ask-question"
		);

		const result = await handleAskQuestion(
			{ run: { id: "run-1", fields: {} } } as never,
			{
				data: {
					question: "Hello {{name}}, are you {{age}} years old?",
					saveToField: "confirmed",
				},
			},
		);

		expect(result.messages[0].text).toBe(
			"Hello {{name}}, are you {{age}} years old?",
		);
	});
});

describe("processQuestionResponse", () => {
	it("stores the user response in the specified field", async () => {
		const { processQuestionResponse } = await import(
			"@/flow-executor/nodes/ask-question"
		);

		const result = processQuestionResponse(
			{ name: "Test", _awaitingField: "email" },
			"user@example.com",
			"email",
		);

		expect(result.fieldUpdates).toEqual({
			email: "user@example.com",
			_awaitingField: "",
		});
		expect(result.completed).toBe(true);
	});

	it("clears _awaitingField after storing response", async () => {
		const { processQuestionResponse } = await import(
			"@/flow-executor/nodes/ask-question"
		);

		const result = processQuestionResponse(
			{ _awaitingField: "phone" },
			"555-1234",
			"phone",
		);

		expect(result.fieldUpdates._awaitingField).toBe("");
	});
});
