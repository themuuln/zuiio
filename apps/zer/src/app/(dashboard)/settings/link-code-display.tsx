"use client";

import { Check, Copy } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface LinkCodeDisplayProps {
  /** Formatted code (e.g. "XK9M-2P7Q"). */
  code: string;
  /** Expiry in minutes. */
  expiresInMinutes: number;
  /** Bot username without @. */
  botUsername: string;
}

/**
 * Displays a device auth code with copy button.
 * User enters this code in the configured Telegram bot to link their account.
 */
export function LinkCodeDisplay({
  code,
  expiresInMinutes,
  botUsername,
}: LinkCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code.replace("-", ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/30 p-6">
        <p className="text-sm text-muted-foreground">
          Энэ кодыг @{botUsername} руу илгээнэ үү:
        </p>
        <div className="flex items-center gap-3">
          <code className="rounded border bg-background px-5 py-3 font-mono text-2xl font-bold tracking-widest text-sky-600">
            {code}
          </code>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <Check className="size-4 text-emerald-600" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {expiresInMinutes} минутын дотор хүчинтэй
        </p>
      </div>
      <Button variant="outline" size="sm" className="w-full" asChild>
        <a
          href={`https://t.me/${botUsername}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          @{botUsername} нээх
        </a>
      </Button>
    </div>
  );
}
