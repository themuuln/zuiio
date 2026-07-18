import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { runWrite } from "@/write-engine";
import type { WriteCatalog, WriteEngineConfig } from "@/write-engine/types";

const catalog: WriteCatalog = JSON.parse(
	readFileSync(resolve(__dirname, "../../../src/write-engine/catalogs/tolom-write.json"), "utf8"),
);

const TENANT = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const UUID = "11111111-1111-1111-1111-111111111111";

interface WriteMockCall {
	op: "insert" | "update" | "delete";
	source: string;
	payload?: Record<string, unknown>;
	filters: Record<string, unknown>;
}

/**
 * Write-aware mock Supabase. Records insert/update/delete calls and the
 * filters applied (eq chains), so we can assert tenant isolation at the query
 * level. Supports .single() and awaitability (thenable) like PostgREST.
 */
function createWriteMock() {
	const calls: WriteMockCall[] = [];

	function makeBuilder(op: WriteMockCall["op"], source: string, initialPayload?: Record<string, unknown>) {
		const builder: Record<string, unknown> = {};
		const filters: Record<string, unknown> = {};
		let payload = initialPayload;
		builder.eq = vi.fn((field: string, val: unknown) => {
			filters[field] = val;
			return builder;
		});
		builder.select = vi.fn(() => builder);
		builder.single = vi.fn(() => {
			calls.push({ op, source, payload, filters });
			return Promise.resolve({
				data: { id: UUID, organization_id: TENANT, ...(filters as object) },
				error: null,
			});
		});
		// thenable for insert/update/.single-less await
		builder.then = (resolve: (v: unknown) => void) => {
			calls.push({ op, source, payload, filters });
			resolve({ data: { id: UUID }, error: null });
		};
		return builder;
	}

	const client = {
		from: vi.fn((source: string) => {
			const api = {
				insert: (p: Record<string, unknown>) => makeBuilder("insert", source, p),
				update: (p: Record<string, unknown>) => makeBuilder("update", source, p),
				delete: () => makeBuilder("delete", source),
			};
			return api;
		}),
		__calls: calls,
	};
	return { client, calls };
}

function makeConfig(client: unknown): WriteEngineConfig {
	return { tenantId: TENANT, catalog, supabase: client as WriteEngineConfig["supabase"] };
}

describe("runWrite (execute)", () => {
	it("inserts with organization_id injected and tenant filter absent on insert (DB-level)", async () => {
		const { client, calls } = createWriteMock();
		const result = await runWrite(makeConfig(client), {
			dataset: "vehicles",
			operation: "insert",
			data: { customer_id: UUID, plate_number: "УБА1", make: "Toyota" },
		});
		expect(result.success).toBe(true);
		expect(calls).toHaveLength(1);
		expect(calls[0]?.op).toBe("insert");
		expect(calls[0]?.payload?.organization_id).toBe(TENANT);
		expect(calls[0]?.payload?.id).toBeUndefined();
		expect(result.id).toBe(UUID);
	});

	it("update applies tenant filter at query level (defense in depth)", async () => {
		const { client, calls } = createWriteMock();
		const result = await runWrite(makeConfig(client), {
			dataset: "vehicles",
			operation: "update",
			id: "wo-9",
			data: { make: "Honda" },
		});
		expect(result.success).toBe(true);
		expect(calls[0]?.op).toBe("update");
		expect(calls[0]?.filters.organization_id).toBe(TENANT);
		expect(calls[0]?.filters.id).toBe("wo-9");
	});

	it("soft delete becomes update with deleted_at set + tenant filter", async () => {
		const { client, calls } = createWriteMock();
		const result = await runWrite(makeConfig(client), {
			dataset: "vehicles",
			operation: "delete",
			id: "wo-9",
			softDelete: true,
		});
		expect(result.success).toBe(true);
		expect(calls[0]?.op).toBe("update");
		expect(calls[0]?.payload?.deleted_at).toBeDefined();
		expect(calls[0]?.filters.organization_id).toBe(TENANT);
	});

	it("hard delete applies tenant filter", async () => {
		const { client, calls } = createWriteMock();
		const result = await runWrite(makeConfig(client), {
			dataset: "vehicles",
			operation: "delete",
			id: "wo-9",
			softDelete: false,
		});
		expect(result.success).toBe(true);
		expect(calls[0]?.op).toBe("delete");
		expect(calls[0]?.filters.organization_id).toBe(TENANT);
		expect(calls[0]?.filters.id).toBe("wo-9");
	});

	it("returns Mongolian error when validation fails (tenant leak)", async () => {
		const { client, calls } = createWriteMock();
		const result = await runWrite(makeConfig(client), {
			dataset: "vehicles",
			operation: "insert",
			data: {
				customer_id: UUID,
				plate_number: "УБА1",
				organization_id: "evil",
			},
		});
		expect(result.success).toBe(false);
		expect(calls).toHaveLength(0); // never reached Supabase
		expect(result.message).toContain("алдаатай");
	});

	it("strips unknown field and succeeds with warning", async () => {
		const { client, calls } = createWriteMock();
		const result = await runWrite(makeConfig(client), {
			dataset: "vehicles",
			operation: "insert",
			data: { customer_id: UUID, plate_number: "УБА1", ghost: "x" },
		});
		expect(result.success).toBe(true);
		expect(result.warnings?.some((w) => w.includes("ghost"))).toBe(true);
		expect(calls[0]?.payload?.ghost).toBeUndefined();
	});
});
