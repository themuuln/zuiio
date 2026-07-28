import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";

function renderAvatar(ui: React.ReactElement) {
  const result = render(ui);
  function $(selector: string) {
    return result.baseElement.querySelector(selector);
  }
  return { ...result, $ };
}

describe("Avatar", () => {
  it("renders with default size", () => {
    const { $ } = renderAvatar(<Avatar />);
    const el = $("[data-slot='avatar']");
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("data-size", "default");
  });

  it("renders with lg size", () => {
    const { $ } = renderAvatar(<Avatar size="lg" />);
    expect($("[data-slot='avatar']")).toHaveAttribute("data-size", "lg");
  });

  it("renders with sm size", () => {
    const { $ } = renderAvatar(<Avatar size="sm" />);
    expect($("[data-slot='avatar']")).toHaveAttribute("data-size", "sm");
  });

  it("renders AvatarFallback text when no image loads", () => {
    render(
      <Avatar>
        <AvatarImage src="/test.jpg" alt="test" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    // Base UI AvatarImage may not mount in jsdom without full image loading;
    // AvatarFallback is always rendered as the fallback content
    expect(screen.getByText("AB")).toBeInTheDocument();
  });

  it("renders AvatarFallback with data-slot", () => {
    render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    const fb = screen.getByText("AB");
    expect(fb).toBeInTheDocument();
    expect(fb).toHaveAttribute("data-slot", "avatar-fallback");
  });

  it("renders AvatarBadge", () => {
    const { $ } = renderAvatar(
      <Avatar>
        <AvatarBadge data-testid="badge">
          <span>!</span>
        </AvatarBadge>
      </Avatar>,
    );
    expect($("[data-slot='avatar-badge']")).toBeInTheDocument();
  });

  it("renders AvatarGroup with children", () => {
    const { $ } = renderAvatar(
      <AvatarGroup>
        <Avatar />
        <Avatar />
      </AvatarGroup>,
    );
    const group = $("[data-slot='avatar-group']");
    expect(group).toBeInTheDocument();
    expect(group?.querySelectorAll("[data-slot='avatar']")).toHaveLength(2);
  });

  it("renders AvatarGroupCount", () => {
    render(
      <AvatarGroup>
        <AvatarGroupCount>+3</AvatarGroupCount>
      </AvatarGroup>,
    );
    const count = screen.getByText("+3");
    expect(count).toBeInTheDocument();
    expect(count).toHaveAttribute("data-slot", "avatar-group-count");
  });

  it("applies custom className", () => {
    const { $ } = renderAvatar(<Avatar className="custom-avatar" />);
    expect($("[data-slot='avatar']")?.className).toContain("custom-avatar");
  });
});
