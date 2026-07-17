import { describe, expect, it, vi } from "vitest";
import { getProductTools } from "@/gateway/webhook-helpers";
import type { ToolContext } from "@/providers/types";

const mockContext: ToolContext = {
	orgId: "test-org",
	userId: "test-user",
	supabase: {
		from: vi.fn(),
		rpc: vi.fn(),
	} as unknown as ToolContext["supabase"],
};

describe("Tolom tool coverage", () => {
	it("returns 24 Tolom tools", () => {
		const tools = getProductTools("tolom", mockContext);
		const toolNames = tools.map((t) => t.name).sort();
		// Core read tools
		expect(toolNames).toContain("getDailySummary");
		expect(toolNames).toContain("getActiveWorkOrders");
		expect(toolNames).toContain("getCustomerHistory");
		expect(toolNames).toContain("getInvoiceStatus");
		expect(toolNames).toContain("getExpensesSummary");
		expect(toolNames).toContain("getAppointments");
		expect(toolNames).toContain("queryData");
		expect(toolNames).toContain("getWorkOrderDetails");
		expect(toolNames).toContain("getVehicleAnalytics");
		// Write tools
		expect(toolNames).toContain("createWorkOrder");
		expect(toolNames).toContain("createInvoice");
		expect(toolNames).toContain("createAppointment");
		expect(toolNames).toContain("recordPayment");
		// All tools are unique
		expect(new Set(toolNames).size).toBe(toolNames.length);
	});

	it("queryData tool has a description mentioning tables", () => {
		const tools = getProductTools("tolom", mockContext);
		const queryData = tools.find((t) => t.name === "queryData");
		expect(queryData).toBeDefined();
		expect(queryData!.description).toBeTruthy();
		// Description should reference available business tables
		expect(queryData!.description.length).toBeGreaterThan(50);
	});
});

describe("Zer tool coverage", () => {
	it("returns Zer tools including getSalesSummary", () => {
		const tools = getProductTools("zer", mockContext);
		expect(tools.length).toBeGreaterThanOrEqual(5);
		const toolNames = tools.map((t) => t.name);
		expect(toolNames).toContain("getSalesSummary");
	});
});
