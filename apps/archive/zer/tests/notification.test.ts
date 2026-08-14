import assert from "node:assert/strict";
import test from "node:test";

// ─── Notification event type matching logic ──────────────────────────

/**
 * Replicated from src/lib/notification.ts for unit testing.
 */
function isEventEnabled(
  config: { event_types: unknown; enabled: boolean | null },
  eventType: string,
): boolean {
  if (!config.enabled) return false;
  const eventTypes = config.event_types as string[] | null;
  if (!Array.isArray(eventTypes) || eventTypes.length === 0) return true;
  return eventTypes.includes(eventType);
}

test("isEventEnabled returns false when config is disabled", () => {
  assert.equal(
    isEventEnabled({ event_types: ["low_stock"], enabled: false }, "low_stock"),
    false,
  );
});

test("isEventEnabled returns true when event_types is empty (all enabled)", () => {
  assert.equal(
    isEventEnabled({ event_types: [], enabled: true }, "low_stock"),
    true,
  );
});

test("isEventEnabled returns true when event_types is null (fallback to all)", () => {
  assert.equal(
    isEventEnabled({ event_types: null, enabled: true }, "low_stock"),
    true,
  );
});

test("isEventEnabled returns true when event_type is in the list", () => {
  assert.equal(
    isEventEnabled(
      { event_types: ["low_stock", "new_sale"], enabled: true },
      "low_stock",
    ),
    true,
  );
});

test("isEventEnabled returns true for new_sale when in list", () => {
  assert.equal(
    isEventEnabled(
      {
        event_types: ["low_stock", "new_sale", "daily_summary"],
        enabled: true,
      },
      "new_sale",
    ),
    true,
  );
});

test("isEventEnabled returns false when event_type is not in the list", () => {
  assert.equal(
    isEventEnabled(
      { event_types: ["low_stock", "daily_summary"], enabled: true },
      "new_sale",
    ),
    false,
  );
});

// ─── Low stock trigger conditions ─────────────────────────────────────

/**
 * Replicated from src/lib/notification.ts for unit testing.
 */
function shouldNotifyLowStock(currentStock: number, minStock: number): boolean {
  return currentStock > 0 && currentStock <= minStock;
}

test("shouldNotifyLowStock returns true when stock is at or below min", () => {
  assert.equal(shouldNotifyLowStock(5, 5), true);
  assert.equal(shouldNotifyLowStock(3, 5), true);
  assert.equal(shouldNotifyLowStock(1, 5), true);
});

test("shouldNotifyLowStock returns false when stock is above min", () => {
  assert.equal(shouldNotifyLowStock(10, 5), false);
  assert.equal(shouldNotifyLowStock(6, 5), false);
});

test("shouldNotifyLowStock returns false when stock is 0", () => {
  assert.equal(shouldNotifyLowStock(0, 5), false);
});

test("shouldNotifyLowStock returns false when stock is negative", () => {
  assert.equal(shouldNotifyLowStock(-1, 5), false);
});

test("shouldNotifyLowStock returns false when min is 0 (no threshold)", () => {
  assert.equal(shouldNotifyLowStock(5, 0), false);
  assert.equal(shouldNotifyLowStock(0, 0), false);
});
