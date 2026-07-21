"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkle, CheckCircle } from "@phosphor-icons/react";
import { intimacyQuestionPacks } from "@/data/intimacy";

export default function IntimacyQuestionPacksPage() {
  const router = useRouter();
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [answerText, setAnswerText] = useState("");
  const [completed, setCompleted] = useState(false);

  const pack = intimacyQuestionPacks.find((p) => p.id === selectedPack);

  function startPack(packId: string) {
    setSelectedPack(packId);
    setCurrentQ(0);
    setAnswers([]);
    setCompleted(false);
  }

  function handleAnswer() {
    if (!answerText.trim()) return;
    setAnswers((prev) => [...prev, answerText.trim()]);
    setAnswerText("");
    if (currentQ < (pack?.questions.length || 0) - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setCompleted(true);
    }
  }

  if (completed) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-success" weight="fill" />
          </div>
          <h2 className="text-xl font-semibold text-text dark:text-dark-text">
            {pack?.title} багц дууслаа!
          </h2>
          <p className="text-text-secondary">{answers.length} хариулт бүртгэгдлээ</p>
          <p className="text-sm text-text-secondary">Хамтрагч тань хариулсны дараа харах боломжтой</p>
          <div className="space-y-2 text-left">
            {answers.map((a, i) => (
              <Card key={i}>
                <p className="text-xs text-primary font-medium mb-1">Асуулт {i + 1}</p>
                <p className="text-text dark:text-dark-text">{a}</p>
              </Card>
            ))}
          </div>
          <Button onClick={() => { setSelectedPack(null); setCompleted(false); }} variant="outline">Буцах</Button>
        </div>
      </div>
    );
  }

  if (selectedPack && pack) {
    return (
      <div className="space-y-4 animate-fade-in">
        <button type="button" onClick={() => setSelectedPack(null)} className="flex items-center gap-1 text-text-secondary hover:text-text transition-colors cursor-pointer">
          <ArrowLeft size={18} /><span className="text-sm">Багцууд</span>
        </button>
        <div className="flex justify-between items-center">
          <Badge variant="info">{pack.title}</Badge>
          <span className="text-xs text-text-secondary">{currentQ + 1}/{pack.questions.length}</span>
        </div>
        <Card className="min-h-[200px]">
          <CardTitle className="text-lg mb-4">{pack.questions[currentQ]}</CardTitle>
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Хариултаа бичээрэй..."
            rows={4}
            className="w-full px-4 py-3 rounded-[12px] bg-bg dark:bg-dark-bg border-2 border-secondary/30 text-text dark:text-dark-text placeholder:text-text-secondary/50 focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </Card>
        <Button onClick={handleAnswer} disabled={!answerText.trim()} fullWidth>
          {currentQ < pack.questions.length - 1 ? "Дараагийн асуулт" : "Дуусгах"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <button type="button" onClick={() => router.push("/intimacy")} className="flex items-center gap-1 text-text-secondary hover:text-text transition-colors cursor-pointer">
        <ArrowLeft size={18} /><span className="text-sm">Буцах</span>
      </button>
      <h1 className="text-xl font-bold text-text dark:text-dark-text">Дотно асуултууд</h1>
      <p className="text-sm text-text-secondary">3 багц, тус бүр 20 асуулт. Хариултаа бичээд хамтрагчтайгаа хуваалцаарай.</p>
      <div className="grid gap-3">
        {intimacyQuestionPacks.map((pack) => (
          <Card key={pack.id} onClick={() => startPack(pack.id)} className="cursor-pointer hover:shadow-warm-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center">
                <Sparkle size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle>{pack.title}</CardTitle>
                <CardDescription>{pack.subtitle} · {pack.questions.length} асуулт</CardDescription>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
