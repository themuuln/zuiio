import type { Page } from "@playwright/test";

/**
 * Opens a drawer by clicking the trigger button that contains the given text.
 * Uses page.evaluate for reliable DOM click through Base UI + Radix Slot.
 */
export async function openDrawerByText(page: Page, text: string) {
  const result = await page.evaluate((btnText) => {
    const buttons = document.querySelectorAll("button");
    for (const btn of buttons) {
      if (btn.textContent?.trim().includes(btnText)) {
        btn.click();
        return `clicked: ${btn.textContent.trim()}`;
      }
    }
    return "not found";
  }, text);
  if (result === "not found") {
    console.log(`[openDrawerByText] Button "${text}" not found`);
  }
  await page.waitForTimeout(1000);
}

/**
 * Submits a form inside a Base UI Drawer by dispatching a submit event.
 * Dispatches a native submit event on the form, which React/RHF intercepts
 * via handleSubmit. This avoids Base UI Portal + Playwright click conflicts.
 * @param page Playwright page
 * @param formId The `id` attribute of the form element to submit
 */
export async function submitDrawerForm(page: Page, formId: string) {
  await page.waitForTimeout(1500); // Wait for drawer animation
  const result = await page.evaluate((fid) => {
    const form = document.getElementById(fid) as HTMLFormElement | null;
    if (!form) return { ok: false, error: `form #${fid} not found` };
    const evt = new Event("submit", { bubbles: true, cancelable: true });
    const prevented = !form.dispatchEvent(evt);
    return { ok: true, prevented };
  }, formId);
  if (!result.ok) console.log(`[submitDrawerForm] ${result.error}`);
  await page.waitForTimeout(3000);
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
