/**
 * Tests for PermissionGate component.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PermissionGate } from "../permission-gate";

describe("PermissionGate", () => {
  it("renders children when permission is granted", () => {
    render(
      <PermissionGate permissions={["products.read"]} required="products.read">
        <div data-testid="content">Protected content</div>
      </PermissionGate>,
    );
    expect(screen.getByTestId("content")).toBeDefined();
    expect(screen.getByText("Protected content")).toBeDefined();
  });

  it("renders fallback when permission is denied", () => {
    render(
      <PermissionGate
        permissions={["products.read"]}
        required="admin.access"
        fallback={<div data-testid="fallback">Access denied</div>}
      >
        <div data-testid="content">Admin content</div>
      </PermissionGate>,
    );
    expect(screen.getByTestId("fallback")).toBeDefined();
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("renders nothing when permission denied and no fallback", () => {
    const { container } = render(
      <PermissionGate permissions={["products.read"]} required="admin.access">
        <div>Admin content</div>
      </PermissionGate>,
    );
    expect(container.textContent).toBe("");
  });

  it("requires all permissions when required is an array", () => {
    render(
      <PermissionGate
        permissions={["products.read", "products.write"]}
        required={["products.read", "products.write"]}
      >
        <div data-testid="content">Full access content</div>
      </PermissionGate>,
    );
    expect(screen.getByTestId("content")).toBeDefined();
  });

  it("denies when one of multiple required permissions is missing", () => {
    render(
      <PermissionGate
        permissions={["products.read"]}
        required={["products.read", "admin.access"]}
        fallback={<div data-testid="fallback">Access denied</div>}
      >
        <div data-testid="content">Admin content</div>
      </PermissionGate>,
    );
    expect(screen.getByTestId("fallback")).toBeDefined();
  });
});
