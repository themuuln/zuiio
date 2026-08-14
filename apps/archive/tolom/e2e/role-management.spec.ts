import { SEED } from "./fixtures";
import { setEnglishLocale } from "./helpers";
import { mockProfile, mockSupabaseREST } from "./mocks";
import { expect, test } from "./test-extensions";

test.setTimeout(60_000);

// ── Helpers ──────────────────────────────────────────────────────────────

function ok(body: unknown) {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

const ORG_ID = SEED.orgId;

const samplePermissions = [
  {
    id: "perm-1",
    name: "work_orders.read",
    resource: "work_orders",
    action: "read",
    description: "View work orders",
  },
  {
    id: "perm-2",
    name: "work_orders.create",
    resource: "work_orders",
    action: "create",
    description: "Create work orders",
  },
  {
    id: "perm-3",
    name: "reports.read",
    resource: "reports",
    action: "read",
    description: "View reports",
  },
  {
    id: "perm-4",
    name: "inventory.read",
    resource: "inventory",
    action: "read",
    description: "View inventory",
  },
  {
    id: "perm-5",
    name: "customers.read",
    resource: "customers",
    action: "read",
    description: "View customers",
  },
  {
    id: "perm-6",
    name: "invoices.read",
    resource: "invoices",
    action: "read",
    description: "View invoices",
  },
];

const systemRoles = [
  {
    id: "role-owner",
    name: "Org Owner",
    description: "Full access to all features",
    is_system: true,
    memberCount: 1,
    permissions: samplePermissions,
  },
  {
    id: "role-manager",
    name: "Manager",
    description: "Manages day-to-day operations",
    is_system: true,
    memberCount: 0,
    permissions: samplePermissions.filter((p) => p.name !== "reports.read"),
  },
  {
    id: "role-mechanic",
    name: "Mechanic",
    description: "Shop floor access only",
    is_system: true,
    memberCount: 2,
    permissions: [samplePermissions[0], samplePermissions[1]],
  },
  {
    id: "role-guest",
    name: "Guest",
    description: "Read-only access",
    is_system: true,
    memberCount: 0,
    permissions: [samplePermissions[0]],
  },
];

const customRoleId = "role-custom-1";
const customRole = {
  id: customRoleId,
  name: "Junior Mechanic",
  description: "Limited mechanic access",
  is_system: false,
  memberCount: 0,
  permissions: [samplePermissions[0], samplePermissions[1]],
};

async function mockRoles(
  page: import("@playwright/test").Page,
  roles?: typeof systemRoles,
) {
  await page.route(`**/api/organizations/${ORG_ID}/roles`, (route) => {
    return route.fulfill(ok({ data: roles ?? systemRoles }));
  });
}

async function mockPermissions(page: import("@playwright/test").Page) {
  await page.route(`**/api/organizations/${ORG_ID}/permissions`, (route) => {
    return route.fulfill(ok({ data: samplePermissions }));
  });
}

async function mockRolesMutations(page: import("@playwright/test").Page) {
  await page.route(`**/api/organizations/${ORG_ID}/roles/*`, (route) => {
    const method = route.request().method();
    if (method === "PATCH" || method === "DELETE") {
      return route.fulfill(ok({ success: true }));
    }
    // fallback (not continue) so GET falls through to mockRoles
    return route.fallback();
  });
  await page.route(`**/api/organizations/${ORG_ID}/roles`, (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: customRoleId,
          name: "Junior Mechanic",
          description: "Limited mechanic access",
          is_system: false,
        }),
      });
    }
    return route.fallback();
  });
}

// ── Role Management ──────────────────────────────────────────────────────

test.describe("Role Management (Mocked)", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);
    await mockProfile(page, { organizationId: ORG_ID });
    await mockRoles(page);
    await mockPermissions(page);
    await mockRolesMutations(page);
  });

  test("shows 4 system role cards on page load", async ({ page }) => {
    await page.goto("/dashboard/organization/roles");

    // Wait for the page to render role cards
    const roleCards = page
      .locator('[class*="border"][class*="rounded"]')
      .filter({ hasText: /Org Owner|Manager|Mechanic|Guest/ });
    await expect(roleCards.first()).toBeVisible({ timeout: 10_000 });

    // Verify system role names are visible
    await expect(page.getByText("Org Owner", { exact: true })).toBeVisible();
    await expect(page.getByText("Manager", { exact: true })).toBeVisible();
    await expect(page.getByText("Mechanic", { exact: true })).toBeVisible();
    await expect(page.getByText("Guest", { exact: true })).toBeVisible();
  });

  test("opens drawer, fills form, submits, and shows success toast", async ({
    page,
  }) => {
    await page.goto("/dashboard/organization/roles");

    // Wait for page to load
    await expect(page.getByText("Org Owner", { exact: true })).toBeVisible({
      timeout: 10_000,
    });

    // Click Create Role button (Plus icon button)
    const createButton = page.getByRole("button", { name: /^add role$/i });
    if (await createButton.isVisible()) {
      await createButton.click();
    } else {
      // Fallback: look for a button with Plus icon near the heading
      await page.locator("button").filter({ hasText: /role/i }).first().click();
    }

    // Drawer should open — look for the name input
    const nameInput = page.getByRole("textbox", { name: /name/i });
    await expect(nameInput).toBeVisible({ timeout: 5_000 });

    // Fill in the form
    await nameInput.fill("Junior Mechanic");

    // Fill description if visible
    const descInput = page.locator("textarea");
    if (await descInput.isVisible()) {
      await descInput.fill("Limited mechanic access");
    }

    // Toggle at least one permission checkbox
    const checkbox = page.locator('[role="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.click();
    }

    // Submit the form
    const saveButton = page.getByRole("button", {
      name: /save|submit|create/i,
    });
    await saveButton.click();

    // Should show a success toast
    await expect(page.getByText(/success|created|saved/i)).toBeVisible({
      timeout: 5_000,
    });
  });

  test("opens drawer with pre-filled values, changes name, and saves", async ({
    page,
  }) => {
    // Include a custom role in the mock
    await mockRoles(page, [...systemRoles, customRole]);
    await page.goto("/dashboard/organization/roles");

    await expect(page.getByText("Junior Mechanic")).toBeVisible({
      timeout: 10_000,
    });

    // Click edit button on the custom role card
    const customCard = page
      .locator('div[class*="cursor-pointer"]')
      .filter({ hasText: "Junior Mechanic" })
      .first();
    await customCard.click();

    // Drawer should open with pre-filled values
    const nameInput = page.getByRole("textbox", { name: /name/i });
    await expect(nameInput).toBeVisible({ timeout: 5_000 });
    await expect(nameInput).toHaveValue("Junior Mechanic");

    // Change the name
    await nameInput.clear();
    await nameInput.fill("Senior Mechanic");

    // Save
    const saveButton = page.getByRole("button", { name: /save|submit/i });
    await saveButton.click();

    // Success toast
    await expect(page.getByText(/success|updated|saved/i)).toBeVisible({
      timeout: 5_000,
    });
  });

  test("opens edit drawer for custom role, clicks Delete, and confirms removal", async ({
    page,
  }) => {
    await mockRoles(page, [...systemRoles, customRole]);
    await page.goto("/dashboard/organization/roles");

    await expect(page.getByText("Junior Mechanic")).toBeVisible({
      timeout: 10_000,
    });

    // Open edit drawer for custom role
    const customCard = page
      .locator('div[class*="cursor-pointer"]')
      .filter({ hasText: "Junior Mechanic" })
      .first();
    await customCard.click();

    // Find and click Delete button
    const deleteButton = page.getByRole("button", { name: /delete|remove/i });
    await expect(deleteButton).toBeVisible({ timeout: 15_000 });
    await deleteButton.click();

    // Success toast
    await expect(page.getByText(/success|deleted|removed/i)).toBeVisible({
      timeout: 5_000,
    });
  });

  test("system role drawer has no Delete button", async ({ page }) => {
    await page.goto("/dashboard/organization/roles");

    await expect(page.getByText("Org Owner", { exact: true })).toBeVisible({
      timeout: 10_000,
    });

    // Click edit on the Org Owner system role
    const ownerCard = page
      .locator('div[class*="cursor-pointer"]')
      .filter({ hasText: "Org Owner" })
      .first();
    await ownerCard.click();

    // Drawer should open
    await expect(page.getByRole("textbox", { name: /name/i })).toBeVisible({
      timeout: 5_000,
    });

    // Delete button should NOT be visible for system roles
    const deleteButton = page.getByRole("button", { name: /delete|remove/i });
    await expect(deleteButton).not.toBeVisible();
  });
});

// ── Sidebar Permission Gating ────────────────────────────────────────────

test.describe("Sidebar Permission Gating (Mocked)", () => {
  test("non-owner without reports.read cannot see Reports but can see Work Orders", async ({
    page,
  }) => {
    await setEnglishLocale(page);
    await mockSupabaseREST(page);

    // Mock profile for a Mechanic WITHOUT reports.read permission
    await page.route("**/api/profile", (route) => {
      return route.fulfill(
        ok({
          id: "e2e-user-id",
          email: "mechanic@test.com",
          username: null,
          phone: null,
          fullName: "Test Mechanic",
          avatarUrl: null,
          organizationId: ORG_ID,
          organizationName: "Test Org",
          branchId: null,
          roleId: "role-mechanic",
          roleName: "Mechanic",
          permissionNames: [
            "work_orders.read",
            "work_orders.create",
            "customers.read",
          ],
        }),
      );
    });

    // Mock dashboard endpoints with minimal data
    await page.route("**/api/organizations/*/reports?*", (route) => {
      return route.fulfill(
        ok({
          total_bays: 3,
          occupied_bays: 0,
          empty_bays: 3,
          utilization_percent: 0,
          bays: [],
        }),
      );
    });

    await page.route("**/api/organizations/*/members*", (route) => {
      return route.fulfill(ok([]));
    });

    await page.goto("/dashboard");

    // Wait for the sidebar to render
    const sidebar = page.locator("nav").or(page.locator('[role="navigation"]'));
    await expect(sidebar.first()).toBeVisible({ timeout: 10_000 });

    // Reports should NOT be visible (mechanic lacks reports.read)
    await expect(
      page.getByRole("button", { name: /^reports$/i }),
    ).not.toBeVisible();

    // Work Orders SHOULD be visible (mechanic has work_orders.read)
    await expect(
      page.getByRole("button", { name: /^work orders$/i }),
    ).toBeVisible();
  });
});
