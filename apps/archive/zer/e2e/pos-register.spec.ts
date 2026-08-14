import { expect, test } from "@playwright/test";

/**
 * POS register E2E — the full cashier loop against the local Supabase stack:
 * login (shared auth.setup storage state) → /pos → tap an in-stock product
 * → charge cash → sale row created (proved via the /sales list) and cart
 * cleared. Skips when the org catalog is empty.
 */

test.setTimeout(120_000);

test("register sells a product end to end", async ({ page }) => {
  // The dashboard-shell instant-validation 500 ("Алдаа гарлаа") can hit
  // the first cold request of any dashboard route — retry once.
  for (let attempt = 1; attempt <= 2; attempt++) {
    await page.goto("/pos", { waitUntil: "domcontentloaded" });
    const heading = page.getByRole("heading", { name: "Касс" });
    const errorHeading = page.getByRole("heading", { name: "Алдаа гарлаа" });
    const [ok, errored] = await Promise.all([
      heading.isVisible().catch(() => false),
      errorHeading.isVisible().catch(() => false),
    ]);
    if (ok) break;
    if (errored && attempt === 1) continue;
    await expect(heading).toBeVisible({ timeout: 45_000 });
    break;
  }
  await expect(page.getByRole("button", { name: "Төлбөр авах" })).toBeVisible();

  // Pick the first in-stock product tile ("Нөөц: N" badge).
  const inStockTile = page.getByRole("button", { name: /Нөөц:/ }).first();
  test.skip(
    (await inStockTile.count()) === 0,
    "org catalog has no in-stock products on the local stack",
  );
  const tileText = await inStockTile.innerText();
  const tileName = tileText.split("\n")[0];
  const tilePrice = tileText.match(/₮[\s\d,]+/)?.[0] ?? "₮ 0";
  await inStockTile.click();

  // Cart line appears; charge it.
  await expect(page.getByRole("heading", { name: "Захиалга" })).toBeVisible();
  await expect(page.getByText(tileName).first()).toBeVisible({
    timeout: 10_000,
  });
  await page.getByRole("button", { name: "Төлбөр авах" }).click();
  await expect(page.getByRole("button", { name: "Батлах" })).toBeVisible({
    timeout: 10_000,
  });

  // Cash: exact tender → confirm. Dialog buttons are clicked via DOM
  // dispatch (react-grab's dev overlay intercepts pointer events on
  // portal content even when hidden — same workaround as
  // e2e/helpers.ts clickInsideDrawer).
  await page
    .getByRole("button", { name: "Бүрэн дүн" })
    .evaluate((el) => (el as HTMLButtonElement).click());
  await expect(page.getByRole("button", { name: "Батлах" })).toBeEnabled();
  await page
    .getByRole("button", { name: "Батлах" })
    .evaluate((el) => (el as HTMLButtonElement).click());

  // Sale lands: success toast + cart cleared.
  await expect(page.getByText("Борлуулалт амжилттай")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("Бүтээгдэхүүн нэмээрэй")).toBeVisible({
    timeout: 10_000,
  });

  // DB proof via UI: newest sale in /sales shows the charged total and a
  // completed status (the sales table renders totals, not product names).
  await page.goto("/sales", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Дууссан").first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(tilePrice).first()).toBeVisible();
});
