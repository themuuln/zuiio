import { describe, expect, it, vi } from "vitest";
import { routing } from "../i18n/routing";

const { mockCreateNavigation } = vi.hoisted(() => ({
  mockCreateNavigation: vi.fn(() => ({
    Link: vi.fn(),
    redirect: vi.fn(),
    usePathname: vi.fn(),
    useRouter: vi.fn(),
    getPathname: vi.fn(),
  })),
}));

vi.mock("next-intl/navigation", () => ({
  createNavigation: mockCreateNavigation,
}));

import {
  getPathname,
  Link,
  redirect,
  usePathname,
  useRouter,
} from "../i18n/navigation";

describe("navigation", () => {
  it("builds navigation helpers from createNavigation", () => {
    expect(Link).toBeDefined();
    expect(redirect).toBeDefined();
    expect(usePathname).toBeDefined();
    expect(useRouter).toBeDefined();
    expect(getPathname).toBeDefined();
  });

  it("wires createNavigation to the app routing config", () => {
    expect(mockCreateNavigation).toHaveBeenCalledTimes(1);
    expect(mockCreateNavigation).toHaveBeenCalledWith(routing);
  });
});
