"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "@phosphor-icons/react";

const moodLights = [
  { id: "green", label: "Ногоон", desc: "Нээлттэй, бэлэн", emoji: "🟢", color: "bg-success/10 text-success border-success" },
  { id: "yellow", label: "Шар", desc: "Асуу, магадгүй", emoji: "🟡", color: "bg-warning/10 text-warning border-warning" },
  { id: "red", label: "Улаан", desc: "Өнөөдөр үгүй, хайрлая", emoji: "🔴", color: "bg-error/10 text-error border-error" },
];

export default function MoodLightPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profileId, setProfileId] = useState("");
  const [coupleId, setCoupleId] = useState("");
  const [myMood, setMyMood] = useState<string | null>(null);
  const [partnerMood, setPartnerMood] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [myName, setMyName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setProfileId(user.id);
      supabase.from("profiles").select("name, couple_id").eq("id", user.id).single().then(({ data: prof }) => {
        if (!prof?.couple_id) return;
        setMyName(prof.name);
        setCoupleId(prof.couple_id);
        loadMoods(user.id, prof.couple_id);
        supabase.from("profiles").select("name").eq("couple_id", prof.couple_id).neq("id", user.id).single().then(({ data: p }) => {
          if (p) setPartnerName(p.name);
        });
      });
    });
  }, []);

  async function loadMoods(uId: string, cId: string) {
    const { data: mine } = await supabase.from("intimacy_moods").select().eq("user_id", uId).single();
    if (mine) setMyMood(mine.mood_light);
    const { data: partner } = await supabase.from("intimacy_moods").select().eq("couple_id", cId).neq("user_id", uId).maybeSingle();
    if (partner) setPartnerMood(partner.mood_light);
  }

  async function setMood(mood: string) {
    if (!profileId || !coupleId) return;
    const existing = myMood === mood;
    if (existing) {
      await supabase.from("intimacy_moods").delete().eq("user_id", profileId);
      setMyMood(null);
    } else {
      await supabase.from("intimacy_moods").upsert({ user_id: profileId, couple_id: coupleId, mood_light: mood });
      setMyMood(mood);
    }
  }

  const partnerLight = moodLights.find((m) => m.id === partnerMood);

  return (
    <div className="space-y-5 animate-fade-in">
      <button type="button" onClick={() => router.back()} className="flex items-center gap-1 text-text-secondary hover:text-text transition-colors cursor-pointer">
        <ArrowLeft size={18} /><span className="text-sm">Буцах</span>
      </button>

      <h1 className="text-xl font-bold text-text dark:text-dark-text">Сэтгэлийн гэрэл</h1>

      <Card>
        <CardTitle>{myName} — чиний гэрэл</CardTitle>
        <CardDescription>Өнөөдрийн сэтгэлээ илэрхийлэх</CardDescription>
        <div className="flex justify-center gap-3 mt-4">
          {moodLights.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMood(m.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-[16px] border-2 transition-all cursor-pointer min-w-[90px]
                ${myMood === m.id ? `${m.color} border-current scale-110` : "border-secondary/20 text-text-secondary hover:border-secondary/40"}`}
            >
              <span className="text-3xl">{m.emoji}</span>
              <span className="text-xs font-medium">{m.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="text-center py-6">
        <CardTitle>{partnerName} — хамтрагчийн гэрэл</CardTitle>
        <div className="mt-4">
          {partnerLight ? (
            <div className={`inline-flex flex-col items-center gap-2 p-6 rounded-[16px] ${partnerLight.color} border-2`}>
              <span className="text-5xl">{partnerLight.emoji}</span>
              <span className="font-semibold text-lg">{partnerLight.label}</span>
              <span className="text-sm opacity-75">{partnerLight.desc}</span>
            </div>
          ) : (
            <p className="text-text-secondary">Хамтрагч тань гэрлээ асаагаагүй байна</p>
          )}
        </div>
      </Card>

      <p className="text-xs text-text-secondary text-center">
        Сэтгэлийн гэрэл нь хүндэтгэлтэй харилцааг дэмждэг. 🟢 = нээлттэй, 🟡 = боломжтой, 🔴 = битгий асуу.
        Улаан гэрэлд хүндэтгэлтэй хандана уу.
      </p>
    </div>
  );
}
