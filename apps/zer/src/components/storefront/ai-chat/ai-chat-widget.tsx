"use client";

import {
  ChatCircleDots,
  PaperPlaneTilt,
  Robot,
  Sparkle,
  X,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MarkdownText } from "./markdown";

/**
 * Floating AI shopping assistant for the public storefront.
 *
 * Buyers chat in Mongolian with the org's AI assistant: product discovery,
 * recommendations, shop info. Product links in answers point at the
 * storefront origin the buyer is actually browsing (passed as baseUrl).
 */
const SUGGESTIONS = [
  "Бүтээгдэхүүн санал болго",
  "Хямдралтай бүтээгдэхүүн байна уу?",
  "Дэлгүүрийн хаяг, ажиллах цаг",
];

const GENERIC_ERROR = "Хариулт авахад алдаа гарлаа. Дахин оролдоно уу.";

type ChatRole = "user" | "assistant";
interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

/**
 * Reads the SSE stream returned by /api/ai/chat. Calls `onToken` for each
 * `{token}` event as it arrives and resolves with the full reply or a
 * mid-stream `{error}` message.
 */
async function readSseStream(
  res: Response,
  onToken: (token: string) => void,
): Promise<{ reply?: string; error?: string }> {
  if (!res.body) return { error: GENERIC_ERROR };
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let reply = "";
  let errorMsg: string | undefined;

  const handleEvent = (raw: string) => {
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload) continue;
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(payload);
      } catch {
        continue; // ignore keep-alive frames
      }
      if (typeof data.token === "string" && data.token.length > 0) {
        reply += data.token;
        onToken(data.token);
      } else if (typeof data.error === "string") {
        errorMsg = data.error;
      } else if (data.done && typeof data.reply === "string") {
        // Authoritative final text (covers a token-less edge case).
        reply = data.reply;
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line (\n\n or \r\n\r\n).
    let sep = buffer.search(/\r?\n\r?\n/);
    while (sep !== -1) {
      const raw = buffer.slice(0, sep);
      buffer = buffer.slice(sep + (buffer[sep] === "\r" ? 4 : 2));
      handleEvent(raw);
      if (errorMsg) return { error: errorMsg };
      sep = buffer.search(/\r?\n\r?\n/);
    }
  }
  handleEvent(buffer);

  return { reply: reply || undefined, error: errorMsg };
}

export function StorefrontAiChat({
  slug,
  orgName,
}: {
  slug: string;
  orgName: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Abort any in-flight stream when the widget unmounts so the server stops
  // spending tokens on a reply nobody will see.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // Keep the latest message in view.
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll must re-run when the chat list changes, even though the body only touches the ref
  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ block: "end" });
  }, [messages, pending, streamingText, open]);

  // Focus the input when the panel opens.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || pending) return;

      const history: ChatMessage[] = [
        ...messages,
        { id: crypto.randomUUID(), role: "user" as const, content: trimmed },
      ].slice(-10);

      setMessages(history);
      setInput("");
      setError(null);
      setStreamingText("");
      setPending(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            messages: history,
            baseUrl: window.location.origin,
          }),
          signal: controller.signal,
        });

        // Streaming path: SSE events {token}, {done, reply}, or {error}.
        const contentType = res.headers?.get?.("content-type") ?? "";
        if (res.ok && contentType.includes("text/event-stream")) {
          const reply = await readSseStream(res, (token) =>
            setStreamingText((prev) => prev + token),
          );
          if (reply.error) {
            setError(reply.error);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                content: reply.reply ?? "",
              },
            ]);
          }
          return;
        }

        // Non-streaming path (validation/rate-limit/config errors).
        const data = (await res.json().catch(() => null)) as {
          reply?: string;
          error?: string;
        } | null;

        if (!res.ok || !data?.reply) {
          setError(data?.error ?? GENERIC_ERROR);
          return;
        }
        const reply = data.reply;
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: reply },
        ]);
      } catch (err) {
        // A deliberate abort (unmount or user navigation) is not an error.
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(GENERIC_ERROR);
        }
      } finally {
        setPending(false);
        setStreamingText("");
        abortRef.current = null;
      }
    },
    [messages, pending, slug],
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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

      {open && (
        <section
          role="dialog"
          aria-label="AI туслах"
          aria-live="polite"
          className="fixed right-4 bottom-20 z-50 flex h-[min(32rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl"
        >
          {/* Header */}
          <header className="flex items-center gap-3 border-b border-border/60 bg-primary px-4 py-3 text-primary-foreground">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary-foreground/15">
              <Robot className="size-5" weight="fill" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {orgName ? `${orgName} — AI туслах` : "AI туслах"}
              </p>
              <p className="text-xs opacity-80">
                Бүтээгдэхүүн хайх, санал авах
              </p>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && !pending && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Сайн байна уу! 👋 Би энэ дэлгүүрийн AI туслах. Бүтээгдэхүүн
                  олох, санал авахад тусална. Юу хайж байна вэ?
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      <Sparkle className="size-3.5" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm break-words",
                  m.role === "user"
                    ? "ml-auto rounded-br-sm bg-primary text-primary-foreground"
                    : "mr-auto rounded-bl-sm border border-border/60 bg-muted/50",
                )}
              >
                {m.role === "user" ? (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                ) : (
                  <MarkdownText text={m.content} />
                )}
              </div>
            ))}

            {pending && streamingText && (
              <div className="mr-auto max-w-[85%] rounded-2xl rounded-bl-sm border border-border/60 bg-muted/50 px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words">
                <MarkdownText text={streamingText} />
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse align-middle bg-muted-foreground/70" />
              </div>
            )}

            {pending && !streamingText && (
              <div className="mr-auto flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-border/60 bg-muted/50 px-4 py-3">
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" />
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                {error}
              </p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-border/60 p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Мессеж бичих..."
              aria-label="Мессеж"
              maxLength={2000}
              className="h-10 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || pending}
              aria-label="Илгээх"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            >
              <PaperPlaneTilt className="size-4" weight="bold" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
