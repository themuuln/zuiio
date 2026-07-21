"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { mn } from "date-fns/locale";
import { Smiley, SmileyMeh, SmileySad, SmileyWink, SmileyXEyes } from "@phosphor-icons/react";

const moods = [
  { id: "amazing", label: "Гайхалтай", icon: SmileyWink, color: "text-accent-steppe", bg: "bg-accent-steppe/5" },
  { id: "good", label: "Сайн", icon: Smiley, color: "text-success", bg: "bg-success/5" },
  { id: "okay", label: "Дунд зэрэг", icon: SmileyMeh, color: "text-accent-fire", bg: "bg-accent-fire/5" },
  { id: "down", label: "Муухай", icon: SmileySad, color: "text-accent-sky", bg: "bg-accent-sky/5" },
  { id: "rough", label: "Хэцүү", icon: SmileyXEyes, color: "text-error", bg: "bg-error/5" },
];

type MoodEntry = {
  id: string;
  mood: string;
  note: string | null;
  date: string;
};

export default function MoodPage() {
  const supabase = createClient();
  const [profileId, setProfileId] = useState("");
  const [coupleId, setCoupleId] = useState("");
  const [todayMood, setTodayMood] = useState<string | null>(null);
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setProfileId(user.id);
      supabase
        .from("profiles")
        .select("couple_id")
        .eq("id", user.id)
        .single()
        .then(({ data: prof }) => {
          if (!prof?.couple_id) return;
          setCoupleId(prof.couple_id);
          loadMoods(user.id, prof.couple_id);
        });
    });
  }, [supabase]);

  function loadMoods(uId: string, cId: string) {
    const today = new Date().toISOString().split("T")[0];
    supabase
      .from("moods")
      .select()
      .eq("user_id", uId)
      .eq("date", today)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setTodayMood((data as MoodEntry).mood);
      });

    supabase
      .from("moods")
      .select()
      .eq("couple_id", cId)
      .order("date", { ascending: false })
      .limit(14)
      .then(({ data }) => {
        if (data) setRecentMoods(data as MoodEntry[]);
      });
  }

  async function setMood(moodId: string) {
    if (!profileId || !coupleId) return;
    if (todayMood === moodId) {
      await supabase.from("moods").delete().eq("user_id", profileId).eq("date", new Date().toISOString().split("T")[0]);
      setTodayMood(null);
      return;
    }
    await supabase.from("moods").upsert({
      user_id: profileId,
      couple_id: coupleId,
      mood: moodId,
      date: new Date().toISOString().split("T")[0],
    });
    setTodayMood(moodId);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold text-text dark:text-dark-text">Сэтгэл</h1>

      <Card>
        <CardTitle>Өнөөдөр сэтгэл ямар байна?</CardTitle>
        <CardDescription>Сэтгэлээ сонгоод хамтрагчдаа мэдэгдээрэй</CardDescription>
        <div className="flex justify-center gap-3 mt-4">
          {moods.map((m) => {
            const Icon = m.icon;
            const isActive = todayMood === m.id;
            return (
              <button
                type="button"
                key={m.id}
                onClick={() => setMood(m.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-[16px] transition-all cursor-pointer min-w-[60px]
                  ${isActive ? `${m.bg} ${m.color} scale-110` : "text-text-secondary hover:bg-secondary/10"}`}
              >
                <Icon size={28} weight={isActive ? "fill" : "regular"} />
                <span className="text-[10px] font-medium">{m.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {recentMoods.length > 0 && (
        <div>
          <h2 className="font-semibold text-text dark:text-dark-text mb-3">Сүүлийн үеийн сэтгэл</h2>
          <div className="flex flex-wrap gap-2">
            {recentMoods.map((entry) => {
              const m = moods.find((x) => x.id === entry.mood);
              const Icon = m?.icon || SmileyMeh;
              return (
                <Card key={entry.id} className="flex items-center gap-2 py-2 px-3">
                  <Icon size={18} className={m?.color || "text-text-secondary"} />
                  <span className="text-xs text-text-secondary">
                    {format(new Date(entry.date), "MMM d", { locale: mn })}
                  </span>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
