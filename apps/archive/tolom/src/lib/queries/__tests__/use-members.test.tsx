import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type InviteWithEmail,
  memberKeys,
  type Role,
  type UserProfile,
  useInvites,
  useMembers,
  useRoles,
} from "../use-members";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useMembers", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleUsers: UserProfile[] = [
    {
      id: "user-1",
      email: "alice@example.com",
      full_name: "Alice",
      phone: "+976-1234",
      role_id: "role-1",
      role_name: "Admin",
      branch_id: "branch-1",
      branch_name: "Main",
    },
  ];

  it("returns members on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleUsers }),
    } as Response);

    const { result } = renderHook(() => useMembers("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleUsers);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useMembers(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useMembers("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useInvites", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleInvites: InviteWithEmail[] = [
    {
      id: "invite-1",
      email: "bob@example.com",
      role_id: "role-2",
      status: "pending",
      created_at: "2024-01-10T12:00:00Z",
    },
  ];

  it("returns invites on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleInvites }),
    } as Response);

    const { result } = renderHook(() => useInvites("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleInvites);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useInvites(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useInvites("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useRoles", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const sampleRoles: Role[] = [
    { id: "role-1", name: "Admin" },
    { id: "role-2", name: "Mechanic" },
  ];

  it("returns roles on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: sampleRoles }),
    } as Response);

    const { result } = renderHook(() => useRoles("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleRoles);
  });

  it("does not fetch when orgId is undefined", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useRoles(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useRoles("org-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("memberKeys", () => {
  it("constructs correct key shapes", () => {
    expect(memberKeys.all("org-1")).toEqual([
      "organizations",
      "org-1",
      "members",
    ]);
    expect(memberKeys.users("org-1")).toEqual([
      "organizations",
      "org-1",
      "members",
      "users",
    ]);
    expect(memberKeys.invites("org-1")).toEqual([
      "organizations",
      "org-1",
      "members",
      "invites",
    ]);
    expect(memberKeys.roles("org-1")).toEqual([
      "organizations",
      "org-1",
      "members",
      "roles",
    ]);
  });
});
