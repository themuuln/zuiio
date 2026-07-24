import { describe, expect, it } from "vitest";
import { createMockSupabase, TEST_ORG_ID } from "../fixtures/supabase-mock";

describe("formatKnowledgeContext", () => {
	it("returns empty string for empty chunks", async () => {
		const { formatKnowledgeContext } = await import("@/state/knowledge");
		expect(formatKnowledgeContext([])).toBe("");
	});

	it("formats single chunk with title", async () => {
		const { formatKnowledgeContext } = await import("@/state/knowledge");
		const result = formatKnowledgeContext([
			{
				id: "1",
				sourceType: "faq",
				title: "Ажлын цаг",
				content: "Даваа-Баасан: 09:00-18:00",
				similarity: 0.95,
			},
		]);
		expect(result).toContain("Мэдлэг 1");
		expect(result).toContain("Ажлын цаг");
		expect(result).toContain("09:00-18:00");
		expect(result).toContain("Мэдлэгийн сан");
	});

	it("formats multiple chunks ordered", async () => {
		const { formatKnowledgeContext } = await import("@/state/knowledge");
		const result = formatKnowledgeContext([
			{
				id: "1",
				sourceType: "faq",
				title: "First",
				content: "Content A",
				similarity: 0.9,
			},
			{
				id: "2",
				sourceType: "document",
				title: null,
				content: "Content B",
				similarity: 0.8,
			},
		]);
		expect(result).toContain("Мэдлэг 1");
		expect(result).toContain("Мэдлэг 2");
		expect(result).toContain("Content A");
		expect(result).toContain("Content B");
	});

	it("omits title label when title is null", async () => {
		const { formatKnowledgeContext } = await import("@/state/knowledge");
		const result = formatKnowledgeContext([
			{
				id: "1",
				sourceType: "document",
				title: null,
				content: "Plain content",
				similarity: 0.7,
			},
		]);
		expect(result).not.toContain("(");
	});

	it("includes instruction to use knowledge in response", async () => {
		const { formatKnowledgeContext } = await import("@/state/knowledge");
		const result = formatKnowledgeContext([
			{
				id: "1",
				sourceType: "faq",
				title: "Test",
				content: "Test content",
				similarity: 0.9,
			},
		]);
		expect(result).toContain("ашиглана уу");
	});
});

describe("searchKnowledge — fallback text search", () => {
	it("falls back to ILIKE when no embedding provided", async () => {
		const { searchKnowledge } = await import("@/state/knowledge");
		const mockSupabase = createMockSupabase({
			data: [
				{
					id: "k1",
					source_type: "faq",
					title: "Часто",
					content: "Асуулт хариулт",
				},
			],
			error: null,
		});

		const result = await searchKnowledge(mockSupabase, TEST_ORG_ID, "асуулт");
		expect(result).toHaveLength(1);
		expect(result[0]?.id).toBe("k1");
		expect(result[0]?.similarity).toBe(0.5);
	});

	it("returns empty array when no matches found", async () => {
		const { searchKnowledge } = await import("@/state/knowledge");
		const mockSupabase = createMockSupabase({ data: [], error: null });

		const result = await searchKnowledge(
			mockSupabase,
			TEST_ORG_ID,
			"nonexistent",
		);
		expect(result).toHaveLength(0);
	});
});

describe("ingestKnowledge", () => {
	it("returns the new knowledge source ID on success", async () => {
		const { ingestKnowledge } = await import("@/state/knowledge");
		const mockSupabase = createMockSupabase({
			data: { id: "new-kb-id-123" },
			error: null,
		});

		const id = await ingestKnowledge(mockSupabase, TEST_ORG_ID, {
			sourceType: "faq",
			title: "Test FAQ",
			content: "Test content",
		});
		expect(id).toBe("new-kb-id-123");
	});

	it("throws Mongolian error on failure", async () => {
		const { ingestKnowledge } = await import("@/state/knowledge");
		const mockSupabase = createMockSupabase({
			data: null,
			error: new Error("DB error"),
		});

		await expect(
			ingestKnowledge(mockSupabase, TEST_ORG_ID, {
				sourceType: "url",
				content: "Content",
				url: "https://example.com",
			}),
		).rejects.toThrow("Мэдлэгийн санд бүртгэхэд алдаа гарлаа");
	});
});

describe("rememberCustomerFact / recallCustomerFacts / forgetCustomerFact", () => {
	it("remembers and recalls customer facts", async () => {
		const { rememberCustomerFact, recallCustomerFacts } = await import(
			"@/state/customer-memory"
		);

		const mockSupabase = createMockSupabase({
			data: [
				{
					id: "fact-1",
					fact: "Даваа гаригт захиалга өгдөг",
					fact_type: "preference",
					confidence: 0.9,
					created_at: new Date().toISOString(),
				},
				{
					id: "fact-2",
					fact: "Тогтмол харилцагч",
					fact_type: "note",
					confidence: 1.0,
					created_at: new Date().toISOString(),
				},
			],
			error: null,
		});

		// Remember (fire and forget, just checks no throw)
		await rememberCustomerFact(mockSupabase, {
			orgId: TEST_ORG_ID,
			customerId: "cust-1",
			customerName: "Бат",
			fact: "Тогтмол харилцагч",
			factType: "note",
		});

		const facts = await recallCustomerFacts(
			mockSupabase,
			TEST_ORG_ID,
			"cust-1",
		);
		expect(facts).toHaveLength(2);
		expect(facts[0]?.fact).toBe("Даваа гаригт захиалга өгдөг");
		expect(facts[0]?.factType).toBe("preference");
	});

	it("filters facts by factType", async () => {
		const { recallCustomerFacts } = await import("@/state/customer-memory");

		const mockSupabase = createMockSupabase({
			data: [
				{
					id: "f1",
					fact: "Note",
					fact_type: "note",
					confidence: 1.0,
					created_at: new Date().toISOString(),
				},
			],
			error: null,
		});

		const facts = await recallCustomerFacts(
			mockSupabase,
			TEST_ORG_ID,
			"cust-1",
			{
				factType: "note",
			},
		);
		expect(facts).toHaveLength(1);
		expect(facts[0]?.factType).toBe("note");
	});

	it("forgets a fact by marking it inactive", async () => {
		const { forgetCustomerFact } = await import("@/state/customer-memory");
		const mockSupabase = createMockSupabase({ data: null, error: null });

		await expect(
			forgetCustomerFact(mockSupabase, "fact-1"),
		).resolves.toBeUndefined();
	});
});

describe("formatCustomerMemory", () => {
	it("returns empty string for empty facts", async () => {
		const { formatCustomerMemory } = await import("@/state/customer-memory");
		expect(formatCustomerMemory("Бат", [])).toBe("");
	});

	it("formats facts with confidence and customer name", async () => {
		const { formatCustomerMemory } = await import("@/state/customer-memory");
		const result = formatCustomerMemory("Бат", [
			{
				id: "1",
				fact: "Тогтмол харилцагч",
				factType: "note",
				confidence: 0.9,
				createdAt: "2026-01-01",
			},
		]);
		expect(result).toContain("Бат");
		expect(result).toContain("Тогтмол харилцагч");
		expect(result).toContain("90%");
	});

	it("includes instruction to use in response", async () => {
		const { formatCustomerMemory } = await import("@/state/customer-memory");
		const result = formatCustomerMemory("Сараа", [
			{
				id: "1",
				fact: "Some fact",
				factType: "general",
				confidence: 1.0,
				createdAt: "2026-01-01",
			},
		]);
		expect(result).toContain("ашиглана уу");
	});
});
