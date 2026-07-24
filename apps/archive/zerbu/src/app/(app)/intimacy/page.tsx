"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Heart, Sparkle, BookOpen, ListChecks, GameController } from "@phosphor-icons/react";

type IntimacyProgress = {
  both_opted_in: boolean;
  desire_match_unlocked: boolean;
  intimacy_dare_level: number;
  streak_required_met: boolean;
};

export default function IntimacyPage() {
  const supabase = createClient();
  const [profileId, setProfileId] = useState("");
  const [coupleId, setCoupleId] = useState("");
  const [streak, setStreak] = useState(0);
  const [progress, setProgress] = useState<IntimacyProgress | null>(null);
  const [optedIn, setOptedIn] = useState(false);

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
          supabase
            .from("streaks")
            .select("current_streak")
            .eq("couple_id", prof.couple_id)
            .single()
            .then(({ data: s }) => {
              if (s) setStreak(s.current_streak || 0);
            });
          supabase
            .from("intimacy_progress")
            .select()
            .eq("couple_id", prof.couple_id)
            .maybeSingle()
            .then(({ data: p }) => {
              if (p) setProgress(p as unknown as IntimacyProgress);
            });
        });
    });
  }, [supabase]);

  async function handleOptIn() {
    if (!coupleId) return;
    await supabase.from("intimacy_progress").upsert({
      couple_id: coupleId,
      both_opted_in: true,
      streak_required_met: streak >= 14,
    });
    setOptedIn(true);
  }

  const canAccess = optedIn || progress?.both_opted_in;
  const streakMet = streak >= 14;

  const features = [
    {
      icon: Heart,
      title: "Desire Match",
      desc: "Хүслийн тоглолт",
      locked: !canAccess || !streakMet,
      badge: "Swipe",
    },
    {
      icon: Sparkle,
      title: "Дотно асуултууд",
      desc: "3 багц, 20-30 асуулт",
      locked: !canAccess || !streakMet,
      badge: "Pack",
    },
    {
      icon: GameController,
      title: "Дотно Dares",
      desc: "Түвшин 1: Хөнгөн, Түвшин 2: Романтик, Түвшин 3: Дотно",
      locked: !canAccess || !streakMet,
      badge: "Game",
    },
    {
      icon: BookOpen,
      title: "Сэтгэлийн гэрэл",
      desc: "Ногоон/Шар/Улаан",
      locked: !canAccess,
      badge: "Mood",
    },
    {
      icon: ListChecks,
      title: "Хүслийн жагсаалт",
      desc: "Хамтдаа хүсэж буй зүйлс",
      locked: !canAccess,
      badge: "List",
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-text dark:text-dark-text">Бидний орон зай</h1>
        {!canAccess && <Lock size={18} className="text-text-secondary" />}
      </div>

      {!canAccess && (
        <Card className="text-center py-6 space-y-3">
          <Heart size={40} className="mx-auto text-primary" />
          <CardTitle>Хувийн орон зай</CardTitle>
          <CardDescription>
            14 хоног дараалан хариулсны дараа нээгдэнэ. Одоо: {streak}/14 хоног
          </CardDescription>
          <div className="w-full bg-secondary/20 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${Math.min((streak / 14) * 100, 100)}%` }}
            />
          </div>
          {!optedIn && (
            <Button onClick={handleOptIn} variant={streakMet ? "primary" : "secondary"}>
              {streakMet ? "Нээх" : "Бүртгүүлэх"}
            </Button>
          )}
        </Card>
      )}

      {canAccess && (
        <div className="grid gap-3">
          {features.map((f) => {
            const Icon = f.icon;
            if (f.locked) {
              return (
                <Card key={f.title} className="opacity-60 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Lock size={20} className="text-text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-text dark:text-dark-text">{f.title}</p>
                    <p className="text-xs text-text-secondary">14 хоногийн дараа нээгдэнэ</p>
                  </div>
                </Card>
              );
            }
            return (
              <Card key={f.title} className="flex items-center gap-3 cursor-pointer hover:shadow-warm-lg transition-shadow">
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center">
                  <Icon size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text dark:text-dark-text">{f.title}</p>
                    <Badge variant="info">{f.badge}</Badge>
                  </div>
                  <p className="text-xs text-text-secondary">{f.desc}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
