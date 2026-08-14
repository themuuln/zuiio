"use client";

import {
  ChatCircleDots,
  PaperPlaneTilt,
  Robot,
  Trash,
} from "@phosphor-icons/react";
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";
import { askAssistant, type ChatMessage } from "./actions";

const SUGGESTION_KEYS = [
  "aiAssistant.suggestion.lowStock",
  "aiAssistant.suggestion.todaySales",
  "aiAssistant.suggestion.profit",
] satisfies MessageKey[];

type AskState = { answer?: string; error?: string } | undefined;

export function AiAssistantClient({ orgName }: { orgName: string | null }) {
  const { t } = useI18n();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState<AskState, FormData>(
    askAssistant,
    undefined,
  );

  const bottomRef = useRef<HTMLDivElement>(null);

  // Append the assistant's answer once it arrives.
  useEffect(() => {
    const answer = state?.answer;
    if (answer) {
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    }
    if (state?.error) {
      setActionError(state.error);
    }
  }, [state]);

  // Keep the latest message in view.
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll must re-run when the chat list changes, even though the body only touches the ref
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const ask = useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isPending) return;

      const fd = new FormData();
      fd.set("userMessage", trimmed);
      fd.set("history", JSON.stringify(messages));
      if (orgName) fd.set("orgName", orgName);

      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setInput("");
      setActionError(null);
      formAction(fd);
    },
    [messages, orgName, isPending, formAction],
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ask(input);
  }

  function clearHistory() {
    setMessages([]);
    setActionError(null);
  }

  return (
    <Card className="flex h-[calc(100dvh-16rem)] min-h-[28rem] flex-col overflow-hidden">
      {/* ── Header: title + clear-history ── */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Robot className="size-4" weight="bold" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">
              {t("aiAssistant.title")}
            </span>
            {orgName && (
              <span className="text-xs text-muted-foreground">{orgName}</span>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearHistory}
          disabled={messages.length === 0 || isPending}
        >
          <Trash className="size-4" />
          {t("aiAssistant.clear")}
        </Button>
      </div>

      {/* ── Messages ── */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 px-4 py-4">
          {messages.length === 0 && !isPending ? (
            <Empty className="py-10">
              <EmptyHeader>
                <EmptyMedia>
                  <ChatCircleDots className="size-6 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>{t("aiAssistant.emptyTitle")}</EmptyTitle>
                <EmptyDescription>
                  {t("aiAssistant.emptyDescription")}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {SUGGESTION_KEYS.map((key) => (
                    <Button
                      key={key}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => ask(t(key))}
                    >
                      {t(key)}
                    </Button>
                  ))}
                </div>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: chat history is append-only and has no stable per-message id
                  key={`${i}-${msg.role}`}
                  className={cn(
                    "flex w-full",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words",
                      msg.role === "user"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-muted",
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* ── Typing indicator ── */}
              {isPending && (
                <div className="flex w-full justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                    <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
                    <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
                    <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
                    <span className="ml-2 text-xs text-muted-foreground">
                      {t("aiAssistant.typing")}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* ── Error + input ── */}
      <div className="space-y-2 border-t p-3">
        {actionError && <ErrorBanner error={actionError} />}

        {/* Suggestion chips (persist once the conversation has started) */}
        {messages.length > 0 && !isPending && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTION_KEYS.map((key) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                size="xs"
                onClick={() => ask(t(key))}
              >
                {t(key)}
              </Button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <Textarea
            name="userMessage"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(input);
              }
            }}
            placeholder={t("aiAssistant.placeholder")}
            rows={2}
            className="max-h-40 flex-1 resize-none"
            aria-label={t("aiAssistant.placeholder")}
            disabled={isPending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isPending || !input.trim()}
            aria-label={t("aiAssistant.send")}
          >
            <PaperPlaneTilt className="size-4" weight="bold" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
