import { heal, ai } from "codeceptjs";

/**
 * AI-powered healing recipe for CodeceptJS tests.
 *
 * When a step fails (click, fillField, selectOption, etc.),
 * this sends the error + page HTML to your configured AI model
 * to generate a fix automatically.
 *
 * Requires an AI provider — see https://codecept.io/heal/ai
 *
 * Usage: npx codeceptjs run --ai
 */

heal.addRecipe("ai", {
  priority: 10,
  prepare: {
    html: ({ I }: { I: CodeceptJS.I }) => I.grabHTMLFrom("body"),
  },
  steps: [
    "click",
    "fillField",
    "appendField",
    "selectOption",
    "attachFile",
    "checkOption",
    "uncheckOption",
    "doubleClick",
  ],
  fn: async (args: Record<string, unknown>) => {
    return ai.healFailedStep(args);
  },
});

/**
 * Basic healing recipe: if a click fails, reload the page and retry.
 */
heal.addRecipe("reloadOnClickFail", {
  priority: 20,
  steps: ["click"],
  fn: async ({ step }: { step: { name: string; args: unknown[] } }) => {
    return ({ I }: { I: CodeceptJS.I }) => {
      I.refreshPage();
      I.wait(1);
      (I as any)[step.name](...step.args);
    };
  },
});
