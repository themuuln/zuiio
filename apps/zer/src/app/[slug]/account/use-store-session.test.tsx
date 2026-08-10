import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStoreSession } from "./use-store-session";

const mockRouterReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockRouterReplace, push: vi.fn() }),
}));

type SupabaseLike = {
  auth: {
    getSession: ReturnType<typeof vi.fn>;
  };
  from: (table: string) => unknown;
};

function makeSupabase(opts: {
  session: {
    user: { id: string; email: string; user_metadata: Record<string, unknown> };
  } | null;
  profile?: { id: string } | null;
  storeAccount?: {
    id: string;
    email: string;
    display_name: string | null;
    phone: string | null;
  } | null;
}) {
  const getSession = vi
    .fn()
    .mockResolvedValue({ data: { session: opts.session } });
  const profileMaybeSingle = vi
    .fn()
    .mockResolvedValue({ data: opts.profile ?? null });
  const accountMaybeSingle = vi
    .fn()
    .mockResolvedValue({ data: opts.storeAccount ?? null });
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const supabase: SupabaseLike = {
    auth: { getSession },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: profileMaybeSingle }) }),
        };
      }
      if (table === "store_accounts") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: accountMaybeSingle }) }),
          upsert,
        };
      }
      throw new Error(`unexpected table: ${table}`);
    },
  };
  return {
    supabase,
    getSession,
    profileMaybeSingle,
    accountMaybeSingle,
    upsert,
  };
}

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabaseInstance,
}));

let mockSupabaseInstance: ReturnType<typeof makeSupabase>["supabase"];

function SessionProbe() {
  const { state, reload } = useStoreSession();
  return (
    <div>
      <p data-testid="status">{state.status}</p>
      {state.status === "account" && (
        <>
          <p data-testid="account-email">{state.account.email}</p>
          <p data-testid="account-name">{state.account.display_name ?? ""}</p>
        </>
      )}
      <button type="button" onClick={() => void reload()}>
        reload
      </button>
    </div>
  );
}

const BUYER_SESSION = {
  user: {
    id: "user-1",
    email: "buyer@example.com",
    user_metadata: { display_name: "Жон", phone: "99112233" },
  },
};

describe("useStoreSession", () => {
  beforeEach(() => {
    mockRouterReplace.mockClear();
  });

  it("reports signedOut when there is no session", async () => {
    const { supabase } = makeSupabase({ session: null });
    mockSupabaseInstance = supabase;
    render(<SessionProbe />);
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("signedOut");
    });
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it("reports account with the store_accounts row for a buyer", async () => {
    const { supabase } = makeSupabase({
      session: BUYER_SESSION,
      storeAccount: {
        id: "user-1",
        email: "buyer@example.com",
        display_name: "Жон",
        phone: "99112233",
      },
    });
    mockSupabaseInstance = supabase;
    render(<SessionProbe />);
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("account");
    });
    expect(screen.getByTestId("account-email")).toHaveTextContent(
      "buyer@example.com",
    );
    expect(screen.getByTestId("account-name")).toHaveTextContent("Жон");
  });

  it("redirects staff (profiles row) to the dashboard", async () => {
    const { supabase } = makeSupabase({
      session: BUYER_SESSION,
      profile: { id: "user-1" },
    });
    mockSupabaseInstance = supabase;
    render(<SessionProbe />);
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("staff");
    });
    expect(mockRouterReplace).toHaveBeenCalledWith("/");
  });

  it("upserts a store_accounts row from session metadata when missing", async () => {
    const { supabase, upsert, accountMaybeSingle } = makeSupabase({
      session: BUYER_SESSION,
      storeAccount: null,
    });
    mockSupabaseInstance = supabase;
    render(<SessionProbe />);
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("account");
    });
    expect(upsert).toHaveBeenCalledWith({
      id: "user-1",
      email: "buyer@example.com",
      display_name: "Жон",
      phone: "99112233",
    });
    expect(accountMaybeSingle).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("account-email")).toHaveTextContent(
      "buyer@example.com",
    );
  });

  it("reload re-queries the session state", async () => {
    const { supabase, getSession } = makeSupabase({
      session: BUYER_SESSION,
      storeAccount: {
        id: "user-1",
        email: "buyer@example.com",
        display_name: "Жон",
        phone: null,
      },
    });
    mockSupabaseInstance = supabase;
    render(<SessionProbe />);
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("account");
    });

    getSession.mockResolvedValue({ data: { session: null } });
    fireEvent.click(screen.getByRole("button", { name: "reload" }));
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("signedOut");
    });
  });
});
