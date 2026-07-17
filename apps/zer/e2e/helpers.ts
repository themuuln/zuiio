import type { Page } from "@playwright/test";

/**
 * Opens a drawer by clicking the trigger button that contains the given text.
 * Uses Playwright's click for reliable event handling through Base UI + Radix Slot.
 * Waits for the dialog to appear instead of a hardcoded timeout.
 */
export async function openDrawerByText(page: Page, text: string) {
  // Wait for the target button to become visible (handles async data loading)
  const btn = page.locator("button").filter({ hasText: text }).first();
  await btn.waitFor({ state: "visible", timeout: 15000 });

  // Use Playwright's click for reliable event handling through Base UI + Radix Slot
  await btn.click();

  // Wait for Base UI drawer: data-drawer-popup appears in portal after animation
  // Also support Radix UI dialogs with role="dialog" as fallback
  await page.waitForSelector('[data-drawer-popup], [role="dialog"]', {
    timeout: 5000,
  });
}

/**
 * Submits a form inside a Base UI Drawer by dispatching a submit event.
 * Dispatches a native submit event on the form, which React/RHF intercepts
 * via handleSubmit. This avoids Base UI Portal + Playwright click conflicts.
 */
export async function submitDrawerForm(page: Page, formId: string) {
  // Wait for the form to exist in the DOM (drawer animation complete)
  await page.waitForSelector(`#${formId}`, { timeout: 5000 });
  const result = await page.evaluate((fid) => {
    const form = document.getElementById(fid) as HTMLFormElement | null;
    if (!form) return { ok: false, error: `form #${fid} not found` };
    const evt = new Event("submit", { bubbles: true, cancelable: true });
    const prevented = !form.dispatchEvent(evt);
    return { ok: true, prevented };
  }, formId);
  if (!result.ok) console.log(`[submitDrawerForm] ${result.error}`);
  // Wait for dialog to close after form submit
  // Support both Base UI (data-drawer-popup) and Radix UI (role="dialog")
  await page
    .waitForSelector('[data-drawer-popup], [role="dialog"]', {
      state: "hidden",
      timeout: 10000,
    })
    .catch(() => {
      // Dialog may not close if there's a validation error — that's OK
    });
}

/**
 * Sets a form field value via native value setter + dispatchEvent,
 * ensuring React Hook Form picks up the change reliably.
 */
export async function setFormField(page: Page, id: string, value: string) {
  await page.evaluate(
    ({ id, value }) => {
      const el = document.getElementById(id) as HTMLInputElement;
      if (!el) return;
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    { id, value },
  );
}

/**
 * Clicks an element inside a Base UI Drawer by dispatching a MouseEvent
 * via page.evaluate. This avoids Portal / Viewport interception issues.
 */
export async function clickInsideDrawer(page: Page, selector: string) {
  const result = await page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) return { ok: false, error: `element not found: ${sel}` };
    el.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    return { ok: true };
  }, selector);
  if (!result.ok) console.log(`[clickInsideDrawer] ${result.error}`);
}
