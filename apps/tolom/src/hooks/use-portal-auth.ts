"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { CustomerPortalData } from "@/lib/database-extras.types";

const portalKeys = {
  customer: () => ["portal", "customer"] as const,
};

export function usePortalAuth() {
  const router = useRouter();
  const pathname = usePathname();
  // Components using this hook must be wrapped in <Suspense>
  const searchParams = useSearchParams();

  // Extract token synchronously — avoids race between useQuery firing and a delayed effect
  const token = searchParams.get("token");

  const {
    data: customer,
    isPending,
    isFetching,
    error,
  } = useQuery<CustomerPortalData | null>({
    queryKey: portalKeys.customer(),
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch("/api/portal/customer", { headers });
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error("Failed to load customer");
      }
      const json = await res.json();
      return json.data ?? null;
    },
    retry: false,
    staleTime: 60000,
  });

  // Redirect to login if not authenticated. MUST wait for the first fetch to
  // settle: on the initial render the query is pending but NOT fetching yet
  // (isPending=true, isFetching=false) — redirecting on !isLoading sent every
  // token/customer visitor to the login page before the auth query resolved.
  useEffect(() => {
    if (!isPending && !isFetching && !customer && !error) {
      const loginUrl = `/auth/customer/login?redirectTo=${encodeURIComponent(pathname)}`;
      router.replace(loginUrl);
    }
  }, [isPending, isFetching, customer, error, router, pathname]);

  return {
    customer,
    loading: isPending,
    token,
    error,
  };
}
