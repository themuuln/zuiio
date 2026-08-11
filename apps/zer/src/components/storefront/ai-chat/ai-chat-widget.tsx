"use client";

import {
  ChatCircleDots,
  PaperPlaneTilt,
  Robot,
  Sparkle,
  X,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

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

const URL_PATTERN = /(https?:\/\/[^\s<>"']+)/g;

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
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the latest message in view.
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll must re-run when the chat list changes, even though the body only touches the ref
  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ block: "end" });
  }, [messages, pending, open]);

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
      setPending(true);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            messages: history,
            baseUrl: window.location.origin,
          }),
        });
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
      } catch {
        setError(GENERIC_ERROR);
      } finally {
        setPending(false);
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
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words",
                  m.role === "user"
                    ? "ml-auto rounded-br-sm bg-primary text-primary-foreground"
                    : "mr-auto rounded-bl-sm border border-border/60 bg-muted/50",
                )}
              >
                {m.role === "user" ? m.content : <Linkify text={m.content} />}
              </div>
            ))}

            {pending && (
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

/**
 * Renders text with http(s) URLs as clickable links. Text parts are
 * rendered as plain React children (auto-escaped) — no innerHTML.
 */
function Linkify({ text }: { text: string }) {
  const parts = useMemo(() => {
    const seen = new Map<string, number>();
    return text
      .split(URL_PATTERN)
      .filter(Boolean)
      .map((part) => {
        const count = seen.get(part) ?? 0;
        seen.set(part, count + 1);
        return { part, key: `${part}#${count}` };
      });
  }, [text]);

  return (
    <>
      {parts.map(({ part, key }) =>
        part.startsWith("http://") || part.startsWith("https://") ? (
          <a
            key={key}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {part}
          </a>
        ) : (
          <span key={key}>{part}</span>
        ),
      )}
    </>
  );
}
