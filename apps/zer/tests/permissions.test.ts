import assert from "node:assert/strict";
import test from "node:test";
import { APP_PERMISSIONS, PERMISSION_GROUPS, PERMISSION_LABELS } from "@/lib/permissions";

// APP_PERMISSIONS is the canonical enum from supabase types
test("APP_PERMISSIONS is a non-empty array", () => {
  assert.ok(Array.isArray(APP_PERMISSIONS), "APP_PERMISSIONS should be an array");
  assert.ok(APP_PERMISSIONS.length > 0, "APP_PERMISSIONS should not be empty");
});

// Every permission referenced by any group must exist in the master list
test("every permission in PERMISSION_GROUPS exists in APP_PERMISSIONS", () => {
  const allPermissions = new Set(APP_PERMISSIONS);
  for (const group of PERMISSION_GROUPS) {
    for (const perm of group.permissions) {
      assert.ok(
        allPermissions.has(perm),
        `Group "${group.key}" contains "${perm}" which is not in APP_PERMISSIONS`,
      );
    }
  }
});

// Every master permission must have a human-readable label
test("every permission in APP_PERMISSIONS has a label in PERMISSION_LABELS", () => {
  for (const perm of APP_PERMISSIONS) {
    assert.ok(
      perm in PERMISSION_LABELS,
      `"${perm}" is missing from PERMISSION_LABELS`,
    );
    assert.ok(
      typeof PERMISSION_LABELS[perm] === "string" &&
        PERMISSION_LABELS[perm].length > 0,
      `Label for "${perm}" must be a non-empty string`,
    );
  }
});

// Groups with dynamic filters (e.g. emails group uses startsWith("emails."))
// naturally overlap explicit groups like admin. This is intentional —
// a permission can belong to multiple UI display categories.
// Only check for unintended duplicates within a single group.
test("no group contains duplicate permissions within itself", () => {
  for (const group of PERMISSION_GROUPS) {
    const unique = new Set(group.permissions);
    assert.equal(
      unique.size,
      group.permissions.length,
      `Group "${group.key}" has duplicate permissions`,
    );
  }
});
