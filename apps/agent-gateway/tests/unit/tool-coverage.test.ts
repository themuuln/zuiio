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
	it("returns Tolom tools with readData and complex analytics", () => {
		const tools = getProductTools("tolom", mockContext);
		const toolNames = tools.map((t) => t.name).sort();
		// Core read tools (kept: complex multi-table)
		expect(toolNames).toContain("getDailySummary");
		expect(toolNames).toContain("readData");
		expect(toolNames).toContain("getWorkOrderDetails");
		expect(toolNames).toContain("getVehicleAnalytics");
		expect(toolNames).toContain("getFinancialSummary");
		expect(toolNames).toContain("exportData");
		expect(toolNames).toContain("partsLookup");
		expect(toolNames).toContain("getSparePartsSales");
		// Redundant tools removed (use readData instead):
		// getActiveWorkOrders, getCustomerHistory, getInvoiceStatus,
		// getExpensesSummary, getAppointments, getMechanics, getSuppliers
		// Write tools are consolidated into the dynamic writeData tool
		expect(toolNames).toContain("writeData");
		const writeData = tools.find((t) => t.name === "writeData")!;
		// writeData must advertise the datasets the legacy inline tools covered
		expect(writeData.description).toContain("work_orders");
		expect(writeData.description).toContain("invoices");
		expect(writeData.description).toContain("appointments");
		expect(writeData.description).toContain("customers");
		// All tools are unique
		expect(new Set(toolNames).size).toBe(toolNames.length);
	});

	it("readData tool has a description listing datasets", () => {
		const tools = getProductTools("tolom", mockContext);
		const readData = tools.find((t) => t.name === "readData");
		expect(readData).toBeDefined();
		expect(readData?.description).toBeTruthy();
		// Description should reference available business datasets
		expect(readData?.description.length).toBeGreaterThan(50);
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
