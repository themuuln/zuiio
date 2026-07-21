"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Lock, CheckCircle, LockKey } from "@phosphor-icons/react";
import { intimacyDares } from "@/data/intimacy";

const levels = [
  { id: 1, title: "Хөнгөн", desc: "Амтат, хөгжилтэй", color: "text-accent-steppe border-accent-steppe", required: 0 },
  { id: 2, title: "Романтик", desc: "Гүн мэдрэмж, дотно", color: "text-accent-fire border-accent-fire", required: 1 },
  { id: 3, title: "Дотно", desc: "Хүсэл, итгэлцэл", color: "text-primary border-primary", required: 2 },
];

export default function IntimacyDaresPage() {
  const router = useRouter();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showLevel, setShowLevel] = useState<1 | 2 | 3>(1);
  const [consented, setConsented] = useState<Record<number, boolean>>({});
  const [completedDares, setCompletedDares] = useState<Set<string>>(new Set());
  const [currentDare, setCurrentDare] = useState<string | null>(null);

  function consentToLevel(level: 1 | 2 | 3) {
    setConsented((prev) => ({ ...prev, [level]: true }));
    setShowLevel(level);
  }

  function getDares(level: number) {
    if (level === 1) return intimacyDares.level1;
    if (level === 2) return intimacyDares.level2;
    return intimacyDares.level3;
  }

  function completeDare(text: string) {
    setCompletedDares((prev) => new Set(prev).add(text));
    setCurrentDare(null);
  }

  const dares = getDares(showLevel);

  return (
    <div className="space-y-5 animate-fade-in">
      <button type="button" onClick={() => router.back()} className="flex items-center gap-1 text-text-secondary hover:text-text transition-colors cursor-pointer">
        <ArrowLeft size={18} /><span className="text-sm">Буцах</span>
      </button>

      <h1 className="text-xl font-bold text-text dark:text-dark-text">Дотно Dares</h1>

      <div className="flex gap-2">
        {levels.map((level) => {
          const unlocked = level.id === 1 || consented[level.id - 1 as 1 | 2];
          return (
            <button
              key={level.id}
              type="button"
              onClick={() => unlocked && setShowLevel(level.id as 1 | 2 | 3)}
              className={`flex-1 p-3 rounded-[12px] border-2 text-center transition-all cursor-pointer
                ${showLevel === level.id ? `${level.color} bg-current/5` : "border-secondary/20 text-text-secondary"}
                ${!unlocked ? "opacity-50" : ""}`}
            >
              <div className="flex items-center justify-center gap-1">
                {!unlocked && <Lock size={14} />}
                <span className="font-semibold text-sm">{level.title}</span>
              </div>
              <span className="text-[10px]">{level.desc}</span>
            </button>
          );
        })}
      </div>

      {!consented[showLevel] && showLevel > 1 && (
        <Card className="text-center py-6 space-y-3 border-accent-fire">
          <LockKey size={32} className="mx-auto text-accent-fire" />
          <CardTitle>Түвшин {showLevel} нээх</CardTitle>
          <CardDescription>Хоёул тав тухтай байхын тулд зөвшөөрөл авах</CardDescription>
          <Button onClick={() => consentToLevel(showLevel as 1 | 2 | 3)} variant="primary">
            Зөвшөөрөх
          </Button>
        </Card>
      )}

      {currentDare ? (
        <div className="space-y-4 animate-fade-in text-center">
          <Card className="py-10">
            <CardTitle className="text-lg mb-2">Таны сорилт:</CardTitle>
            <CardDescription className={`text-2xl font-bold mt-4 ${showLevel === 1 ? "text-accent-steppe" : showLevel === 2 ? "text-accent-fire" : "text-primary"}`}>
              {currentDare}
            </CardDescription>
          </Card>
          <div className="flex gap-3">
            <Button onClick={() => setCurrentDare(null)} variant="outline" className="flex-1">Скип</Button>
            <Button onClick={() => completeDare(currentDare)} className="flex-1">✅ Хийсэн</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {dares.map((dare, i) => {
            const done = completedDares.has(dare.text);
            return (
              <Card
                key={i}
                onClick={() => !done && setCurrentDare(dare.text)}
                className={`flex items-center justify-between cursor-pointer transition-all ${done ? "opacity-50" : "hover:shadow-warm-lg"}`}
              >
                <div className="flex items-center gap-3">
                  {done ? (
                    <CheckCircle size={20} className="text-success" weight="fill" />
                  ) : (
                    <span className={`w-5 h-5 rounded-full border-2 ${showLevel === 1 ? "border-accent-steppe" : showLevel === 2 ? "border-accent-fire" : "border-primary"}`} />
                  )}
                  <span className={done ? "line-through text-text-secondary" : "text-text dark:text-dark-text"}>
                    {dare.text}
                  </span>
                </div>
                <Badge variant={dare.type === "intimate" ? "error" : dare.type === "romantic" ? "warning" : dare.type === "deep" ? "info" : "success"}>
                  {dare.type}
                </Badge>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
