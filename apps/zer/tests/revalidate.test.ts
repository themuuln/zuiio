import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { mockMod } from "./actions-helpers";

// Spies must be created before mock.module so they're available in the module registry.
const revalidatePathSpy = mock.fn();
const revalidateTagSpy = mock.fn();

mockMod("next/cache", {
  revalidatePath: revalidatePathSpy,
  revalidateTag: revalidateTagSpy,
});
mockMod("server-only", {});

// Dynamic import AFTER mock.module so the import sees our spies.
import type { EntityKey } from "@/lib/revalidate";

let revalidateEntity: (entity: EntityKey) => void;
let revalidateEntities: (entities: EntityKey[]) => void;
let revalidateEntityTag: (entity: EntityKey, orgId?: string) => void;
let ENTITY_PATHS: Record<EntityKey, readonly string[]>;

test.before(async () => {
  const mod = await import("@/lib/revalidate");
  revalidateEntity = mod.revalidateEntity;
  revalidateEntities = mod.revalidateEntities;
  revalidateEntityTag = mod.revalidateEntityTag;
  ENTITY_PATHS = mod.ENTITY_PATHS;
});

// Clear call history between tests so spies don't accumulate.
test.beforeEach(() => {
  revalidatePathSpy.mock.resetCalls();
  revalidateTagSpy.mock.resetCalls();
});

test("revalidateEntity('sales') calls revalidatePath for '/' and '/sales'", () => {
  revalidateEntity("sales");

  const paths = revalidatePathSpy.mock.calls.map(
    (c: { arguments: unknown[] }) => String(c.arguments[0]),
  );
  assert.deepEqual(paths, ["/", "/sales"]);
});

test("revalidateEntity('inventory') calls revalidatePath for 3 paths", () => {
  revalidateEntity("inventory");

  const paths = revalidatePathSpy.mock.calls.map(
    (c: { arguments: unknown[] }) => String(c.arguments[0]),
  );
  assert.deepEqual(paths, ["/inventory", "/inventory/movements", "/products"]);
  assert.equal(paths.length, 3);
});

test("revalidateEntity('categories') calls revalidatePath for 1 path", () => {
  revalidateEntity("categories");

  const paths = revalidatePathSpy.mock.calls.map(
    (c: { arguments: unknown[] }) => String(c.arguments[0]),
  );
  assert.deepEqual(paths, ["/inventory/categories"]);
  assert.equal(paths.length, 1);
});

test("revalidateEntities(['sales', 'products']) calls revalidatePath for all combined paths", () => {
  revalidateEntities(["sales", "products"]);

  const paths = revalidatePathSpy.mock.calls.map(
    (c: { arguments: unknown[] }) => String(c.arguments[0]),
  );
  // sales: ["/", "/sales"], products: ["/products", "/inventory"]
  assert.deepEqual(paths, ["/", "/sales", "/products", "/inventory"]);
});

test("revalidateEntityTag('products', 'org_123') calls revalidateTag with 'products:org_123'", () => {
  revalidateEntityTag("products", "org_123");

  assert.equal(revalidateTagSpy.mock.calls.length, 1);
  const [tag, scope] = revalidateTagSpy.mock.calls[0].arguments;
  assert.equal(tag, "products:org_123");
  assert.equal(scope, "max");
});

test("revalidateEntityTag('sales') calls revalidateTag with 'sales' (no orgId)", () => {
  revalidateEntityTag("sales");

  assert.equal(revalidateTagSpy.mock.calls.length, 1);
  const [tag, scope] = revalidateTagSpy.mock.calls[0].arguments;
  assert.equal(tag, "sales");
  assert.equal(scope, "max");
});

test("ENTITY_PATHS has all expected entity keys", () => {
  const keys = Object.keys(ENTITY_PATHS);
  const expected = [
    "accounting",
    "branding",
    "branches",
    "categories",
    "commissions",
    "coupons",
    "customers",
    "deliveries",
    "discounts",
    "expenses",
    "gift_cards",
    "hr",
    "invoices",
    "inventory",
    "products",
    "production",
    "promotions",
    "purchases",
    "quality",
    "quotations",
    "returns",
    "roles",
    "sales",
    "settings",
    "shop",
    "suppliers",
    "users",
  ];
  assert.deepEqual(keys.sort(), expected.sort());
});

test("ENTITY_PATHS['production'] has 2 entries", () => {
  assert.equal(ENTITY_PATHS.production.length, 2);
  assert.deepEqual(ENTITY_PATHS.production, ["/production", "/quality"]);
});
