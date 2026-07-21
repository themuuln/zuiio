# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: public-feedback.spec.ts >> Public site — critical flow >> public standings page loads
- Location: e2e/public-feedback.spec.ts:25:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('body')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('body')
    13 × locator resolved to <body>…</body>
       - unexpected value "hidden"

```

```yaml
- navigation:
  - button "previous" [disabled]:
    - img "previous"
  - text: 1/ 1
  - button "next" [disabled]:
    - img "next"
- img
- text: Next.js 16.3.0-preview.6 Turbopack
- dialog "Build Error":
  - text: Build Error
  - button "Copy Error Info":
    - img
  - link "Go to related documentation":
    - /url: https://nextjs.org/docs/messages/module-not-found
    - img
  - button "Attach Node.js inspector":
    - img
  - text: "Module not found: Can't resolve '@zuiio/ui'"
  - img
  - text: ./apps/onoo/src/app/components/game-card.tsx (12:1)
  - button "Open in editor":
    - img
  - text: "Error: Module not found: Can't resolve '@zuiio/ui' 10 | CardTitle, 11 | } from \"@zuiio/ui\"; > 12 | import { Skeleton } from \"@zuiio/ui\"; | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ 13 | import { cn } from \"@/lib/utils\"; 14 | import type { GameWithTeams } from \"../lib/shared\"; 15 | import { formatGameTime } from \"../lib/shared\"; Import trace: Server Component: ./apps/onoo/src/app/components/game-card.tsx ./apps/onoo/src/app/loading.tsx"
  - link "https://nextjs.org/docs/messages/module-not-found":
    - /url: https://nextjs.org/docs/messages/module-not-found
- button "Open Next.js Dev Tools":
  - img
- button "Open issues overlay": 1 Issue
- alert
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | /**
  4  |  * Critical user flow: public pages.
  5  |  *
  6  |  * Onoo is a basketball stats platform. The key public flow is:
  7  |  *   Landing page → View games → View standings → View player stats
  8  |  *
  9  |  * These tests run against the local dev server.
  10 |  */
  11 | 
  12 | test.describe("Public site — critical flow", () => {
  13 |   test("home page loads and shows sports", async ({ page }) => {
  14 |     await page.goto("/");
  15 |     // The page should load without errors
  16 |     await expect(page.locator("body")).toBeVisible();
  17 |   });
  18 | 
  19 |   test("public games page loads", async ({ page }) => {
  20 |     await page.goto("/games");
  21 |     // Should show games list or empty state
  22 |     await expect(page.locator("body")).toBeVisible();
  23 |   });
  24 | 
  25 |   test("public standings page loads", async ({ page }) => {
  26 |     await page.goto("/standings");
> 27 |     await expect(page.locator("body")).toBeVisible();
     |                                        ^ Error: expect(locator).toBeVisible() failed
  28 |   });
  29 | 
  30 |   test("public teams page loads", async ({ page }) => {
  31 |     await page.goto("/teams");
  32 |     await expect(page.locator("body")).toBeVisible();
  33 |   });
  34 | });
  35 | 
```