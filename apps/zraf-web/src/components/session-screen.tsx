"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Flag,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { Question, SessionResult, SessionMode } from "@/lib/models";

interface SessionScreenProps {
  mode: SessionMode;
  questions: Question[];
  onComplete: (result: SessionResult) => void;
  onBack: () => void;
}

export default function SessionScreen({
  mode,
  questions,
  onComplete,
  onBack,
}: SessionScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(
    Array(questions.length).fill(null),
  );
  const [flagged, setFlagged] = useState<boolean[]>(
    Array(questions.length).fill(false),
  );
  const [elapsed, setElapsed] = useState<number[]>(
    Array(questions.length).fill(0),
  );
  const [revealed, setRevealed] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const questionStartRef = useRef(Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isMock = mode === "mockExam";

  useEffect(() => {
    const tick = setInterval(() => {
      setSessionDuration((d) => d + 1);
    }, 1000);
    tickRef.current = tick;
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const current = questions[currentIndex];
  const total = questions.length;
  const answeredCount = answers.filter((a) => a !== null).length;
  const progress = answeredCount / total;

  const handleSelect = useCallback(
    (choiceIndex: number) => {
      if (revealed) return;
      const now = Date.now();
      const questionTime = Math.round((now - questionStartRef.current) / 1000);
      setAnswers((prev) => {
        const next = [...prev];
        next[currentIndex] = choiceIndex;
        return next;
      });
      setElapsed((prev) => {
        const next = [...prev];
        next[currentIndex] = questionTime;
        return next;
      });
      setRevealed(true);
    },
    [currentIndex, revealed],
  );

  const handleNext = useCallback(() => {
    if (!revealed) {
      const now = Date.now();
      const questionTime = Math.round((now - questionStartRef.current) / 1000);
      setElapsed((prev) => {
        const next = [...prev];
        next[currentIndex] = questionTime;
        return next;
      });
    }
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setRevealed(false);
      questionStartRef.current = Date.now();
    } else {
      finishSession();
    }
  }, [currentIndex, total, revealed]);

  const handleSkip = useCallback(() => {
    if (revealed) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = null;
      return next;
    });
    setRevealed(true);
  }, [currentIndex, revealed]);

  const toggleFlag = useCallback(() => {
    setFlagged((prev) => {
      const next = [...prev];
      next[currentIndex] = !next[currentIndex];
      return next;
    });
  }, [currentIndex]);

  const goToQuestion = useCallback(
    (index: number) => {
      if (index === currentIndex) return;
      const now = Date.now();
      const questionTime = Math.round((now - questionStartRef.current) / 1000);
      setElapsed((prev) => {
        const next = [...prev];
        next[currentIndex] = questionTime;
        return next;
      });
      setCurrentIndex(index);
      setRevealed(answers[index] !== null);
      questionStartRef.current = Date.now();
    },
    [currentIndex, answers],
  );

  function finishSession() {
    if (tickRef.current) clearInterval(tickRef.current);
    const result: SessionResult = {
      mode,
      answers: questions.map((q, i) => ({
        questionId: q.id,
        selectedIndex: answers[i],
        flagged: flagged[i],
        elapsed: elapsed[i],
        prompt: q.prompt,
        choices: q.choices,
        correctIndex: q.correctIndex,
        shortExplanation: q.shortExplanation,
        longExplanation: q.longExplanation,
        topic: q.topic,
        commonMistakeReason: q.commonMistakeReason,
        visual: q.visual,
      })),
      duration: sessionDuration,
      completedAt: Date.now(),
    };
    onComplete(result);
  }

  const isCorrect = revealed && answers[currentIndex] === current.correctIndex;
  const hasAnswer = answers[currentIndex] !== null;
  const isLast = currentIndex === total - 1;

  return (
    <div className="min-h-dvh bg-surface animate-fade-in">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 pt-4 pb-3 bg-white/85 backdrop-blur-lg border-b border-mist/30">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-white border border-mist/30 flex items-center justify-center flex-shrink-0 hover:bg-mist/50 transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} className="text-ink" />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-teal">
              {currentIndex + 1} of {total}
            </span>
            {isMock && (
              <span className="text-xs font-bold text-stone flex items-center gap-1">
                <Clock size={14} className="text-teal/70" />
                {formatTime(sessionDuration)}
              </span>
            )}
          </div>
          <Progress value={progress * 100} className="h-1.5" />
        </div>
      </header>

      {/* Question content */}
      <div className="px-4 pt-4 pb-28 space-y-4">
        {/* Question card */}
        <Card className="p-3 border-mist/30 shadow-sm animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-teal">
              Q{currentIndex + 1}
            </span>
            <button
              onClick={toggleFlag}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-mist/50 transition-colors cursor-pointer"
            >
              {flagged[currentIndex] ? (
                <Flag size={18} className="text-warm" weight="fill" />
              ) : (
                <Flag size={18} className="text-stone" />
              )}
            </button>
          </div>
          {current.visual && current.visual.assetPath ? (
            <img
              src={current.visual.assetPath}
              alt={current.visual.title || "Question visual"}
              className="w-full rounded-xl object-contain"
              loading="lazy"
            />
          ) : (
            <p className="text-sm font-bold text-ink leading-relaxed p-2">
              {current.prompt}
            </p>
          )}
        </Card>

        {/* Answer choices — horizontal number buttons */}
        <div className="flex gap-3 animate-slide-up stagger-1">
          {current.choices.map((_, i) => {
            const isSelected = answers[currentIndex] === i;
            const showCorrect = revealed && i === current.correctIndex;
            const showWrong =
              revealed && isSelected && i !== current.correctIndex;
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={revealed}
                className={cn(
                  "flex-1 py-4 rounded-2xl border-2 text-lg font-bold transition-all duration-200 cursor-pointer",
                  "hover:shadow-sm",
                  showCorrect && "border-teal bg-teal text-white shadow-md",
                  showWrong && "border-red bg-red text-white shadow-md",
                  !revealed &&
                    "border-mist/60 bg-white text-ink hover:border-teal/40",
                  revealed &&
                    !showCorrect &&
                    !showWrong &&
                    "border-mist/30 bg-white/60 text-stone",
                  isSelected && !revealed && "border-teal bg-teal/10 text-teal",
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Reveal/Explanation card */}
        {revealed && (
          <Card
            className={cn(
              "p-4 border animate-scale-in",
              isCorrect ? "border-teal/20 bg-teal/5" : "border-red/20 bg-red/5",
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <CheckCircle size={18} className="text-teal" weight="fill" />
              ) : (
                <XCircle size={18} className="text-red" weight="fill" />
              )}
              <span
                className={cn(
                  "text-xs font-bold",
                  isCorrect ? "text-teal" : "text-red",
                )}
              >
                {isCorrect ? "Correct!" : hasAnswer ? "Incorrect" : "Skipped"}
              </span>
            </div>
            <p className="text-xs text-clay leading-relaxed">
              {current.shortExplanation}
            </p>
            {!isCorrect && !hasAnswer && (
              <p className="text-xs text-warm mt-2">
                {current.commonMistakeReason}
              </p>
            )}
          </Card>
        )}
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full z-20 px-4 py-3 bg-white/85 backdrop-blur-xl border-t border-mist/30 pb-[max(env(safe-area-inset-bottom,0.75rem),0.75rem)]">
        <div className="flex gap-2 max-w-lg mx-auto items-center">
          {!revealed && (
            <Button
              variant="outline"
              size="xl"
              onClick={handleSkip}
              className="rounded-2xl border-mist/50 text-stone hover:bg-mist/50 cursor-pointer"
            >
              Skip
            </Button>
          )}
          <div className="flex-1" />
          {revealed && (
            <Button
              onClick={handleNext}
              size="xl"
              className="rounded-2xl bg-teal hover:bg-teal-light text-white font-bold hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer shadow-md shadow-teal/15"
            >
              {isLast ? "Finish" : "Next"}
              <ArrowRight className="ml-1.5" size={16} weight="bold" />
            </Button>
          )}
          {!revealed && (
            <Button
              onClick={handleNext}
              variant="ghost"
              size="xl"
              className="rounded-2xl text-stone hover:bg-mist/50 cursor-pointer"
            >
              Skip all
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
