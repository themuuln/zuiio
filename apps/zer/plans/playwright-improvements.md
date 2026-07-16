# Playwright E2E Improvements

## Context

Our 40-file E2E suite (172 tests) works but has reliability and quality gaps: 146 hardcoded `waitForTimeout` calls, zero API mocking, no visual regression, no video/screenshot-on-failure config, no `test.step()` for structured reports, and CSS selectors where semantic locators should be used. This plan addresses the high and medium impact items from the gap analysis.

## Files to Change

| File | Action | What Changes |
|------|--------|--------------|
| `playwright.config.ts` | Modify | Add `screenshot: "only-on-failure"`, `video: "on-first-retry"`, `screenshotPath` |
| `e2e/fixture.ts` | Modify | Extend with custom fixtures: `appPage` (auto-goto with domcontentloaded), `mockPage` (page with route mocking), typed `expect` |
| `e2e/helpers.ts` | Modify | Replace `waitForTimeout` with `waitForSelector`/`waitForResponse` in `openDrawerByText` and `submitDrawerForm` |
| `e2e/app-smoke.spec.ts` | Modify | Add `test.step()` for each page, add `test.beforeEach`, add console error capture |
| `e2e/auth.setup.ts` | No change | Already has retry logic |
| `e2e/auth-flows.spec.ts` | Modify | Use `test.step()`, `toHaveText`, `toHaveValue` |
| `e2e/crud-products.spec.ts` | Modify | Replace CSS selectors with `getByRole`/`getByLabel`, use `test.step()` |
| `e2e/sidebar-navigation.spec.ts` | Modify | Use `test.step()`, `toHaveText` for exact matches |
| `e2e/shop-checkout.spec.ts` | Modify | Use `test.step()` |
| `e2e/settings-smtp.spec.ts` | Modify | Use `test.step()` |
| `e2e/restock-deep-flows.spec.ts` | Modify | Replace `page.evaluate` DOM hacks with locator APIs |
| `e2e/accounting.spec.ts` | Modify | Replace `page.evaluate` with locator APIs where possible |

## Implementation Order

### Phase 1: Config + Fixtures (foundation)

1. **`playwright.config.ts`** — Add `screenshot: "only-on-failure"`, `video: "on-first-retry"`
2. **`e2e/fixture.ts`** — Create custom fixtures:
   - `appPage`: wraps `page` with auto `goto(baseURL)` + `domcontentloaded`, replaces the repeated `page.goto(url, { waitUntil: "domcontentloaded" })` pattern
   - `expect`: re-exported with `configure({ timeout: 10000 })` default

### Phase 2: Helpers (reliability)

3. **`e2e/helpers.ts`** — Fix anti-patterns:
   - `openDrawerByText`: replace `waitForTimeout(1200)` with `page.waitForSelector('[role="dialog"]')` or `page.waitForResponse`
   - `submitDrawerForm`: replace `waitForTimeout(500)` with `page.waitForFunction` on form existence
   - `setFormField`: already good (uses evaluate correctly for React)

### Phase 3: Test improvements (quality)

4. **`e2e/app-smoke.spec.ts`** — Restructure with `test.step()`, add console error listener
5. **`e2e/auth-flows.spec.ts`** — Use `test.step()`, `toHaveText`, `toHaveValue`
6. **`e2e/crud-products.spec.ts`** — Replace `#name`, `#sku` CSS selectors with `getByLabel`
7. **`e2e/sidebar-navigation.spec.ts`** — Use `toHaveText` for exact text matching
8. Other spec files — Apply `test.step()` to the 5 most-used spec files

### Phase 4: Verification

9. Run `npx playwright test --reporter=list --project=chromium` — all 172 tests must still pass
10. Run `npx playwright test --reporter=html` — verify HTML report shows steps
11. Check `playwright-report/` for screenshot and video artifacts

## Edge Cases

- Custom fixtures must not break existing `fixture.ts` (Midscene) import — extend, don't replace
- `waitForTimeout` removal must not cause new flakiness — each replacement must be verified
- CSS selector → semantic locator changes must be tested against Base UI portals (drawers)
- Video recording adds disk usage — `on-first-retry` limits to only failed-then-retried tests

## Verification

1. `npx playwright test --project=chromium --reporter=list` — 172 pass, 0 fail
2. `npx playwright test --project=auth-test --reporter=list` — auth tests pass
3. `npx playwright test --reporter=html` — open HTML report, verify steps visible
4. Check `test-results/` for `.png` screenshots and `.webm` videos on any failures
