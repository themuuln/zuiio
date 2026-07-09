# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tolom/e2e/appointments-crud.spec.ts >> Appointments CRUD (Mocked) >> loads appointments list
- Location: tolom/e2e/appointments-crud.spec.ts:21:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/dashboard/appointments", waiting until "load"

```

# Test source

```ts
  1  | import { expect, test } from "./test-extensions";
  2  | import { setEnglishLocale } from "./helpers";
  3  | import {
  4  |   mockSupabaseREST,
  5  |   mockAppointments,
  6  |   mockCrudMutations,
  7  | } from "./mocks";
  8  | import { appointmentFixture } from "./fixtures";
  9  | 
  10 | test.setTimeout(15_000);
  11 | 
  12 | test.describe("Appointments CRUD (Mocked)", () => {
  13 |   test.beforeEach(async ({ page }) => {
  14 |     await setEnglishLocale(page);
  15 |     await mockSupabaseREST(page);
  16 |     await mockAppointments(page, [appointmentFixture({ status: "scheduled" })]);
  17 |     await mockCrudMutations(page, "appointments");
> 18 |     await page.goto("/dashboard/appointments");
     |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  19 |   });
  20 | 
  21 |   test("loads appointments list", async ({ page }) => {
  22 |     await expect(
  23 |       page.getByRole("heading", { level: 1 }).or(
  24 |         page.getByText(/appointment/i),
  25 |       ).first(),
  26 |     ).toBeVisible({ timeout: 10_000 });
  27 |   });
  28 | 
  29 |   test("shows appointments content", async ({ page }) => {
  30 |     await expect(
  31 |       page.getByText(/appointment|schedule|calendar/i).first(),
  32 |     ).toBeVisible({ timeout: 10_000 });
  33 |   });
  34 | 
  35 |   test("new appointment button triggers form", async ({ page }) => {
  36 |     const newBtn = page.locator("button").filter({ hasText: /appointment/i }).first();
  37 |     await newBtn.click();
  38 |     await expect(
  39 |       page.getByRole("dialog").or(
  40 |         page.getByText(/vehicle|customer|date|time/i),
  41 |       ).first(),
  42 |     ).toBeVisible({ timeout: 10_000 });
  43 |   });
  44 | });
  45 | 
```