import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the read engine and catalogs
vi.mock("@/read-engine", () => ({
	createReadEngine: vi.fn(),
}));

// Mock JSON catalog imports — provide minimal valid catalogs
vi.mock("@/read-engine/catalogs/tolom.json", () => ({
	default: {
		id: "tolom",
		name: "Толом",
		description: "Auto repair shop management",
		tenant: { column: "organization_id", source: "jwt" },
		datasets: {
			customers: {
				source: "customers",
				displayName: "Харилцагчид",
				fields: {
					id: { type: "uuid", pk: true, dimension: true },
					name: { type: "string", dimension: true, displayName: "Нэр" },
				},
			},
		},
	},
}));

vi.mock("@/read-engine/catalogs/zer.json", () => ({
	default: {
		id: "zer",
		name: "Zer",
		description: "Retail ERP",
		tenant: { column: "organization_id", source: "jwt" },
		datasets: {
			products: {
				source: "products",
				displayName: "Бараа",
				fields: {
					id: { type: "uuid", pk: true, dimension: true },
					name: { type: "string", dimension: true, displayName: "Нэр" },
				},
			},
		},
	},
}));

describe("createReadDataTool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns null when product has no read catalog", async () => {
		const { createReadDataTool } = await import("@/gateway/read-data-tool");

		const result = createReadDataTool("unknown-product", {
			orgId: "org-1",
			userId: "user-1",
			supabase: {} as never,
		});

		expect(result).toBeNull();
	});

	it("returns a GatewayTool with correct name and description for known product", async () => {
		const { createReadDataTool } = await import("@/gateway/read-data-tool");

		const tool = createReadDataTool("tolom", {
			orgId: "org-1",
			userId: "user-1",
			supabase: {} as never,
		});

		expect(tool).not.toBeNull();
		expect(tool?.name).toBe("readData");
		expect(tool?.description).toContain("Read Engine");
		expect(tool?.description).toContain("Харилцагчид"); // from catalog displayName
	});

	it("includes parameters with plan object", async () => {
		const { createReadDataTool } = await import("@/gateway/read-data-tool");

		const tool = createReadDataTool("zer", {
			orgId: "org-1",
			userId: "user-1",
			supabase: {} as never,
		});

		expect(tool?.parameters).toHaveLength(1);
		expect(tool?.parameters[0].name).toBe("plan");
		expect(tool?.parameters[0].type).toBe("object");
		expect(tool?.parameters[0].required).toBe(true);
	});

	it("execute calls engine and returns result on success", async () => {
		const { createReadEngine } = await import("@/read-engine");
		const mockExecute = vi.fn().mockResolvedValue({
			rows: [{ id: "1", name: "Test" }],
			rowCount: 1,
		});
		vi.mocked(createReadEngine).mockReturnValue({
			execute: mockExecute,
		} as never);

		const { createReadDataTool } = await import("@/gateway/read-data-tool");

		const tool = createReadDataTool("tolom", {
			orgId: "org-1",
			userId: "user-1",
			supabase: {} as never,
		});

		const result = await tool?.execute({
			plan: { queries: [{ dataset: "customers" }] },
		});

		expect(result).toEqual({
			rows: [{ id: "1", name: "Test" }],
			rowCount: 1,
		});
		expect(createReadEngine).toHaveBeenCalledWith(
			expect.objectContaining({ tenantId: "org-1" }),
		);
		expect(mockExecute).toHaveBeenCalled();
	});

	it("execute returns error for invalid plan (not an object)", async () => {
		const { createReadDataTool } = await import("@/gateway/read-data-tool");

		const tool = createReadDataTool("tolom", {
			orgId: "org-1",
			userId: "user-1",
			supabase: {} as never,
		});

		const result = await tool?.execute({ plan: null });
		expect(result).toEqual({ error: "readData: plan объект шаардлагатай" });
	});

	it("execute returns Mongolian error on engine failure", async () => {
		const { createReadEngine } = await import("@/read-engine");
		vi.mocked(createReadEngine).mockImplementation(() => {
			throw new Error("Engine error");
		});

		const { createReadDataTool } = await import("@/gateway/read-data-tool");

		const tool = createReadDataTool("tolom", {
			orgId: "org-1",
			userId: "user-1",
			supabase: {} as never,
		});

		const result = await tool?.execute({
			plan: { queries: [{ dataset: "customers" }] },
		});
		expect(result).toEqual({ error: "Өгөгдөл уншихад алдаа гарлаа" });
	});
});
