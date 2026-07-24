// biome-ignore-all lint/suspicious/noConsole: standalone smoke harness reports assertion results
// Runtime smoke test for mobile category rail behavior.
// Run: node_modules/.bin/tsx src/components/shop/__smoke__/category-chips.runtime-harness.mts

// @ts-expect-error jsdom is untyped in this monorepo
import { JSDOM } from "jsdom";
import { createElement } from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});
const globals = globalThis as unknown as Record<string, unknown>;
globals.window = dom.window;
globals.document = dom.window.document;
globals.HTMLElement = dom.window.HTMLElement;
globals.Node = dom.window.Node;
globals.getComputedStyle = dom.window.getComputedStyle;
globals.IS_REACT_ACT_ENVIRONMENT = true;

const scrollCalls: ScrollIntoViewOptions[] = [];
Object.defineProperty(dom.window.HTMLElement.prototype, "scrollIntoView", {
  configurable: true,
  value(options?: ScrollIntoViewOptions) {
    scrollCalls.push(options ?? {});
  },
});

const React = await import("react");
const { act } = React;
const { createRoot } = await import("react-dom/client");
const { CategoryChips } = await import("@/components/shop/category-chips");

let failures = 0;
function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    return;
  }
  failures += 1;
  console.error(`  ✗ ${message}`);
}

const selections: Array<string | null> = [];
const container = dom.window.document.createElement("div");
dom.window.document.body.appendChild(container);
const root = createRoot(container);

console.log("Category rail — mobile scrolling and selection:");
await act(async () => {
  root.render(
    createElement(CategoryChips, {
      categories: [
        { id: "food", name: "Хүнс" },
        { id: "drink", name: "Ундаа" },
        { id: "home", name: "Гэр ахуй" },
      ],
      selectedId: "drink",
      onSelect: (id) => selections.push(id),
    }),
  );
});

const nav = container.querySelector("nav");
const selected = container.querySelector<HTMLButtonElement>(
  'button[aria-pressed="true"]',
);
assert(
  nav?.getAttribute("aria-label") === "Бүтээгдэхүүний ангилал",
  "rail has an accessible label",
);
assert(
  selected?.textContent === "Ундаа",
  "selected category is exposed with aria-pressed",
);
assert(
  scrollCalls.length === 1,
  "selected category scrolls into view after render",
);
assert(
  scrollCalls[0]?.inline === "center",
  "selected category is centered in the rail",
);
assert(
  nav?.className.includes("touch-pan-x") === true,
  "rail enables horizontal touch panning",
);
assert(
  nav?.className.includes("overscroll-x-contain") === true,
  "rail contains horizontal overscroll",
);

await act(async () => {
  selected?.dispatchEvent(
    new dom.window.MouseEvent("click", { bubbles: true }),
  );
});
assert(
  selections.length === 1 && selections[0] === null,
  "clicking the active chip clears the filter",
);

await act(async () => {
  root.unmount();
});

if (failures > 0) {
  console.error(`\nFAILED: ${failures} assertion(s)`);
  process.exit(1);
}

console.log("\nALL CATEGORY-RAIL ASSERTIONS PASSED");
process.exit(0);
