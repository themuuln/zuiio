import "server-only";

import { TelegramLogo } from "@phosphor-icons/react/dist/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { capture, withDbCapture } from "@zuiio/capture";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LinkCodeDisplay } from "./link-code-display";

const GATEWAY_URL = process.env.AGENT_GATEWAY_URL ?? "http://localhost:3999";
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME ?? "zuiio_bot";

interface TelegramLinkProps {
  organizationId: string;
  userId: string;
  supabase: SupabaseClient;
}

interface LinkedTelegramAccount {
  telegram_username: string | null;
  linked_at: string | null;
}

async function fetchLinkCode(
  orgId: string,
  userId: string,
  productType: string,
): Promise<{ code: string; formatted: string } | null> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/link/code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, userId, productType }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code && data.formatted) {
      return { code: data.code, formatted: data.formatted };
    }
    return null;
  } catch (e) {
    capture(e, { context: "telegram: fetch link code" });
    return null;
  }
}

export async function TelegramLink({
  organizationId,
  userId,
  supabase,
}: TelegramLinkProps) {
  const { data: links } = await withDbCapture(
    "settings_telegram_links",
    supabase
      .from("telegram_links")
      .select("telegram_username, linked_at")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .eq("product_type", "zer")
      .eq("is_active", true)
      .order("linked_at", { ascending: false })
      .limit(1),
  );

  const linkedAccount =
    (links?.[0] as LinkedTelegramAccount | undefined) ?? null;
  const linkCode = linkedAccount
    ? null
    : await fetchLinkCode(organizationId, userId, "zer");

  let content: React.ReactNode;

  if (linkedAccount) {
    content = (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            ✅ Холбогдсон
          </span>
          {linkedAccount.telegram_username && (
            <span className="text-muted-foreground">
              @{linkedAccount.telegram_username}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Та @{BOT_USERNAME} бот руу мессеж бичиж өгөгдлөө харах боломжтой.
          <br />
          Холбогдсон:{" "}
          {new Date(linkedAccount.linked_at ?? "").toLocaleDateString()}
        </p>
        <Button variant="outline" size="sm" asChild>
          <a
            href={`https://t.me/${BOT_USERNAME}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            @{BOT_USERNAME} нээх
          </a>
        </Button>
      </div>
    );
  } else if (linkCode) {
    content = (
      <LinkCodeDisplay
        code={linkCode.formatted}
        expiresInMinutes={10}
        botUsername={BOT_USERNAME}
      />
    );
  } else {
    content = (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Код үүсгэх боломжгүй байна. Хуудсыг дахин ачааллаад оролдоно уу.
        </p>
        <Button variant="outline" size="sm" asChild>
          <a
            href={`https://t.me/${BOT_USERNAME}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <TelegramLogo className="size-4" weight="fill" />@{BOT_USERNAME}{" "}
            нээх
          </a>
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sky-600">
          <TelegramLogo className="size-5" weight="fill" />
          Telegram холболт
        </CardTitle>
        <CardDescription>
          Telegram боттой холбогдон өгөгдлөө натурал хэлээр асуух
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
