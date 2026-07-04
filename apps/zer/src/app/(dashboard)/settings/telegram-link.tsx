import "server-only";

import { TelegramLogo } from "@phosphor-icons/react/dist/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QrCodeInline } from "./qr-code-inline";

const GATEWAY_URL = process.env.AGENT_GATEWAY_URL ?? "http://localhost:3999";

interface TelegramLinkProps {
  organizationId: string;
  userId: string;
  supabase: SupabaseClient;
}

async function fetchLinkToken(
  orgId: string,
  userId: string,
  productType: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/link/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, userId, productType }),
    });
    if (!res.ok) return null;
    const { token } = await res.json();
    return token ?? null;
  } catch {
    return null;
  }
}

export async function TelegramLink({
  organizationId,
  userId,
  supabase,
}: TelegramLinkProps) {
  const { data: links } = await supabase
    .from("telegram_agent_links")
    .select("telegram_username, linked_at")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .order("linked_at", { ascending: false })
    .limit(1);

  const linkedAccount = links?.[0] ?? null;
  const linkToken = linkedAccount
    ? null
    : await fetchLinkToken(organizationId, userId, "zer");

  // tg:// native scheme for more reliable mobile deep linking
  const deeplinkUrl = linkToken
    ? `tg://resolve?domain=zuiio_bot&start=${encodeURIComponent(linkToken)}`
    : null;
  const startCommand = linkToken ? `/start ${linkToken}` : null;

  // Build the content based on state
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
          Та @zuiio_bot бот руу мессеж бичиж өгөгдлөө харах боломжтой.
          <br />
          Холбогдсон:{" "}
          {new Date(linkedAccount.linked_at).toLocaleDateString()}
        </p>
        <Button variant="outline" size="sm" asChild>
          <a
            href="https://t.me/zuiio_bot"
            target="_blank"
            rel="noopener noreferrer"
          >
            @zuiio_bot нээх
          </a>
        </Button>
      </div>
    );
  } else if (deeplinkUrl && startCommand) {
    content = (
      <div className="space-y-4">
        <QrCodeInline
          value={deeplinkUrl}
          startCommand={startCommand}
          size={200}
        />
        <Button variant="outline" size="sm" asChild>
          <a
            href="https://t.me/zuiio_bot"
            target="_blank"
            rel="noopener noreferrer"
          >
            <TelegramLogo className="size-4" weight="fill" />
            @zuiio_bot нээх
          </a>
        </Button>
      </div>
    );
  } else {
    content = (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          QR код үүсгэх боломжгүй байна. Хуудсыг дахин ачааллаад оролдоно уу.
        </p>
        <Button variant="outline" size="sm" asChild>
          <a
            href="https://t.me/zuiio_bot"
            target="_blank"
            rel="noopener noreferrer"
          >
            <TelegramLogo className="size-4" weight="fill" />
            @zuiio_bot нээх
          </a>
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#0088cc]">
          <TelegramLogo className="size-5" weight="fill" />
          Telegram холболт
        </CardTitle>
        <CardDescription>
          Telegram боттой холбогдон өгөгдлөө натурал хэлээр асуух
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
