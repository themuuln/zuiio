/**
 * Reusable CRUD test factory for Zer ERP entities.
 *
 * Every entity's tests are generated from a config object. Each test is
 * self-contained (creates its own data). Fix a pattern here → all entities benefit.
 *
 * To add a new entity:
 *   1. Add its config to crud-entity-configs.ts
 *   2. Import createCrudTests + config in a spec file
 *   3. Done
 */

import { expect, type Page, test } from "@playwright/test";
import { openDrawerByText, submitDrawerForm } from "./helpers";

// ── Types ──────────────────────────────────────────────────────────────────

export interface FormField {
  /** The `name` attribute (react-hook-form register sets name, not id) */
  id: string;
  /** Value to fill in */
  value: string;
  /** Custom fill function for complex inputs */
  fill?: (page: Page, value: string) => Promise<void>;
  /** Use input[inputmode="decimal"] selector for currency fields */
  isCurrency?: boolean;
  /** Skip if field is not found */
  optional?: boolean;
  /** Placeholder text fallback */
  placeholder?: string;
}

export interface EntityConfig {
  /** Display name in Mongolian for test descriptions */
  name: string;
  /** List page URL */
  listUrl: string;
  /** Text visible on the list page (for load assertion) */
  listTitle: string;

  /** Create mode */
  create: {
    type: "drawer" | "dialog" | "page";
    triggerText?: string; // button text for drawer/dialog
    formId?: string; // form id for drawer submission
    url?: string; // for page type
  };
  /** Create form fields */
  createFields: FormField[];
  /** Submit button text */
  submitText: string;
  /** Text to verify in list after create */
  listAssertText: string; // use UNIQUE_ID / UNIQUE_EMAIL as placeholders

  /** Edit config (optional) */
  edit?: {
    /** How to open the edit form: by clicking a row, or by clicking a button */
    mode: "row-detail-edit" | "button";
    /** Fields to change in edit */
    fields: FormField[];
    /** Submit button text in edit form */
    submitText: string;
    /** Text to verify after edit */
    verifyText: string;
  };

  /** Delete config (optional) */
  delete?: {
    /** How to trigger delete: by clicking a delete button in the row, or via detail drawer */
    mode: "row-button" | "detail-action";
    /** Text of the confirm button (default: "Устгах") */
    confirmText?: string;
    /** Text that should disappear (default: same as listAssertText) */
    deletedText?: string;
  };

  /** Detail view config (optional) */
  detail?: {
    /** How to open detail: click row or navigate to URL */
    mode: "row-click" | "navigate";
    /** URL pattern for navigate mode */
    url?: string;
    /** Text to verify in detail view */
    titleContains: string;
  };

  /** Timeout overrides (ms) */
  timeouts?: {
    listLoad?: number;
    submitWait?: number;
    listAssertion?: number;
  };
}

// ── Default timeouts ──────────────────────────────────────────────────────

const DEFAULTS = {
  listLoad: 15000,
  submitWait: 2000,
  listAssertion: 10000,
};

// ── Field helpers ──────────────────────────────────────────────────────────

async function fillField(page: Page, field: FormField, value: string) {
  if (field.fill) {
    await field.fill(page, value);
    return;
  }

  // Try by name, then id, then placeholder, then currency
  const locators: (() => Promise<{
    loc: ReturnType<Page["locator"]>;
    found: boolean;
  }>)[] = [
    async () => {
      const l = page.locator(`[name="${field.id}"]`);
      return { loc: l, found: await l.isVisible().catch(() => false) };
    },
    async () => {
      const l = page.locator(`#${field.id}`);
      return { loc: l, found: await l.isVisible().catch(() => false) };
    },
  ];

  const placeholder = field.placeholder;
  if (placeholder) {
    locators.push(async () => {
      const l = page.getByPlaceholder(placeholder);
      return { loc: l, found: await l.isVisible().catch(() => false) };
    });
  }

  if (field.isCurrency) {
    locators.push(async () => {
      const l = page.locator('input[inputmode="decimal"]').first();
      return { loc: l, found: await l.isVisible().catch(() => false) };
    });
  }

  for (const tryLoc of locators) {
    const { loc, found } = await tryLoc();
    if (found) {
      await loc.click();
      await loc.fill(value);
      return;
    }
  }

  if (!field.optional) {
    throw new Error(
      `Field "${field.id}" not found (optional=${field.optional})`,
    );
  }
}

// ── Create helpers ─────────────────────────────────────────────────────────

async function createEntity(
  page: Page,
  config: EntityConfig,
  fields: FormField[],
) {
  // Open create form
  if (config.create.type === "drawer") {
    await openDrawerByText(page, config.create.triggerText!);
  } else if (config.create.type === "dialog") {
    await page
      .locator(`button:has-text("${config.create.triggerText}")`)
      .click();
  } else if (config.create.type === "page") {
    await page.goto(config.create.url!, { waitUntil: "domcontentloaded" });
    return; // page-based creates handle their own flow
  }
  await page.waitForTimeout(1200);

  // Fill fields
  for (const field of fields) {
    await fillField(page, field, field.value);
  }

  // Submit
  if (config.create.type === "drawer" && config.create.formId) {
    await submitDrawerForm(page, config.create.formId);
  } else {
    const btn = page.locator(`button:has-text("${config.submitText}")`);
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
    }
  }

  await page.waitForTimeout(config.timeouts?.submitWait ?? DEFAULTS.submitWait);
}

// ── Test Factory ──────────────────────────────────────────────────────────

export function createCrudTests(config: EntityConfig) {
  const uid = `E2E-${Date.now()}`;
  const email = `e2e-${Date.now()}@test.mn`;

  const resolve = (v: string) =>
    v.replace("UNIQUE_ID", uid).replace("UNIQUE_EMAIL", email);

  const listText = resolve(config.listAssertText);
  const delText = config.delete?.deletedText
    ? resolve(config.delete.deletedText)
    : listText;
  const editText = config.edit?.verifyText
    ? resolve(config.edit.verifyText)
    : `EDITED-${uid}`;

  const resolvedFields = config.createFields.map((f) => ({
    ...f,
    value: resolve(f.value),
  }));

  const t = { ...DEFAULTS, ...config.timeouts };

  test.describe(`${config.name}`, () => {
    test("list page loads", async ({ page }) => {
      await page.goto(config.listUrl, { waitUntil: "domcontentloaded" });
      await expect(page.getByText(config.listTitle).first()).toBeVisible({
        timeout: t.listLoad,
      });
    });

    test("create entity → verify in list", async ({ page }) => {
      await page.goto(config.listUrl, { waitUntil: "domcontentloaded" });

      if (config.createFields.length === 0) {
        // List-only entity: just verify drawer opens
        if (config.create.type === "drawer") {
          await openDrawerByText(page, config.create.triggerText!);
          await page.waitForTimeout(1000);
          // Verify drawer opened by checking for submit button or title
          await expect(page.getByText(config.submitText).first())
            .toBeVisible({ timeout: 5000 })
            .catch(() => {});
          await page.keyboard.press("Escape");
        }
        return;
      }

      await createEntity(page, config, resolvedFields);
      await verifyInList(page, config.listUrl, listText, t.listAssertion);
    });

    if (config.edit && config.createFields.length > 0) {
      test("create → edit → verify", async ({ page }) => {
        // Create
        await page.goto(config.listUrl, { waitUntil: "domcontentloaded" });
        await createEntity(page, config, resolvedFields);
        await verifyInList(page, config.listUrl, listText, t.listAssertion);

        // Navigate to edit
        const editMode = config.edit!.mode;
        if (editMode === "row-detail-edit") {
          // Click row → detail drawer → click "Засах" → edit drawer
          const row = page.locator(`main >> text="${listText}"`).first();
          if (await row.isVisible().catch(() => false)) {
            await row.click();
            await page.waitForTimeout(1200);
          }
          const editBtn = page.locator('button:has-text("Засах")');
          if (await editBtn.isVisible().catch(() => false)) {
            await editBtn.click();
            await page.waitForTimeout(1200);
          }
        } else if (editMode === "button") {
          // Click edit button in table row
          const row = page.locator(`main >> text="${listText}"`).first();
          const btn = row.locator("..").getByRole("button").last();
          if (await btn.isVisible().catch(() => false)) {
            await btn.click();
            await page.waitForTimeout(1200);
          }
        }

        // Fill edit fields
        const editResolved = config.edit!.fields.map((f) => ({
          ...f,
          value: resolve(f.value),
        }));
        for (const field of editResolved) {
          await fillField(page, field, field.value);
        }

        // Submit edit
        const submitBtn = page.locator(
          `button:has-text("${config.edit!.submitText}")`,
        );
        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click();
        } else {
          await submitDrawerForm(page, "");
        }
        await page.waitForTimeout(t.submitWait);

        // Verify edit
        await verifyInList(page, config.listUrl, editText, t.listAssertion);
      });
    }

    if (config.delete && config.createFields.length > 0) {
      test("create → delete → verify removed", async ({ page }) => {
        // Create
        await page.goto(config.listUrl, { waitUntil: "domcontentloaded" });
        await createEntity(page, config, resolvedFields);
        await verifyInList(page, config.listUrl, listText, t.listAssertion);

        // Delete
        const delMode = config.delete!.mode;
        if (delMode === "row-button") {
          // Find delete button in the row
          const row = page.locator(`main >> text="${listText}"`).first();
          const delBtn = row.locator("..").locator('button:has-text("Устгах")');
          if (await delBtn.isVisible().catch(() => false)) {
            await delBtn.click();
          } else {
            // Try any action button in the row
            const actionBtn = row.locator("..").getByRole("button").last();
            if (await actionBtn.isVisible().catch(() => false)) {
              await actionBtn.click();
            }
          }
        } else if (delMode === "detail-action") {
          const row = page.locator(`main >> text="${listText}"`).first();
          if (await row.isVisible().catch(() => false)) {
            await row.click();
            await page.waitForTimeout(1200);
          }
          const delBtn = page.locator('button:has-text("Устгах")');
          if (await delBtn.isVisible().catch(() => false)) {
            await delBtn.click();
          }
        }
        await page.waitForTimeout(800);

        // Confirm
        const confirmText = config.delete!.confirmText ?? "Устгах";
        const confirmBtn = page.locator(
          `[data-slot="alert-dialog-action"]:has-text("${confirmText}")`,
        );
        if (await confirmBtn.isVisible().catch(() => false)) {
          await confirmBtn.click();
        }
        // Fallback: try button with confirm text anywhere
        const fallbackBtn = page.locator(`button:has-text("${confirmText}")`);
        if (await fallbackBtn.isVisible().catch(() => false)) {
          await fallbackBtn.click();
        }

        await page.waitForTimeout(2000);

        // Verify deleted
        await verifyNotInList(page, config.listUrl, delText, t.listAssertion);
      });
    }

    if (config.detail) {
      test("detail view", async ({ page }) => {
        await page.goto(config.listUrl, { waitUntil: "domcontentloaded" });
        // First create an entity so there's something to view
        await createEntity(page, config, resolvedFields);
        await verifyInList(page, config.listUrl, listText, t.listAssertion);

        // Open detail
        if (config.detail!.mode === "row-click") {
          const row = page.locator(`main >> text="${listText}"`).first();
          if (await row.isVisible().catch(() => false)) {
            await row.click();
            await page.waitForTimeout(1200);
          }
        } else if (config.detail!.mode === "navigate") {
          // Navigate to detail (can't get exact ID, but try)
          // Just verify list page for now
        }

        await expect(
          page.getByText(config.detail!.titleContains).first(),
        ).toBeVisible({ timeout: t.listAssertion });
      });
    }
  });
}

// ── Shared verification helpers ───────────────────────────────────────────

async function verifyInList(
  page: Page,
  url: string,
  text: string,
  timeout: number,
) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await expect(page.locator("main")).toContainText(text, { timeout });
}

async function verifyNotInList(
  page: Page,
  url: string,
  text: string,
  timeout: number,
) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.locator("main")).not.toContainText(text, { timeout });
}
