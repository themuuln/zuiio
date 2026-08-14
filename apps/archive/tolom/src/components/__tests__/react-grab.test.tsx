import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReactGrab } from "@/components/react-grab";

const grabState = vi.hoisted(() => ({ imported: false }));
vi.mock("react-grab", () => {
  grabState.imported = true;
  return { default: vi.fn() };
});

describe("ReactGrab", () => {
  beforeEach(() => {
    grabState.imported = false;
    vi.unstubAllEnvs();
  });

  it("renders nothing", () => {
    const { container } = render(<ReactGrab />);
    expect(container.firstChild).toBeNull();
  });

  it("does not load react-grab outside development", async () => {
    render(<ReactGrab />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(grabState.imported).toBe(false);
  });

  it("lazily imports react-grab in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    render(<ReactGrab />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(grabState.imported).toBe(true);
  });
});
