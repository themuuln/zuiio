"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatCircle, Calendar, GameController, Heart } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { StreakDisplay } from "@/components/ui/streak-display";
import { Avatar } from "@/components/ui/avatar";
import { SkeletonCard } from "@/components/ui/skeleton";

type Profile = {
  id: string;
  name: string;
  avatar_url: string | null;
  couple_id: string | null;
};

type Streak = {
  current_streak: number;
  longest_streak: number;
};

type Question = {
  id: string;
  question_text: string;
  category: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [streak, setStreak] = useState<Streak | null>(null);
  const [todayQuestion, setTodayQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      supabase
        .from("profiles")
        .select()
        .eq("id", user.id)
        .single()
        .then(({ data: prof }) => {
          if (!prof) return;
          setProfile(prof);
          if (prof.couple_id) {
            supabase
              .from("profiles")
              .select("name")
              .eq("couple_id", prof.couple_id)
              .neq("id", user.id)
              .single()
              .then(({ data: partner }) => {
                if (partner) setPartnerName(partner.name);
              });
            supabase
              .from("streaks")
              .select()
              .eq("couple_id", prof.couple_id)
              .single()
              .then(({ data: s }) => {
                if (s) setStreak(s);
              });
            supabase
              .from("questions")
              .select()
              .eq("couple_id", prof.couple_id)
              .eq("scheduled_date", new Date().toISOString().split("T")[0])
              .single()
              .then(({ data: q }) => {
                if (q) setTodayQuestion(q as Question);
              });
          }
          setLoading(false);
        });
    });
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const quickActions = [
    { href: "/questions", label: "Өнөөдрийн асуулт", icon: ChatCircle, color: "text-primary bg-primary/5" },
    { href: "/calendar", label: "Календарь", icon: Calendar, color: "text-accent-sky bg-accent-sky/5" },
    { href: "/games", label: "Тоглоом", icon: GameController, color: "text-accent-steppe bg-accent-steppe/5" },
    { href: "/memories", label: "Дурсамж", icon: Heart, color: "text-accent-fire bg-accent-fire/5" },
  ];

  const greetTime = new Date().getHours();
  const greet = greetTime < 12 ? "Өглөөний" : greetTime < 18 ? "Өдрийн" : "Оройн";

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text dark:text-dark-text">
            {greet} сайн, {profile?.name || "Найз"}!
          </h1>
          {partnerName && (
            <p className="text-sm text-text-secondary">{partnerName} ×амт таньтай</p>
          )}
        </div>
        <Avatar name={profile?.name} size="lg" />
      </div>

      {streak && <StreakDisplay currentStreak={streak.current_streak} longestStreak={streak.longest_streak} />}

      {todayQuestion && (
        <Link href={`/questions/${todayQuestion.id}`}>
          <Card className="hover:shadow-warm-lg transition-shadow cursor-pointer border-l-4 border-l-primary">
            <p className="text-xs text-primary font-medium mb-1">ӨНӨӨДРИЙН АСУУЛТ</p>
            <p className="text-text dark:text-dark-text font-medium">
              {todayQuestion.question_text}
            </p>
          </Card>
        </Link>
      )}

      {!todayQuestion && !loading && (
        <Card className="border border-dashed border-secondary/40 text-center py-6">
          <p className="text-text-secondary text-sm">Өнөөдрийн асуулт байхгүй байна</p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Card className="flex flex-col items-center justify-center py-5 gap-2 hover:shadow-warm-lg transition-shadow cursor-pointer text-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${action.color}`}>
                  <Icon size={22} />
                </div>
                <span className="text-sm font-medium text-text dark:text-dark-text">{action.label}</span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
