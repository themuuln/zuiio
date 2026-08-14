import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { useWishlist, WishlistProvider } from "./wishlist-context";

const STORAGE_KEY = "wishlist:test-shop";

// jsdom in this setup has no localStorage — install the repo-standard mock.
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();

beforeAll(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    configurable: true,
  });
});

type WishlistApi = {
  items: string[];
  count: number;
  isWishlisted: (productId: string) => boolean;
  toggle: (productId: string) => void;
};

function Harness({ items, count, isWishlisted, toggle }: WishlistApi) {
  return (
    <div>
      <p data-testid="count">{count}</p>
      <ul>
        {items.map((id) => (
          <li key={id} data-testid={`item:${id}`}>
            {id}
          </li>
        ))}
      </ul>
      <p data-testid="p1-saved">{String(isWishlisted("p1"))}</p>
      <button type="button" onClick={() => toggle("p1")}>
        toggle-p1
      </button>
      <button type="button" onClick={() => toggle("p2")}>
        toggle-p2
      </button>
    </div>
  );
}

function WishlistProbe() {
  const wishlist = useWishlist();
  return <Harness {...wishlist} />;
}

function renderProvider(slug = "test-shop") {
  return render(
    <WishlistProvider slug={slug}>
      <WishlistProbe />
    </WishlistProvider>,
  );
}

/** Read the persisted list the provider wrote to localStorage. */
function storedItems(): string[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed)
    ? parsed.filter((id) => typeof id === "string")
    : [];
}

describe("WishlistProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts empty and toggles a product id", () => {
    renderProvider();
    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("p1-saved")).toHaveTextContent("false");

    fireEvent.click(screen.getByText("toggle-p1"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("item:p1")).toBeInTheDocument();
    expect(screen.getByTestId("p1-saved")).toHaveTextContent("true");
  });

  it("toggling the same id twice removes it", () => {
    renderProvider();
    fireEvent.click(screen.getByText("toggle-p1"));
    fireEvent.click(screen.getByText("toggle-p1"));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.queryByTestId("item:p1")).toBeNull();
  });

  it("keeps different product ids separate", () => {
    renderProvider();
    fireEvent.click(screen.getByText("toggle-p1"));
    fireEvent.click(screen.getByText("toggle-p2"));
    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(screen.getByTestId("item:p1")).toBeInTheDocument();
    expect(screen.getByTestId("item:p2")).toBeInTheDocument();
  });

  it("persists the list to localStorage under wishlist:<slug>", () => {
    renderProvider();
    fireEvent.click(screen.getByText("toggle-p1"));
    fireEvent.click(screen.getByText("toggle-p2"));
    expect(storedItems()).toEqual(["p1", "p2"]);
  });

  it("uses a per-slug storage key", () => {
    renderProvider("other-shop");
    fireEvent.click(screen.getByText("toggle-p1"));
    expect(window.localStorage.getItem("wishlist:other-shop")).toBe(
      JSON.stringify(["p1"]),
    );
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("hydrates from localStorage on mount", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(["p1", "p2"]));
    renderProvider();
    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(screen.getByTestId("item:p1")).toBeInTheDocument();
    expect(screen.getByTestId("item:p2")).toBeInTheDocument();
    expect(screen.getByTestId("p1-saved")).toHaveTextContent("true");
  });

  it("hydrated items can be toggled off and persisted", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(["p1"]));
    renderProvider();
    fireEvent.click(screen.getByText("toggle-p1"));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(storedItems()).toEqual([]);
  });

  it("treats corrupt localStorage as an empty list", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    renderProvider();
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("dedupes duplicate ids in stored data", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(["p1", "p1"]));
    renderProvider();
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getAllByTestId("item:p1")).toHaveLength(1);
  });
});
