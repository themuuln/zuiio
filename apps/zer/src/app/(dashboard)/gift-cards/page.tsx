import { withDbCapture } from "@zuiio/capture";
import { Suspense } from "react";
import { requireAppContext } from "@/lib/erp";
import { GiftCardsContent } from "./gift-cards-content";

function PageSkeleton() {
  return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
}

async function DataFetcher() {
  const { supabase, organizationId } = await requireAppContext();

  // gift_cards table exists in DB but not yet in generated supabase types
  const gcDb = supabase as unknown as {
    from(table: "gift_cards"): {
      select(columns: string): {
        eq(
          col: string,
          val: string,
        ): {
          order(
            col: string,
            opts?: { ascending?: boolean },
          ): Promise<{
            data: Array<Record<string, unknown>> | null;
            error: unknown;
          }>;
        };
      };
    };
  };

  const rawQuery = gcDb
    .from("gift_cards")
    .select(
      "id, code, initial_balance, current_balance, expires_at, is_active, recipient_name, issued_at",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  const { data: giftCards } = await withDbCapture(
    "page:gift_cards gift_cards",
    rawQuery,
  );

  const giftCardRows: GiftCardRow[] = (
    (giftCards ?? []) as Record<string, unknown>[]
  ).map((d) => ({
    id: String(d.id ?? ""),
    code: String(d.code ?? ""),
    initial_balance: Number(d.initial_balance ?? 0),
    current_balance: Number(d.current_balance ?? 0),
    expires_at: d.expires_at ? String(d.expires_at) : null,
    is_active: Boolean(d.is_active),
    recipient_name: d.recipient_name ? String(d.recipient_name) : null,
    issued_at: String(d.issued_at ?? new Date().toISOString()),
  }));

  return <GiftCardsContent giftCards={giftCardRows} />;
}

export type GiftCardRow = {
  id: string;
  code: string;
  initial_balance: number;
  current_balance: number;
  expires_at: string | null;
  is_active: boolean;
  recipient_name: string | null;
  issued_at: string;
};

export default async function GiftCardsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DataFetcher />
    </Suspense>
  );
}
