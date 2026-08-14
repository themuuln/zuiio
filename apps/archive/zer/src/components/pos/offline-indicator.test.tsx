import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OfflineIndicator } from "./offline-indicator";

// The Base UI TooltipTrigger renders its own wrapping <button> around the
// shadcn Button, so target the inner button via its data-slot.
function getInnerButton(): HTMLButtonElement {
  const el = document.querySelector('button[data-slot="button"]');
  if (!el) throw new Error("inner button not found");
  return el as HTMLButtonElement;
}

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value,
  });
}

afterEach(() => {
  setNavigatorOnline(true);
});

describe("OfflineIndicator", () => {
  it("renders nothing when online with no pending actions", () => {
    render(<OfflineIndicator />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the pending badge and syncs on click", () => {
    const onSync = vi.fn();
    render(<OfflineIndicator pendingCount={3} onSync={onSync} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(getInnerButton()).toBeEnabled();
    fireEvent.click(getInnerButton());
    expect(onSync).toHaveBeenCalled();
  });

  it("shows the offline state and disables sync", async () => {
    setNavigatorOnline(false);
    render(<OfflineIndicator pendingCount={2} onSync={vi.fn()} />);
    await waitFor(() => expect(getInnerButton()).toBeDisabled());
    expect(screen.getByText("Оффлайн")).toBeInTheDocument();
  });

  it("disables sync while replaying", () => {
    render(<OfflineIndicator pendingCount={1} onSync={vi.fn()} isSyncing />);
    expect(getInnerButton()).toBeDisabled();
  });
});
