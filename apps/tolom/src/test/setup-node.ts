/**
 * Lightweight setup for Node-environment tests (API routes, services, utils).
 * No DOM polyfills, no jsdom, no IndexedDB — keeps test startup fast.
 */
import { vi } from "vitest";

// Global mock for @/lib/audit — services call logAuditAfter which uses next/after
vi.mock("@/lib/audit", () => ({
	createAuditLog: vi.fn(),
	logAuditAfter: vi.fn(),
}));

// Mock @/lib/offline/idb-store so service tests don't hit real IndexedDB
vi.mock("@/lib/offline/idb-store", () => ({
	putRecord: vi.fn().mockResolvedValue(undefined),
	putRecords: vi.fn().mockResolvedValue(undefined),
	putListResponse: vi.fn().mockResolvedValue(undefined),
	getListResponse: vi.fn().mockResolvedValue(null),
	getOrgRecords: vi.fn().mockResolvedValue([]),
	getRecord: vi.fn().mockResolvedValue(null),
	getRecordsByIds: vi.fn().mockResolvedValue([]),
	deleteRecord: vi.fn().mockResolvedValue(undefined),
	deleteRecords: vi.fn().mockResolvedValue(undefined),
	getOrgListResponses: vi.fn().mockResolvedValue([]),
	clearOrgData: vi.fn().mockResolvedValue(undefined),
	clearAllData: vi.fn().mockResolvedValue(undefined),
	getStorageEstimate: vi.fn().mockResolvedValue({ usage: 0, quota: 0 }),
	STORES: [],
}));
