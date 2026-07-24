import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the write engine
vi.mock("@/write-engine", () => ({
	runWrite: vi.fn(),
}));

// Mock JSON catalog imports
vi.mock("@/write-engine/catalogs/tolom-write.json", () => ({
	default: {
		id: "tolom",
		name: "Толом",
		tenant: { column: "organization_id", source: "jwt" },
		datasets: {
			customers: {
				source: "customers",
				displayName: "Харилцагчид",
				pk: "id",
				insertable: true,
				updatable: true,
				deletable: true,
				fields: {
					id: { type: "uuid" },
					name: { type: "string", required: true },
					organization_id: { type: "string", writable: false },
				},
			},
		},
	},
}));

vi.mock("@/write-engine/catalogs/zer-write.json", () => ({
	default: {
		id: "zer",
		name: "Zer",
		tenant: { column: "organization_id", source: "jwt" },
		datasets: {
			products: {
				source: "products",
				displayName: "Бараа",
				pk: "id",
				insertable: true,
				updatable: true,
				deletable: true,
				fields: {
					id: { type: "uuid" },
					name: { type: "string", required: true },
				},
			},
		},
	},
}));

describe("createWriteDataTool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns null when product has no write catalog", async () => {
		const { createWriteDataTool } = await import("@/gateway/write-data-tool");

		const result = createWriteDataTool("unknown-product", {
			orgId: "org-1",
			userId: "user-1",
			supabase: {} as never,
		});

		expect(result).toBeNull();
	});

	it("returns a GatewayTool with correct name and description", async () => {
		const { createWriteDataTool } = await import("@/gateway/write-data-tool");

		const tool = createWriteDataTool("tolom", {
			orgId: "org-1",
			userId: "user-1",
			supabase: {} as never,
		});

		expect(tool).not.toBeNull();
		expect(tool?.name).toBe("writeData");
		expect(tool?.description).toContain("бичих");
		expect(tool?.description).toContain("Харилцагчид");
	});

	it("includes parameters with dataset, operation, id, data, softDelete", async () => {
		const { createWriteDataTool } = await import("@/gateway/write-data-tool");

		const tool = createWriteDataTool("zer", {
			orgId: "org-1",
			userId: "user-1",
			supabase: {} as never,
		});

		const paramNames = tool?.parameters.map((p) => p.name);
		expect(paramNames).toContain("dataset");
		expect(paramNames).toContain("operation");
		expect(paramNames).toContain("id");
		expect(paramNames).toContain("data");
		expect(paramNames).toContain("softDelete");
	});

	it("execute calls runWrite with correct params on success", async () => {
		const { runWrite } = await import("@/write-engine");
		vi.mocked(runWrite).mockResolvedValue({
			success: true,
			message: "Амжилттай бүртгэгдлээ.",
			id: "new-id",
		});

		const { createWriteDataTool } = await import("@/gateway/write-data-tool");

		const tool = createWriteDataTool("tolom", {
			orgId: "org-1",
			userId: "user-1",
			supabase: {} as never,
		});

		const result = await tool?.execute({
			dataset: "customers",
			operation: "insert",
			data: { name: "New Customer" },
		});

		expect(result).toEqual({
			success: true,
			message: "Амжилттай бүртгэгдлээ.",
			id: "new-id",
		});
		expect(runWrite).toHaveBeenCalledWith(
			expect.objectContaining({ tenantId: "org-1" }),
			expect.objectContaining({
				dataset: "customers",
				operation: "insert",
			}),
		);
	});

	it("execute defaults operation to insert when invalid", async () => {
		const { runWrite } = await import("@/write-engine");
		vi.mocked(runWrite).mockResolvedValue({
			success: true,
			message: "Амжилттай.",
		});

		const { createWriteDataTool } = await import("@/gateway/write-data-tool");

		const tool = createWriteDataTool("tolom", {
			orgId: "org-1",
			userId: "user-1",
			supabase: {} as never,
		});

		await tool?.execute({
			dataset: "customers",
			operation: "invalid_op",
			data: { name: "X" },
		});

		expect(runWrite).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ operation: "insert" }),
		);
	});

	it("execute passes softDelete when provided as boolean", async () => {
		const { runWrite } = await import("@/write-engine");
		vi.mocked(runWrite).mockResolvedValue({
			success: true,
			message: "Амжилттай.",
		});

		const { createWriteDataTool } = await import("@/gateway/write-data-tool");

		const tool = createWriteDataTool("tolom", {
			orgId: "org-1",
			userId: "user-1",
			supabase: {} as never,
		});

		await tool?.execute({
			dataset: "customers",
			operation: "delete",
			id: "cust-1",
			softDelete: false,
		});

		expect(runWrite).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ softDelete: false }),
		);
	});

	it("execute returns Mongolian error on failure", async () => {
		const { runWrite } = await import("@/write-engine");
		vi.mocked(runWrite).mockRejectedValue(new Error("Runtime error"));

		const { createWriteDataTool } = await import("@/gateway/write-data-tool");

		const tool = createWriteDataTool("tolom", {
			orgId: "org-1",
			userId: "user-1",
			supabase: {} as never,
		});

		const result = await tool?.execute({
			dataset: "customers",
			operation: "insert",
			data: { name: "X" },
		});

		expect(result).toEqual({ error: "Өгөгдөл бичихэд алдаа гарлаа" });
	});
});
