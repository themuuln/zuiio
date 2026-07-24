// Runtime smoke test for ProductCard stock-chip + add-confirmation.
// Runs under `tsx` (no vitest needed) because the workspace vitest@4 /
// vite@5 mismatch blocks `pnpm test`. Covers:
//   1. SSR markup for in-stock / low-stock / trackStock-off states
//   2. Interactive jsdom mount: clicking add shows the confirmation overlay + ring
//
// Run: node_modules/.bin/tsx src/components/shop/__smoke__/product-card.ssr-harness.mts

import { createRequire } from "node:module";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// jsdom ships no bundled types in this workspace; ts-expect-error the import.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error jsdom is untyped in this monorepo
import { JSDOM } from "jsdom";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";

type JSDOMWindow = {
  document: Document;
  HTMLElement: typeof HTMLElement;
  Node: typeof Node;
  MouseEvent: typeof MouseEvent;
  getComputedStyle: typeof getComputedStyle;
};

const require = createRequire(import.meta.url);
const Module = require("node:module");
const originalLoad = Module._load;
let forcedTrackStock = true;

Module._load = function (request: string, parent: unknown, isMain: boolean) {
  if (
    request === "@/app/(dashboard)/shop/cart-context" ||
    /cart-context/.test(request)
  ) {
    const noop = () => {};
    const value = {
      addItem: (...args: unknown[]) => {
        const spy = (
          globalThis as unknown as { __addItemSpy?: (...a: unknown[]) => void }
        ).__addItemSpy;
        return (spy ?? noop)(...args);
      },
      updateQuantity: noop,
      removeItem: noop,
      items: [],
      itemCount: 0,
      totalAmount: 0,
      discountedTotal: 0,
      discount: null,
      clearCart: noop,
      removeDiscount: noop,
      holdSale: noop,
      restoreHeldSale: noop,
      removeHeldSale: noop,
    };
    const Ctx = {
      _currentValue: value,
      Provider: ({ children }: { children: never }) => children,
    };
    return { CartContext: Ctx, useCart: () => value };
  }
  if (request === "@/components/ui/optimized-image") {
    return {
      OptimizedImage: ({ alt }: { alt?: string }) =>
        h("span", { "data-testid": "opt-img" }, alt),
    };
  }
  if (
    request === "@/lib/query/hooks/use-product-variants" ||
    /use-product-variants/.test(request)
  ) {
    return {
      useVariantGroups: () => ({ data: undefined }),
      fetchVariantGroups: () => {},
      fetchVariants: () => {},
    };
  }
  if (
    request === "@/lib/org-settings-context" ||
    /org-settings-context/.test(request)
  ) {
    return {
      useOrgSettings: () => ({ trackStock: forcedTrackStock, currency: "₮" }),
    };
  }
  if (/@tanstack[\\/]react-query$/.test(request)) {
    const real = originalLoad.apply(this, [request, parent, isMain]);
    return { ...real, useQueryClient: () => ({ prefetchQuery: () => {} }) };
  }
  return originalLoad.apply(this, [request, parent, isMain]);
};

const { ProductCard } = (await import("@/components/shop/product-card")) as {
  ProductCard: unknown;
};

(
  globalThis as unknown as { IntersectionObserver: unknown }
).IntersectionObserver = class {
  observe() {}
  disconnect() {}
  unobserve() {}
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function render(
  product: object,
  cartQuantity = 0,
  variant: "card" | "tile" = "card",
) {
  return renderToStaticMarkup(
    h(
      QueryClientProvider as never,
      { client: queryClient },
      h(ProductCard as never, { product, cartQuantity, variant } as never),
    ),
  );
}

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    failures++;
    console.error(`  ✗ ${msg}`);
  } else {
  }
}

const base = {
  id: "p1",
  name: "Тест бүтээгдэхүүн",
  sale_price: 5000,
  current_stock: 10,
  unit: "ш",
  sku: null,
  barcode: null,
  category_id: null,
  image_url: null,
  brand_name: null,
  brand_logo_url: null,
};
{
  forcedTrackStock = true;
  const html = render({ ...base, current_stock: 10 }, 0, "card");
  assert(html.includes("Үлдэгдэл 10 ш"), "renders 'Үлдэгдэл 10 ш'");
  assert(
    html.includes("border-border"),
    "in-stock chip uses neutral border token",
  );
  assert(html.includes("bg-muted"), "in-stock chip uses muted bg token");
}
{
  forcedTrackStock = true;
  const html = render({ ...base, current_stock: 3 }, 0, "card");
  assert(html.includes("Үлдэгдэл 3 ш"), "renders 'Үлдэгдэл 3 ш'");
  assert(
    html.includes("text-destructive"),
    "low-stock chip uses destructive text token",
  );
  assert(
    html.includes("bg-destructive/10"),
    "low-stock chip uses destructive bg token",
  );
}
{
  forcedTrackStock = false;
  const html = render({ ...base, current_stock: 3 }, 0, "card");
  assert(!html.includes("Үлдэгдэл"), "no stock text when trackStock is false");
}
{
  forcedTrackStock = true;
  const html = render({ ...base, current_stock: 10 }, 0, "card");
  assert(
    !html.includes("ring-primary/40"),
    "no justAdded ring before interaction",
  );
  assert(!html.includes("zoom-in-50"), "no check overlay before interaction");
  assert(
    html.includes("Нэмэх") || html.includes("Дахин нэмэх"),
    "add button present initially",
  );
}

// ---------------------------------------------------------------------------
// Interactive test (jsdom): verify add-confirmation overlay + ring appear after
// clicking the add button. SSR can't run effects/handlers, so we mount with
// react-dom/client into a jsdom document and dispatch a click.
// ---------------------------------------------------------------------------
async function interactiveTest() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
  });
  const g = globalThis as unknown as Record<string, unknown>;
  g.window = dom.window;
  g.document = dom.window.document;
  g.HTMLElement = dom.window.HTMLElement;
  g.Node = dom.window.Node;
  g.getComputedStyle = dom.window.getComputedStyle;
  g.IS_REACT_ACT_ENVIRONMENT = true;

  let addedCalls = 0;
  (globalThis as unknown as { __addItemSpy: () => void }).__addItemSpy = () => {
    addedCalls++;
  };

  forcedTrackStock = true;
  const React = await import("react");
  const { createRoot } = await import("react-dom/client");
  const { act } = React;

  const container = dom.window.document.createElement("div");
  dom.window.document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      React.createElement(
        QueryClientProvider as never,
        { client: queryClient },
        React.createElement(ProductCard as never, {
          product: { ...base, current_stock: 10 },
          cartQuantity: 0,
          variant: "card",
        }),
      ),
    );
  });

  const addBtn = Array.from(
    dom.window.document.querySelectorAll("button") as unknown as Element[],
  ).find((b): b is HTMLButtonElement => /Нэмэх/.test(b.textContent ?? ""));
  if (!addBtn) {
    failures++;
    console.error("  ✗ add button not found in DOM");
    return;
  }
  await act(async () => {
    addBtn.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });

  const html = container.innerHTML;
  assert(addedCalls === 1, "addItem called exactly once on click");
  assert(
    html.includes("ring-primary/40"),
    "justAdded ring applied after click",
  );
  assert(
    html.includes("zoom-in-50"),
    "confirmation check overlay shown after click",
  );

  await act(async () => {
    root.unmount();
  });
}

await interactiveTest();

if (failures > 0) {
  console.error(`\nFAILED: ${failures} assertion(s)`);
  process.exit(1);
} else {
  process.exit(0);
}
