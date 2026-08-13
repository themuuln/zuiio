"use client";

import { useState } from "react";
import { StorefrontAiChatButton } from "./ai-chat-button";

/**
 * Deferred storefront AI assistant. The floating button ships in the
 * initial bundle; the full widget (SSE reader, markdown renderer, chat
 * state) is dynamically imported on the first click, so storefront
 * visitors who never open the chat never pay for its JavaScript.
 *
 * Once loaded, the widget mounts open (initialOpen) and manages its own
 * button + panel; the lazy wrapper hands over permanently.
 */
export function StorefrontAiChatLazy({
  slug,
  orgName,
}: {
  slug: string;
  orgName: string | null;
}) {
  const [Chat, setChat] = useState<
    typeof import("./ai-chat-widget")["StorefrontAiChat"] | null
  >(null);

  if (Chat) {
    return <Chat slug={slug} orgName={orgName} initialOpen />;
  }

  return (
    <StorefrontAiChatButton
      open={false}
      onClick={() => {
        void import("./ai-chat-widget").then((m) =>
          setChat(() => m.StorefrontAiChat),
        );
      }}
    />
  );
}
