import { describe, expect, it } from "vitest";

describe("handleSetField", () => {
	it("sets a field to a static value", async () => {
		const { handleSetField } = await import("@/flow-executor/nodes/set-field");

		const result = await handleSetField({ run: { fields: {} } } as never, {
			data: { field: "name", value: "John" },
		});

		expect(result.action).toEqual({ type: "next" });
		expect(result.messages).toHaveLength(0);
		expect(result.fieldUpdates).toEqual({ name: "John" });
	});

	it("interpolates {{field}} placeholders with run field values", async () => {
		const { handleSetField } = await import("@/flow-executor/nodes/set-field");

		const result = await handleSetField(
			{ run: { fields: { firstName: "Jane", lastName: "Doe" } } } as never,
			{ data: { field: "fullName", value: "{{firstName}} {{lastName}}" } },
		);

		expect(result.fieldUpdates).toEqual({
			fullName: "Jane Doe",
		});
	});

	it("leaves unresolved placeholders intact", async () => {
		const { handleSetField } = await import("@/flow-executor/nodes/set-field");

		const result = await handleSetField(
			{ run: { fields: { name: "Alice" } } } as never,
			{ data: { field: "greeting", value: "Hello {{name}} from {{city}}" } },
		);

		expect(result.fieldUpdates).toEqual({
			greeting: "Hello Alice from {{city}}",
		});
	});

	it("handles empty fields gracefully", async () => {
		const { handleSetField } = await import("@/flow-executor/nodes/set-field");

		const result = await handleSetField({ run: { fields: {} } } as never, {
			data: { field: "test", value: "plain value" },
		});

		expect(result.fieldUpdates).toEqual({ test: "plain value" });
	});

	it("interpolates multiple different placeholders", async () => {
		const { handleSetField } = await import("@/flow-executor/nodes/set-field");

		const result = await handleSetField(
			{ run: { fields: { a: "1", b: "2", c: "3" } } } as never,
			{ data: { field: "result", value: "{{a}}-{{b}}-{{c}}" } },
		);

		expect(result.fieldUpdates).toEqual({
			result: "1-2-3",
		});
	});
});
