import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@/test/test-utils";
import { MechanicPanel } from "../mechanic-panel";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("@dnd-kit/core", () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
}));

vi.mock("@/components/mechanic-avatar", () => ({
  MechanicAvatar: ({
    mechanic,
  }: {
    mechanic: { full_name: string | null };
  }) => <span data-testid="mechanic-avatar">{mechanic.full_name ?? "?"}</span>,
}));

function makeMechanic(id: string, fullName: string, currentJobs: number) {
  return {
    id,
    full_name: fullName,
    avatar_url: null,
    email: `${id}@example.com`,
    current_jobs: currentJobs,
  };
}

describe("MechanicPanel", () => {
  it("renders the roster header and total count", () => {
    render(<MechanicPanel mechanics={[makeMechanic("m-1", "Бат", 0)]} />);
    expect(screen.getByText("mechanicRoster")).toBeTruthy();
    // Roster badge + free-section badge both show the count
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
  });

  it("groups mechanics into working and free sections", () => {
    render(
      <MechanicPanel
        mechanics={[
          makeMechanic("m-1", "Бат", 2),
          makeMechanic("m-2", "Нара", 0),
        ]}
      />,
    );
    expect(screen.getByText("workingLabel")).toBeTruthy();
    expect(screen.getByText("freeLabel")).toBeTruthy();
    // Names render in both the avatar mock and the text row
    expect(screen.getAllByText("Бат").length).toBeGreaterThan(0);
    expect(screen.getByText("activeJobsCount")).toBeTruthy();
    expect(screen.getAllByText("Нара").length).toBeGreaterThan(0);
    expect(screen.getByText("availableStatus")).toBeTruthy();
  });

  it("shows the empty state with an invite action", () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "" },
    });
    render(<MechanicPanel mechanics={[]} />);
    expect(screen.getByText("noMechanics")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "inviteMechanic" }));
    expect(window.location.href).toBe("/dashboard/organization/members");
  });
});
