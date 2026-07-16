"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Star, Book, Users, Brain } from "@phosphor-icons/react";

const categories = [
  { id: "dreams", title: "Мөрөөдөл", icon: Star, desc: "Түүний хүсэл, мөрөөдөл, зорилго", color: "text-accent-gold" },
  { id: "favorites", title: "Дуртай зүйлс", icon: Heart, desc: "Хоол, кино, хөгжим, өнгө", color: "text-primary" },
  { id: "history", title: "Бидний түүх", icon: Book, desc: "Дурсамж, үйл явдлууд", color: "text-accent-sky" },
  { id: "stress", title: "Стресс", icon: Brain, desc: "Түүнийг юу стресст оруулдаг вэ", color: "text-accent-fire" },
  { id: "daily", title: "Өдөр тутмын", icon: Users, desc: "Дадал, зуршил", color: "text-accent-steppe" },
];

const quizQuestions: Record<string, { q: string; a: string }[]> = {
  dreams: [
    { q: "Түүний хамгийн том мөрөөдөл?", a: "" },
    { q: "Аялахыг хүсдэг газар?", a: "" },
    { q: "5 жилийн дараа хаана байхыг хүсдэг вэ?", a: "" },
  ],
  favorites: [
    { q: "Дуртай хоол?", a: "" },
    { q: "Дуртай кино?", a: "" },
    { q: "Дуртай хөгжим?", a: "" },
    { q: "Дуртай өнгө?", a: "" },
  ],
  history: [
    { q: "Бидний анхны болзоо хаана байсан?", a: "" },
    { q: "Бидний анхны үнсэлт хэзээ?", a: "" },
    { q: "Хамгийн хөгжилтэй дурсамж?", a: "" },
  ],
  stress: [
    { q: "Түүнийг юу стресст оруулдаг вэ?", a: "" },
    { q: "Хэцүү үед хэрхэн дэмжих вэ?", a: "" },
    { q: "Тайвшрах дуртай арга?", a: "" },
  ],
  daily: [
    { q: "Өглөө хэдэн цагт сэрдэг вэ?", a: "" },
    { q: "Өдөрт хэдэн аяга цай уудаг вэ?", a: "" },
    { q: "Амралтын өдрөөр юу хийх дуртай вэ?", a: "" },
  ],
};

export default function LoveMapsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [quizMode, setQuizMode] = useState(false);
  const [score, setScore] = useState(0);

  if (activeCategory && quizMode) {
    const questions = quizQuestions[activeCategory] || [];
    const handleAnswer = () => {
      setAnswers((prev) => ({ ...prev, [questions[currentQ].q]: answerText }));
      setAnswerText("");
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1);
      } else {
        setQuizMode(false);
        setCurrentQ(0);
      }
    };

    return (
      <div className="space-y-4 animate-fade-in">
        <button type="button" onClick={() => { setQuizMode(false); setCurrentQ(0); }} className="flex items-center gap-1 text-text-secondary hover:text-text transition-colors cursor-pointer">
          <ArrowLeft size={18} /><span className="text-sm">Буцах</span>
        </button>
        <Badge variant="info">{currentQ + 1}/{questions.length}</Badge>
        <Card className="min-h-[200px]">
          <CardTitle className="text-lg mb-4">{questions[currentQ].q}</CardTitle>
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Хариултаа бичээрэй..."
            rows={4}
            className="w-full px-4 py-3 rounded-[12px] bg-bg dark:bg-dark-bg border-2 border-secondary/30 text-text dark:text-dark-text placeholder:text-text-secondary/50 focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </Card>
        <Button onClick={handleAnswer} disabled={!answerText.trim()} fullWidth>
          {currentQ < questions.length - 1 ? "Дараагийн" : "Дуусгах"}
        </Button>
      </div>
    );
  }

  if (activeCategory) {
    const questions = quizQuestions[activeCategory] || [];
    const answered = questions.filter((q) => answers[q.q]);
    return (
      <div className="space-y-4 animate-fade-in">
        <button type="button" onClick={() => setActiveCategory(null)} className="flex items-center gap-1 text-text-secondary hover:text-text transition-colors cursor-pointer">
          <ArrowLeft size={18} /><span className="text-sm">Ангилалууд</span>
        </button>
        <div className="text-center space-y-3">
          <p className="text-text-secondary">{answered.length}/{questions.length} хариулсан</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => { setQuizMode(true); setCurrentQ(0); setAnswerText(""); }}>
              {answered.length > 0 ? "Үргэлжлүүлэх" : "Эхлэх"}
            </Button>
            <Button variant="outline" onClick={() => { setQuizMode(true); setCurrentQ(0); setAnswerText(""); }}>
              Дахин эхлэх
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {questions.map((q, i) => (
            <Card key={i}>
              <p className="text-xs text-primary font-medium mb-1">{q.q}</p>
              <p className="text-text dark:text-dark-text">{answers[q.q] || "—"}</p>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <button type="button" onClick={() => router.back()} className="flex items-center gap-1 text-text-secondary hover:text-text transition-colors cursor-pointer">
        <ArrowLeft size={18} /><span className="text-sm">Буцах</span>
      </button>
      <h1 className="text-xl font-bold text-text dark:text-dark-text">Love Maps</h1>
      <CardDescription>Хамтрагчийнхаа дотоод ертөнцийг мэдэх — Gottman арга</CardDescription>
      <div className="grid gap-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card key={cat.id} onClick={() => setActiveCategory(cat.id)} className="flex items-center gap-4 cursor-pointer hover:shadow-warm-lg transition-shadow">
              <div className={`w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center ${cat.color}`}>
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <CardTitle>{cat.title}</CardTitle>
                <CardDescription>{cat.desc}</CardDescription>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
