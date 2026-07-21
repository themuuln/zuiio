"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Question, HeartStraight, Sparkle } from "@phosphor-icons/react";

type GameDef = {
  id: string;
  title: string;
  description: string;
  icon: typeof Question;
  color: string;
  bgColor: string;
};

const games: GameDef[] = [
  {
    id: "wyr",
    title: "Would You Rather",
    description: "2 сонголтоос аль нь вэ?",
    icon: Question,
    color: "text-primary",
    bgColor: "bg-primary/5",
  },
  {
    id: "know_me",
    title: "Намайг хэр сайн мэдэх вэ?",
    description: "Хамтрагчийнхаа тухай 10 асуулт",
    icon: HeartStraight,
    color: "text-accent-fire",
    bgColor: "bg-accent-fire/5",
  },
  {
    id: "nhie",
    title: "Never Have I Ever",
    description: "Хос болон тоглох, нийтлэг зүйлсээ ол",
    icon: Sparkle,
    color: "text-accent-sky",
    bgColor: "bg-accent-sky/5",
  },
];

const wyrQuestions = [
  { text: "Гэртээ цай уух уу, эсвэл гадаа аягалах уу?", a: "Гэртээ цай", b: "Гадаа аягалах" },
  { text: "Зуны Наадам эсвэл өвлийн гал тогоо?", a: "Зуны Наадам", b: "Өвлийн гал тогоо" },
  { text: "Хамтдаа хоол хийх эсвэл захиалах?", a: "Хамтдаа хоол хийх", b: "Захиалах" },
  { text: "Кино үзэх эсвэл ном унших?", a: "Кино үзэх", b: "Ном унших" },
  { text: "Ууланд эсвэл далайн эрэгт амралт?", a: "Ууланд", b: "Далайн эрэгт" },
  { text: "Нохой эсвэл муур?", a: "Нохой", b: "Муур" },
  { text: "Кофе эсвэл цай?", a: "Кофе", b: "Цай" },
  { text: "Хотод эсвэл хөдөө амьдрах?", a: "Хотод", b: "Хөдөө" },
];

const knowMeQuestions = [
  { question: "Миний дуртай хоол?", options: ["Хуушуур", "Бууз", "Цуйван", "Банштай цай"], correct: 0 },
  { question: "Миний дуртай өнгө?", options: ["Улаан", "Цэнхэр", "Ногоон", "Хар"], correct: 0 },
  { question: "Би ямар хөгжим сонсох дуртай вэ?", options: ["Поп", "Рок", "Ардын", "Хип Хоп"], correct: 1 },
  { question: "Миний хобби?", options: ["Ном унших", "Спорт", "Хоол хийх", "Зураг авах"], correct: 0 },
  { question: "Би амралтаа хаана өнгөрүүлэх дуртай вэ?", options: ["Ууланд", "Далайд", "Хотод", "Хөдөө"], correct: 3 },
  { question: "Миний дуртай амралтын өдөр?", options: ["Бямба", "Ням", "Баасан", "Даваа"], correct: 0 },
  { question: "Би ямар амьтанд дуртай вэ?", options: ["Нохой", "Муур", "Морь", "Загас"], correct: 2 },
  { question: "Мийн дуртай улирал?", options: ["Хавар", "Зун", "Намар", "Өвөл"], correct: 1 },
  { question: "Би өглөө юу уудаг вэ?", options: ["Кофе", "Цай", "Сүү", "Ус"], correct: 1 },
  { question: "Миний дуртай кино төрөл?", options: ["Инээдмийн", "Драм", "Адал явдалт", "Романтик"], correct: 2 },
];

const nhieQuestions = [
  "Хэзээ ч бусдын өмнө бүжиглэж байгаагүй",
  "Хэзээ ч дунд сургуулиас зугтаж байгаагүй",
  "Хэзээ ч 24 цаг унтаж байгаагүй",
  "Хэзээ ч гадаад улс явж байгаагүй",
  "Хэзээч онгоцоор нисч байгааагүй",
  "Хэзээч концерт явж байгаагүй",
  "Хэзээч романтик кино үзээд уйлаагүй",
  "Хэзээч бэлэг өгөхөө мартдаггүй",
  "Хэзээч хамтрагчдаа гэнэтийн бэлэг өгч байгаагүй",
  "Хэзээч хамтдаа хоол хийж байгаагүй",
  "Хэзээч хамтрагчийнхаа төрсөн өдрийг мартдаггүй",
  "Хэзээч шөнөжин ярилцаж байгаагүй",
  "Хэзээч хамтдаа аялж байгаагүй",
  "Хэзээч хамтрагчдаа гайхшруулж байгаагүй",
];

export default function GamesPage() {
  const supabase = createClient();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [profileId, setProfileId] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [nhieAnswers, setNhieAnswers] = useState<Record<number, boolean>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setProfileId(user.id);
    });
  }, [supabase]);

  function startGame(gameId: string) {
    setActiveGame(gameId);
    setCurrentQ(0);
    setScore(0);
    setShowResult(false);
    setSelectedAnswer(null);
    setNhieAnswers({});
  }

  function handleWyrAnswer() {
    if (currentQ < wyrQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
      setScore(score + 1);
    } else {
      setScore(score + 1);
      setShowResult(true);
    }
  }

  function handleKnowMeAnswer(idx: number) {
    if (idx === knowMeQuestions[currentQ].correct) {
      setScore(score + 1);
    }
    if (currentQ < knowMeQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
    }
  }

  function handleNhieAnswer(qIdx: number, answer: boolean) {
    setNhieAnswers((prev) => ({ ...prev, [qIdx]: answer }));
  }

  function finishNhie() {
    const answeredCount = Object.keys(nhieAnswers).length;
    setScore(answeredCount);
    setShowResult(true);
  }

  function renderGame() {
    if (activeGame === "wyr") {
      if (showResult) {
        return (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <span className="text-success text-2xl">✓</span>
            </div>
            <h3 className="font-semibold text-lg text-text dark:text-dark-text">Тоглоом дууслаа!</h3>
            <p className="text-text-secondary">{wyrQuestions.length} асуултад хариуллаа</p>
            <p className="text-text-secondary">Хариултуудыг хамтрагч тань хүлээж байна</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => startGame("wyr")}>Дахин тоглох</Button>
              <Button variant="outline" onClick={() => setActiveGame(null)}>Буцах</Button>
            </div>
          </div>
        );
      }
      const q = wyrQuestions[currentQ];
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary text-sm">Асуулт {currentQ + 1}/{wyrQuestions.length}</span>
            <span className="text-accent-fire text-sm font-medium">+{score}</span>
          </div>
          <h3 className="text-lg font-semibold text-center text-text dark:text-dark-text px-4">{q.text}</h3>
          <div className="flex flex-col gap-3">
            <Button onClick={handleWyrAnswer} variant="outline" size="lg" className="justify-center h-auto py-4" fullWidth>
              {q.a}
            </Button>
            <Button onClick={handleWyrAnswer} variant="outline" size="lg" className="justify-center h-auto py-4" fullWidth>
              {q.b}
            </Button>
          </div>
        </div>
      );
    }

    if (activeGame === "know_me") {
      if (showResult) {
        const pct = Math.round((score / knowMeQuestions.length) * 100);
        return (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-accent-fire/10 flex items-center justify-center mx-auto">
              <span className="text-accent-fire text-3xl font-bold">{pct}%</span>
            </div>
            <h3 className="font-semibold text-lg text-text dark:text-dark-text">
              {score}/{knowMeQuestions.length} зөв!
            </h3>
            <p className="text-text-secondary">
              {pct >= 80 ? "Чи намайг маш сайн мэддэг юм!" : pct >= 50 ? "Дунд зэрэг мэддэг юм байна!" : "Намайг илүү сайн мэдэх хэрэгтэй бололтой!"}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => startGame("know_me")}>Дахин тоглох</Button>
              <Button variant="outline" onClick={() => setActiveGame(null)}>Буцах</Button>
            </div>
          </div>
        );
      }
      const q = knowMeQuestions[currentQ];
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary text-sm">Асуулт {currentQ + 1}/{knowMeQuestions.length}</span>
            <span className="text-accent-fire text-sm font-medium">Оноо: {score}</span>
          </div>
          <h3 className="text-lg font-semibold text-center text-text dark:text-dark-text px-4">{q.question}</h3>
          <div className="flex flex-col gap-2">
            {q.options.map((opt, idx) => (
              <Button
                key={idx}
                onClick={() => handleKnowMeAnswer(idx)}
                variant={idx === selectedAnswer ? "primary" : "outline"}
                size="lg"
                className="justify-center h-auto py-3"
                fullWidth
              >
                {opt}
              </Button>
            ))}
          </div>
        </div>
      );
    }

    if (activeGame === "nhie") {
      const remaining = nhieQuestions.filter((_, i) => nhieAnswers[i] === undefined);
      if (showResult) {
        const yesCount = Object.values(nhieAnswers).filter(Boolean).length;
        const noCount = Object.values(nhieAnswers).filter((v) => !v).length;
        return (
          <div className="text-center space-y-4 animate-fade-in">
            <h3 className="font-semibold text-lg text-text dark:text-dark-text">Тоглоом дууслаа!</h3>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <p className="text-2xl font-bold text-accent-fire">{yesCount}</p>
                <p className="text-xs text-text-secondary">Тийм</p>
              </Card>
              <Card>
                <p className="text-2xl font-bold text-accent-sky">{noCount}</p>
                <p className="text-xs text-text-secondary">Үгүй</p>
              </Card>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => startGame("nhie")}>Дахин тоглох</Button>
              <Button variant="outline" onClick={() => setActiveGame(null)}>Буцах</Button>
            </div>
          </div>
        );
      }

      if (remaining.length === 0) {
        finishNhie();
        return null;
      }

      const currentNhieIdx = nhieQuestions.indexOf(remaining[0]);
      return (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary text-sm">
              {Object.keys(nhieAnswers).length + 1}/{nhieQuestions.length}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-center text-text dark:text-dark-text px-4">
            {remaining[0]}
          </h3>
          <div className="flex gap-3">
            <Button
              onClick={() => handleNhieAnswer(currentNhieIdx, true)}
              variant="primary"
              className="flex-1 h-auto py-4 text-lg"
            >
              Тийм ✅
            </Button>
            <Button
              onClick={() => handleNhieAnswer(currentNhieIdx, false)}
              variant="outline"
              className="flex-1 h-auto py-4 text-lg"
            >
              Үгүй ❌
            </Button>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold text-text dark:text-dark-text">Тоглоом</h1>

      {!activeGame ? (
        <div className="grid gap-3">
          {games.map((game) => {
            const Icon = game.icon;
            return (
              <Card
                key={game.id}
                onClick={() => startGame(game.id)}
                className="flex items-center gap-4 hover:shadow-warm-lg transition-shadow cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-full ${game.bgColor} flex items-center justify-center shrink-0`}>
                  <Icon size={28} className={game.color} />
                </div>
                <div>
                  <CardTitle>{game.title}</CardTitle>
                  <CardDescription>{game.description}</CardDescription>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        renderGame()
      )}
    </div>
  );
}
