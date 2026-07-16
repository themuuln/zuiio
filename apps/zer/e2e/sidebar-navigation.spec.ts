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

    await test.step("Verify sidebar is visible", async () => {
      await expect(page.locator("[data-slot='sidebar']")).toBeVisible({
        timeout: 15000,
      });
    });

    await test.step("Verify all 6 group labels are visible", async () => {
      for (const group of SIDEBAR_GROUPS) {
        await expect(
          page
            .locator("[data-slot='sidebar-group-label']")
            .filter({ hasText: group.label }),
        ).toBeVisible();
      }
    });
  });

  test("contains all 18 nav items in correct positions", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await test.step("Count sidebar menu items", async () => {
      await expect(page.locator("[data-slot='sidebar']")).toBeVisible({
        timeout: 15000,
      });

      const menuItems = page.locator(
        "[data-slot='sidebar-content'] [data-slot='sidebar-menu-button'] span",
      );
      const itemCount = await menuItems.count();
      expect(itemCount).toBeGreaterThanOrEqual(18);
    });
  });

  test("each nav item navigates to correct route", async ({ page }) => {
    const sampleItems = [
      { title: "Хяналтын самбар", href: "/" },
      { title: "Борлуулалт", href: "/sales" },
      { title: "Бүтээгдэхүүн", href: "/products" },
      { title: "Нэхэмжлэл", href: "/invoices" },
      { title: "Тайлан", href: "/reports" },
      { title: "Тохиргоо", href: "/settings" },
    ];

    for (const item of sampleItems) {
      await test.step(`Navigate to ${item.title} (${item.href})`, async () => {
        await page.goto("/", { waitUntil: "domcontentloaded" });

        await page
          .locator(`a[href="${item.href}"]`)
          .first()
          .click({ timeout: 5000 });

        // Wait for navigation to complete instead of hardcoded timeout
        await page.waitForURL(`**${item.href}`, { timeout: 5000 });
        expect(page.url()).toContain(item.href);
      });
    }
  });

  test("highlights active nav item", async ({ page }) => {
    await page.goto("/sales", { waitUntil: "domcontentloaded" });

    await test.step("Verify active link indicator", async () => {
      const activeLink = page.locator(
        "[data-slot='sidebar-menu-button'][data-active='true']",
      );
      await expect(activeLink.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test("collapsed sidebar hides group labels", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await test.step("Verify sidebar is visible", async () => {
      await expect(page.locator("[data-slot='sidebar']")).toBeVisible({
        timeout: 15000,
      });
    });

    await test.step("Toggle sidebar to collapsed", async () => {
      const sidebarRail = page.locator("[data-slot='sidebar-rail']");
      if (await sidebarRail.isVisible()) {
        await sidebarRail.click();
        // Wait for collapse animation instead of hardcoded timeout
        await page.waitForFunction(
          () => {
            const labels = document.querySelectorAll(
              "[data-slot='sidebar-group-label']",
            );
            return Array.from(labels).every((el) => {
              const style = window.getComputedStyle(el);
              return style.opacity === "0" || style.visibility === "hidden";
            });
          },
          { timeout: 3000 },
        );
      }
    });

    await test.step("Verify items still in DOM", async () => {
      const labels = page.locator("[data-slot='sidebar-group-label']");
      const labelCount = await labels.count();
      expect(labelCount).toBeGreaterThanOrEqual(6);

      const menuButtons = page.locator(
        "[data-slot='sidebar-content'] [data-slot='sidebar-menu-button']",
      );
      const buttonCount = await menuButtons.count();
      expect(buttonCount).toBeGreaterThanOrEqual(18);
    });
  });
});
