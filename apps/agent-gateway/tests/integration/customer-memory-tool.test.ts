import { describe, expect, it, vi } from "vitest";
import { createMockSupabase } from "../fixtures/supabase-mock";
import { createCustomerMemoryTools } from "@/gateway/customer-memory-tool";

const ORG_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const CUSTOMER_ID = "cust-0001";
function mockClientForMemory() {
	const capturedInserts: unknown[] = [];

	// Build a thenable chain resolving to `response`.
	const chain = (response: { data: unknown; error: unknown }) => {
		const c: Record<string, unknown> = {
			select: () => c,
			insert: (row: unknown) => {
				capturedInserts.push(row);
				return chain({ data: null, error: null });
			},
			update: () => c,
			upsert: () => c,
			delete: () => c,
			eq: () => c,
			neq: () => c,
			in: () => c,
			not: () => c,
			or: () => c,
			order: () => c,
			limit: () => c,
			range: () => c,
			ilike: () => c,
			gte: () => c,
			lte: () => c,
			is: () => c,
			contains: () => c,
			single: () => Promise.resolve(response),
			maybeSingle: () => Promise.resolve(response),
			then: (resolve: (v: unknown) => unknown) => resolve(response),
		};
		return c;
	};

	const fromMock = vi.fn((table: string) => {
		if (table === "customers") {
			// Recall lookup (phone->id) and name lookup both query `customers`.
			return chain({
				data: [{ id: CUSTOMER_ID, full_name: "Бат" }],
				error: null,
			});
		}
		if (table === "agent_customer_memory") {
			// Recall reads two active facts; remember inserts (captured above).
			return chain({
				data: [
					{
						id: "f1",
						fact: "SMS-ээр холбогдохыг илүүд үздэг",
						fact_type: "contact",
						confidence: 0.9,
						created_at: "2026-01-01T00:00:00Z",
					},
					{
						id: "f2",
						fact: "Засварын төлбөрийг бэлнээр тооцооздог",
						fact_type: "preference",
						confidence: 0.7,
						created_at: "2026-01-02T00:00:00Z",
					},
				],
				error: null,
			});
		}
		return chain({ data: [], error: null });
	});

	const client = createMockSupabase();
	return { client: { ...client, from: fromMock }, capturedInserts };
}

describe("createCustomerMemoryTools — recallCustomerMemory", () => {
	it("returns formatted memory for a known customer id", async () => {
		const { client } = mockClientForMemory();
		const [recall] = createCustomerMemoryTools({ orgId: ORG_ID, supabase: client as never });
		const result = (await recall.execute({ customerId: CUSTOMER_ID })) as {
			found: boolean;
			memory: string;
		};
		expect(result.found).toBe(true);
		expect(result.memory).toContain("Бат");
		expect(result.memory).toContain("SMS-ээр холбогдохыг илүүд үздэг");
		expect(result.memory).toContain("Засварын төлбөрийг бэлнээр тооцооздог");
	});

	it("resolves customer id from phone before recalling", async () => {
		const { client } = mockClientForMemory();
		const [recall] = createCustomerMemoryTools({ orgId: ORG_ID, supabase: client as never });
		// No customerId, only phone -> should resolve via customers lookup then recall.
		const result = (await recall.execute({ phone: "99112233" })) as {
			found: boolean;
			memory: string;
		};
		expect(result.found).toBe(true);
		expect(result.memory).toContain("Бат");
	});

	it("returns not found when neither id nor phone resolves", async () => {
		const { client } = mockClientForMemory();
		const [recall] = createCustomerMemoryTools({ orgId: ORG_ID, supabase: client as never });
		const result = (await recall.execute({})) as { found: boolean; message: string };
		expect(result.found).toBe(false);
		expect(result.message).toContain("олдсонгүй");
	});
});

describe("createCustomerMemoryTools — rememberCustomerFact", () => {
	it("inserts a fact for a known customer id and returns success", async () => {
		const { client, capturedInserts } = mockClientForMemory();
		const [, remember] = createCustomerMemoryTools({
			orgId: ORG_ID,
			supabase: client as never,
		});
		const result = (await remember.execute({
			customerId: CUSTOMER_ID,
			fact: "Гараар түгжигддэг",
			factType: "preference",
		})) as { success: boolean; message: string };
		expect(result.success).toBe(true);
		expect(capturedInserts.length).toBe(1);
		const row = capturedInserts[0] as Record<string, unknown>;
		expect(row.organization_id).toBe(ORG_ID);
		expect(row.customer_id).toBe(CUSTOMER_ID);
		expect(row.customer_name).toBe("Бат");
		expect(row.fact).toBe("Гараар түгжигддэг");
		expect(row.fact_type).toBe("preference");
	});

	it("resolves customer id from phone before remembering", async () => {
		const { client, capturedInserts } = mockClientForMemory();
		const [, remember] = createCustomerMemoryTools({
			orgId: ORG_ID,
			supabase: client as never,
		});
		await remember.execute({ phone: "99112233", fact: "Хоолны захиалга хийдэг" });
		expect(capturedInserts.length).toBe(1);
		const row = capturedInserts[0] as Record<string, unknown>;
		expect(row.customer_id).toBe(CUSTOMER_ID);
	});

	it("rejects an empty fact", async () => {
		const { client } = mockClientForMemory();
		const [, remember] = createCustomerMemoryTools({
			orgId: ORG_ID,
			supabase: client as never,
		});
		const result = (await remember.execute({ customerId: CUSTOMER_ID, fact: "   " })) as {
			error: string;
		};
		expect(result.error).toBeTruthy();
	});

	it("errors when the customer cannot be resolved", async () => {
		const client = createMockSupabase({ data: [], error: null });
		const fromMock = vi.fn((table: string) => {
			if (table === "customers") {
				return createMockSupabase({ data: [], error: null });
			}
			if (table === "agent_customer_memory") {
				return createMockSupabase({ data: [], error: null });
			}
			return createMockSupabase();
		});
		const [, remember] = createCustomerMemoryTools({
			orgId: ORG_ID,
			supabase: { ...client, from: fromMock } as never,
		});
		const result = (await remember.execute({
			customerId: "missing",
			fact: "юу ч биш",
		})) as { error: string };
		expect(result.error).toBeTruthy();
	});
});
