"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ShieldCheck,
  Lightning,
  Rows,
  MagicWand,
  Brain,
  Clipboard,
  TrendDown,
  Image,
  Lock,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import type {
  MembershipPlan,
  LearningSnapshot,
  Question,
} from "@/lib/models"
import { topicAccuracy } from "@/lib/models"

interface PracticeScreenProps {
  membershipPlan: MembershipPlan
  paymentsEnabled: boolean
  heldBackQuestionCount: number
  questionBank: Question[]
  officialTestBank: Question[]
  learningSnapshot: LearningSnapshot
  onQuickPractice: (count: number) => void
  onOfficialTest: () => void
  onTopicPractice: () => void
  onWeakPractice: () => void
  onMistakeReview: () => void
  onRememberMode: () => void
  onImagePractice: () => void
  onMockExam: () => void
}

export default function PracticeScreen({
  membershipPlan,
  paymentsEnabled,
  heldBackQuestionCount,
  questionBank,
  officialTestBank,
  learningSnapshot,
  onQuickPractice,
  onOfficialTest,
  onTopicPractice,
  onWeakPractice,
  onMistakeReview,
  onRememberMode,
  onImagePractice,
  onMockExam,
}: PracticeScreenProps) {
  const mainQuestionCount = questionBank.filter(
    (q) => q.sourceGroup === "main",
  ).length
  const plusQuestionCount = questionBank.filter(
    (q) => q.sourceGroup === "plus",
  ).length
  const visualQuestionCount = questionBank.filter((q) => q.visual).length
  const officialVisualCount = officialTestBank.filter((q) => q.visual).length
  const allModesUnlocked =
    !paymentsEnabled || membershipPlan === "premium"
  const featuredTopic = learningSnapshot.topicMetrics[0]

  const modes: Array<{
    title: string
    subtitle: string
    icon: typeof ShieldCheck
    accent: string
    eyebrow?: string
    progress?: number
    highlighted?: boolean
    onClick: () => void
  }> = [
    {
      title: "Official Test",
      subtitle: `${officialTestBank.length} clean questions${officialVisualCount > 0 ? ` · ${officialVisualCount} visuals` : ""}`,
      icon: ShieldCheck,
      accent: "#00685F",
      eyebrow: "Active",
      progress: 0.76,
      onClick: onOfficialTest,
    },
    {
      title: "Quick Practice",
      subtitle: "10 rapid questions",
      icon: Lightning,
      accent: "#3F6560",
      onClick: () => onQuickPractice(5),
    },
    {
      title: "Topic Practice",
      subtitle: "Focus on specific rules",
      icon: Rows,
      accent: "#924628",
      onClick: onTopicPractice,
    },
    {
      title: "Mistake Review",
      subtitle: "Learn from errors",
      icon: MagicWand,
      accent: "#BA1A1A",
      onClick: onMistakeReview,
    },
    {
      title: "Remember Mode",
      subtitle: "Spaced repetition engine",
      icon: Brain,
      accent: "#0D1C2E",
      onClick: onRememberMode,
    },
    {
      title: "Mock Exam",
      subtitle: "Timed full simulation",
      icon: Clipboard,
      accent: "#00685F",
      highlighted: true,
      onClick: onMockExam,
    },
  ]

  return (
    <div className="px-5 pb-6 space-y-5">
      {/* Header */}
      <div className="animate-slide-up">
        <p className="text-sm font-bold text-ink">Choose a mode</p>
        <p className="text-xs text-stone mt-1">
          Start with the shortest useful step.
        </p>
      </div>

      {/* Stats badges */}
      <div className="flex flex-wrap gap-2 animate-slide-up stagger-1">
        <Badge
          variant="outline"
          className="rounded-full gap-1.5 px-3 py-1.5 text-xs font-semibold border-mist/50"
        >
          {mainQuestionCount} reviewed questions
        </Badge>
        <Badge
          variant="outline"
          className="rounded-full gap-1.5 px-3 py-1.5 text-xs font-semibold border-mist/50"
        >
          {plusQuestionCount} Plus Questions
        </Badge>
        <Badge
          variant="outline"
          className="rounded-full gap-1.5 px-3 py-1.5 text-xs font-semibold border-mist/50"
        >
          {questionBank.length} Reviewed
        </Badge>
        {heldBackQuestionCount > 0 && (
          <Badge
            variant="outline"
            className="rounded-full gap-1.5 px-3 py-1.5 text-xs font-semibold border-mist/50"
          >
            {heldBackQuestionCount} held back
          </Badge>
        )}
      </div>

      {/* Held back alert */}
      {heldBackQuestionCount > 0 && (
        <Card className="p-4 bg-teal-subtle border-none flex gap-3 animate-fade-in">
          <ShieldCheck className="text-teal flex-shrink-0 mt-0.5" size={18} />
          <p className="text-xs text-clay">
            Only reviewed OCR questions are live right now. {heldBackQuestionCount}{" "}
            questions are held back until manual cleanup is finished.
          </p>
        </Card>
      )}

      {/* Mode grid */}
      <div className="grid grid-cols-2 gap-3 animate-slide-up stagger-2">
        {modes.map((mode, i) => (
          <Card
            key={mode.title}
            className={cn(
              "p-4 border-mist/30 cursor-pointer flex flex-col justify-between min-h-[160px]",
              "hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200",
              mode.highlighted &&
                "border-teal/30 bg-teal/[0.03]",
            )}
            onClick={mode.onClick}
          >
            <div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5"
                style={{ backgroundColor: `${mode.accent}14` }}
              >
                <mode.icon size={20} color={mode.accent} />
              </div>
              <p className="text-sm font-bold text-ink">{mode.title}</p>
              <p className="text-[10px] text-stone mt-1 leading-relaxed">
                {mode.subtitle}
              </p>
            </div>
            {mode.eyebrow && (
              <div className="mt-auto">
                <span className="text-[10px] font-bold text-teal uppercase">
                  {mode.eyebrow}
                </span>
                {mode.progress !== undefined && (
                  <div className="w-full h-1 bg-mist rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-teal rounded-full transition-all duration-500"
                      style={{ width: `${mode.progress * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Focused Training */}
      <div className="animate-slide-up stagger-3">
        <p className="text-sm font-bold text-ink">Focused Training</p>
        <p className="text-xs text-stone mt-1">
          Extra drills for weak areas and visuals.
        </p>
      </div>

      <Card className="border-mist/30 overflow-hidden animate-slide-up stagger-4">
        <button
          onClick={allModesUnlocked ? onWeakPractice : undefined}
          className="w-full flex items-center gap-3 p-4 hover:bg-mist/50 transition-colors border-b border-mist/30 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-red/10 flex items-center justify-center flex-shrink-0">
            <TrendDown size={20} color="#BA1A1A" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-ink">Weak Topics</p>
            <p className="text-xs text-stone">
              Based on your recent sessions
            </p>
          </div>
          {!allModesUnlocked && <Lock size={18} className="text-stone" />}
        </button>
        <button
          onClick={allModesUnlocked ? onImagePractice : undefined}
          className="w-full flex items-center gap-3 p-4 hover:bg-mist/50 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center flex-shrink-0">
            <Image size={20} color="#00685F" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-ink">Image Practice</p>
            <p className="text-xs text-stone">
              {visualQuestionCount} visual questions
            </p>
          </div>
          {!allModesUnlocked && <Lock size={18} className="text-stone" />}
        </button>
      </Card>

      {/* Featured topic */}
      {featuredTopic && (
        <Card className="p-4 bg-teal-subtle border-none flex items-center gap-4 animate-slide-up stagger-5">
          <div className="flex-1">
            <p className="text-sm font-bold text-ink">
              Recommended focus
            </p>
            <p className="text-xs font-bold text-ink mt-1.5">
              {featuredTopic.topic}
            </p>
            <p className="text-[10px] text-stone mt-1">
              {Math.round(topicAccuracy(featuredTopic) * 100)}% correct so far
            </p>
          </div>
          <div className="relative w-[68px] h-[68px] flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 68 68">
              <circle cx="34" cy="34" r="28" fill="none" stroke="#E6EEFF" strokeWidth="4" />
              <circle cx="34" cy="34" r="28" fill="none" stroke="#00685F" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 - topicAccuracy(featuredTopic) * 2 * Math.PI * 28}
                style={{ filter: "drop-shadow(0 0 3px rgba(0,104,95,0.2))" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-teal">
                {Math.round(topicAccuracy(featuredTopic) * 100)}%
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
