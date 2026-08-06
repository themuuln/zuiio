import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { ProductCatalog, ReadPlan } from "@/read-engine/types";
import { validateReadPlan } from "@/read-engine/validate";

const catalog: ProductCatalog = JSON.parse(
	readFileSync(
		resolve(__dirname, "../../../src/read-engine/catalogs/tolom.json"),
		"utf-8",
	),
);

const TENANT_ID = "11111111-1111-1111-1111-111111111111";

describe("validateReadPlan", () => {
	it("accepts a valid plan with dimensions and measures", () => {
		const plan: ReadPlan = {
			queries: [
				{
					dataset: "work_orders",
					dimensions: ["status"],
					measures: [{ field: "total", op: "sum", alias: "total" }],
				},
			],
		};
		const result = validateReadPlan(plan, catalog, TENANT_ID);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("rejects unknown dataset", () => {
		const plan: ReadPlan = { queries: [{ dataset: "nonexistent_table" }] };
		const result = validateReadPlan(plan, catalog, TENANT_ID);
		expect(result.valid).toBe(false);
		expect(result.errors[0]?.code).toBe("DATASET_NOT_FOUND");
	});

	it("rejects non-dimension field used as dimension", () => {
		const plan: ReadPlan = {
			queries: [{ dataset: "work_orders", dimensions: ["total"] }],
		};
		const result = validateReadPlan(plan, catalog, TENANT_ID);
		expect(result.valid).toBe(false);
		expect(result.errors[0]?.code).toBe("FIELD_NOT_DIMENSION");
	});

	it("rejects non-measure field used as measure", () => {
		const plan: ReadPlan = {
			queries: [
				{
					dataset: "work_orders",
					measures: [{ field: "status", op: "sum", alias: "x" }],
				},
			],
		};
		const result = validateReadPlan(plan, catalog, TENANT_ID);
		expect(result.valid).toBe(false);
		expect(result.errors[0]?.code).toBe("FIELD_NOT_AGGREGATABLE");
	});

	it("rejects invalid aggregate op for field", () => {
		const plan: ReadPlan = {
			queries: [
				{
					dataset: "work_orders",
					measures: [{ field: "total", op: "mean", alias: "x" }],
				},
			],
		};
		const result = validateReadPlan(plan, catalog, TENANT_ID);
		expect(result.valid).toBe(false);
		expect(result.errors[0]?.code).toBe("INVALID_AGGREGATE_OP");
	});

	it("rejects invalid filter operator", () => {
		const plan: ReadPlan = {
			queries: [
				{
					dataset: "work_orders",
					filters: [
						{ field: "status", op: "bogus_op" as never, value: "paid" },
					],
				},
			],
		};
		const result = validateReadPlan(plan, catalog, TENANT_ID);
		expect(result.valid).toBe(false);
		expect(result.errors[0]?.code).toBe("INVALID_FILTER_OP");
	});

	it("rejects tenant column leaked into filters", () => {
		const plan: ReadPlan = {
			queries: [
				{
					dataset: "work_orders",
					filters: [
						{ field: catalog.tenant.column, op: "eq", value: TENANT_ID },
					],
				},
			],
		};
		const result = validateReadPlan(plan, catalog, TENANT_ID);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.code === "TENANT_COLUMN_LEAKED")).toBe(
			true,
		);
	});

	it("rejects unknown relation in embeds", () => {
		const plan: ReadPlan = {
			queries: [{ dataset: "work_orders", embeds: ["nonexistent_relation"] }],
		};
		const result = validateReadPlan(plan, catalog, TENANT_ID);
		expect(result.valid).toBe(false);
		expect(result.errors[0]?.code).toBe("EMBED_RELATION_NOT_FOUND");
	});

	it("rejects measures + embeds together (mutual exclusive)", () => {
		const plan: ReadPlan = {
			queries: [
				{
					dataset: "work_orders",
					measures: [{ field: "total_amount", op: "sum", alias: "total" }],
					embeds: ["customer"],
				},
			],
		};
		const result = validateReadPlan(plan, catalog, TENANT_ID);
		expect(result.valid).toBe(false);
		expect(result.errors[0]?.code).toBe("MUTUAL_EXCLUSIVE_MODES");
	});

	it("rejects empty plan", () => {
		const plan = { queries: [] } as unknown as ReadPlan;
		const result = validateReadPlan(plan, catalog, TENANT_ID);
		expect(result.valid).toBe(false);
		expect(result.errors[0]?.code).toBe("EMPTY_PLAN");
	});

	it("rejects too many queries", () => {
		const plan: ReadPlan = {
			queries: Array.from({ length: 11 }, () => ({
				dataset: "work_orders",
			})) as ReadPlan["queries"],
		};
		const result = validateReadPlan(plan, catalog, TENANT_ID);
		expect(result.valid).toBe(false);
		expect(result.errors[0]?.code).toBe("TOO_MANY_QUERIES");
	});

	it("accepts valid embed relation", () => {
		const dataset = catalog.datasets.work_orders;
		const firstRelation = dataset?.relations
			? Object.keys(dataset.relations)[0]
			: undefined;
		expect(firstRelation).toBeDefined();
		const plan: ReadPlan = {
			queries: [{ dataset: "work_orders", embeds: [firstRelation as string] }],
		};
		const result = validateReadPlan(plan, catalog, TENANT_ID);
		expect(result.valid).toBe(true);
	});
});
