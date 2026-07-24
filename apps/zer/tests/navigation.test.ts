import assert from "node:assert/strict";
import test from "node:test";
import { filterNavGroups, type NavGroup, type NavItem } from "@/lib/navigation";

// ─── Helpers ──────────────────────────────────────────────────────────

function item(
  overrides: Partial<NavItem> & Pick<NavItem, "title" | "href">,
): NavItem {
  return {
    icon: () => null,
    ...overrides,
  };
}

function group(label: string, items: NavItem[]): NavGroup {
  return { label, items };
}

// ─── filterNavGroups ──────────────────────────────────────────────────

test("filterNavGroups keeps items without featureKey", () => {
  const groups = [
    group("Main", [
      item({ title: "Dashboard", href: "/" }),
      item({ title: "Settings", href: "/settings" }),
    ]),
  ];

  const result = filterNavGroups(groups, ["_inventory"], false);

  assert.equal(result.length, 1);
  assert.equal(result[0].items.length, 2);
  assert.equal(result[0].items[0].title, "Dashboard");
  assert.equal(result[0].items[1].title, "Settings");
});

test("filterNavGroups includes items whose featureKey is in enabledFeatures", () => {
  const groups = [
    group("Features", [
      item({ title: "Inventory", href: "/inventory", featureKey: "_inventory" }),
      item({ title: "Audit Log", href: "/audit", featureKey: "_audit_log" }),
    ]),
  ];

  const result = filterNavGroups(groups, ["_inventory", "_audit_log"], false);

  assert.equal(result.length, 1);
  assert.equal(result[0].items.length, 2);
  assert.equal(result[0].items[0].featureKey, "_inventory");
  assert.equal(result[0].items[1].featureKey, "_audit_log");
});

test("filterNavGroups excludes items whose featureKey is NOT in enabledFeatures", () => {
  const groups = [
    group("Features", [
      item({ title: "Inventory", href: "/inventory", featureKey: "_inventory" }),
      item({ title: "Brands", href: "/brands", featureKey: "_brands" }),
      item({ title: "Categories", href: "/categories", featureKey: "_categories" }),
    ]),
  ];

  // Only inventory is enabled
  const result = filterNavGroups(groups, ["_inventory"], false);

  assert.equal(result.length, 1);
  assert.equal(result[0].items.length, 1);
  assert.equal(result[0].items[0].title, "Inventory");
  assert.equal(result[0].items[0].featureKey, "_inventory");
});

test("filterNavGroups excludes _multi_branch item when hasMultiBranch is false", () => {
  const groups = [
    group("Settings", [
      item({ title: "Branches", href: "/settings/branches", featureKey: "_multi_branch" }),
      item({ title: "General", href: "/settings/general" }),
    ]),
  ];

  const result = filterNavGroups(groups, ["_multi_branch"], false);

  assert.equal(result.length, 1);
  assert.equal(result[0].items.length, 1);
  assert.equal(result[0].items[0].title, "General");
});

test("filterNavGroups keeps _multi_branch item when hasMultiBranch is true", () => {
  const groups = [
    group("Settings", [
      item({ title: "Branches", href: "/settings/branches", featureKey: "_multi_branch" }),
      item({ title: "General", href: "/settings/general" }),
    ]),
  ];

  const result = filterNavGroups(groups, ["_multi_branch"], true);

  assert.equal(result.length, 1);
  assert.equal(result[0].items.length, 2);
  assert.equal(result[0].items[0].title, "Branches");
  assert.equal(result[0].items[0].featureKey, "_multi_branch");
});

test("filterNavGroups removes groups that become empty after filtering", () => {
  const groups = [
    group("Should Stay", [
      item({ title: "Dashboard", href: "/" }),
    ]),
    group("Should Go", [
      item({ title: "Brands", href: "/brands", featureKey: "_brands" }),
      item({ title: "Categories", href: "/categories", featureKey: "_categories" }),
    ]),
  ];

  // Neither _brands nor _categories enabled
  const result = filterNavGroups(groups, ["_inventory"], false);

  assert.equal(result.length, 1);
  assert.equal(result[0].label, "Should Stay");
});

test("filterNavGroups keeps groups that still have items after filtering", () => {
  const groups = [
    group("Mixed", [
      item({ title: "Dashboard", href: "/" }),
      item({ title: "Brands", href: "/brands", featureKey: "_brands" }),
      item({ title: "Inventory", href: "/inventory", featureKey: "_inventory" }),
    ]),
  ];

  // Only _inventory enabled; _brands filtered, but Dashboard (no featureKey) stays
  const result = filterNavGroups(groups, ["_inventory"], false);

  assert.equal(result.length, 1);
  assert.equal(result[0].items.length, 2);
  assert.equal(result[0].items[0].title, "Dashboard");
  assert.equal(result[0].items[1].title, "Inventory");
});

test("filterNavGroups handles empty groups array", () => {
  const result = filterNavGroups([], ["_inventory"], false);

  assert.equal(result.length, 0);
  assert.deepEqual(result, []);
});

test("filterNavGroups handles all items filtered out across all groups", () => {
  const groups = [
    group("Group A", [
      item({ title: "Brands", href: "/brands", featureKey: "_brands" }),
    ]),
    group("Group B", [
      item({ title: "Categories", href: "/categories", featureKey: "_categories" }),
    ]),
  ];

  // Empty enabled features — early return passes everything through,
  // but with specific features that don't match, everything is removed
  const result = filterNavGroups(groups, ["_inventory"], false);

  assert.equal(result.length, 0);
});

test("filterNavGroups preserves order of groups and items", () => {
  const groups = [
    group("Third", [
      item({ title: "Last", href: "/last" }),
      item({ title: "Brands", href: "/brands", featureKey: "_brands" }),
    ]),
    group("First", [
      item({ title: "Categories", href: "/categories", featureKey: "_categories" }),
      item({ title: "First", href: "/first" }),
    ]),
    group("Second", [
      item({ title: "Inventory", href: "/inventory", featureKey: "_inventory" }),
    ]),
  ];

  const result = filterNavGroups(groups, ["_inventory", "_categories"], false);

  // Group order: Third (has "Last" without featureKey), then First (has "Categories" and "First"), then Second
  assert.equal(result.length, 3);
  assert.equal(result[0].label, "Third");
  assert.equal(result[0].items.length, 1);
  assert.equal(result[0].items[0].title, "Last");

  assert.equal(result[1].label, "First");
  assert.equal(result[1].items.length, 2);
  assert.equal(result[1].items[0].title, "Categories");
  assert.equal(result[1].items[1].title, "First");

  assert.equal(result[2].label, "Second");
  assert.equal(result[2].items.length, 1);
  assert.equal(result[2].items[0].title, "Inventory");
});
