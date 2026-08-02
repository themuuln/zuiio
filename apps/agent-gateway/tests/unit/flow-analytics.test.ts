import { describe, expect, it, vi } from "vitest";
import { getFlowAbResults } from "@/flow-executor/analytics";

vi.mock("server-only", () => ({}));

function makeSupabase(runs: unknown[]) {
	const chain = {
		select: vi.fn(() => chain),
		eq: vi.fn(() => chain),
		not: vi.fn(() => Promise.resolve({ data: runs, error: null })),
	};
	const from = vi.fn(() => chain);
	return { from } as never;
}

describe("getFlowAbResults", () => {
	it("aggregates assignments per (flow, experiment, variant)", async () => {
		const sb = makeSupabase([
			{ flow_version_id: "fv1", assignments: { ab1: "a", ab2: "x" } },
			{ flow_version_id: "fv1", assignments: { ab1: "a" } },
			{ flow_version_id: "fv1", assignments: { ab1: "b" } },
			{ flow_version_id: "fv2", assignments: { ab1: "a" } },
			{ flow_version_id: "fv3", assignments: null },
		]);

		const results = await getFlowAbResults(sb, "org-1");

		expect(results).toEqual([
			{ flowVersionId: "fv1", experimentId: "ab1", variantId: "a", count: 2 },
			{ flowVersionId: "fv1", experimentId: "ab2", variantId: "x", count: 1 },
			{ flowVersionId: "fv1", experimentId: "ab1", variantId: "b", count: 1 },
			{ flowVersionId: "fv2", experimentId: "ab1", variantId: "a", count: 1 },
		]);
	});

	it("returns [] on error", async () => {
		const chain = {
			select: vi.fn(() => chain),
			eq: vi.fn(() => chain),
			not: vi.fn(() =>
				Promise.resolve({ data: null, error: { message: "x" } }),
			),
		};
		const from = vi.fn(() => chain);
		const results = await getFlowAbResults({ from } as never, "org-1");
		expect(results).toEqual([]);
	});
});
