import { beforeAll, describe, expect, it } from "vitest";

describe("checkHandoffTriggers", () => {
	let checkHandoffTriggers: typeof import("@/state/handoff").checkHandoffTriggers;

	beforeAll(async () => {
		const mod = await import("@/state/handoff");
		checkHandoffTriggers = mod.checkHandoffTriggers;
	});

	it("triggers on config keyword match", () => {
		const result = checkHandoffTriggers("Би даргатайгаа ярих гэсэн юм", {
			keywordTriggers: ["дарга"],
		});
		expect(result.triggered).toBe(true);
		expect(result.by).toBe("keyword");
		expect(result.reason).toContain("дарга");
	});

	it("triggers on default Mongolian escalation keyword (хүн)", () => {
		const result = checkHandoffTriggers("Надад хүн хэрэгтэй байна", {});
		expect(result.triggered).toBe(true);
		expect(result.by).toBe("keyword");
	});

	it("triggers on оператор", () => {
		const result = checkHandoffTriggers("Оператортай холбогдох", {});
		expect(result.triggered).toBe(true);
	});

	it("triggers on гомдол", () => {
		const result = checkHandoffTriggers("Би гомдол гаргах гэсэн юм", {});
		expect(result.triggered).toBe(true);
		expect(result.reason).toContain("гомдол");
	});

	it("triggers on буруу (wrong info)", () => {
		const result = checkHandoffTriggers("Энэ мэдээлэл буруу байна", {});
		expect(result.triggered).toBe(true);
	});

	it("triggers on алдаа (error)", () => {
		const result = checkHandoffTriggers("Алдаа гарлаа", {});
		expect(result.triggered).toBe(true);
	});

	it("does not trigger on normal query", () => {
		const result = checkHandoffTriggers("Өнөөдрийн борлуулалт хэд вэ?", {});
		expect(result.triggered).toBe(false);
	});

	it("does not trigger on greeting", () => {
		const result = checkHandoffTriggers("Сайн уу", {});
		expect(result.triggered).toBe(false);
	});

	it("triggers on config keyword with case insensitivity", () => {
		const result = checkHandoffTriggers("Би ДАРГАТАЙ ярих гэсэн юм", {
			keywordTriggers: ["дарга"],
		});
		expect(result.triggered).toBe(true);
	});

	it("triggers on утас (phone — wanting to call)", () => {
		const result = checkHandoffTriggers("Утасны дугаар өгөөч", {});
		expect(result.triggered).toBe(true);
	});

	it("triggers on холбогд (connect)", () => {
		const result = checkHandoffTriggers("Холбогдох хүсэлтэй байна", {});
		expect(result.triggered).toBe(true);
	});

	it("triggers on хэлэлц (discuss)", () => {
		const result = checkHandoffTriggers("Хэлэлцэх асуудал байна", {});
		expect(result.triggered).toBe(true);
	});

	it("triggers on менеджер", () => {
		const result = checkHandoffTriggers("Менежерээр үйлчлүүлье", {});
		expect(result.triggered).toBe(true);
	});

	it("returns not triggered for empty message", () => {
		const result = checkHandoffTriggers("", {});
		expect(result.triggered).toBe(false);
	});

	it("works without keywordTriggers config", () => {
		const result = checkHandoffTriggers("Өнөөдрийн борлуулалт?", {});
		expect(result.triggered).toBe(false);
	});
});
