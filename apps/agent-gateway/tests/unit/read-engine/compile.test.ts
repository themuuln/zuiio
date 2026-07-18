import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ProductCatalog, ReadPlanQuery } from "@/read-engine/types";
import { compileQuery } from "@/read-engine/compile";

const catalog: ProductCatalog = JSON.parse(
	readFileSync(
		resolve(__dirname, "../../../src/read-engine/catalogs/tolom.json"),
		"utf-8",
	),
);

const TENANT_ID = "11111111-1111-1111-1111-111111111111";

describe("compileQuery", () => {
	it("compiles simple select (*)", () => {
		const q: ReadPlanQuery = { dataset: "work_orders" };
		const compiled = compileQuery(q, catalog, TENANT_ID);
		expect(compiled.params.select).toBe("*");
		expect(compiled.params["organization_id"]).toBe(`eq.${TENANT_ID}`);
		expect(compiled.path).toBe("/rest/v1/work_orders");
	});

	it("compiles aggregates with alias", () => {
		const q: ReadPlanQuery = {
			dataset: "work_orders",
			measures: [{ field: "total_amount", op: "sum", alias: "total" }],
		};
		const compiled = compileQuery(q, catalog, TENANT_ID);
		expect(compiled.params.select).toBe("total_amount.sum().total");
	});

	it("compiles dimensions + measures", () => {
		const q: ReadPlanQuery = {
			dataset: "work_orders",
			dimensions: ["status"],
			measures: [{ field: "total_amount", op: "sum", alias: "total" }],
		};
		const compiled = compileQuery(q, catalog, TENANT_ID);
		expect(compiled.params.select).toBe("status, total_amount.sum().total");
	});

	it("compiles filters", () => {
		const q: ReadPlanQuery = {
			dataset: "work_orders",
			filters: [{ field: "status", op: "eq", value: "paid" }],
		};
		const compiled = compileQuery(q, catalog, TENANT_ID);
		expect(compiled.params["status"]).toBe("eq.paid");
	});

	it("compiles in filter with values array", () => {
		const q: ReadPlanQuery = {
			dataset: "work_orders",
			filters: [{ field: "status", op: "in", values: ["paid", "done"] }],
		};
		const compiled = compileQuery(q, catalog, TENANT_ID);
		expect(compiled.params["status"]).toBe("in.(paid,done)");
	});

	it("compiles nested embeds", () => {
		const q: ReadPlanQuery = { dataset: "work_orders", embeds: ["customer"] };
		const compiled = compileQuery(q, catalog, TENANT_ID);
		expect(compiled.params.select).toContain("customer:customers(*)");
	});

	it("always injects tenant filter", () => {
		const q: ReadPlanQuery = { dataset: "work_orders" };
		const compiled = compileQuery(q, catalog, TENANT_ID);
		expect(compiled.params["organization_id"]).toBe(`eq.${TENANT_ID}`);
		expect(compiled.tenantId).toBe(TENANT_ID);
	});

	it("compiles sort desc", () => {
		const q: ReadPlanQuery = {
			dataset: "work_orders",
			sort: [{ field: "created_at", order: "desc" }],
		};
		const compiled = compileQuery(q, catalog, TENANT_ID);
		expect(compiled.params.order).toBe("created_at.desc");
	});

	it("compiles limit and offset as strings", () => {
		const q: ReadPlanQuery = { dataset: "work_orders", limit: 10, offset: 20 };
		const compiled = compileQuery(q, catalog, TENANT_ID);
		expect(compiled.params.limit).toBe("10");
		expect(compiled.params.offset).toBe("20");
	});

	it("compiles includeCount to request.prefer", () => {
		const q: ReadPlanQuery = { dataset: "work_orders", includeCount: true };
		const compiled = compileQuery(q, catalog, TENANT_ID);
		expect(compiled.params["request.prefer"]).toBe("count=exact");
	});
});
