import { describe, it, expect } from "vitest";
import type { QueryResult, Derivation } from "@/read-engine/types";
import { applyDerivation } from "@/read-engine/reduce";

const results: QueryResult[] = [
	{
		queryRef: "a",
		columns: [{ name: "value", displayName: "value", type: "number" }],
		rows: [{ value: 100 }],
		rowCount: 1,
		executionTimeMs: 1,
	},
	{
		queryRef: "b",
		columns: [{ name: "value", displayName: "value", type: "number" }],
		rows: [{ value: 50 }],
		rowCount: 1,
		executionTimeMs: 1,
	},
];

describe("applyDerivation", () => {
	it("sums across queries", () => {
		const d: Derivation = { type: "sum", targetField: "value", description: "Нийт" };
		const result = applyDerivation(results, d);
		expect(result?.type).toBe("sum");
		expect(result?.rows[0]?.value).toBe(150);
	});

	it("compares two queries as percentage", () => {
		const d: Derivation = { type: "compare", targetField: "value" };
		const result = applyDerivation(results, d);
		expect(result?.type).toBe("compare");
		// (100 - 50) / 50 * 100 = 100
		expect(result?.rows[0]?.changePct).toBe(100);
	});

	it("concatenates results", () => {
		const d: Derivation = { type: "concat" };
		const result = applyDerivation(results, d);
		expect(result?.type).toBe("concat");
		expect(result?.rows).toHaveLength(2);
	});

	it("merges results by index", () => {
		const d: Derivation = { type: "merge" };
		const result = applyDerivation(results, d);
		expect(result?.type).toBe("merge");
		expect(result?.rows).toHaveLength(1);
	});

	it("returns undefined for no derivation", () => {
		const result = applyDerivation(results, undefined);
		expect(result).toBeUndefined();
	});

	it("returns undefined for none type", () => {
		const d: Derivation = { type: "none" };
		const result = applyDerivation(results, d);
		expect(result).toBeUndefined();
	});

	it("returns undefined for empty results", () => {
		const d: Derivation = { type: "sum", targetField: "value" };
		const result = applyDerivation([], d);
		expect(result).toBeUndefined();
	});

	it("handles missing numeric field gracefully", () => {
		const empty: QueryResult[] = [
			{ queryRef: "x", columns: [], rows: [{}], rowCount: 0, executionTimeMs: 0 },
		];
		const d: Derivation = { type: "sum", targetField: "value" };
		const result = applyDerivation(empty, d);
		expect(result?.rows[0]?.value).toBe(0);
	});
});
