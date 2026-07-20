import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { compileMutation } from "@/write-engine/compile";
import type { WriteCatalog } from "@/write-engine/types";

const catalog: WriteCatalog = JSON.parse(
	readFileSync(
		resolve(__dirname, "../../../src/write-engine/catalogs/tolom-write.json"),
		"utf8",
	),
);

const UUID = "11111111-1111-1111-1111-111111111111";
const TENANT = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

describe("compileMutation", () => {
	it("injects organization_id and strips non-writable fields on insert", () => {
		const compiled = compileMutation(
			{
				dataset: "vehicles",
				operation: "insert",
				data: {
					customer_id: UUID,
					plate_number: "УБА1234",
					make: "Toyota",
					id: "should-be-stripped",
					organization_id: "should-be-stripped",
				},
			},
			catalog,
			TENANT,
		);
		expect(compiled.payload.organization_id).toBe(TENANT);
		expect(compiled.payload.id).toBeUndefined();
		expect(compiled.payload.customer_id).toBe(UUID);
		expect(compiled.payload.plate_number).toBe("УБА1234");
		expect(compiled.payload.make).toBe("Toyota");
		expect(compiled.source).toBe("vehicles");
	});

	it("converts soft delete to update + sets deleted_at", () => {
		const compiled = compileMutation(
			{ dataset: "vehicles", operation: "delete", id: "xyz", softDelete: true },
			catalog,
			TENANT,
		);
		expect(compiled.operation).toBe("update");
		expect(compiled.softDelete).toBe(true);
		expect(compiled.payload.deleted_at).toBeDefined();
		expect(typeof compiled.payload.deleted_at).toBe("string");
		expect(compiled.payload.organization_id).toBe(TENANT);
	});

	it("hard delete keeps delete operation and no deleted_at", () => {
		const compiled = compileMutation(
			{
				dataset: "vehicles",
				operation: "delete",
				id: "xyz",
				softDelete: false,
			},
			catalog,
			TENANT,
		);
		expect(compiled.operation).toBe("delete");
		expect(compiled.softDelete).toBe(false);
		expect(compiled.payload.deleted_at).toBeUndefined();
	});

	it("preserves update target id", () => {
		const compiled = compileMutation(
			{
				dataset: "vehicles",
				operation: "update",
				id: "wo-9",
				data: { make: "Honda" },
			},
			catalog,
			TENANT,
		);
		expect(compiled.id).toBe("wo-9");
		expect(compiled.operation).toBe("update");
		expect(compiled.payload.make).toBe("Honda");
		expect(compiled.payload.organization_id).toBe(TENANT);
	});

	it("defaults softDelete to true on delete", () => {
		const compiled = compileMutation(
			{ dataset: "vehicles", operation: "delete", id: "xyz" },
			catalog,
			TENANT,
		);
		expect(compiled.softDelete).toBe(true);
	});
});
