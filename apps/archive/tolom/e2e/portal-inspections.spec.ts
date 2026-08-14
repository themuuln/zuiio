import { setEnglishLocale } from "./helpers";
import { expect, type Page, test } from "./test-extensions";

test.setTimeout(60_000);
const customer = {
  id: "customer-1",
  first_name: "Test",
  last_name: "Customer",
  full_name: "Test Customer",
  total_visits: 4,
  last_visit_at: "2026-07-28T10:00:00Z",
};

const vehicle = {
  id: "vehicle-1",
  plate_number: "1234УБА",
  make: "Toyota",
  model: "Prius",
  year: 2020,
};

const inspection = {
  id: "inspection-1",
  status: "sent",
  created_at: "2026-07-30T10:00:00Z",
  updated_at: "2026-07-30T10:00:00Z",
  odometer: 85000,
  vehicle,
  item_count: 1,
  items: [
    {
      id: "item-1",
      category: "Brakes",
      item_name: "Front brake pads",
      condition: "Worn",
      severity: "high",
      estimated_cost: 250000,
      customer_approved: null,
      has_photo: false,
    },
  ],
};

async function mockPortalApis(page: Page) {
  await page.route("**/api/portal/customer", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: customer }),
    }),
  );
  await page.route("**/api/portal/vehicles", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [vehicle] }),
    }),
  );
  await page.route("**/api/portal/inspections", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [inspection] }),
    }),
  );
  await page.route("**/api/portal/inspections/inspection-1", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          ...inspection,
          vin: "JTDKN3DU0A0123456",
          color: "Silver",
          estimated_total_cost: 250000,
        },
      }),
    }),
  );
  await page.route("**/api/portal/inspections/inspection-1/approve", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { updated_count: 1, status: "approved" } }),
    }),
  );
}

test.describe("Customer Portal inspections", () => {
  test.beforeEach(async ({ page }) => {
    await setEnglishLocale(page);
    await mockPortalApis(page);
  });

  test("shows the authenticated customer dashboard with vehicle and pending inspection", async ({
    page,
  }) => {
    await page.goto("/portal?token=portal-test-token");

    await expect(
      page.getByRole("heading", { name: /welcome, test/i }),
    ).toBeVisible();
    await expect(page.getByText("1234УБА").first()).toBeVisible();
    await expect(page.getByText("Pending Your Approval")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /inspections/i }).first(),
    ).toBeVisible();
  });

  test("opens an inspection report and submits approve-all", async ({
    page,
  }) => {
    await page.goto("/portal/inspections/inspection-1?token=portal-test-token");

    // The detail header shows the vehicle string (H1) — "Inspection Report"
    // only appears in the not-found state. Assert the vehicle heading.
    await expect(
      page.getByRole("heading", { name: "1234УБА Toyota Prius" }),
    ).toBeVisible();
    await expect(page.getByText("Front brake pads")).toBeVisible();

    const approveResponse = page.waitForResponse(
      (response) =>
        response
          .url()
          .includes("/api/portal/inspections/inspection-1/approve") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Approve All" }).click();
    await expect((await approveResponse).status()).toBe(200);
    await expect(page.getByText("Items approved successfully!")).toBeVisible();
  });
});
