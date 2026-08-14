import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { WorkOrderDetail } from "@/lib/types/composite";
import type { MechanicRef } from "@/lib/types/mechanic";
import { render } from "@/test/test-utils";
import { MechanicCardV2 } from "../drawer-v2/_sidebar";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

const t = (key: string) => key;

const wo = {
  mechanic: { id: "lead-1", full_name: "Zet" },
} as unknown as WorkOrderDetail;

const allMechanics: MechanicRef[] = [
  { id: "lead-1", full_name: "Zet" },
  { id: "m-2", full_name: "Mechanic 44" },
  { id: "m-3", full_name: "mechanic 41" },
];

function renderCard({
  helpers = [],
  addHelper = vi.fn().mockResolvedValue(undefined),
}: {
  helpers?: MechanicRef[];
  addHelper?: ReturnType<typeof vi.fn>;
} = {}) {
  return render(
    <MechanicCardV2
      wo={wo}
      allMechanics={allMechanics}
      helpers={helpers}
      workOrderId="wo-1"
      t={t}
      onAssignMechanic={vi.fn()}
      addHelperMutation={{ mutateAsync: addHelper }}
      removeHelperMutation={{
        mutateAsync: vi.fn().mockResolvedValue(undefined),
      }}
    />,
  );
}

describe("MechanicCardV2", () => {
  it("shows the add-helper action when a lead mechanic is selected and no helpers exist", () => {
    renderCard();
    expect(
      screen.getByRole("button", { name: "addHelper" }),
    ).toBeInTheDocument();
  });

  it("hides the add-helper action when no mechanic is assigned", () => {
    render(
      <MechanicCardV2
        wo={{ mechanic: null } as unknown as WorkOrderDetail}
        allMechanics={allMechanics}
        helpers={[]}
        workOrderId="wo-1"
        t={t}
        onAssignMechanic={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "addHelper" }),
    ).not.toBeInTheDocument();
  });

  it("excludes the lead mechanic from the helper picker", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "addHelper" }));
    expect(
      screen.getByRole("button", { name: "Mechanic 44" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "mechanic 41" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Zet" }),
    ).not.toBeInTheDocument();
  });

  it("adds the selected mechanic through the mutation", async () => {
    const addHelper = vi.fn().mockResolvedValue(undefined);
    renderCard({ addHelper });
    fireEvent.click(screen.getByRole("button", { name: "addHelper" }));
    fireEvent.click(screen.getByRole("button", { name: "Mechanic 44" }));
    await waitFor(() =>
      expect(addHelper).toHaveBeenCalledWith({
        woId: "wo-1",
        mechanicId: "m-2",
      }),
    );
  });

  it("excludes already-assigned helpers from the picker", () => {
    renderCard({ helpers: [{ id: "m-3", full_name: "mechanic 41" }] });
    fireEvent.click(screen.getByRole("button", { name: "addHelper" }));
    expect(
      screen.getByRole("button", { name: "Mechanic 44" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "mechanic 41" }),
    ).not.toBeInTheDocument();
  });

  it("renders the mechanic avatar in the lead row", () => {
    renderCard();
    const row = screen.getByRole("button", { name: /Zet/ });
    const avatar = row.querySelector("[data-slot='avatar']");
    expect(avatar).not.toBeNull();
    // Initials fallback derived from wo.mechanic.full_name
    expect(row.textContent).toContain("Z");
  });

  it("renders avatars inside helper chips", () => {
    renderCard({ helpers: [{ id: "m-3", full_name: "mechanic 41" }] });
    const removeButton = screen.getByRole("button", { name: "removeHelper" });
    expect(
      removeButton.parentElement?.querySelector("[data-slot='avatar']"),
    ).not.toBeNull();
  });
});
