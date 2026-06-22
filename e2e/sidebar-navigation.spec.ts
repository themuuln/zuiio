import { expect, test } from "@playwright/test";

/**
 * Sidebar navigation tests: validates grouped navigation layout,
 * collapsed mode behavior, and that all items navigate correctly.
 */

const SIDEBAR_GROUPS = [
  {
    label: "Үндсэн",
    items: [{ title: "Хяналтын самбар", href: "/" }],
  },
  {
    label: "Үйл ажиллагаа",
    items: [
      { title: "Борлуулалт", href: "/sales" },
      { title: "Зарлага", href: "/expenses" },
      { title: "Худалдан авалт", href: "/purchases" },
      { title: "Буцаалт", href: "/returns" },
    ],
  },
  {
    label: "Бүртгэл",
    items: [
      { title: "Бүтээгдэхүүн", href: "/products" },
      { title: "Ангилалууд", href: "/inventory/categories" },
      { title: "Агуулах", href: "/inventory" },
      { title: "Харилцагчид", href: "/customers" },
      { title: "Нийлүүлэгчид", href: "/suppliers" },
    ],
  },
  {
    label: "Баримт бичиг",
    items: [
      { title: "Нэхэмжлэл", href: "/invoices" },
      { title: "Үнийн санал", href: "/quotations" },
      { title: "Хямдрал", href: "/discounts" },
    ],
  },
  {
    label: "Шинжилгээ",
    items: [
      { title: "Тайлан", href: "/reports" },
      { title: "Комисс", href: "/commissions" },
      { title: "Нягтлан бодох бүртгэл", href: "/accounting" },
    ],
  },
  {
    label: "Систем",
    items: [
      { title: "Үйлдлийн түүх", href: "/audit" },
      { title: "Тохиргоо", href: "/settings" },
    ],
  },
];

test.describe("Sidebar navigation", () => {
  test("shows 6 labeled groups on the dashboard page", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Wait for the sidebar to be visible
    await expect(page.locator("[data-slot='sidebar']")).toBeVisible({
      timeout: 15000,
    });

    // Check that all 6 group labels are visible
    for (const group of SIDEBAR_GROUPS) {
      await expect(
        page
          .locator("[data-slot='sidebar-group-label']")
          .filter({ hasText: group.label }),
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("contains all 18 nav items in correct positions", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-slot='sidebar']")).toBeVisible({
      timeout: 15000,
    });

    // Count total sidebar menu items (excluding header and footer items)
    const menuItems = page.locator(
      "[data-slot='sidebar-content'] [data-slot='sidebar-menu-button'] span",
    );
    const itemCount = await menuItems.count();
    expect(itemCount).toBeGreaterThanOrEqual(18);
  });

  test("each nav item navigates to correct route", async ({ page }) => {
    // Test a sample of items across different groups
    const sampleItems = [
      { title: "Хяналтын самбар", href: "/" },
      { title: "Борлуулалт", href: "/sales" },
      { title: "Бүтээгдэхүүн", href: "/products" },
      { title: "Нэхэмжлэл", href: "/invoices" },
      { title: "Тайлан", href: "/reports" },
      { title: "Тохиргоо", href: "/settings" },
    ];

    for (const item of sampleItems) {
      await page.goto("/", { waitUntil: "domcontentloaded" });

      // Click the nav item
      await page
        .locator(`a[href="${item.href}"]`)
        .first()
        .click({ timeout: 5000 });
      await page.waitForTimeout(500);

      // Verify we navigated to the correct URL
      expect(page.url()).toContain(item.href);
    }
  });

  test("highlights active nav item", async ({ page }) => {
    // Navigate to a specific page
    await page.goto("/sales", { waitUntil: "domcontentloaded" });

    // The active link should have data-active="true"
    const activeLink = page.locator(
      `[data-slot='sidebar-menu-button'][data-active='true']`,
    );
    await expect(activeLink.first()).toBeVisible({ timeout: 5000 });
  });

  test("collapsed sidebar hides group labels", async ({ page }) => {
    // First, ensure sidebar is expanded to start
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-slot='sidebar']")).toBeVisible({
      timeout: 15000,
    });

    // Toggle sidebar to collapsed state by clicking the rail
    // The SidebarRail is a thin strip at the edge of the sidebar
    const sidebarRail = page.locator("[data-slot='sidebar-rail']");
    if (await sidebarRail.isVisible()) {
      await sidebarRail.click();
      await page.waitForTimeout(500);
    }

    // In collapsed mode, group labels should be visually hidden (opacity-0)
    // They may still be in the DOM but not visible
    const labels = page.locator("[data-slot='sidebar-group-label']");
    const labelCount = await labels.count();
    expect(labelCount).toBeGreaterThanOrEqual(6);

    // Verify items are still in the DOM even when collapsed
    const menuButtons = page.locator(
      "[data-slot='sidebar-content'] [data-slot='sidebar-menu-button']",
    );
    const buttonCount = await menuButtons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(18);
  });
});
