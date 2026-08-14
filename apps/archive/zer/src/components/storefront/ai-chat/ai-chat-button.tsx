"use client";

import { ChatCircleDots, X } from "@phosphor-icons/react";

/**
 * Floating trigger for the storefront AI assistant. Lives in its own
 * module so the lazy chat wrapper can ship the button in the initial
 * bundle while the full chat widget (SSE streaming, markdown) loads on
 * first click.
 */
export function StorefrontAiChatButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={open ? "AI туслах чатыг хаах" : "AI туслах чат нээх"}
      className="fixed right-4 bottom-4 z-50 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105"
    >
      {open ? (
        <X className="size-5" weight="bold" />
      ) : (
        <ChatCircleDots className="size-5" weight="bold" />
      )}
      <span className="hidden sm:inline">AI туслах</span>
    </button>
  );
}
