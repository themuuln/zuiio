import type { TelegramChannel } from "./channel";

const MAX_STREAM_PREVIEW_LENGTH = 4096;
const DEFAULT_STREAM_UPDATE_INTERVAL_MS = 250;
const MAX_TELEGRAM_DRAFT_ID = 2_147_483_647;

interface TelegramStreamingChannel {
  sendChatAction(chatId: number | string, action?: string): Promise<void>;
  sendMessage(chatId: number | string, text: string): Promise<void>;
  sendMessageDraft(
    chatId: number | string,
    draftId: number,
    text: string,
  ): Promise<boolean>;
  sendStreamingPlaceholder(chatId: number | string): Promise<number | null>;
  editStreamingMessage(
    chatId: number | string,
    messageId: number,
    text: string,
  ): Promise<boolean>;
}

/**
 * Start a typing indicator loop that refreshes every 4 seconds.
 * Returns a stop function — call it when the operation completes.
 */
export function startTypingLoop(
  tg: Pick<TelegramChannel, "sendChatAction">,
  chatId: number | string,
): () => void {
  tg.sendChatAction(chatId, "typing").catch(() => {});

  const interval = setInterval(() => {
    tg.sendChatAction(chatId, "typing").catch(() => {});
  }, 4000);

  return () => clearInterval(interval);
}

export interface TelegramResponseStream {
  /** Pass provider token chunks into the throttled Telegram stream. */
  onToken(token: string): void;
  /** Drain in-flight previews, then persist the final formatted message. */
  finish(text: string): Promise<void>;
  /** Replace any preview with a user-facing error message. */
  fail(text: string): Promise<void>;
}

/**
 * Stream an AI response through Telegram.
 *
 * Private chats use sendMessageDraft when available. Group and channel chats,
 * plus bots running on older Bot API versions, use an edit-in-place fallback.
 * Draft previews intentionally stay plain text; the final sendMessage call
 * applies the existing Telegram HTML/rich-message formatting.
 */
export function createTelegramResponseStream(
  tg: TelegramStreamingChannel,
  chatId: number | string,
  chatType: string,
  options?: {
    onFirstToken?: () => void;
    updateIntervalMs?: number;
  },
): TelegramResponseStream {
  const updateIntervalMs = Math.max(
    100,
    options?.updateIntervalMs ?? DEFAULT_STREAM_UPDATE_INTERVAL_MS,
  );
  let mode: "draft" | "edit" = chatType === "private" ? "draft" : "edit";
  const draftId = Math.floor(Math.random() * MAX_TELEGRAM_DRAFT_ID) + 1;
  let accumulatedText = "";
  let pendingText: string | null = null;
  let pendingTimer: ReturnType<typeof setTimeout> | undefined;
  let updatePromise: Promise<void> | null = null;
  let fallbackMessageId: number | null = null;
  let fallbackAttempted = false;
  let lastUpdateAt = 0;
  let closing = false;
  let closed = false;
  let firstTokenSeen = false;
  let finishPromise: Promise<void> | null = null;

  function scheduleUpdate(): void {
    if (closed || closing || updatePromise || pendingText === null) return;

    const delay = Math.max(0, updateIntervalMs - (Date.now() - lastUpdateAt));
    if (delay === 0) {
      void flushUpdate();
      return;
    }
    if (pendingTimer === undefined) {
      pendingTimer = setTimeout(() => {
        pendingTimer = undefined;
        void flushUpdate();
      }, delay);
    }
  }

  async function flushUpdate(): Promise<void> {
    if (closed || pendingText === null || updatePromise) return;

    const preview = pendingText.slice(0, MAX_STREAM_PREVIEW_LENGTH);
    pendingText = null;
    updatePromise = (async () => {
      if (mode === "draft") {
        try {
          if (await tg.sendMessageDraft(chatId, draftId, preview)) {
            lastUpdateAt = Date.now();
            return;
          }
        } catch {
          // Fall through to the edit-in-place fallback.
        }
        mode = "edit";
      }

      if (!fallbackAttempted) {
        fallbackAttempted = true;
        try {
          fallbackMessageId = await tg.sendStreamingPlaceholder(chatId);
        } catch {
          fallbackMessageId = null;
        }
      }
      if (fallbackMessageId !== null) {
        try {
          await tg.editStreamingMessage(chatId, fallbackMessageId, preview);
        } catch {
          // The final send below remains the source of truth.
        }
      }
      lastUpdateAt = Date.now();
    })();

    try {
      await updatePromise;
    } finally {
      updatePromise = null;
      if (pendingText !== null && !closed && !closing) {
        scheduleUpdate();
      }
    }
  }

  async function drainUpdates(): Promise<void> {
    if (pendingTimer !== undefined) {
      clearTimeout(pendingTimer);
      pendingTimer = undefined;
    }

    while (updatePromise || pendingText !== null) {
      if (updatePromise) {
        await updatePromise;
      } else {
        await flushUpdate();
      }
    }
  }

  function onToken(token: string): void {
    if (closed || closing || token.length === 0) return;
    if (!firstTokenSeen) {
      firstTokenSeen = true;
      try {
        options?.onFirstToken?.();
      } catch {
        // A UI callback must never interrupt provider token delivery.
      }
    }
    accumulatedText += token;
    pendingText = accumulatedText;
    scheduleUpdate();
  }

  function finish(text: string): Promise<void> {
    if (finishPromise) return finishPromise;
    finishPromise = (async () => {
      closing = true;
      await drainUpdates();
      closed = true;
      await tg.sendMessage(chatId, text);
    })();
    return finishPromise;
  }

  return {
    onToken,
    finish,
    fail: finish,
  };
}
