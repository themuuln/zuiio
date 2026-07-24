import { describe, expect, it } from "vitest";

/**
 * Idempotency dedup tests.
 *
 * The isDuplicateUpdate function is defined inside the telegram webhook route.ts
 * as a module-level function. We test the dedup logic by simulating its behavior:
 * a Map with TTL-based cleanup that tracks processed update_ids.
 */

// Replicate the dedup logic from route.ts for testing
const processedUpdates = new Map<number, number>();
const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000;

function isDuplicateUpdate(updateId: number): boolean {
	const now = Date.now();
	for (const [id, ts] of processedUpdates) {
		if (now - ts > IDEMPOTENCY_TTL_MS) processedUpdates.delete(id);
	}
	if (processedUpdates.has(updateId)) return true;
	processedUpdates.set(updateId, now);
	return false;
}

describe("idempotency dedup by update_id", () => {
	// Clean up between tests
	it("allows first occurrence of an update_id", () => {
		processedUpdates.clear();
		expect(isDuplicateUpdate(1001)).toBe(false);
	});

	it("blocks duplicate update_id within TTL", () => {
		processedUpdates.clear();
		isDuplicateUpdate(1002);
		expect(isDuplicateUpdate(1002)).toBe(true);
	});

	it("allows different update_ids", () => {
		processedUpdates.clear();
		isDuplicateUpdate(1003);
		expect(isDuplicateUpdate(1004)).toBe(false);
	});

	it("allows reprocessing after TTL expiry", () => {
		processedUpdates.clear();
		processedUpdates.set(1005, Date.now() - IDEMPOTENCY_TTL_MS - 1000);
		expect(isDuplicateUpdate(1005)).toBe(false);
	});

	it("cleans up expired entries", () => {
		processedUpdates.clear();
		// Add expired entry
		processedUpdates.set(9999, Date.now() - IDEMPOTENCY_TTL_MS - 1000);
		isDuplicateUpdate(1006);
		// Expired entry should be cleaned up
		expect(processedUpdates.has(9999)).toBe(false);
		expect(processedUpdates.has(1006)).toBe(true);
	});

	it("tracks multiple concurrent update_ids", () => {
		processedUpdates.clear();
		isDuplicateUpdate(2001);
		isDuplicateUpdate(2002);
		isDuplicateUpdate(2003);
		expect(isDuplicateUpdate(2001)).toBe(true);
		expect(isDuplicateUpdate(2002)).toBe(true);
		expect(isDuplicateUpdate(2003)).toBe(true);
		expect(isDuplicateUpdate(2004)).toBe(false);
	});
});
