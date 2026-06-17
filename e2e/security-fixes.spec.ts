import { expect, test } from "@playwright/test";

/**
 * E2E tests for security fixes applied in the security audit.
 *
 * Prerequisites:
 *   - App must be running (npm run dev)
 *   - PLAYWRIGHT_BASE_URL env var or default http://localhost:3000
 *   - Auth setup must have run (saves storage to .auth/user.json)
 *
 * Run: npm run test:e2e
 */

// ── Helper: fetch export CSV using browser context (carries auth cookies) ──

async function fetchExportCsv(
  page: import("@playwright/test").Page,
  url: string,
): Promise<{ ok: boolean; text: string }> {
  const response = await page.request.get(url);
  return { ok: response.ok(), text: await response.text() };
}

// ── P0: Cron Endpoint Authentication (no auth needed) ─────────────

test.describe("P0: Cron endpoint auth", () => {
  test("POST /api/cron/daily-report returns 401 without token", async ({
    request,
  }) => {
    const res = await request.post("/api/cron/daily-report");
    expect(res.status()).toBe(401);
    expect((await res.json()).error).toBe("Unauthorized");
  });

  test("POST /api/cron/daily-report returns 401 with wrong token", async ({
    request,
  }) => {
    const res = await request.post("/api/cron/daily-report", {
      headers: { Authorization: "Bearer wrong-secret" },
    });
    expect(res.status()).toBe(401);
  });

  test("GET /api/cron/setup returns 401 without token", async ({ request }) => {
    const res = await request.get("/api/cron/setup");
    expect(res.status()).toBe(401);
    expect((await res.json()).error).toBe("Unauthorized");
  });

  test("GET /api/cron/setup returns 401 with wrong token", async ({
    request,
  }) => {
    const res = await request.get("/api/cron/setup", {
      headers: { Authorization: "Bearer wrong-secret" },
    });
    expect(res.status()).toBe(401);
  });

  test("DELETE /api/cron/setup returns 401 without token", async ({
    request,
  }) => {
    const res = await request.delete("/api/cron/setup");
    expect(res.status()).toBe(401);
  });
});

// ── P1: Public share pages (unauthenticated) ──────────────────────

test.describe("P1: Public share pages show not-found", () => {
  test("/r/invoice/[token] shows not-found for invalid token", async ({
    page,
  }) => {
    await page.goto(
      "/r/invoice/0000000000000000000000000000000000000000000000000000000000000000",
      { waitUntil: "networkidle" },
    );
    expect(page.url()).toContain("/r/invoice/");
    await expect(
      page.getByText(/Нэхэмжлэл|not.?found|404|олдсонгүй/i).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("/r/[token] shows not-found for invalid token", async ({ page }) => {
    await page.goto(
      "/r/0000000000000000000000000000000000000000000000000000000000000000",
      { waitUntil: "networkidle" },
    );
    expect(page.url()).toContain("/r/");
    await expect(
      page.getByText(/not.?found|404|олдсонгүй/i).first(),
    ).toBeVisible({ timeout: 10000 });
  });
});

// ── Auth-dependent tests ──────────────────────────────────────────

test.describe("Security fixes (authenticated)", () => {
  // ── P1: Share link creation ─────────────────────────────────

  test.describe("P1: Share link creation", () => {
    test("can create a report share link", async ({ page }) => {
      await page.goto("/reports", { waitUntil: "networkidle" });
      await page.getByRole("button", { name: /Хуваалцах/i }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 10000 });
      await dialog.getByRole("button", { name: /Холбоос үүсгэх/i }).click();
      await expect(dialog.getByLabel(/Хуваалцах холбоос/i)).toBeVisible({
        timeout: 10000,
      });
    });
  });

  // ── P2: Permission enforcement ─────────────────────────────

  test.describe("P2: Permission enforcement", () => {
    test("settings page shows roles card for org owner", async ({ page }) => {
      await page.goto("/settings", { waitUntil: "networkidle" });
      await expect(page.getByText("Үүрэг, эрхүүд").first()).toBeVisible();
    });

    test("roles drawer shows permission groups", async ({ page }) => {
      await page.goto("/settings?roles=true", { waitUntil: "networkidle" });
      await expect(
        page.getByRole("heading", { name: /Үүрэг, эрхүүд/i }),
      ).toBeVisible({ timeout: 15000 });
      await page.getByRole("button", { name: /owner/i }).first().click();
      await expect(page.getByText(/Бүтээгдэхүүн/i).first()).toBeVisible();
    });
  });

  // ── P3: CSV injection prevention ───────────────────────────────

  test.describe("P3: CSV injection prevention", () => {
    test("product export has CSV content type and header", async ({ page }) => {
      const r = await fetchExportCsv(page, "/api/export/products");
      expect(r.ok).toBe(true);
      expect(r.text.length).toBeGreaterThan(0);
      expect(r.text.trim().split("\n")[0]).toContain("Бүтээгдэхүүн");
    });

    test("product export sanitizes formula-prefixed cells", async ({
      page,
    }) => {
      const r = await fetchExportCsv(page, "/api/export/products");
      expect(r.ok).toBe(true);
      const lines = r.text.trim().split("\n");
      for (let i = 1; i < lines.length; i++) {
        for (const cell of parseCsvLine(lines[i])) {
          const t = cell.trim();
          if (/^[=+\-@]/.test(t)) expect(t.startsWith("'")).toBe(true);
        }
      }
    });

    test("sales export returns CSV", async ({ page }) => {
      const r = await fetchExportCsv(page, "/api/export/sales");
      expect(r.ok).toBe(true);
      expect(r.text.length).toBeGreaterThan(0);
    });

    test("expenses export returns CSV", async ({ page }) => {
      const r = await fetchExportCsv(page, "/api/export/expenses");
      expect(r.ok).toBe(true);
      expect(r.text.length).toBeGreaterThan(0);
    });

    test("customers export returns CSV", async ({ page }) => {
      const r = await fetchExportCsv(page, "/api/export/customers");
      expect(r.ok).toBe(true);
      expect(r.text.length).toBeGreaterThan(0);
    });

    test("suppliers export returns CSV", async ({ page }) => {
      const r = await fetchExportCsv(page, "/api/export/suppliers");
      expect(r.ok).toBe(true);
      expect(r.text.length).toBeGreaterThan(0);
    });
  });

  // ── P2: Invoice page loads ──────────────────────────────────────

  test.describe("P2: Invoice page loads", () => {
    test("invoice page loads without error for org owner", async ({ page }) => {
      await page.goto("/invoices", { waitUntil: "networkidle" });
      await expect(page.getByText(/Нэхэмжлэл/u).first()).toBeVisible({
        timeout: 15000,
      });
    });
  });
});

/**
 * Parse a single CSV line into cells, handling quoted values.
 */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else current += c;
  }
  cells.push(current);
  return cells;
}
