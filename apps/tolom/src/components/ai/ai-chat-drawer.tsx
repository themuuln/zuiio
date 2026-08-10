"use client";

import { Bot, Loader2, SendHorizonal, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCurrentOrg } from "@/lib/queries/use-organization";

// ── Types ────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ── Chat Bubble ──────────────────────────────────────────────

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bot className="size-4 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        {message.content}
      </div>
      {isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary">
          <span className="text-xs font-semibold text-primary-foreground">
            Т
          </span>
        </div>
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";

// ── Chat Input ───────────────────────────────────────────────

function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const t = useTranslations();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
  }, [input, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
    // Height is derived from the current value through the DOM.
    // biome-ignore lint/correctness/useExhaustiveDependencies: resize must run on input change; the value is read via the ref.
    void input;
  }, [input]);

  return (
    <div className="flex items-end gap-2 border-t bg-background p-4">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("ai.chatPlaceholder")}
        rows={1}
        className="flex-1 resize-none rounded-xl border bg-muted/50 px-3 py-2.5 text-sm outline-none ring-1 ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
        disabled={disabled}
      />
      <Button
        size="icon"
        onClick={handleSubmit}
        disabled={disabled || !input.trim()}
        className="h-10 w-10 shrink-0 rounded-xl"
      >
        {disabled ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <SendHorizonal className="size-4" />
        )}
      </Button>
    </div>
  );
}

// ── Welcome Message ──────────────────────────────────────────

function WelcomeMessage() {
  const t = useTranslations();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="size-8 text-primary" />
      </div>
      <div className="flex flex-col gap-y-1">
        <p className="text-lg font-semibold">{t("ai.chatTitle")}</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          {t("ai.chatWelcome")}
        </p>
      </div>
      <div className="mt-2 grid gap-2 text-left text-sm text-muted-foreground">
        <div className="rounded-lg border bg-muted/50 px-3 py-2">
          &ldquo;Өнөөдрийн захиалгуудыг харуул&rdquo;
        </div>
        <div className="rounded-lg border bg-muted/50 px-3 py-2">
          &ldquo;Дугуйны тосны үлдэгдэл шалга&rdquo;
        </div>
        <div className="rounded-lg border bg-muted/50 px-3 py-2">
          &ldquo;Баярсайханы утасны дугаарыг ол&rdquo;
        </div>
      </div>
    </div>
  );
}

// ── Floating Trigger Button ─────────────────────────────────

function AiFloatingButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations();
  return (
    <Button
      onClick={onClick}
      size="icon"
      aria-label={t("ai.openChat")}
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
    >
      <Sparkles className="size-6" />
    </Button>
  );
}

// ── Main Drawer Component ───────────────────────────────────

interface AiChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When true, renders a floating trigger button instead of requiring external control */
  showFloatingButton?: boolean;
}

export function AiChatDrawer({
  open,
  onOpenChange,
  showFloatingButton,
}: AiChatDrawerProps) {
  const t = useTranslations();
  const { data: orgInfo } = useCurrentOrg();
  const orgId = orgInfo?.orgId;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // Scroll position derives from the message list rendered in the DOM.
    // biome-ignore lint/correctness/useExhaustiveDependencies: must run on every message change.
    void messages;
  }, [messages]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!orgId) return;

      const userMessage: ChatMessage = { role: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch(`/api/organizations/${orgId}/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as { reply: string };

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Уучлаарай, хариулт авахад алдаа гарлаа. Дахин оролдоно уу.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [orgId, messages],
  );

  return (
    <>
      <DetailDrawer
        open={open}
        onOpenChange={onOpenChange}
        size="md"
        modal={false}
      >
        <DetailDrawer.Header
          closeButton
          onClose={() => onOpenChange(false)}
          bordered
        >
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/10">
              <Bot className="size-4 text-primary" />
            </div>
            <DetailDrawer.Title>{t("ai.chatTitle")}</DetailDrawer.Title>
          </div>
        </DetailDrawer.Header>

        <DetailDrawer.Body className="flex flex-col p-0">
          {messages.length === 0 && !isLoading ? (
            <WelcomeMessage />
          ) : (
            <ScrollArea className="flex-1">
              <div
                ref={scrollRef}
                className="flex flex-col gap-4 p-4 overflow-y-auto max-h-[calc(100vh-12rem)]"
              >
                {messages.map((msg, i) => (
                  <ChatBubble key={i} message={msg} />
                ))}
                {isLoading && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    {t("ai.chatThinking")}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <ChatInput onSend={handleSend} disabled={isLoading} />
        </DetailDrawer.Body>
      </DetailDrawer>

      {showFloatingButton && !open && (
        <AiFloatingButton onClick={() => onOpenChange(true)} />
      )}
    </>
  );
}
