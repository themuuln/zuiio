import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MechanicAvatar } from "@/components/mechanic-avatar";
import type { MechanicRef } from "@/lib/types/mechanic";

const mockMechanic: MechanicRef = {
  id: "mech-1",
  full_name: "Bold Dorj",
  avatar_url: null,
};

vi.mock("@/lib/mechanic-colors", () => ({
  getMechanicColor: () => ({
    bg: "bg-blue-100",
    text: "text-blue-700",
  }),
  getMechanicInitials: (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  },
}));

function renderMechanicAvatar(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("MechanicAvatar", () => {
  it("renders avatar with initials fallback", () => {
    render(<MechanicAvatar mechanic={mockMechanic} />);
    expect(screen.getByText("BD")).toBeInTheDocument();
  });

  it("renders with default size", () => {
    const { $ } = renderMechanicAvatar(
      <MechanicAvatar mechanic={mockMechanic} />,
    );
    const avatar = $("[data-slot='avatar']");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute("data-size", "default");
  });

  it("renders with custom size", () => {
    const { $ } = renderMechanicAvatar(
      <MechanicAvatar mechanic={mockMechanic} size="lg" />,
    );
    expect($("[data-slot='avatar']")).toHaveAttribute("data-size", "lg");
  });

  it("renders initials when avatar_url is provided (Base UI defers image load)", () => {
    const mechanicWithImage: MechanicRef = {
      ...mockMechanic,
      avatar_url: "/avatars/mech1.jpg",
    };
    render(<MechanicAvatar mechanic={mechanicWithImage} />);
    // Base UI AvatarImage defers loading; AvatarFallback always renders as fallback
    expect(screen.getByText("BD")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { $ } = renderMechanicAvatar(
      <MechanicAvatar mechanic={mockMechanic} className="size-9" />,
    );
    expect($("[data-slot='avatar']")?.className).toContain("size-9");
  });

  it("handles mechanic with single name", () => {
    const singleName: MechanicRef = {
      id: "mech-2",
      full_name: "Bold",
      avatar_url: null,
    };
    render(<MechanicAvatar mechanic={singleName} />);
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});
