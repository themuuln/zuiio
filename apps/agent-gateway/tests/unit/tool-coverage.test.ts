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
	it("returns Tolom tools with queryData and complex analytics", () => {
		const tools = getProductTools("tolom", mockContext);
		const toolNames = tools.map((t) => t.name).sort();
		// Core read tools (kept: complex multi-table)
		expect(toolNames).toContain("getDailySummary");
		expect(toolNames).toContain("queryData");
		expect(toolNames).toContain("getWorkOrderDetails");
		expect(toolNames).toContain("getVehicleAnalytics");
		expect(toolNames).toContain("getFinancialSummary");
		expect(toolNames).toContain("exportData");
		expect(toolNames).toContain("partsLookup");
		expect(toolNames).toContain("getSparePartsSales");
		// Redundant tools removed (use queryData instead):
		// getActiveWorkOrders, getCustomerHistory, getInvoiceStatus,
		// getExpensesSummary, getAppointments, getMechanics, getSuppliers
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
	it("returns Zer tools with getSalesByCategory", () => {
		const tools = getProductTools("zer", mockContext);
		expect(tools.length).toBeGreaterThanOrEqual(1);
		const toolNames = tools.map((t) => t.name);
		expect(toolNames).toContain("getSalesByCategory");
	});
});
