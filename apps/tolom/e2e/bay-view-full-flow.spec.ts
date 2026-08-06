import { expect, type Page, test } from "./test-extensions";

// Full bay-view flow involves multiple Supabase round-trips plus a
// production server cold-start. Allow up to 5 minutes per test.
test.setTimeout(300_000);

/** Unique plate per run to avoid collisions */
let uniquePlate: string;

/** Wait for the bay view to finish loading */
async function waitForBayViewReady(page: Page) {
  // Wait for any bay region (empty or occupied) to appear.
  // Use a generous timeout because Supabase can cold-start.
  await expect(
    page.getByRole("region", { name: /bay \d/i }).first(),
  ).toBeVisible({ timeout: 60_000 });
}

/**
 * Find the first empty bay, click the "Click to add vehicle" button,
 * and return the bay number.
 */
async function clickEmptyBay(page: Page): Promise<number> {
  // Look for the first empty bay region (label contains " - empty")
  const emptyBay = page
    .getByRole("region", { name: /bay \d+ - empty/i })
    .first();

  await expect(emptyBay).toBeVisible({ timeout: 30_000 });

  // Extract bay number from the aria-label BEFORE clicking (the element may
  // be detached after the click triggers a dialog).
  let bayNumber = 1;
  try {
    const label = await emptyBay.getAttribute("aria-label");
    const match = label?.match(/Bay (\d+)/i);
    bayNumber = match ? Number.parseInt(match[1], 10) : 1;
  } catch {
    // fallback to bay 1
  }

  // Click the button inside the empty bay to trigger registration.
  // The button text is "click to add vehicle"
  const addBtn = emptyBay.getByRole("button", { name: /click to add/i });
  await expect(addBtn).toBeVisible({ timeout: 5_000 });
  await addBtn.click();

  return bayNumber;
}

/**
 * If the EmptyBayActionDialog appears (queue has items), click
 * the "Register & Assign to Bay #N" action (Mongolian locale) to
 * proceed to the vehicle registration dialog.
 */
async function dismissQueueDialog(page: Page, bayNumber: number) {
  try {
    const dialog = page.getByRole("dialog");
    // The dialog shows two action cards. The first one has text like
    // "Бүртгээд #N буланд байршуулах" (MN) or "Register & Assign to Bay #N" (EN).
    const assignBtn = dialog.getByRole("button", {
      name: new RegExp(
        `бүртгээд.*${bayNumber}.*буланд|register.*assign.*bay.*#${bayNumber}`,
        "i",
      ),
    });
    if (await assignBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await assignBtn.click();
      await page.waitForTimeout(500);
    }
  } catch {
    // No dialog — that's fine
  }
}

/**
 * Complete vehicle registration: enter plate → lookup → fill form → save.
 */
async function registerVehicle(page: Page, bayNumber: number, plate: string) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 15_000 });

  // ── Enter plate number and click Lookup ──
  const plateInput = dialog.getByPlaceholder(/plate number|улсын дугаар/i);
  await expect(plateInput).toBeVisible({ timeout: 5_000 });
  await plateInput.fill(plate);

  await dialog.getByRole("button", { name: /lookup|хайх/i }).click();

  // ── Wait for "Vehicle not found" and the registration form ──
  await expect(dialog.getByText(/vehicle not found|олдсонгүй/i)).toBeVisible({
    timeout: 15_000,
  });

  // ── Fill vehicle fields ──
  // Make (placeholder contains "Toyota" or a brand example)
  const makeInput = dialog.getByPlaceholder(/toyota|бра/i);
  await makeInput.fill("E2E Make");

  // Model (placeholder contains "Prius")
  const modelInput = dialog.getByPlaceholder(/prius|загвар/i);
  await modelInput.fill("E2E Model");

  // Year (placeholder contains "2020")
  const yearInput = dialog.getByPlaceholder(/2020/i);
  await yearInput.fill("2024");

  // Odometer inside "Additional details" — may need to expand
  // Use fill-by-placeholder with "120000" which appears in the odometer placeholder
  const odoInput = dialog.getByPlaceholder(/120000/i);
  if (await odoInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await odoInput.fill("50000");
  }

  // Customer first name (placeholder "e.g. Bat")
  const fnInput = dialog.getByPlaceholder(/bat/i);
  if (await fnInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await fnInput.fill("E2E");
  }

  // Customer last name (placeholder "e.g. Erdene")
  const lnInput = dialog.getByPlaceholder(/erdene/i);
  if (await lnInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await lnInput.fill("Test");
  }

  // Phone (placeholder "e.g. 99112233")
  const phoneInput = dialog.getByPlaceholder(/99112233/i);
  if (await phoneInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await phoneInput.fill("99998888");
  }

  // Complaint textarea
  const complaintInput = dialog.getByPlaceholder(/complaint|гомдол|шалтгаан/i);
  if (await complaintInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await complaintInput.fill("E2E test");
  }

  // ── Click "Save & Assign to Bay #N" ──
  const submitBtn = dialog.getByRole("button", {
    name: new RegExp(
      `save.*assign.*bay.*#${bayNumber}|хадгаад.*${bayNumber}.*буланд`,
      "i",
    ),
  });
  await expect(submitBtn).toBeVisible({ timeout: 5_000 });
  await submitBtn.click();

  // Wait for dialog to close
  await expect(dialog).not.toBeVisible({ timeout: 30_000 });
}

/**
 * Click the action button (Start / Repair / Ready / Complete)
 * on the bay card for the given work order.
 */
async function clickBayButton(page: Page, plate: string, buttonLabel: string) {
  const bay = page.getByRole("region", {
    name: new RegExp(plate, "i"),
  });
  await expect(bay).toBeVisible({ timeout: 15_000 });
  const btn = bay.getByRole("button", { name: new RegExp(buttonLabel, "i") });
  await expect(btn).toBeVisible({ timeout: 10_000 });
  await btn.click();
}

/**
 * Fill and submit the PostServiceDialog (odometer + payment method).
 */
async function submitPostServiceDialog(page: Page) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 15_000 });

  // Fill odometer
  const odo = dialog.getByPlaceholder(/85000|одометр/i);
  if (await odo.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await odo.fill("52000");
  }

  // Select payment method (visible when grand total > 0)
  const paySelect = dialog.getByRole("combobox", {
    name: /payment method|төлбөрийн хэрэгсэл/i,
  });
  if (await paySelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await paySelect.click();
    const cashOpt = page.getByRole("option", { name: /^cash$/i });
    if (await cashOpt.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await cashOpt.click();
    }
  }

  // Submit — button text is "Mark Ready" (EN) or "Авахад бэлэн" (MN)
  const submit = dialog.getByRole("button", {
    name: /^mark ready$|авахад бэлэн/i,
  });
  await expect(submit).toBeVisible({ timeout: 5_000 });
  await submit.click();

  await expect(dialog).not.toBeVisible({ timeout: 30_000 });
}

/**
 * Fill and submit the PickupCompleteDialog (satisfaction + feedback).
 */
async function submitPickupCompleteDialog(page: Page) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 15_000 });

  // Click 5 stars
  const star5 = dialog.getByRole("button", { name: /^5 stars?$/i });
  if (await star5.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await star5.click();
  }

  // Feedback
  const feedback = dialog.getByPlaceholder(/feedback|сэтгэгдэл/i);
  if (await feedback.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await feedback.fill("Great service, thank you!");
  }

  // Click Complete — "Complete" (EN) or "Гүйцэтгэсэн" (MN)
  const completeBtn = dialog.getByRole("button", {
    name: /^complete$|гүйцэтгэсэн/i,
  });
  await expect(completeBtn).toBeVisible({ timeout: 5_000 });
  await completeBtn.click();

  await expect(dialog).not.toBeVisible({ timeout: 15_000 });
}

// ── Main Test ──────────────────────────────────────────────────

test.describe("Bay View Full Flow: Register → Complete", () => {
  test.beforeAll(() => {
    // Create a unique, recognizable Mongolian plate (4 digits + 3 Cyrillic letters)
    const digits = String(Date.now()).slice(-4);
    uniquePlate = `${digits}ТЕС`;
  });

  test("completes full bay view workflow", async ({ page }) => {
    // ── 1. Navigate to bay view ──
    await page.goto("/dashboard/bay-view");
    await waitForBayViewReady(page);

    // ── 2. Click an empty bay ──
    const bayNumber = await clickEmptyBay(page);

    // ── 3. Handle queue dialog if it appears ──
    await dismissQueueDialog(page, bayNumber);

    // ── 4. Register vehicle ──
    await registerVehicle(page, bayNumber, uniquePlate);

    // ── 5. Confirm work order is now in the bay ──
    await expect(
      page.getByRole("region", {
        name: new RegExp(`bay ${bayNumber}.*${uniquePlate}`, "i"),
      }),
    ).toBeVisible({ timeout: 25_000 });

    // ── 6. New → Diagnosing: click "Start" ──
    await clickBayButton(page, uniquePlate, "^start$");
    await page.waitForTimeout(1_500);

    // ── 7. Diagnosing → In Progress: click "Repair" ──
    await clickBayButton(page, uniquePlate, "^repair$");
    await page.waitForTimeout(1_500);

    // ── 8. In Progress → Ready for Pickup: click "Ready" ──
    await clickBayButton(page, uniquePlate, "^ready$");

    // ── 9. Fill & submit PostServiceDialog ──
    await submitPostServiceDialog(page);

    // ── 10. Ready for Pickup → Completed: click "Complete" ──
    await clickBayButton(page, uniquePlate, "^complete$");

    // ── 11. Fill & submit PickupCompleteDialog ──
    await submitPickupCompleteDialog(page);

    // ── 12. Verify no error toasts ──
    await expect(
      page.locator('[role="status"]').filter({ hasText: /error|алдаа/i }),
    ).not.toBeVisible({ timeout: 5_000 });
  });
});
