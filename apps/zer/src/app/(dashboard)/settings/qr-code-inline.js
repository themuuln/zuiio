"use client";
import { Copy } from "@phosphor-icons/react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
/**
 * Renders an inline QR code plus a copyable /start command.
 *
 * Dual-path: scan the QR (opens Telegram with pre-filled START button)
 * OR copy the command and paste it directly to @zuiio_bot.
 */
export function QrCodeInline({ value, startCommand, size = 200 }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(startCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return React.createElement(
    "div",
    { className: "space-y-3" },
    React.createElement(
      "div",
      { className: "inline-flex rounded-lg border bg-white p-3" },
      React.createElement(QRCodeSVG, {
        value: value,
        size: size,
        level: "M",
        includeMargin: true,
      }),
    ),
    React.createElement(
      "p",
      { className: "text-xs text-muted-foreground" },
      "QR \u043A\u043E\u0434\u044B\u0433 \u0443\u043D\u0448\u0443\u0443\u043B\u0436 Telegram-\u0434 \u043E\u0447\u0438\u0436 ",
      React.createElement("strong", null, "START"),
      " \u0442\u043E\u0432\u0447\u0438\u0439\u0433 \u0434\u0430\u0440\u0430\u0430\u0440\u0430\u0439.",
    ),
    React.createElement(
      "div",
      { className: "flex items-center gap-2" },
      React.createElement(
        "code",
        {
          className:
            "flex-1 rounded bg-muted px-2 py-1.5 text-xs font-mono break-all",
        },
        startCommand,
      ),
      React.createElement(
        Button,
        {
          variant: "outline",
          size: "sm",
          className: "shrink-0 gap-1",
          onClick: handleCopy,
        },
        React.createElement(Copy, { className: "size-3.5" }),
        copied ? "Хуулсан" : "Хуулах",
      ),
    ),
    React.createElement(
      "p",
      { className: "text-xs text-muted-foreground" },
      "\u042D\u0441\u0432\u044D\u043B \u0434\u044D\u044D\u0440\u0445 \u043A\u043E\u043C\u0430\u043D\u0434\u044B\u0433 \u0445\u0443\u0443\u043B\u0436 @zuiio_bot \u0440\u0443\u0443 \u0438\u043B\u0433\u044D\u044D\u043D\u044D \u04AF\u04AF.",
    ),
  );
}
