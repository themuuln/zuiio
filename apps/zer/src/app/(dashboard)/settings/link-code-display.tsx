"use client";

import { Check, Copy } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface LinkCodeDisplayProps {
  /** Formatted code (e.g. "XK9M-2P7Q"). */
  code: string;
  /** Expiry in minutes. */
  expiresInMinutes: number;
}

/**
 * Displays a device auth code with copy button.
 * User enters this code in @zuiio_bot to link their account.
 */
export function LinkCodeDisplay({
  code,
  expiresInMinutes,
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
          Энэ кодыг @zuiio_bot руу илгээнэ үү:
        </p>
        <div className="flex items-center gap-3">
          <code className="rounded bg-background px-5 py-3 text-2xl font-mono font-bold tracking-widest text-[#0088cc] border">
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
          href="https://t.me/zuiio_bot"
          target="_blank"
          rel="noopener noreferrer"
        >
          @zuiio_bot нээх
        </a>
      </Button>
    </div>
  );
}
