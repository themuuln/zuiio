import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { WriteCatalog } from "@/write-engine/types";
import { validateWritePlan } from "@/write-engine/validate";

const catalog: WriteCatalog = JSON.parse(
	readFileSync(
		resolve(__dirname, "../../../src/write-engine/catalogs/tolom-write.json"),
		"utf8",
	),
);

describe("validateWritePlan", () => {
	it("accepts a valid vehicle insert", () => {
		const plan = {
			dataset: "vehicles",
			operation: "insert" as const,
			data: {
				customer_id: "11111111-1111-1111-1111-111111111111",
				plate_number: "УБА1234",
				make: "Toyota",
			},
		};
		const res = validateWritePlan(plan, catalog);
		expect(res.valid).toBe(true);
		expect(res.errors).toHaveLength(0);
	});

	it("rejects unknown dataset", () => {
		const res = validateWritePlan(
			{ dataset: "does_not_exist", operation: "insert", data: {} },
			catalog,
		);
		expect(res.valid).toBe(false);
		expect(res.errors[0]?.code).toBe("DATASET_NOT_FOUND");
	});

	it("rejects insert missing required field", () => {
		// vehicles requires customer_id + plate_number
		const res = validateWritePlan(
			{ dataset: "vehicles", operation: "insert", data: { make: "Toyota" } },
			catalog,
		);
		expect(res.valid).toBe(false);
		expect(res.errors.some((e) => e.code === "FIELD_REQUIRED")).toBe(true);
	});

	it("rejects update without id", () => {
		const res = validateWritePlan(
			{ dataset: "vehicles", operation: "update", data: { make: "Honda" } },
			catalog,
		);
		expect(res.valid).toBe(false);
		expect(res.errors.some((e) => e.code === "MISSING_ID")).toBe(true);
	});

	it("rejects invalid enum value for status", () => {
		const res = validateWritePlan(
			{
				dataset: "work_orders",
				operation: "insert",
				data: {
					customer_id: "11111111-1111-1111-1111-111111111111",
					status: "flying",
				},
			},
			catalog,
		);
		expect(res.valid).toBe(false);
		expect(res.errors.some((e) => e.code === "INVALID_ENUM_VALUE")).toBe(true);
	});

	it("rejects tenant column leak", () => {
		const res = validateWritePlan(
			{
				dataset: "vehicles",
				operation: "insert",
				data: {
					customer_id: "11111111-1111-1111-1111-111111111111",
					plate_number: "УБА1",
					organization_id: "99999999-9999-9999-9999-999999999999",
				},
			},
			catalog,
		);
		expect(res.valid).toBe(false);
		expect(res.errors.some((e) => e.code === "TENANT_COLUMN_LEAKED")).toBe(
			true,
		);
	});

	it("rejects non-writable field (id)", () => {
		const res = validateWritePlan(
			{
				dataset: "vehicles",
				operation: "insert",
				data: {
					customer_id: "11111111-1111-1111-1111-111111111111",
					plate_number: "УБА1",
					id: "22222222-2222-2222-2222-222222222222",
				},
			},
			catalog,
		);
		expect(res.valid).toBe(false);
		expect(res.errors.some((e) => e.code === "FIELD_NOT_WRITABLE")).toBe(true);
	});

	it("warns and strips unknown field on valid insert", () => {
		const res = validateWritePlan(
			{
				dataset: "vehicles",
				operation: "insert",
				data: {
					customer_id: "11111111-1111-1111-1111-111111111111",
					plate_number: "УБА1",
					bogus_field: "x",
				},
			},
			catalog,
		);
		expect(res.valid).toBe(true);
		expect(res.warnings.some((w) => w.includes("bogus_field"))).toBe(true);
	});

	it("rejects wrong type (year as string)", () => {
		const res = validateWritePlan(
			{
				dataset: "vehicles",
				operation: "insert",
				data: {
					customer_id: "11111111-1111-1111-1111-111111111111",
					plate_number: "УБА1",
					year: "not-a-number",
				},
			},
			catalog,
		);
		expect(res.valid).toBe(false);
		expect(res.errors.some((e) => e.code === "INVALID_TYPE")).toBe(true);
	});

	it("accepts valid delete with id", () => {
		const res = validateWritePlan(
			{ dataset: "vehicles", operation: "delete", id: "abc" },
			catalog,
		);
		expect(res.valid).toBe(true);
	});

	it("rejects missing data on insert", () => {
		const res = validateWritePlan(
			{ dataset: "vehicles", operation: "insert" },
			catalog,
		);
		expect(res.valid).toBe(false);
		expect(res.errors.some((e) => e.code === "MISSING_DATA")).toBe(true);
	});

	it("rejects operation not allowed when dataset not insertable", () => {
		// all our datasets are insertable; craft a temp catalog with insertable:false
		const locked: WriteCatalog = JSON.parse(JSON.stringify(catalog));
		locked.datasets.vehicles.insertable = false;
		const res = validateWritePlan(
			{
				dataset: "vehicles",
				operation: "insert",
				data: {
					customer_id: "11111111-1111-1111-1111-111111111111",
					plate_number: "УБА1",
				},
			},
			locked,
		);
		expect(res.valid).toBe(false);
		expect(res.errors.some((e) => e.code === "OPERATION_NOT_ALLOWED")).toBe(
			true,
		);
	});
});
