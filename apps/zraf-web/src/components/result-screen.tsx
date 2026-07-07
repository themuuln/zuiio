"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  ArrowRight,
  House,
  List,
  Flag,
  SkipForward,
  Lightbulb,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import type { SessionResult, SessionMode, AnswerRecord } from "@/lib/models"
import { SessionModeLabels } from "@/lib/models"

interface ResultScreenProps {
  result: SessionResult
  onReviewRetry: (questions: AnswerRecord[]) => void
  onGoHome: () => void
}

export default function ResultScreen({
  result,
  onReviewRetry,
  onGoHome,
}: ResultScreenProps) {
  const [showReview, setShowReview] = useState(false)
  const correctCount = result.answers.filter(
    (a) => a.selectedIndex === a.correctIndex,
  ).length
  const score =
    result.answers.length === 0
      ? 0
      : Math.round((correctCount / result.answers.length) * 100)
  const passed = score >= 80
  const wrongCount = result.answers.length - correctCount

  const reviewAnswers = result.answers.filter(
    (a) =>
      a.flagged ||
      a.selectedIndex === null ||
      a.selectedIndex !== a.correctIndex ||
      a.elapsed >= 20,
  )

  if (showReview) {
    return (
      <ReviewList
        answers={reviewAnswers.length > 0 ? reviewAnswers : result.answers}
        onBack={() => setShowReview(false)}
        onRetry={() => onReviewRetry(reviewAnswers)}
      />
    )
  }

  return (
    <div className="min-h-dvh bg-surface animate-fade-in">
      <div className="px-5 pt-6 pb-28 space-y-5">
        {/* Title */}
        <div className="animate-slide-up">
          <h1 className="text-xl font-bold text-ink">
            {result.mode === "mockExam"
              ? "Mock Exam Result"
              : `${SessionModeLabels[result.mode]} Result`}
          </h1>
          <p className="text-sm text-clay mt-1.5">
            {result.mode === "mockExam"
              ? passed
                ? "You are exam ready"
                : "Keep practicing before exam day"
              : "Session complete"}
          </p>
        </div>

        {/* Score ring */}
        <Card className="p-6 border-mist/30 animate-scale-in">
          <div className="flex flex-col items-center">
            <ScoreRing score={score} size={152} strokeWidth={12} />
            <p className="text-sm font-bold text-ink mt-3.5">
              {correctCount} out of {result.answers.length}
            </p>
          </div>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up stagger-1">
          <Card className="p-4 border-mist/30 flex items-center gap-3">
            <Clock size={20} className="text-teal" />
            <div>
              <p className="text-[10px] font-semibold text-stone">Duration</p>
              <p className="text-sm font-bold text-ink">
                {formatDuration(result.duration)}
              </p>
            </div>
          </Card>
          <Card className="p-4 border-mist/30 flex items-center gap-3">
            <XCircle size={20} className="text-warm" />
            <div>
              <p className="text-[10px] font-semibold text-stone">Mistakes</p>
              <p className="text-sm font-bold text-ink">
                {wrongCount} question{wrongCount !== 1 ? "s" : ""}
              </p>
            </div>
          </Card>
        </div>

        {/* Review mistakes */}
        {reviewAnswers.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setShowReview(true)}
            className="w-full rounded-2xl border-mist/50 justify-start gap-2 h-12 hover:bg-mist/50 transition-colors cursor-pointer animate-slide-up stagger-2"
          >
            <List size={18} />
            Review mistakes ({reviewAnswers.length} questions)
          </Button>
        )}

        {/* Takeaways */}
        <Card className="p-4 bg-teal-subtle border-none animate-slide-up stagger-3">
          <div className="flex items-center gap-2.5 mb-3">
            <Lightbulb size={18} className="text-teal" />
            <p className="text-sm font-bold text-ink">Takeaways</p>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-teal flex items-center gap-1.5 mb-1.5">
                <CheckCircle size={14} weight="fill" />
                What went well
              </p>
              <p className="text-xs text-clay pl-6">
                Completed {correctCount} questions correctly in{" "}
                {formatDuration(result.duration)}.
              </p>
              {passed && (
                <p className="text-xs text-clay pl-6 mt-1">
                  Performance is above the exam threshold for this session.
                </p>
              )}
              {!passed && (
                <p className="text-xs text-clay pl-6 mt-1">
                  You finished the session and gathered clear review points.
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-warm flex items-center gap-1.5 mb-1.5">
                <Lightbulb size={14} weight="fill" />
                What to refine
              </p>
              {wrongCount > 0 && (
                <p className="text-xs text-clay pl-6">
                  Revisit {wrongCount} question
                  {wrongCount !== 1 ? "s" : ""} before your next timed run.
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Fixed Home button */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full z-20 p-5 pb-[max(env(safe-area-inset-bottom,1.5rem),1.5rem)] bg-gradient-to-t from-surface via-surface to-transparent">
        <Button
          onClick={onGoHome}
          className="w-full rounded-2xl bg-teal hover:bg-teal-light text-white font-bold h-12 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer shadow-md shadow-teal/15"
        >
          <House size={18} className="mr-2" weight="fill" />
          Back to Home
        </Button>
      </div>
    </div>
  )
}

function ReviewList({
  answers,
  onBack,
  onRetry,
}: {
  answers: AnswerRecord[]
  onBack: () => void
  onRetry: () => void
}) {
  return (
    <div className="min-h-dvh bg-surface animate-fade-in">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 pt-4 pb-3 bg-white/85 backdrop-blur-lg border-b border-mist/30">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-white border border-mist/30 flex items-center justify-center hover:bg-mist/50 transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} className="text-ink" />
        </button>
        <div>
          <h2 className="text-base font-bold text-ink">Review</h2>
          <p className="text-xs text-stone">
            {answers.length} question{answers.length !== 1 ? "s" : ""}
          </p>
        </div>
      </header>

      <div className="px-4 pt-4 pb-24 space-y-3">
        {answers.map((answer, i) => {
          const isCorrect = answer.selectedIndex === answer.correctIndex
          return (
            <Card
              key={i}
              className={cn(
                "p-4 border-mist/30 animate-slide-up shadow-sm",
              )}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start gap-2 mb-2.5">
                {answer.flagged && (
                  <Flag
                    size={14}
                    className="text-warm mt-0.5 flex-shrink-0"
                    weight="fill"
                  />
                )}
                {answer.selectedIndex === null && (
                  <SkipForward
                    size={14}
                    className="text-stone mt-0.5 flex-shrink-0"
                  />
                )}
                <p className="text-xs font-bold text-ink leading-relaxed flex-1">
                  {answer.prompt}
                </p>
              </div>

              <div className="space-y-1.5 mb-2.5">
                {answer.choices.map((choice, ci) => {
                  const isSelected = answer.selectedIndex === ci
                  const isRight = ci === answer.correctIndex
                  return (
                    <div
                      key={ci}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg text-xs",
                        isRight && "bg-teal/8 text-teal font-semibold",
                        isSelected && !isRight && "bg-red/8 text-red font-semibold",
                        !isRight && !isSelected && "text-stone",
                      )}
                    >
                      {isRight && <CheckCircle size={12} weight="fill" />}
                      {isSelected && !isRight && <XCircle size={12} weight="fill" />}
                      {!isRight && !isSelected && <span className="w-3" />}
                      <span>
                        {String.fromCharCode(65 + ci)}. {choice}
                      </span>
                    </div>
                  )
                })}
              </div>

              <p className="text-[10px] text-clay leading-relaxed">
                {answer.shortExplanation}
              </p>
            </Card>
          )
        })}
      </div>

      {/* Fixed Retry button */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full z-20 px-4 py-3 bg-white/85 backdrop-blur-xl border-t border-mist/30 pb-[max(env(safe-area-inset-bottom,0.75rem),0.75rem)]">
        <Button
          onClick={onRetry}
          className="w-full rounded-2xl bg-teal hover:bg-teal-light text-white font-bold hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer shadow-md shadow-teal/15"
        >
          Retry these questions
          <ArrowRight className="ml-1.5" size={16} weight="bold" />
        </Button>
      </div>
    </div>
  )
}

function ScoreRing({
  score,
  size,
  strokeWidth,
}: {
  score: number
  size: number
  strokeWidth: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? "#00685F" : score >= 60 ? "#924628" : "#BA1A1A"
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E6EEFF" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-ink">{score}%</span>
        <span className="text-[10px] font-semibold text-stone">Correct</span>
      </div>
    </div>
  )
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  if (seconds === 0) return `${minutes}m`
  return `${minutes}m ${seconds}s`
}
