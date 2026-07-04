"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Copy } from "@phosphor-icons/react";

interface QrCodeInlineProps {
 /** The Telegram deep link URL to encode. */
 value: string;
 /** The raw /start command text the user can copy. */
 startCommand: string;
 /** Size in pixels (default 200). */
 size?: number;
}

/**
 * Renders an inline QR code plus a copyable /start command.
 *
 * Dual-path: scan the QR (opens Telegram with pre-filled START button)
 * OR copy the command and paste it directly to @zuiio_bot.
 */
export function QrCodeInline({
 value,
 startCommand,
 size = 200,
}: QrCodeInlineProps) {
 const [copied, setCopied] = useState(false);

 const handleCopy = async () => {
  await navigator.clipboard.writeText(startCommand);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
 };

 return (
  <div className="space-y-3">
   <div className="inline-flex rounded-lg border bg-white p-3">
    <QRCodeSVG value={value} size={size} level="M" includeMargin />
   </div>
   <p className="text-xs text-muted-foreground">
    QR кодыг уншуулж Telegram-д очиж <strong>START</strong> товчийг
    дараарай.
   </p>
   <div className="flex items-center gap-2">
    <code className="flex-1 rounded bg-muted px-2 py-1.5 text-xs font-mono break-all">
     {startCommand}
    </code>
    <Button
     variant="outline"
     size="sm"
     className="shrink-0 gap-1"
     onClick={handleCopy}
    >
     <Copy className="size-3.5" />
     {copied ? "Хуулсан" : "Хуулах"}
    </Button>
   </div>
   <p className="text-xs text-muted-foreground">
    Эсвэл дээрх командыг хуулж @zuiio_bot руу илгээнэ үү.
   </p>
  </div>
 );
}
