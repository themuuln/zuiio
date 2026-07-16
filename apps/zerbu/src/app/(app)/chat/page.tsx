"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PaperPlaneRight, Heart } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type Message = {
  id: string;
  content: string;
  sender_id: string | null;
  created_at: string | null;
  is_read: boolean | null;
};

export default function ChatPage() {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [profileId, setProfileId] = useState("");
  const [coupleId, setCoupleId] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setProfileId(user.id);
      supabase
        .from("profiles")
        .select("name, couple_id")
        .eq("id", user.id)
        .single()
        .then(({ data: prof }) => {
          if (!prof?.couple_id) { setLoading(false); return; }
          setCoupleId(prof.couple_id);
          loadMessages(prof.couple_id);
          setupRealtime(prof.couple_id);
          supabase
            .from("profiles")
            .select("name")
            .eq("couple_id", prof.couple_id)
            .neq("id", user.id)
            .single()
            .then(({ data: p }) => {
              if (p) setPartnerName(p.name);
            });
        });
    });
    return () => {
      supabase.channel("chat_messages").unsubscribe();
    };
  }, []);

  function setupRealtime(cId: string) {
    supabase
      .channel("chat_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `couple_id=eq.${cId}`,
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
        },
      )
      .subscribe();
  }

  function loadMessages(cId: string) {
    setLoading(true);
    setError(null);
    supabase
      .from("messages")
      .select()
      .eq("couple_id", cId)
      .order("created_at", { ascending: true })
      .then(({ data, error: err }) => {
        if (err) {
          setError("Мессежүүдийг ачаалахад алдаа гарлаа");
        } else if (data) {
          setMessages(data as Message[]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Мессежүүдийг ачаалахад алдаа гарлаа");
        setLoading(false);
      });
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!newMessage.trim() || !coupleId) return;
    await supabase.from("messages").insert({
      couple_id: coupleId,
      sender_id: profileId,
      content: newMessage.trim(),
    });
    setNewMessage("");
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] animate-fade-in">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <h1 className="text-xl font-bold text-text dark:text-dark-text">Чат</h1>
        {partnerName && <span className="text-sm text-text-secondary">× {partnerName}</span>}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 px-1">
        {loading ? (
          <>
            <div className="flex justify-end">
              <Skeleton className="h-12 w-2/3 rounded-[16px]" />
            </div>
            <div className="flex justify-start">
              <Skeleton className="h-12 w-1/2 rounded-[16px]" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-12 w-3/5 rounded-[16px]" />
            </div>
            <div className="flex justify-start">
              <Skeleton className="h-12 w-2/5 rounded-[16px]" />
            </div>
          </>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-text-secondary mb-4">{error}</p>
            <Button
              onClick={() => loadMessages(coupleId)}
              className="bg-primary text-white rounded-full px-6"
            >
              Дахин оролдох
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Heart size={48} className="text-primary/40 mb-4" weight="fill" />
            <p className="text-text-secondary">Хоосон байна. Эхний мессежээ бичээрэй!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === profileId;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-[16px] px-4 py-2.5 ${
                    isMe
                      ? "bg-primary text-white rounded-br-[4px]"
                      : "bg-surface dark:bg-dark-surface text-text dark:text-dark-text rounded-bl-[4px]"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? "text-white/70" : "text-text-secondary"}`}>
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleTimeString("mn-MN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {!coupleId ? (
        <div className="text-center py-4 text-text-secondary bg-surface dark:bg-dark-surface rounded-full">
          Холбогдоогүй байна
        </div>
      ) : (
        <div className="flex gap-2 shrink-0">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Мессеж бичих..."
            className="flex-1 px-4 py-3 rounded-full bg-surface dark:bg-dark-surface border-2 border-secondary/30 dark:border-dark-surface text-text dark:text-dark-text placeholder:text-text-secondary/50 focus:outline-none focus:border-primary transition-colors"
          />
          <Button onClick={handleSend} size="sm" className="rounded-full w-12 h-12 p-0 flex items-center justify-center">
            <PaperPlaneRight size={20} />
          </Button>
        </div>
      )}
    </div>
  );
}
