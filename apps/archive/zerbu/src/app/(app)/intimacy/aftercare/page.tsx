"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Notebook } from "@phosphor-icons/react";
import { SkeletonCard } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { mn } from "date-fns/locale";

type JournalEntry = {
  id: string;
  entry_date: string;
  entry_a: string | null;
  entry_b: string | null;
};

export default function AftercareJournalPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profileId, setProfileId] = useState("");
  const [coupleId, setCoupleId] = useState("");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [todayEntry, setTodayEntry] = useState<JournalEntry | null>(null);
  const [myEntry, setMyEntry] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setProfileId(user.id);
      supabase.from("profiles").select("couple_id").eq("id", user.id).single().then(({ data: prof }) => {
        if (!prof?.couple_id) return;
        setCoupleId(prof.couple_id);
        loadEntries(prof.couple_id, user.id);
      });
    });
  }, []);

  async function loadEntries(cId: string, uId: string) {
    const { data } = await supabase.from("aftercare_journal").select().eq("couple_id", cId).order("entry_date", { ascending: false }).limit(14);
    if (data) setEntries(data as JournalEntry[]);
    const today = new Date().toISOString().split("T")[0];
    const { data: todayData } = await supabase.from("aftercare_journal").select().eq("couple_id", cId).eq("entry_date", today).single();
    if (todayData) {
      setTodayEntry(todayData as JournalEntry);
      const role = await getRole(cId, uId);
      setMyEntry(role === "a" ? (todayData as JournalEntry).entry_a || "" : (todayData as JournalEntry).entry_b || "");
    }
    setLoading(false);
  }

  async function getRole(cId: string, uId: string): Promise<"a" | "b"> {
    const { data: profiles } = await supabase.from("profiles").select("id").eq("couple_id", cId).order("created_at", { ascending: true });
    if (!profiles || profiles.length < 2) return "a";
    return profiles[0].id === uId ? "a" : "b";
  }

  async function handleSave() {
    if (!coupleId || !myEntry.trim()) return;
    const role = await getRole(coupleId, profileId);
    const column = role === "a" ? "entry_a" : "entry_b";
    const today = new Date().toISOString().split("T")[0];

    if (todayEntry) {
      await supabase.from("aftercare_journal").update({ [column]: myEntry.trim() }).eq("id", todayEntry.id);
    } else {
      await supabase.from("aftercare_journal").insert({
        couple_id: coupleId,
        entry_date: today,
        [column]: myEntry.trim(),
      });
    }
    setEditing(false);
    loadEntries(coupleId, profileId);
  }

  const hasBothEntries = (entry: JournalEntry) => entry.entry_a && entry.entry_b;

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <button type="button" onClick={() => router.back()} className="flex items-center gap-1 text-text-secondary hover:text-text transition-colors cursor-pointer">
        <ArrowLeft size={18} /><span className="text-sm">Буцах</span>
      </button>

      <h1 className="text-xl font-bold text-text dark:text-dark-text">Aftercare Journal</h1>
      <CardDescription>Дотно мөчүүдийн дараах бодол, мэдрэмжээ тэмдэглэх</CardDescription>

      <Card>
        <CardTitle>Өнөөдөр</CardTitle>
        <div className="mt-3">
          {editing ? (
            <div className="space-y-3">
              <textarea
                value={myEntry}
                onChange={(e) => setMyEntry(e.target.value)}
                placeholder="Өнөөдөр юу сайхан болсон бэ? Юу чамайг ойртуулав?"
                rows={5}
                className="w-full px-4 py-3 rounded-[12px] bg-bg dark:bg-dark-bg border-2 border-secondary/30 text-text dark:text-dark-text placeholder:text-text-secondary/50 focus:outline-none focus:border-primary transition-colors resize-none"
              />
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={!myEntry.trim()}>Хадгалах</Button>
                <Button onClick={() => setEditing(false)} variant="outline">Цуцлах</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {myEntry ? (
                <div>
                  <p className="text-text dark:text-dark-text">{myEntry}</p>
                  <Button onClick={() => setEditing(true)} variant="ghost" size="sm" className="mt-2">Засах</Button>
                </div>
              ) : (
                <Button onClick={() => setEditing(true)} variant="outline" fullWidth>Өнөөдрийн тэмдэглэл бичих</Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {entries.length > 0 ? (
        <div>
          <h2 className="font-semibold text-text dark:text-dark-text mb-3">Өмнөх тэмдэглэлүүд</h2>
          <div className="space-y-3">
            {entries.filter(hasBothEntries).map((entry) => (
              <Card key={entry.id}>
                <p className="text-xs text-text-secondary mb-2">
                  {format(new Date(entry.entry_date), "yyyy MMM d", { locale: mn })}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary/5 rounded-[12px] p-3">
                    <p className="text-[10px] text-primary font-medium mb-1">Танд</p>
                    <p className="text-sm text-text dark:text-dark-text">{entry.entry_a}</p>
                  </div>
                  <div className="bg-accent-steppe/5 rounded-[12px] p-3">
                    <p className="text-[10px] text-accent-steppe font-medium mb-1">Хамтрагчид</p>
                    <p className="text-sm text-text dark:text-dark-text">{entry.entry_b}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="text-center py-12 border-dashed border-2 border-secondary/30">
          <Notebook size={48} className="mx-auto text-text-secondary mb-3" />
          <p className="text-text-secondary">Тэмдэглэл байхгүй байна</p>
        </Card>
      )}
    </div>
  );
}
