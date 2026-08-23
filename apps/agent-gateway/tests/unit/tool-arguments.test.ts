import { describe, expect, it } from "vitest";
import { validateToolArguments, type ToolParam } from "@zuiio/gateway-core";

const parameters: ToolParam[] = [
	{
		name: "status",
		type: "string",
		description: "Order status",
		required: true,
		enum: ["pending", "paid"],
	},
	{
		name: "items",
		type: "array",
		description: "Product identifiers",
		items: { type: "string" },
	},
	{
		name: "customer",
		type: "object",
		description: "Customer fields",
		properties: {
			phone: { type: "string", description: "Phone" },
		},
	},
];

describe("validateToolArguments", () => {
	it("accepts the declared shape", () => {
		expect(
			validateToolArguments(parameters, {
				status: "pending",
				items: ["p-1"],
				customer: { phone: "99112233" },
			}),
		).toEqual({ ok: true });
	});

	it.each([
		[{}, "Missing required argument: status"],
		[{ status: "other" }, "Invalid value for status"],
		[{ status: "paid", items: [1] }, "Invalid item type for items"],
		[
			{ status: "paid", customer: { phone: 99112233 } },
			"Invalid type for customer.phone",
		],
		[{ status: "paid", tenantId: "unsafe" }, "Unknown argument: tenantId"],
	] as const)("rejects invalid boundary input %#", (args, message) => {
		expect(validateToolArguments(parameters, args)).toEqual({
			ok: false,
			message,
		});
	});
});
