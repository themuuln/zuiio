"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  brandKeys,
  contactKeys,
  expenseKeys,
  inventoryKeys,
  productKeys,
  saleKeys,
} from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";

type RealtimeChannelGroup = {
  name: string;
  table: string;
  keyLists: (orgId: string) => readonly string[];
};

/**
 * Sets up Supabase Realtime channels for key entities (products, sales, contacts,
 * expenses, brands) that invalidate the corresponding React Query caches on any
 * INSERT/UPDATE/DELETE.
 *
 * Sales changes also invalidate the inventory/stock cache.
 * Cleans up all channels when the component unmounts or orgId changes.
 *
 * Pass `null` or `undefined` for orgId to skip subscription setup
 * (e.g., when the user hasn't created an organization yet).
 */
export function useRealtimeSubscriptions(orgId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!orgId) return;

    const supabase = createClient();

    const channels: RealtimeChannelGroup[] = [
      {
        name: `products:${orgId}`,
        table: "products",
        keyLists: (id) => productKeys.lists(id),
      },
      {
        name: `sales:${orgId}`,
        table: "sales",
        keyLists: (id) => saleKeys.lists(id),
      },
      {
        name: `contacts:${orgId}`,
        table: "contacts",
        keyLists: (id) => contactKeys.lists(id),
      },
      {
        name: `expenses:${orgId}`,
        table: "expenses",
        keyLists: (id) => expenseKeys.lists(id),
      },
      {
        name: `brands:${orgId}`,
        table: "brands",
        keyLists: (id) => brandKeys.lists(id),
      },
    ];

    const subscribedChannels = channels.map(({ name, table, keyLists }) => {
      const channel = supabase.channel(name);

      const keyFactories =
        table === "sales"
          ? [keyLists(orgId), inventoryKeys.lists(orgId)]
          : [keyLists(orgId)];

      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `organization_id=eq.${orgId}`,
        },
        () => {
          for (const queryKey of keyFactories) {
            queryClient.invalidateQueries({ queryKey });
          }
        },
      );

      channel.subscribe();
      return channel;
    });

    return () => {
      for (const channel of subscribedChannels) {
        supabase.removeChannel(channel);
      }
    };
  }, [orgId, queryClient]);
}
