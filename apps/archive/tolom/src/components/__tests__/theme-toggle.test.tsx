import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ThemeToggle from "@/components/theme-toggle";

// Mock next-themes
const mockSetTheme = vi.fn();
let mockTheme = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
  }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
    mockTheme = "light";
  });

  it("renders Moon icon and Dark label in light mode", () => {
    render(<ThemeToggle />);
    expect(screen.getByText("Dark")).toBeInTheDocument();
    expect(document.querySelector(".lucide-moon")).toBeInTheDocument();
  });

  it("renders Sun icon and Light label in dark mode", () => {
    mockTheme = "dark";
    render(<ThemeToggle />);
    expect(screen.getByText("Light")).toBeInTheDocument();
    expect(document.querySelector(".lucide-sun")).toBeInTheDocument();
  });

  it("toggles theme on click", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("toggles to light when currently dark", () => {
    mockTheme = "dark";
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("renders in collapsed mode without label", () => {
    render(<ThemeToggle collapsed />);
    expect(screen.queryByText("Dark")).not.toBeInTheDocument();
    expect(screen.queryByText("Light")).not.toBeInTheDocument();
  });

  it("has correct aria-label", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Switch to dark mode",
    );
  });

  it("has correct aria-label in dark mode", () => {
    mockTheme = "dark";
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Switch to light mode",
    );
  });
});
