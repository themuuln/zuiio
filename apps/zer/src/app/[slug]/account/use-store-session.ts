"use client";

import { capture } from "@zuiio/capture";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type StoreAccount = {
  id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
};

export type StoreSessionState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "staff" }
  | { status: "account"; account: StoreAccount };

/**
 * Shared session hook for buyer pages (account home, order history).
 *
 * - Signed-out users get `signedOut` (login/register UI).
 * - Org members (profiles row = Zer staff) get `staff` — the hook then
 *   redirects them away from buyer pages to the dashboard.
 * - Store buyers get their store_accounts row, upserting it on first
 *   login after email confirmation if it is missing.
 */
export function useStoreSession() {
  const router = useRouter();
  const [state, setState] = useState<StoreSessionState>({ status: "loading" });

  const reload = useCallback(async () => {
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setState({ status: "signedOut" });
      return;
    }

    // Guard: org members (Zer staff) belong on the dashboard, not here.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (profile) {
      setState({ status: "staff" });
      return;
    }

    const { data: row } = await supabase
      .from("store_accounts" as never)
      .select("id, email, display_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const displayName =
      typeof metadata.display_name === "string" ? metadata.display_name : null;
    const phone = typeof metadata.phone === "string" ? metadata.phone : null;

    if (row) {
      setState({
        status: "account",
        account: row as unknown as StoreAccount,
      });
      return;
    }

    // Signed in but store_accounts row missing — create it from the session.
    const { error: upsertError } = await supabase
      .from("store_accounts" as never)
      .upsert({
        id: user.id,
        email: user.email ?? "",
        display_name: displayName,
        phone,
      } as never);
    if (upsertError) {
      capture(upsertError, { context: "store account: upsert after login" });
    }

    setState({
      status: "account",
      account: {
        id: user.id,
        email: user.email ?? "",
        display_name: displayName,
        phone,
      },
    });
  }, []);

  useEffect(() => {
    reload().catch((e) => {
      capture(e, { context: "store account: session load" });
    });
  }, [reload]);

  // Staff sessions are redirected away from buyer pages.
  useEffect(() => {
    if (state.status === "staff") {
      router.replace("/");
    }
  }, [state.status, router]);

  return { state, reload };
}
