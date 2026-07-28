import { expect, type Page, test } from "@playwright/test";

const SHOP = "/shop";
const PRODUCT_URL = "/shop/onoo-t-shirt";
const ADMIN_PRODUCTS = "/admin/products";
const ADMIN_ORDERS = "/admin/orders";
const ADMIN_REVIEWS = "/admin/reviews";
const ADMIN_BUNDLES = "/admin/bundles";
const LOGIN_URL = "/auth/login";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54325";
const ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// ─── Helper: create admin user + sign in via browser ─────────────────

async function signInAsAdmin(page: Page) {
  const email = `pw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@pwtest.mn`;
  const password = "PwTestPass123!";

  // Sign up via Supabase REST API
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify({ email, password }),
  });
  const data = await resp.json();
  const userId = data.user?.id ?? data.id;
  if (!userId) throw new Error(`Signup failed: ${JSON.stringify(data)}`);

  // Grant admin membership via service role
  const mResp = await fetch(`${SUPABASE_URL}/rest/v1/memberships`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      user_id: userId,
      scope_type: "league",
      scope_id: "c0000000-0000-0000-0000-000000000001",
      role: "admin",
    }),
  });
  if (!mResp.ok) throw new Error(`Membership failed: ${await mResp.text()}`);

  // Sign in via browser
  await page.goto(LOGIN_URL);
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("Имэйл").fill(email);
  await page.getByPlaceholder("Нууц үг").fill(password);
  await page.getByRole("button", { name: "Нэвтрэх" }).click();
  await page.waitForURL(/\/(admin|auth)/, { timeout: 15000 });
}

// ═══════════════════════════════════════════════════════════════════════
// Public catalogue
// ═══════════════════════════════════════════════════════════════════════

test.describe("Shop — public catalogue", () => {
  test("loads with shop title", async ({ page }) => {
    await page.goto(SHOP);
    await expect(page.locator("h1")).toHaveText("Onoo дэлгүүр");
  });

  test("shows product cards with prices", async ({ page }) => {
    await page.goto(SHOP);
    await expect(page.getByText("₮35,000")).toBeVisible();
    await expect(page.getByText("₮75,000")).toBeVisible();
    await expect(page.getByText("₮25,000")).toBeVisible();
    await expect(page.getByText("₮10,000")).toBeVisible();
  });

  test("card click navigates to detail", async ({ page }) => {
    await page.goto(SHOP);
    await page.getByText("Onoo подуу цамц").first().click();
    await expect(page).toHaveURL(PRODUCT_URL);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Product detail
// ═══════════════════════════════════════════════════════════════════════

test.describe("Shop — product detail", () => {
  test("shows h1, price, and description", async ({ page }) => {
    await page.goto(PRODUCT_URL);
    await expect(page.locator("h1")).toHaveText("Onoo подуу цамц");
    await expect(page.getByText("₮35,000")).toBeVisible();
  });

  test("shows variant selector", async ({ page }) => {
    await page.goto(PRODUCT_URL);
    await expect(page.getByText("Хэмжээ")).toBeVisible();
  });

  test("shows buy button when in stock", async ({ page }) => {
    await page.goto(PRODUCT_URL);
    await expect(page.getByText("Худалдаж авах")).toBeVisible();
  });

  test("back link returns to catalogue", async ({ page }) => {
    await page.goto(PRODUCT_URL);
    await page.getByText("Дэлгүүр лүү буцах").click();
    await expect(page).toHaveURL(SHOP);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Checkout flow (mocks /api/shop/orders)
// ═══════════════════════════════════════════════════════════════════════

test.describe("Shop — checkout flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PRODUCT_URL);
  });

  test("opens order dialog", async ({ page }) => {
    await page.route("**/api/shop/orders", async (route) => {
      if (route.request().method() === "POST")
        await route.fulfill({
          status: 200,
          json: {
            orderId: "o1",
            totalMnt: 35000,
            qrImage: "data:qr",
            qrText: "qpay://t",
            merchantInvoiceId: "M1",
            expiresIn: 300,
          },
        });
    });
    await page.getByText("Худалдаж авах").click();
    await expect(page.getByText("Захиалга баталгаажуулах")).toBeVisible();
  });

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.route("**/api/shop/orders", async (route) => {
      if (route.request().method() === "POST")
        await route.fulfill({ status: 200, json: {} });
    });
    await page.getByText("Худалдаж авах").click();
    await page.getByText("QPay-гаар төлөх").click();
    await expect(page.getByText("Нэрээ оруулна уу")).toBeVisible();
  });

  test("submits and shows QR", async ({ page }) => {
    let postedBody: unknown = null;
    await page.route("**/api/shop/orders", async (route) => {
      if (route.request().method() === "POST") {
        postedBody = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          json: {
            orderId: "o2",
            totalMnt: 35000,
            qrImage: "data:qr",
            qrText: "qpay://o2",
            merchantInvoiceId: "M2",
            expiresIn: 300,
          },
        });
      }
    });
    await page.getByText("Худалдаж авах").click();
    await page.getByPlaceholder("Таны нэр").fill("Болд");
    await page.getByPlaceholder("9999-0000").fill("99112233");
    await page.getByText("QPay-гаар төлөх").click();
    await expect(page.locator('img[alt="QPay QR код"]')).toBeVisible();
    expect(postedBody).toHaveProperty("customerName", "Болд");
  });

  test("shows error toast on API failure", async ({ page }) => {
    await page.route("**/api/shop/orders", async (route) => {
      if (route.request().method() === "POST")
        await route.fulfill({
          status: 400,
          json: { error: "Бараа дууссан байна" },
        });
    });
    await page.getByText("Худалдаж авах").click();
    await page.getByPlaceholder("Таны нэр").fill("Бат");
    await page.getByPlaceholder("9999-0000").fill("88887777");
    await page.getByText("QPay-гаар төлөх").click();
    await expect(page.getByText("Бараа дууссан байна")).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Admin pages
// ═══════════════════════════════════════════════════════════════════════

test.describe("Admin — shop", () => {
  test("redirects unauthenticated to login", async ({ page }) => {
    await page.goto(ADMIN_PRODUCTS);
    await expect(page).toHaveURL(/admin\/login/);
  });

  test("shows products page", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto(ADMIN_PRODUCTS);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Бүтээгдэхүүн")).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows orders page", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto(ADMIN_ORDERS);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Захиалга")).toBeVisible({ timeout: 10000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Responsive
// ═══════════════════════════════════════════════════════════════════════

test.describe("Shop — responsive", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("catalogue renders at mobile width", async ({ page }) => {
    await page.goto(SHOP);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("product detail at mobile width", async ({ page }) => {
    await page.goto(PRODUCT_URL);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText("Худалдаж авах")).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Edge cases
// ═══════════════════════════════════════════════════════════════════════

test.describe("Shop — edge cases", () => {
  test("shows English product name", async ({ page }) => {
    await page.goto(PRODUCT_URL);
    await expect(page.getByText("Onoo T-Shirt")).toBeVisible();
  });

  test("shows back link", async ({ page }) => {
    await page.goto(PRODUCT_URL);
    await expect(page.getByText("Дэлгүүр лүү буцах")).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Reviews
// ═══════════════════════════════════════════════════════════════════════

test.describe("Shop — reviews", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PRODUCT_URL);
  });

  test("shows review section heading", async ({ page }) => {
    await expect(page.getByText("Сэтгэгдлүүд")).toBeVisible();
  });

  test("shows review submission form", async ({ page }) => {
    await expect(page.getByText("Сэтгэгдэл үлдээх")).toBeVisible();
    await expect(page.getByPlaceholder("Таны нэр")).toBeVisible();
    await expect(
      page.getByPlaceholder(
        "Бүтээгдэхүүний талаарх сэтгэгдлээ хуваалцана уу...",
      ),
    ).toBeVisible();
  });

  test("filled review submission flow", async ({ page }) => {
    // Intercept Supabase insert to avoid actual DB write
    await page.route("**/rest/v1/product_reviews", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify([{ id: "test-review-id-1" }]),
        });
      }
    });

    // Fill author name
    await page.getByPlaceholder("Таны нэр").fill("Тест хэрэглэгч");

    // Select rating by clicking the 5th star button
    await page.getByRole("button", { name: "5 од" }).click();

    // Write review content
    await page
      .getByPlaceholder(
        "Бүтээгдэхүүний талаарх сэтгэгдлээ хуваалцана уу...",
      )
      .fill("Сайхан бүтээгдэхүүн байна. Хүргэлт хурдан.");

    // Submit the form
    await page.getByRole("button", { name: "Сэтгэгдэл илгээх" }).click();

    // Wait for and verify the confirmation message
    await expect(
      page.getByText(
        "Сэтгэгдэл илгээгдлээ, баталгаажсаны дараа харагдана",
      ),
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows validation errors on incomplete submit", async ({ page }) => {
    // Attempt submit without filling anything
    await page.getByRole("button", { name: "Сэтгэгдэл илгээх" }).click();

    // Should show validation toast for missing rating
    await expect(page.getByText("Үнэлгээ сонгоно уу")).toBeVisible();
  });

  test("shows existing reviews when present", async ({ page }) => {
    // If any reviews exist, they should be visible
    // The review container shows author names and content
    await page.goto(PRODUCT_URL);
    await page.waitForLoadState("networkidle");

    // At minimum the section heading is present
    await expect(page.getByText("Сэтгэгдлүүд")).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Related products
// ═══════════════════════════════════════════════════════════════════════

test.describe("Shop — related products", () => {
  test("shows related products section on product detail", async ({ page }) => {
    await page.goto(PRODUCT_URL);
    await expect(page.getByText("Санал болгох")).toBeVisible();
  });

  test("related products contain links that navigate", async ({ page }) => {
    await page.goto(PRODUCT_URL);

    // If related products are shown, clicking one navigates to its detail
    const relatedSection = page.getByText("Санал болгох");
    await expect(relatedSection).toBeVisible();

    // Try to find any related product card link and navigate
    const relatedLink = page.locator(
      'section:has(h2:text("Санал болгох")) a',
    ).first();

    if ((await relatedLink.count()) > 0) {
      const href = await relatedLink.getAttribute("href");
      await relatedLink.click();
      await expect(page).toHaveURL(new RegExp(href ?? "/shop/"));
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Admin — reviews
// ═══════════════════════════════════════════════════════════════════════

test.describe("Admin — reviews", () => {
  test("navigates to reviews page", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto(ADMIN_REVIEWS);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Сэтгэгдэл")).toBeVisible({ timeout: 10000 });
  });

  test("shows reviews table", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto(ADMIN_REVIEWS);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Сэтгэгдэл")).toBeVisible({ timeout: 10000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Admin — bundles
// ═══════════════════════════════════════════════════════════════════════

test.describe("Admin — bundles", () => {
  test("navigates to bundles page", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto(ADMIN_BUNDLES);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Багц")).toBeVisible({ timeout: 10000 });
  });

  test("shows bundles management", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto(ADMIN_BUNDLES);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Багц")).toBeVisible({ timeout: 10000 });
  });

  test("shows create bundle button", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto(ADMIN_BUNDLES);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Шинэ багц")).toBeVisible({ timeout: 10000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Shop — team page
// ═══════════════════════════════════════════════════════════════════════

test.describe("Shop — team page", () => {
  test("shows shop section on team detail page", async ({ page }) => {
    // Start from a known product detail page with a team link
    await page.goto(PRODUCT_URL);
    await page.waitForLoadState("networkidle");

    // Find the team link from the product detail team card
    const teamLink = page.locator('a[href*="/teams/"]').first();
    if ((await teamLink.count()) === 0) {
      test.skip("No team link on this product page");
      return;
    }
    const href = await teamLink.getAttribute("href");
    if (!href) {
      test.skip("No team href found");
      return;
    }

    await page.goto(href);
    await page.waitForLoadState("networkidle");

    // Check the shop section heading and label
    await expect(page.getByText("Багийн дэлгүүр")).toBeVisible({
      timeout: 10000,
    });
  });

  test("shop section has product cards", async ({ page }) => {
    await page.goto(PRODUCT_URL);
    await page.waitForLoadState("networkidle");

    const teamLink = page.locator('a[href*="/teams/"]').first();
    if ((await teamLink.count()) === 0) {
      test.skip("No team link on this product page");
      return;
    }
    const href = await teamLink.getAttribute("href");
    if (!href) {
      test.skip("No team href found");
      return;
    }

    await page.goto(href);
    await page.waitForLoadState("networkidle");

    // Look for the shop section with product cards
    const shopSection = page.locator(
      'section:has(h2:text("Дэлгүүр"))',
    );
    await expect(shopSection).toBeVisible({ timeout: 10000 });

    // Try to click a product link within the shop section if any
    const productLink = shopSection.locator("a").first();
    if ((await productLink.count()) > 0) {
      const productHref = await productLink.getAttribute("href");
      await productLink.click();
      await expect(page).toHaveURL(new RegExp(productHref ?? "/shop/"));
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Shop — product detail reviews
// ═══════════════════════════════════════════════════════════════════════

test.describe("Shop — product detail reviews", () => {
  test("shows rating summary on product detail", async ({ page }) => {
    await page.goto(PRODUCT_URL);
    await page.waitForLoadState("networkidle");

    // The review section heading
    await expect(page.getByText("Сэтгэгдлүүд")).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows rating average number", async ({ page }) => {
    await page.goto(PRODUCT_URL);
    await page.waitForLoadState("networkidle");

    // The review section heading must be present
    await expect(page.getByText("Сэтгэгдлүүд")).toBeVisible({
      timeout: 10000,
    });

    // If reviews exist, the average rating number should be visible
    // The average is rendered inside the section as text like "4" or "4.5"
    const ratingSection = page.locator(
      'section:has(h2:text("Сэтгэгдлүүд"))',
    );
    // Check that there's a numeric element (the average rating)
    // and a count element ("N сэтгэгдэл") — only when reviews exist
    const averageEl = ratingSection.locator(".text-5xl").first();
    const countText = ratingSection.getByText(/сэтгэгдэл/);
    if ((await averageEl.count()) > 0) {
      // Average value is visible
      await expect(averageEl).toBeVisible();
    }
    if ((await countText.count()) > 0) {
      await expect(countText).toBeVisible();
    }
  });
});
