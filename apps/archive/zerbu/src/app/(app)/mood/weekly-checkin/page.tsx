"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart } from "@phosphor-icons/react";
import { SkeletonCard } from "@/components/ui/skeleton";

const checkinQuestions = [
  { id: "good", question: "Энэ долоо хоногт бид хоёрт юу сайхан болсон бэ?" },
  { id: "hard", question: "Энэ долоо хоногт юу хэцүү байв?" },
  { id: "grateful", question: "Би юунд талархаж байна вэ?" },
  { id: "partner_grateful", question: "Хамтрагчдаа юунд талархаж байна вэ?" },
  { id: "learned", question: "Би өөрийнхөө тухай юу сурсан бэ?" },
  { id: "next", question: "Дараа долоо хоногт юуг илүү хийхийг хүсэж байна?" },
];

export default function WeeklyCheckinPage() {
  const router = useRouter();
  const supabase = createClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [completed, setCompleted] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      supabase.from("profiles").select("name").eq("id", user.id).single().then(({ data: p }) => {
        if (p) setProfileName(p.name);
        setLoading(false);
      });
    });
  }, []);

  function handleNext() {
    if (!answerText.trim()) return;
    setAnswers((prev) => ({ ...prev, [checkinQuestions[currentQ].id]: answerText.trim() }));
    setAnswerText("");
    if (currentQ < checkinQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setCompleted(true);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (completed) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mx-auto">
            <Heart size={32} className="text-primary" weight="fill" />
          </div>
          <h2 className="text-xl font-semibold text-text dark:text-dark-text">
            Долоо хоногийн дүгнэлт
          </h2>
          <p className="text-text-secondary">Таны хариултууд хадгалагдлаа</p>
        </div>
        <div className="space-y-2">
          {checkinQuestions.map((q) => (
            <Card key={q.id}>
              <p className="text-xs text-primary font-medium mb-1">{q.question}</p>
              <p className="text-text dark:text-dark-text">{answers[q.id]}</p>
            </Card>
          ))}
        </div>
        <Button onClick={() => router.push("/dashboard")} fullWidth>Дуусгах</Button>
      </div>
    );
  }

  const q = checkinQuestions[currentQ];
  return (
    <div className="space-y-4 animate-fade-in">
      <button type="button" onClick={() => router.back()} className="flex items-center gap-1 text-text-secondary hover:text-text transition-colors cursor-pointer">
        <ArrowLeft size={18} /><span className="text-sm">Буцах</span>
      </button>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text dark:text-dark-text">Долоо хоногийн дүгнэлт</h1>
        <Badge variant="info">{currentQ + 1}/{checkinQuestions.length}</Badge>
      </div>
      <Card className="min-h-[220px] flex flex-col justify-center">
        <CardTitle className="text-lg mb-4">{q.question}</CardTitle>
        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder="Бодлоо бичээрэй..."
          rows={5}
          className="w-full px-4 py-3 rounded-[12px] bg-bg dark:bg-dark-bg border-2 border-secondary/30 text-text dark:text-dark-text placeholder:text-text-secondary/50 focus:outline-none focus:border-primary transition-colors resize-none"
        />
      </Card>
      <Button onClick={handleNext} disabled={!answerText.trim()} fullWidth>
        {currentQ < checkinQuestions.length - 1 ? "Дараагийн асуулт" : "Дуусгах"}
      </Button>
    </div>
  );
}
