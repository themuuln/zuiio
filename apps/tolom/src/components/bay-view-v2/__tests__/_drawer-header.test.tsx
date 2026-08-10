import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { DrawerHeaderSection } from "../_drawer-header";

vi.mock("@/components/ui/drawer", () => ({
  DrawerHeader: ({ children }: { children: React.ReactNode }) => (
    <header>{children}</header>
  ),
  DrawerTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  DrawerDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
}));

const t = (key: string) => key;

const wo = {
  id: "wo-12345678",
  vehicle: {
    id: "v-1",
    plate_number: "1234УБА",
    make: "Toyota",
    model: "Prius",
    year: 2020,
  },
  status: "In Progress",
} as never;

const baseProps = {
  loading: false,
  isFullScreen: false,
  onToggleFullScreen: vi.fn(),
  onClose: vi.fn(),
  onBack: vi.fn(),
  t,
};

describe("DrawerHeaderSection", () => {
  it("renders plate, model line and work order id", () => {
    render(<DrawerHeaderSection {...baseProps} wo={wo} />);
    expect(screen.getByText("1234")).toBeTruthy();
    expect(screen.getByText("УБА")).toBeTruthy();
    expect(screen.getByText(/Toyota Prius · 2020/)).toBeTruthy();
    expect(screen.getByText(/WO#wo-12345/)).toBeTruthy();
    // StatusPill renders the status twice (sr-only + inline)
    expect(screen.getAllByText("In Progress").length).toBeGreaterThan(0);
  });

  it("renders skeleton blocks while loading", () => {
    render(<DrawerHeaderSection {...baseProps} wo={null} loading />);
    // logo + plate + pill + vehicle-name line
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBe(4);
  });

  it("toggles fullscreen and closes", () => {
    const onToggleFullScreen = vi.fn();
    const onClose = vi.fn();
    render(
      <DrawerHeaderSection
        {...baseProps}
        wo={wo}
        onToggleFullScreen={onToggleFullScreen}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "fullscreen" }));
    expect(onToggleFullScreen).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("labels the fullscreen button for exiting fullscreen", () => {
    render(<DrawerHeaderSection {...baseProps} wo={wo} isFullScreen />);
    expect(screen.getByRole("button", { name: "exitFullscreen" })).toBeTruthy();
  });

  it("shows a back button instead of fullscreen when showBack is set", () => {
    const onBack = vi.fn();
    render(
      <DrawerHeaderSection {...baseProps} wo={wo} showBack onBack={onBack} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "backLabel" }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "fullscreen" })).toBeNull();
  });
});
