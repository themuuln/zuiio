"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { desireMatchInterests } from "@/data/intimacy";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type Interest = {
  id: string;
  category: string;
  interest_text: string;
  is_interested_a: boolean | null;
  is_interested_b: boolean | null;
  is_matched: boolean | null;
};

export default function DesireMatchPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profileId, setProfileId] = useState("");
  const [coupleId, setCoupleId] = useState("");
  const [interests, setInterests] = useState<Interest[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [myVotes, setMyVotes] = useState<Record<string, boolean>>({});
  const [matchedItems, setMatchedItems] = useState<Interest[]>([]);
  const [completed, setCompleted] = useState(false);
  const [partnerName, setPartnerName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setProfileId(user.id);
      supabase.from("profiles").select("couple_id").eq("id", user.id).single().then(({ data: prof }) => {
        if (!prof?.couple_id) return;
        setCoupleId(prof.couple_id);
        loadInterests(prof.couple_id);
        supabase.from("profiles").select("name").eq("couple_id", prof.couple_id).neq("id", user.id).single().then(({ data: p }) => {
          if (p) setPartnerName(p.name);
        });
        setupRealtime(prof.couple_id);
      });
    });
    return () => { supabase.channel("desire_match").unsubscribe(); };
  }, []);

  function setupRealtime(cId: string) {
    supabase.channel("desire_match")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "intimacy_interests", filter: `couple_id=eq.${cId}` },
        (payload: RealtimePostgresChangesPayload<Interest>) => {
          const updated = payload.new as Interest;
          setInterests((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          if (updated.is_matched) {
            setMatchedItems((prev) => {
              if (prev.find((m) => m.id === updated.id)) return prev;
              return [...prev, updated];
            });
          }
        })
      .subscribe();
  }

  async function loadInterests(cId: string) {
    const { data: existing } = await supabase.from("intimacy_interests").select().eq("couple_id", cId);
    if (existing && existing.length > 0) {
      const items = existing as Interest[];
      setInterests(items);
      const myColumn = items[0]?.is_interested_a !== null ? items.map((i) => ({ id: i.id, v: i.is_interested_a })) : [];
      return;
    }
    const batch = desireMatchInterests.map((item) => ({
      couple_id: cId,
      category: item.category,
      interest_text: item.text,
    }));
    const { data: inserted } = await supabase.from("intimacy_interests").insert(batch).select();
    if (inserted) setInterests(inserted as Interest[]);
  }

  async function swipe(interested: boolean) {
    const item = interests[currentIdx];
    if (!item) return;
    setMyVotes((prev) => ({ ...prev, [item.id]: interested }));
    if (interested) {
      await supabase.from("intimacy_interests").update({ is_interested_a: true }).eq("id", item.id);
    } else {
      await supabase.from("intimacy_interests").update({ is_interested_a: false }).eq("id", item.id);
    }
    if (currentIdx < interests.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setCompleted(true);
    }
  }

  const current = interests[currentIdx];
  const remaining = interests.length - currentIdx - 1;

  if (completed) {
    return (
      <div className="space-y-4 animate-fade-in">
        <button type="button" onClick={() => router.back()} className="flex items-center gap-1 text-text-secondary hover:text-text transition-colors cursor-pointer">
          <ArrowLeft size={18} /><span className="text-sm">Буцах</span>
        </button>
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mx-auto">
            <Heart size={32} className="text-primary" weight="fill" />
          </div>
          <h2 className="text-xl font-semibold text-text dark:text-dark-text">Бүрэн!</h2>
          <p className="text-text-secondary">{interests.length} сонирхлоос {Object.values(myVotes).filter(Boolean).length} таалагдсан</p>
          {matchedItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-text dark:text-dark-text">💞 Тааруулсан ({matchedItems.length})</h3>
              {matchedItems.map((m) => (
                <Card key={m.id} className="border-l-4 border-l-primary">
                  <div className="flex items-center gap-2">
                    <span>💞</span>
                    <div>
                      <p className="font-medium text-text dark:text-dark-text">{m.interest_text}</p>
                      <p className="text-xs text-text-secondary">{m.category}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <Button onClick={() => router.push("/intimacy")} variant="outline">Буцах</Button>
        </div>
      </div>
    );
  }

  if (!current) {
    return <div className="flex justify-center py-12"><p className="text-text-secondary">Ачааллаж байна...</p></div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <button type="button" onClick={() => router.back()} className="flex items-center gap-1 text-text-secondary hover:text-text transition-colors cursor-pointer">
        <ArrowLeft size={18} /><span className="text-sm">Буцах</span>
      </button>

      <div className="text-center">
        <h1 className="text-xl font-bold text-text dark:text-dark-text">Desire Match</h1>
        <p className="text-sm text-text-secondary">Таалагдсан эсэхээ сонгоно уу</p>
      </div>

      <div className="flex justify-center gap-1">
        {interests.map((_, i) => (
          <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i <= currentIdx ? "bg-primary" : "bg-secondary/20"}`} />
        ))}
      </div>

      <Card className="text-center py-10 min-h-[240px] flex flex-col items-center justify-center gap-4">
        <Badge variant="info">{current.category}</Badge>
        <CardTitle className="text-lg">{current.interest_text}</CardTitle>
        <p className="text-xs text-text-secondary">{remaining} үлдсэн</p>
      </Card>

      <div className="flex gap-3">
        <Button onClick={() => swipe(false)} variant="outline" size="lg" className="flex-1 h-16 text-lg" fullWidth>✕</Button>
        <Button onClick={() => swipe(true)} size="lg" className="flex-1 h-16 text-lg" fullWidth>❤️</Button>
      </div>
    </div>
  );
}
