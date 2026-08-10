import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  MechanicAvatarChip,
  MechanicAvatarGroup,
} from "@/components/mechanic-avatar-chip";
import type { MechanicRef } from "@/lib/types/mechanic";

const mechanics: MechanicRef[] = [
  { id: "m-1", full_name: "Бат" },
  { id: "m-2", full_name: "Нара" },
  { id: "m-3", full_name: "Сараа" },
  { id: "m-4", full_name: "Дорж" },
];

describe("MechanicAvatarChip", () => {
  it("renders the mechanic initials without a tooltip when disabled", () => {
    const { container } = render(
      <MechanicAvatarChip mechanic={mechanics[0]} showTooltip={false} />,
    );
    expect(container.textContent).toBe("Б");
  });

  it("shows the lead crown when showLeadCrown is set", () => {
    const { container } = render(
      <MechanicAvatarChip mechanic={mechanics[0]} showLeadCrown />,
    );
    expect(container.querySelector(".lucide-crown")).toBeInTheDocument();
  });

  it("calls onRemove when the remove button is clicked", () => {
    const onRemove = vi.fn();
    render(<MechanicAvatarChip mechanic={mechanics[0]} onRemove={onRemove} />);
    fireEvent.click(containerRemoveButton());
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("does not render a remove button without onRemove", () => {
    const { container } = render(
      <MechanicAvatarChip mechanic={mechanics[0]} showTooltip={false} />,
    );
    expect(container.querySelector(".lucide-x")).not.toBeInTheDocument();
  });
});

function containerRemoveButton(): HTMLButtonElement {
  const btn = document.querySelector("button");
  if (!btn) throw new Error("Expected a remove button");
  return btn as HTMLButtonElement;
}

describe("MechanicAvatarGroup", () => {
  it("renders up to the limit with a +N overflow badge", () => {
    render(<MechanicAvatarGroup mechanics={mechanics} limit={3} />);
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("renders the empty placeholder when there are no mechanics", () => {
    render(
      <MechanicAvatarGroup mechanics={[]} emptyPlaceholder="No mechanics" />,
    );
    expect(screen.getByText("No mechanics")).toBeInTheDocument();
  });

  it("passes the mechanic id to onRemove", () => {
    const onRemove = vi.fn();
    render(
      <MechanicAvatarGroup
        mechanics={[mechanics[0], mechanics[1]]}
        onRemove={onRemove}
      />,
    );
    // Two chips, each with a remove button
    const buttons = document.querySelectorAll("button");
    fireEvent.click(buttons[0]);
    expect(onRemove).toHaveBeenCalledWith("m-1");
    fireEvent.click(buttons[1]);
    expect(onRemove).toHaveBeenCalledWith("m-2");
  });
});
