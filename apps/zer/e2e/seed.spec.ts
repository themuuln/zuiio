import { expect, test } from "./fixture";

/**
 * Midscene AI-powered e2e tests.
 *
 * Runs under the "chromium" project which has pre-authenticated storageState
 * from auth.setup.ts. No login needed — user is already on the dashboard.
 *
 * Each test uses natural language for actions (ai) and assertions (aiAssert),
 * driven by the MiMo V2.5 vision model from your Factory settings.
 *
 * Requires MIDSCENE_MODEL_NAME env var to be set.
 * Run: ./e2e/run-midscene.sh e2e/seed.spec.ts
 */

const hasModelConfig = !!(
  process.env.MIDSCENE_MODEL_NAME || process.env.MIDSCENE_MODEL_API_KEY
);

test.describe("Dashboard — AI Driven", () => {
  test("ai can see dashboard KPIs after login", async ({ page, aiAssert }) => {
    test.skip(
      !hasModelConfig,
      "Set MIDSCENE_MODEL_NAME env var to run AI tests",
    );
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await aiAssert("There is a dashboard with key performance indicators");
    await aiAssert("There are today's sales and expenses shown");
  });

  test("ai can see recent sales on dashboard", async ({ page, aiQuery }) => {
    test.skip(
      !hasModelConfig,
      "Set MIDSCENE_MODEL_NAME env var to run AI tests",
    );
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const recentSales = await aiQuery<
      Array<{ contact: string; amount: number }>
    >(
      "List the recent sales displayed on the dashboard with contact name and amount",
    );
    expect(Array.isArray(recentSales)).toBe(true);
  });
});

test.describe("Products — AI Driven", () => {
  test("ai can navigate to products page and see the table", async ({
    page,
    _ai,
    aiAssert,
  }) => {
    test.skip(
      !hasModelConfig,
      "Set MIDSCENE_MODEL_NAME env var to run AI tests",
    );
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    await aiAssert("There is a table or list of products");
    await aiAssert("The page has a button or link to add a new product");
  });

  test("ai can open the create product drawer", async ({
    page,
    ai,
    aiAssert,
  }) => {
    test.skip(
      !hasModelConfig,
      "Set MIDSCENE_MODEL_NAME env var to run AI tests",
    );
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    await ai(
      'Click the button that says "Шинэ бүтээгдэхүүн" or similar new product button',
    );
    await aiAssert("A drawer or dialog for creating a new product is open");
  });
});

test.describe("Navigation — AI Driven", () => {
  test("ai can navigate between main sections", async ({
    page,
    ai,
    aiAssert,
  }) => {
    test.skip(
      !hasModelConfig,
      "Set MIDSCENE_MODEL_NAME env var to run AI tests",
    );
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await ai('Click on "Борлуулалт" or sales navigation link');
    await aiAssert("The sales page with a list of sales is visible");

    await ai('Click on "Бүтээгдэхүүн" or products navigation link');
    await aiAssert("The products page with a product list is visible");
  });

  test("ai can navigate to settings", async ({ page, ai, aiAssert }) => {
    test.skip(
      !hasModelConfig,
      "Set MIDSCENE_MODEL_NAME env var to run AI tests",
    );
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await ai('Navigate to settings or "Тохиргоо" page');
    await aiAssert(
      "The settings page with profile info and options is visible",
    );
  });
});

test.describe("Reports — AI Driven", () => {
  test("ai can view the reports page", async ({ page, aiAssert, _ai }) => {
    test.skip(
      !hasModelConfig,
      "Set MIDSCENE_MODEL_NAME env var to run AI tests",
    );
    await page.goto("/reports");
    await page.waitForLoadState("networkidle");

    await aiAssert("The reports page with financial summary is visible");
    await aiAssert("There are charts or report data displayed");
  });
});
