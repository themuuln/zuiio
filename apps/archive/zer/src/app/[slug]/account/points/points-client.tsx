"use client";

import { Coins, Gift, Sparkle } from "@phosphor-icons/react";
import { capture } from "@zuiio/capture";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { formatPoints, getPointsTier } from "@/lib/loyalty";
import {
  fetchPublicLoyalty,
  type PublicLoyalty,
  pointsToMoney,
  sortHistoryNewestFirst,
} from "@/lib/storefront-loyalty";
import { createClient } from "@/lib/supabase/client";
import { useStoreSession } from "../use-store-session";

const TYPE_LABELS: Record<string, string> = {
  earned: "Оноо авсан",
  redeemed: "Оноо зарцуулсан",
  expired: "Дууссан",
  adjusted: "Тохируулсан",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Buyer loyalty overview: balance, earn rules, points history, and the
 * org's redeemable rewards. Fetches `get_public_loyalty` — the RPC resolves
 * the buyer's contact by the signed-in store account's phone/email.
 */
export function PointsClient({ slug }: { slug: string }) {
  const { state } = useStoreSession();
  const [loyalty, setLoyalty] = useState<PublicLoyalty | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPublicLoyalty(createClient(), slug);
      setLoyalty(data);
    } catch (err) {
      capture(err, { context: "points: get_public_loyalty" });
      setLoyalty(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (state.status !== "account") return;
    void load();
  }, [state.status, load]);

  if (state.status !== "account") {
    return (
      <p className="text-sm text-muted-foreground">
        Оноо харахын тулд нэвтэрнэ үү.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!loyalty?.enabled) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Энэ дэлгүүр одоогоор лоялти хөтөлбөр санал болгохгүй байна.
      </div>
    );
  }

  const tier = getPointsTier(loyalty.balance);
  const history = sortHistoryNewestFirst(loyalty.history);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Coins className="size-5 text-primary" />
          <CardTitle className="text-lg">Миний оноо</CardTitle>
        </CardHeader>
        <CardContent className="flex items-end justify-between">
          <div>
            <p className="text-4xl font-bold tabular-nums">
              {formatPoints(loyalty.balance)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              ₮
              {formatPoints(
                pointsToMoney(loyalty.balance, loyalty.points_per_mnt),
              )}
              -ийн хямдрал болгох боломжтой
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-sm font-semibold ${tier.color}`}>
              {tier.name}
            </span>
            {tier.nextThreshold !== null && (
              <span className="text-xs text-muted-foreground">
                Дараагийн түвшин: {formatPoints(tier.nextThreshold)} оноо
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkle className="size-4 text-primary" />
            Оноо хэрхэн цуглуулах вэ?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {loyalty.min_purchase > 0 ? (
            <p>
              ₮{formatPoints(loyalty.min_purchase)}-аас дээш худалдан авалт
              тутамд ₮{formatPoints(loyalty.points_per_mnt)} тутамд 1 оноо авна.
              Захиалгын төлбөрөө оноогоор хямдруулж болно.
            </p>
          ) : (
            <p>
              ₮{formatPoints(loyalty.points_per_mnt)} тутамд 1 оноо авна.
              Захиалгын төлбөрөө оноогоор хямдруулж болно.
            </p>
          )}
        </CardContent>
      </Card>

      {loyalty.rewards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="size-4 text-primary" />
              Шагналууд
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {loyalty.rewards.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{reward.name}</p>
                  {reward.description && (
                    <p className="text-xs text-muted-foreground">
                      {reward.description}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatPoints(reward.points_cost)} оноо
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Онооны түүх</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Онооны түүх байхгүй байна.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {TYPE_LABELS[entry.type] ?? entry.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(entry.created_at)}
                    </p>
                  </div>
                  <span
                    className={`font-semibold tabular-nums ${
                      entry.points >= 0
                        ? "text-emerald-600"
                        : "text-destructive"
                    }`}
                  >
                    {entry.points >= 0 ? "+" : ""}
                    {formatPoints(entry.points)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
