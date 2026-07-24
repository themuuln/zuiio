import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoomCodeDisplay } from "../room-code-display";

// Mock sonner toast
const mockToast = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToast(...args),
  },
}));

describe("RoomCodeDisplay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the room code", () => {
    render(<RoomCodeDisplay code="FROG" />);
    expect(screen.getByText("FROG")).toBeDefined();
  });

  it("renders a copy button with correct aria-label", () => {
    render(<RoomCodeDisplay code="FROG" />);
    const button = screen.getByRole("button", { name: "Copy room code" });
    expect(button).toBeDefined();
  });

  it("renders the Copy icon", () => {
    const { container } = render(<RoomCodeDisplay code="FROG" />);
    // Lucide Copy icon renders an SVG
    const svg = container.querySelector("svg");
    expect(svg).toBeDefined();
  });

  it("copies code to clipboard on button click", async () => {
    render(<RoomCodeDisplay code="FROG" />);
    const button = screen.getByRole("button", { name: "Copy room code" });

    fireEvent.click(button);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("FROG");
  });

  it("shows a success toast on clipboard copy", async () => {
    render(<RoomCodeDisplay code="FROG" />);
    const button = screen.getByRole("button", { name: "Copy room code" });

    fireEvent.click(button);

    // Wait for async clipboard operation
    await vi.waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith("Copied!", { duration: 2000 });
    });
  });

  it("uses fallback clipboard when navigator.clipboard is not available", async () => {
    // Remove clipboard API
    Object.assign(navigator, {
      clipboard: undefined,
    });

    // Mock execCommand
    const execCommand = vi.fn().mockReturnValue(true);
    document.execCommand = execCommand;

    render(<RoomCodeDisplay code="FROG" />);
    const button = screen.getByRole("button", { name: "Copy room code" });

    fireEvent.click(button);

    // Should still show toast
    await vi.waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith("Copied!", { duration: 2000 });
    });
  });
});
