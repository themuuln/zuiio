/**
 * Flow management API tests: /api/flow/list + /api/flow/activate.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockOrder = vi.fn();
const mockMaybeSingle = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/supabase", () => ({
	createServiceClient: vi.fn(() => {
		const chain: Record<string, unknown> = {};
		chain.select = vi.fn(() => chain);
		chain.eq = vi.fn(() => chain);
		chain.order = vi.fn(() => chain);
		chain.limit = vi.fn(() => mockOrder());
		chain.maybeSingle = vi.fn(() => mockMaybeSingle());
		chain.update = vi.fn(() => mockUpdate());
		return { from: vi.fn(() => chain) } as never;
	}),
}));

beforeEach(() => {
	vi.clearAllMocks();
	mockOrder.mockResolvedValue({ data: [], error: null });
	mockMaybeSingle.mockResolvedValue({
		data: { id: "fv-1", organization_id: "org-1", product_type: "zer" },
		error: null,
	});
	mockUpdate.mockReturnValue({
		eq: vi.fn(() => ({
			eq: vi.fn(() => ({
				eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
			})),
		})),
	});
});

describe("GET /api/flow/list", () => {
	it("lists flow versions with metadata names", async () => {
		mockOrder.mockResolvedValue({
			data: [
				{
					id: "fv-1",
					product_type: "zer",
					is_active: true,
					version: 3,
					metadata: { name: "Шинэ хэрэглэгч" },
					created_at: "2026-08-01T00:00:00Z",
				},
			],
			error: null,
		});
		const { GET } = await import("@/app/api/flow/list/route");
		const res = await GET(
			new Request("http://localhost/api/flow/list?orgId=org-1"),
		);
		const json = (await res.json()) as { flows: Array<{ name: string }> };
		expect(json.flows).toHaveLength(1);
		expect(json.flows[0]?.name).toBe("Шинэ хэрэглэгч");
	});

	it("requires orgId", async () => {
		const { GET } = await import("@/app/api/flow/list/route");
		const res = await GET(new Request("http://localhost/api/flow/list"));
		expect(res.status).toBe(400);
	});
});

describe("POST /api/flow/activate", () => {
	it("activates a version and deactivates siblings in the same product", async () => {
		delete process.env.CRON_SECRET;
		const { POST } = await import("@/app/api/flow/activate/route");
		const res = await POST(
			new Request("http://localhost/api/flow/activate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orgId: "org-1", flowVersionId: "fv-1" }),
			}),
		);
		const json = (await res.json()) as {
			success: boolean;
			productType: string;
		};
		expect(json.success).toBe(true);
		expect(json.productType).toBe("zer");
	});

	it("404s when the target version is not in the org", async () => {
		delete process.env.CRON_SECRET;
		mockMaybeSingle.mockResolvedValue({ data: null, error: null });
		const { POST } = await import("@/app/api/flow/activate/route");
		const res = await POST(
			new Request("http://localhost/api/flow/activate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orgId: "org-1", flowVersionId: "other" }),
			}),
		);
		expect(res.status).toBe(404);
	});

	it("requires both fields", async () => {
		delete process.env.CRON_SECRET;
		const { POST } = await import("@/app/api/flow/activate/route");
		const res = await POST(
			new Request("http://localhost/api/flow/activate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orgId: "org-1" }),
			}),
		);
		expect(res.status).toBe(400);
	});
});
