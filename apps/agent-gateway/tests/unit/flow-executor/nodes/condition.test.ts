import { describe, expect, it } from "vitest";

describe("handleCondition", () => {
	it("branches 'true' when field equals expected value", async () => {
		const { handleCondition } = await import("@/flow-executor/nodes/condition");

		const result = await handleCondition(
			{ run: { fields: { status: "active" } } } as never,
			{ data: { field: "status", operator: "equals", value: "active" } },
		);

		expect(result.action).toEqual({ type: "branch", edgeLabel: "true" });
	});

	it("branches 'false' when field does not equal expected value", async () => {
		const { handleCondition } = await import("@/flow-executor/nodes/condition");

		const result = await handleCondition(
			{ run: { fields: { status: "inactive" } } } as never,
			{ data: { field: "status", operator: "equals", value: "active" } },
		);

		expect(result.action).toEqual({ type: "branch", edgeLabel: "false" });
	});

	it("branches 'true' when field contains expected value", async () => {
		const { handleCondition } = await import("@/flow-executor/nodes/condition");

		const result = await handleCondition(
			{
				run: { fields: { description: "Premium customer since 2024" } },
			} as never,
			{
				data: { field: "description", operator: "contains", value: "Premium" },
			},
		);

		expect(result.action).toEqual({ type: "branch", edgeLabel: "true" });
	});

	it("branches 'false' when field does not contain expected value", async () => {
		const { handleCondition } = await import("@/flow-executor/nodes/condition");

		const result = await handleCondition(
			{ run: { fields: { description: "Regular customer" } } } as never,
			{
				data: { field: "description", operator: "contains", value: "Premium" },
			},
		);

		expect(result.action).toEqual({ type: "branch", edgeLabel: "false" });
	});

	it("branches 'true' when field value is greater than expected", async () => {
		const { handleCondition } = await import("@/flow-executor/nodes/condition");

		const result = await handleCondition(
			{ run: { fields: { age: "25" } } } as never,
			{ data: { field: "age", operator: "gt", value: "18" } },
		);

		expect(result.action).toEqual({ type: "branch", edgeLabel: "true" });
	});

	it("branches 'false' when field value is less than expected", async () => {
		const { handleCondition } = await import("@/flow-executor/nodes/condition");

		const result = await handleCondition(
			{ run: { fields: { age: "15" } } } as never,
			{ data: { field: "age", operator: "gt", value: "18" } },
		);

		expect(result.action).toEqual({ type: "branch", edgeLabel: "false" });
	});

	it("branches 'true' when field value is less than expected for lt operator", async () => {
		const { handleCondition } = await import("@/flow-executor/nodes/condition");

		const result = await handleCondition(
			{ run: { fields: { score: "50" } } } as never,
			{ data: { field: "score", operator: "lt", value: "100" } },
		);

		expect(result.action).toEqual({ type: "branch", edgeLabel: "true" });
	});

	it("branches 'true' when field exists (non-empty string)", async () => {
		const { handleCondition } = await import("@/flow-executor/nodes/condition");

		const result = await handleCondition(
			{ run: { fields: { email: "user@example.com" } } } as never,
			{ data: { field: "email", operator: "exists", value: "" } },
		);

		expect(result.action).toEqual({ type: "branch", edgeLabel: "true" });
	});

	it("branches 'false' when field does not exist (empty string)", async () => {
		const { handleCondition } = await import("@/flow-executor/nodes/condition");

		const result = await handleCondition(
			{ run: { fields: { email: "" } } } as never,
			{ data: { field: "email", operator: "exists", value: "" } },
		);

		expect(result.action).toEqual({ type: "branch", edgeLabel: "false" });
	});

	it("branches 'false' for missing field", async () => {
		const { handleCondition } = await import("@/flow-executor/nodes/condition");

		const result = await handleCondition({ run: { fields: {} } } as never, {
			data: { field: "nonexistent", operator: "exists", value: "" },
		});

		expect(result.action).toEqual({ type: "branch", edgeLabel: "false" });
	});

	it("performs case-insensitive comparison for equals", async () => {
		const { handleCondition } = await import("@/flow-executor/nodes/condition");

		const result = await handleCondition(
			{ run: { fields: { status: "Active" } } } as never,
			{ data: { field: "status", operator: "equals", value: "ACTIVE" } },
		);

		expect(result.action).toEqual({ type: "branch", edgeLabel: "true" });
	});

	it("performs case-insensitive comparison for contains", async () => {
		const { handleCondition } = await import("@/flow-executor/nodes/condition");

		const result = await handleCondition(
			{ run: { fields: { note: "Hello World" } } } as never,
			{ data: { field: "note", operator: "contains", value: "hello" } },
		);

		expect(result.action).toEqual({ type: "branch", edgeLabel: "true" });
	});

	it("returns no messages", async () => {
		const { handleCondition } = await import("@/flow-executor/nodes/condition");

		const result = await handleCondition(
			{ run: { fields: { status: "active" } } } as never,
			{ data: { field: "status", operator: "equals", value: "active" } },
		);

		expect(result.messages).toHaveLength(0);
	});
});
