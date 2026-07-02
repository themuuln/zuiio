import { ai, heal } from "codeceptjs";

// Register AI healing recipes
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

heal.addRecipe("reloadOnClickFail", {
  priority: 20,
  steps: ["click"],
  fn: async ({ step }: { step: { name: string; args: unknown[] } }) => {
    return ({ I }: { I: CodeceptJS.I }) => {
      I.refreshPage();
      I.wait(1);
      // biome-ignore lint/suspicious/noExplicitAny: dynamic step execution
      (I as any)[step.name](...step.args);
    };
  },
});

export const config: CodeceptJS.Config = {
  name: "zer-e2e",
  noGlobals: true,
  tests: "./e2e/codeceptjs/**/*.test.ts",
  require: ["tsx/cjs"],
  output: "./e2e/codeceptjs/_output",
  timeout: 30000,
  helpers: {
    Playwright: {
      browser: "chromium",
      url: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
      show: process.env.SHOW_BROWSER === "true",
      waitForTimeout: 15000,
      waitForAction: 500,
      waitForNavigation: "networkidle0",
      restart: "session",
      keepCookies: false,
      keepBrowserState: false,
    },
  },
  plugins: {
    heal: {
      enabled: true,
    },
    screenshot: {
      enabled: true,
      on: "fail",
    },
    retryFailedStep: {
      enabled: true,
      retries: 2,
    },
  },
  include: {},
};
