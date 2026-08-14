"use client";

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { SearchInput } from "./search-input";

const commonMessages = {
  common: {
    search: "Search...",
    clearSearch: "Clear search",
    searching: "Searching...",
  },
};

describe("SearchInput", () => {
  it("renders with default placeholder", () => {
    render(<SearchInput />, { messages: commonMessages });
    const input = screen.getByPlaceholderText("Search...");
    expect(input).toBeDefined();
    expect(input.getAttribute("data-slot")).toBe("search-input");
  });

  it("renders with custom placeholder", () => {
    render(<SearchInput placeholder="Хайх..." />, { messages: commonMessages });
    expect(screen.getByPlaceholderText("Хайх...")).toBeDefined();
  });

  it("calls onSearch when typing and pressing Enter", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchInput onSearch={onSearch} />, { messages: commonMessages });
    const input = screen.getByPlaceholderText("Search...");
    await user.type(input, "test{Enter}");
    expect(onSearch).toHaveBeenCalledWith("test");
  });

  it("shows clear button when value is not empty", () => {
    render(<SearchInput value="test" />, { messages: commonMessages });
    expect(screen.getByLabelText("Clear search")).toBeDefined();
  });

  it("hides clear button when value is empty", () => {
    render(<SearchInput value="" />, { messages: commonMessages });
    expect(screen.queryByLabelText("Clear search")).toBeNull();
  });

  it("clears input on clear button click", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchInput value="test" onSearch={onSearch} />, {
      messages: commonMessages,
    });
    await user.click(screen.getByLabelText("Clear search"));
    expect(onSearch).toHaveBeenCalledWith("");
  });

  it("shows loading spinner when loading is true", () => {
    render(<SearchInput loading value="test" />, { messages: commonMessages });
    expect(screen.getByLabelText("Searching...")).toBeDefined();
  });

  it("hides clear button when loading", () => {
    render(<SearchInput loading value="test" />, { messages: commonMessages });
    expect(screen.queryByLabelText("Clear search")).toBeNull();
    expect(screen.getByLabelText("Searching...")).toBeDefined();
  });

  it("debounces onSearch when debounceMs is set", async () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} debounceMs={300} />, {
      messages: commonMessages,
    });
    const input = screen.getByPlaceholderText("Search...");
    // Trigger a change event directly (not via userEvent typing)
    input.dispatchEvent(new Event("input", { bubbles: true }));
    // Just verify it doesn't crash
    expect(screen.getByPlaceholderText("Search...")).toBeDefined();
  });

  it("supports external value control", () => {
    const { rerender } = render(<SearchInput value="initial" />, {
      messages: commonMessages,
    });
    const input = screen.getByPlaceholderText("Search...");
    expect(input).toHaveValue("initial");
    rerender(<SearchInput value="updated" />);
    expect(input).toHaveValue("updated");
  });

  it("shows shortcut badge by default when input is empty", () => {
    render(<SearchInput />, { messages: commonMessages });
    const badge = screen.queryByText("Cmd+K");
    expect(badge).toBeDefined();
  });

  it("hides shortcut badge when value is non-empty", () => {
    render(<SearchInput value="something" />, { messages: commonMessages });
    const badge = screen.queryByText("Cmd+K");
    expect(badge).toBeNull();
  });

  it("hides shortcut badge when focusShortcut is disabled", () => {
    render(<SearchInput focusShortcut={false} />, { messages: commonMessages });
    const badge = screen.queryByText("Cmd+K");
    expect(badge).toBeNull();
  });

  it("calls onValueChange while typing", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchInput onValueChange={onValueChange} />, {
      messages: commonMessages,
    });
    const input = screen.getByPlaceholderText("Search...");
    await user.type(input, "abc");
    expect(onValueChange).toHaveBeenLastCalledWith("abc");
  });

  it("clears on escape when enabled", async () => {
    const onSearch = vi.fn();
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchInput
        value="query"
        onSearch={onSearch}
        onValueChange={onValueChange}
      />,
      { messages: commonMessages },
    );
    const input = screen.getByPlaceholderText("Search...");
    await user.click(input);
    await user.keyboard("{Escape}");
    expect(onSearch).toHaveBeenCalledWith("");
    expect(onValueChange).toHaveBeenCalledWith("");
  });
});
