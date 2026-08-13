"use client";

import { Coins } from "@phosphor-icons/react";
import { capture } from "@zuiio/capture";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPoints } from "@/lib/loyalty";
import { fetchPublicLoyalty } from "@/lib/storefront-loyalty";
import { createClient } from "@/lib/supabase/client";

/**
 * Small balance chip on the buyer account home. Renders nothing when the
 * store has no loyalty program or the buyer has no points (avoids noise
 * for stores that never enabled the feature).
 */
export function PointsBalanceCard({ slug }: { slug: string }) {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPublicLoyalty(createClient(), slug)
      .then((loyalty) => {
        if (!cancelled && loyalty?.enabled && loyalty.balance > 0) {
          setBalance(loyalty.balance);
        }
      })
      .catch((err) => {
        capture(err, { context: "points card: get_public_loyalty" });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (balance === null) return null;

  return (
    <Link
      href={`/${slug}/account/points`}
      className="flex items-center justify-between rounded-xl border bg-primary/5 p-4 transition-colors hover:bg-primary/10"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <Coins className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">Миний оноо</p>
          <p className="text-xs text-muted-foreground">Оноо, түүх, шагналууд</p>
        </div>
      </div>
      <span className="text-lg font-bold tabular-nums">
        {formatPoints(balance)}
      </span>
    </Link>
  );
}
