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
  keyAll: () => readonly string[];
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
      { name: `products:${orgId}`, table: "products", keyAll: productKeys.all },
      {
        name: `sales:${orgId}`,
        table: "sales",
        keyAll: saleKeys.all,
      },
      {
        name: `contacts:${orgId}`,
        table: "contacts",
        keyAll: contactKeys.all,
      },
      {
        name: `expenses:${orgId}`,
        table: "expenses",
        keyAll: expenseKeys.all,
      },
      {
        name: `brands:${orgId}`,
        table: "brands",
        keyAll: brandKeys.all,
      },
    ];

    const subscribedChannels = channels.map(({ name, table, keyAll }) => {
      const channel = supabase.channel(name);

      const keyFactories =
        table === "sales" ? [keyAll, inventoryKeys.all] : [keyAll];

      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `organization_id=eq.${orgId}`,
        },
        () => {
          for (const keyFactory of keyFactories) {
            queryClient.invalidateQueries({ queryKey: keyFactory() });
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
