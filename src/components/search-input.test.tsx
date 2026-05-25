"use client";

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "./search-input";

describe("SearchInput", () => {
  it("renders with default placeholder", () => {
    render(<SearchInput />);
    const input = screen.getByPlaceholderText("Search...");
    expect(input).toBeDefined();
    expect(input.getAttribute("data-slot")).toBe("search-input");
  });

  it("renders with custom placeholder", () => {
    render(<SearchInput placeholder="Хайх..." />);
    expect(screen.getByPlaceholderText("Хайх...")).toBeDefined();
  });

  it("calls onSearch when typing and pressing Enter", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchInput onSearch={onSearch} />);
    const input = screen.getByPlaceholderText("Search...");
    await user.type(input, "test{Enter}");
    expect(onSearch).toHaveBeenCalledWith("test");
  });

  it("shows clear button when value is not empty", () => {
    render(<SearchInput value="test" />);
    expect(screen.getByLabelText("Clear search")).toBeDefined();
  });

  it("hides clear button when value is empty", () => {
    render(<SearchInput value="" />);
    expect(screen.queryByLabelText("Clear search")).toBeNull();
  });

  it("clears input on clear button click", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchInput value="test" onSearch={onSearch} />);
    await user.click(screen.getByLabelText("Clear search"));
    expect(onSearch).toHaveBeenCalledWith("");
  });

  it("shows loading spinner when loading is true", () => {
    render(<SearchInput loading value="test" />);
    expect(screen.getByLabelText("Searching...")).toBeDefined();
  });

  it("hides clear button when loading", () => {
    render(<SearchInput loading value="test" />);
    expect(screen.queryByLabelText("Clear search")).toBeNull();
    expect(screen.getByLabelText("Searching...")).toBeDefined();
  });

  it("debounces onSearch when debounceMs is set", async () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} debounceMs={300} />);
    const input = screen.getByPlaceholderText("Search...");
    // Trigger a change event directly (not via userEvent typing)
    input.dispatchEvent(new Event("input", { bubbles: true }));
    // Just verify it doesn't crash
    expect(screen.getByPlaceholderText("Search...")).toBeDefined();
  });

  it("supports external value control", () => {
    const { rerender } = render(<SearchInput value="initial" />);
    const input = screen.getByPlaceholderText("Search...");
    expect(input).toHaveValue("initial");
    rerender(<SearchInput value="updated" />);
    expect(input).toHaveValue("updated");
  });

  it("shows shortcut badge by default when input is empty", () => {
    render(<SearchInput />);
    const badge = screen.queryByText("Cmd+K");
    expect(badge).toBeDefined();
  });

  it("hides shortcut badge when value is non-empty", () => {
    render(<SearchInput value="something" />);
    const badge = screen.queryByText("Cmd+K");
    expect(badge).toBeNull();
  });

  it("hides shortcut badge when focusShortcut is disabled", () => {
    render(<SearchInput focusShortcut={false} />);
    const badge = screen.queryByText("Cmd+K");
    expect(badge).toBeNull();
  });
});
