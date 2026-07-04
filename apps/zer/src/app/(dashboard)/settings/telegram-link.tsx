import "server-only";

import { TelegramLogo } from "@phosphor-icons/react/dist/ssr";
import { createServiceClient } from "@/lib/supabase/server-service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const GATEWAY_URL =
  process.env.AGENT_GATEWAY_URL ?? "http://localhost:3999";

interface TelegramLinkProps {
  organizationId: string;
  userId: string;
}

export async function TelegramLink({
  organizationId,
  userId,
}: TelegramLinkProps) {
  const supabase = createServiceClient();

  const { data: links } = await supabase
    .from("telegram_agent_links")
    .select("telegram_username, linked_at")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .order("linked_at", { ascending: false })
    .limit(1);

  const linkedAccount = links?.[0] ?? null;
  const qrPageUrl = `${GATEWAY_URL}/link?orgId=${encodeURIComponent(organizationId)}&userId=${encodeURIComponent(userId)}&productType=zer`;

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
        {linkedAccount ? (
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={qrPageUrl} target="_blank" rel="noopener noreferrer">
                  <TelegramLogo className="size-4" weight="fill" />
                  Дахин холбох
                </a>
              </Button>
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
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Telegram боттой холбогдон өөрийн Zer өгөгдлөө натурал хэлээр
              асуух боломжтой. Дараах холбоосоор QR код уншуулж холбогдоно
              уу.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild>
                <a href={qrPageUrl} target="_blank" rel="noopener noreferrer">
                  <TelegramLogo className="size-4" weight="fill" />
                  Telegram-тэй холбох
                </a>
              </Button>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
