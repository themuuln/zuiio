import { setEnglishLocale } from "./helpers";
import {
  mockOrganizations,
  mockPrewarm,
  mockProfile,
  mockSupabaseREST,
} from "./mocks";
import { expect, test } from "./test-extensions";

// Mocked APIs — fast, no cold starts. 10s is generous.
test.setTimeout(60_000);

// All vehicle tests use English locale for stable English text selectors

test.describe("Vehicle Management", () => {
  test.describe("Vehicle List Page", () => {
    test.beforeEach(async ({ page }) => {
      await setEnglishLocale(page);
      await mockSupabaseREST(page);
      await mockOrganizations(page);
      await mockProfile(page);
      await mockPrewarm(page);
      await page.goto("/dashboard/vehicles");
      await page
        .locator('h1, [data-slot="empty"]')
        .first()
        .waitFor({ timeout: 5000 });
    });

    test("renders the vehicles page heading", async ({ page }) => {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });

    test("shows the Add Vehicle button", async ({ page }) => {
      const addButton = page.getByRole("button", { name: /add vehicle/i });
      await expect(addButton).toBeVisible();
    });

    test("shows search input", async ({ page }) => {
      const searchInput = page.getByPlaceholder(/plate|vin/i);
      await expect(searchInput).toBeVisible();
    });

    test("Add Vehicle button is clickable", async ({ page }) => {
      const addButton = page.getByRole("button", { name: /add vehicle/i });
      await expect(addButton).toBeEnabled();
    });
  });

  test.describe("add vehicle Form", () => {
    test.beforeEach(async ({ page }) => {
      await setEnglishLocale(page);
      await mockSupabaseREST(page);
      await mockOrganizations(page);
      await mockProfile(page);
      await mockPrewarm(page);
      await page.goto("/dashboard/vehicles/new");
      await page
        .getByRole("heading", { name: /add vehicle/i })
        .waitFor({ timeout: 5000 });
    });

    test("renders the add vehicle page heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: /add vehicle/i }),
      ).toBeVisible();
    });

    test("shows back link (arrow)", async ({ page }) => {
      // Back button renders as a <Link> via render prop
      const backLink = page.getByRole("link", { name: "Back" });
      await expect(backLink).toBeVisible();
    });

    test("renders owner section", async ({ page }) => {
      await expect(page.getByText(/owner/i).first()).toBeVisible();
      await expect(page.getByPlaceholder(/search customer/i)).toBeVisible();
    });

    test("renders vehicle information section", async ({ page }) => {
      await expect(page.getByText(/vehicle information/i)).toBeVisible();
    });

    test("renders required fields", async ({ page }) => {
      await expect(page.getByLabel(/plate/i)).toBeVisible();
      await expect(page.getByLabel(/make/i)).toBeVisible();
      await expect(page.getByLabel(/model/i)).toBeVisible();
    });

    test("renders optional fields", async ({ page }) => {
      // Field labels are not htmlFor-associated — assert the label text.
      // VIN's label renders "VIN (optional)" (label + optional badge).
      await expect(page.getByText(/^vin/i).first()).toBeVisible();
      await expect(page.getByText(/^year$/i).first()).toBeVisible();
      await expect(page.getByText(/odometer/i).first()).toBeVisible();
      await expect(page.getByText(/^engine$/i).first()).toBeVisible();
      await expect(page.getByText(/^notes$/i).first()).toBeVisible();
    });

    test("renders dropdown selects for vehicle specs", async ({ page }) => {
      await expect(page.getByText(/select fuel type/i)).toBeVisible();
      await expect(page.getByText(/select transmission/i)).toBeVisible();
      await expect(page.getByText(/select drivetrain/i)).toBeVisible();
      await expect(page.getByText(/select body type/i)).toBeVisible();
    });

    test("renders Create Vehicle submit button", async ({ page }) => {
      // Create Vehicle is a real submit button (not a Link)
      await expect(
        page.getByRole("button", { name: /create vehicle/i }),
      ).toBeVisible();
    });

    test("Create Vehicle button is initially enabled", async ({ page }) => {
      const createButton = page.getByRole("button", {
        name: /create vehicle/i,
      });
      await expect(createButton).toBeEnabled();
    });

    test("shows validation error when submitting without required fields", async ({
      page,
    }) => {
      const createButton = page.getByRole("button", {
        name: /create vehicle/i,
      });
      await createButton.click();

      // The submit handler validates the owner first — submitting with no
      // customer shows the selectCustomerFirst error before brand/model.
      await expect(
        page.getByText(/search for an existing customer first/i),
      ).toBeVisible({
        timeout: 5000,
      });
    });

    test("back link navigates back to vehicles list", async ({ page }) => {
      const backLink = page.getByRole("link", { name: "Back" });
      await backLink.click();

      await expect(page).toHaveURL(/\/dashboard\/vehicles$/, {
        timeout: 5000,
      });
    });
  });

  test.describe("Vehicle List Navigation", () => {
    test("can navigate from dashboard to vehicles", async ({ page }) => {
      await setEnglishLocale(page);
      await mockSupabaseREST(page);
      await mockOrganizations(page);
      await mockProfile(page);
      await mockPrewarm(page);
      await page.goto("/dashboard");

      await page.getByRole("button", { name: "Vehicles", exact: true }).click();
      await expect(page).toHaveURL(/\/dashboard\/vehicles$/, {
        timeout: 10000,
      });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe("Vehicle Spec Dropdowns", () => {
    test.beforeEach(async ({ page }) => {
      await setEnglishLocale(page);
      await mockSupabaseREST(page);
      await mockOrganizations(page);
      await mockProfile(page);
      await mockPrewarm(page);
      await page.goto("/dashboard/vehicles/new");
      await page
        .getByRole("heading", { name: /add vehicle/i })
        .waitFor({ timeout: 5000 });
    });

    test("fuel type dropdown shows all options", async ({ page }) => {
      const fuelTrigger = page.getByText(/select fuel type/i);
      await fuelTrigger.click();

      await expect(
        page.getByRole("option", { name: "Gasoline" }),
      ).toBeVisible();
      await expect(page.getByRole("option", { name: "Diesel" })).toBeVisible();
      await expect(
        page.getByRole("option", { name: "Electric" }),
      ).toBeVisible();
      await expect(page.getByRole("option", { name: "Hybrid" })).toBeVisible();
      await expect(page.getByRole("option", { name: "LPG" })).toBeVisible();
    });

    test("transmission dropdown shows all options", async ({ page }) => {
      const transTrigger = page.getByText(/select transmission/i);
      await transTrigger.click();

      await expect(
        page.getByRole("option", { name: "Automatic" }),
      ).toBeVisible();
      await expect(page.getByRole("option", { name: "Manual" })).toBeVisible();
      await expect(page.getByRole("option", { name: "CVT" })).toBeVisible();
      await expect(page.getByRole("option", { name: "DCT" })).toBeVisible();
    });

    test("body type dropdown shows all options", async ({ page }) => {
      const bodyTrigger = page.getByText(/select body type/i);
      await bodyTrigger.click();

      await expect(page.getByRole("option", { name: "SUV" })).toBeVisible();
      await expect(page.getByRole("option", { name: "Sedan" })).toBeVisible();
      await expect(
        page.getByRole("option", { name: "Hatchback" }),
      ).toBeVisible();
      await expect(page.getByRole("option", { name: "Truck" })).toBeVisible();
    });
  });
});
