"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Fire,
  Warning,
  Trophy,
  ArrowRight,
  Clipboard,
  ClockCounterClockwise,
  BookOpenText,
  LockOpen,
} from "@phosphor-icons/react"
import type {
  LearningGoal,
  MembershipPlan,
  SchoolPartner,
  SessionResult,
  LearningSnapshot,
} from "@/lib/models"
import { readinessLabel } from "@/lib/models"

interface HomeScreenProps {
  isLoggedIn: boolean
  onLoginClick: () => void
  goal: LearningGoal
  membershipPlan: MembershipPlan
  paymentsEnabled: boolean
  selectedSchool: SchoolPartner | null
  sessionHistory: SessionResult[]
  learningSnapshot: LearningSnapshot
  onPracticeNow: () => void
  onMockExam: () => void
  onReviewMistakes: () => void
}

export default function HomeScreen({
  isLoggedIn,
  onLoginClick,
  goal,
  membershipPlan,
  paymentsEnabled,
  selectedSchool,
  sessionHistory,
  learningSnapshot,
  onPracticeNow,
  onMockExam,
  onReviewMistakes,
}: HomeScreenProps) {
  const { readinessScore, streakDays, topicMetrics, recommendation } =
    learningSnapshot
  const weakestTopic = topicMetrics[0]
  const latestSession = sessionHistory[0]
  const greeting = selectedSchool
    ? `Good morning, ${selectedSchool.name.split(" ")[0]} learner`
    : "Good morning"

  return (
    <div className="px-5 pb-6 space-y-5">
      {/* Badges row */}
      <div className="flex flex-wrap gap-2 animate-slide-up">
        <Badge
          variant="outline"
          className="rounded-full gap-1.5 px-3 py-1.5 text-xs font-semibold border-mist/50"
        >
          <Fire size={14} className="text-warm" />
          {streakDays}-day streak
        </Badge>
        {weakestTopic && (
          <Badge
            variant="outline"
            className="rounded-full gap-1.5 px-3 py-1.5 text-xs font-semibold border-mist/50"
          >
            <Warning size={14} className="text-warm" />
            Weakest: {weakestTopic.topic}
          </Badge>
        )}
        {membershipPlan === "premium" && (
          <Badge
            variant="outline"
            className="rounded-full gap-1.5 px-3 py-1.5 text-xs font-semibold border-teal/30 text-teal"
          >
            <Trophy size={14} weight="fill" />
            Premium
          </Badge>
        )}
      </div>

      {/* Today card */}
      <Card className="p-5 border-mist/30 relative overflow-hidden animate-slide-up stagger-1">
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-teal/[0.04]" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-teal/[0.02]" />
        <div className="flex items-start justify-between relative">
          <div className="flex-1">
            <p className="text-[10px] font-bold tracking-[0.15em] text-teal/60 uppercase">
              Today
            </p>
            <h2 className="text-lg font-bold text-ink mt-1.5">
              {greeting}
            </h2>
          </div>
          {isLoggedIn ? (
            <ReadinessRing score={readinessScore} />
          ) : (
            <button
              onClick={onLoginClick}
              className="text-xs font-bold text-teal bg-teal/10 hover:bg-teal/20 transition-colors px-3.5 py-2 rounded-full cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-4 relative">
          <span className="w-2 h-2 rounded-full bg-teal/80 animate-pulse-glow" />
          <span className="text-xs font-bold text-teal">
            {isLoggedIn ? readinessLabel(readinessScore) : "Guest Mode"}
          </span>
        </div>
        <p className="text-xs text-stone mt-2.5 relative">
          {isLoggedIn
            ? recommendation
            : "Sign in to save your session history, unlock personalized readiness tracking, and customize your preparation path."}
        </p>
        <Button
          onClick={onPracticeNow}
          className="mt-4 rounded-2xl bg-teal hover:bg-teal-light text-white font-bold h-12 px-8 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer shadow-md shadow-teal/15 hover:shadow-lg hover:shadow-teal/20"
        >
          Continue
          <ArrowRight className="ml-2" size={16} weight="bold" />
        </Button>
      </Card>

      {/* Quick actions */}
      <div className="flex gap-3 animate-slide-up stagger-2">
        <QuickActionCard
          icon={Clipboard}
          title="Mock exam"
          subtitle="Full simulation of the state test"
          accent="#00685F"
          onClick={onMockExam}
        />
        <QuickActionCard
          icon={ClockCounterClockwise}
          title="Review mistakes"
          subtitle={
            latestSession
              ? `Analyze ${latestSession.answers.filter((a) => a.selectedIndex === null || a.selectedIndex !== a.correctIndex || a.elapsed >= 20).length} review items`
              : "Revisit your recent incorrect answers"
          }
          accent="#924628"
          onClick={onReviewMistakes}
        />
      </div>

      {/* Weak topic insight */}
      {weakestTopic && (
        <Card className="p-4 bg-teal-subtle border-none flex gap-3.5 animate-slide-up stagger-3">
          <div className="w-14 h-14 rounded-2xl bg-white/70 flex items-center justify-center flex-shrink-0 shadow-sm">
            <BookOpenText className="text-teal" size={24} weight="fill" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold tracking-wider text-clay uppercase">
              {goal === "passSoon" ? "Academic Insight" : "Recommended Focus"}
            </span>
            <p className="text-sm font-bold text-ink mt-2">
              {weakestTopic.topic}
            </p>
            <p className="text-xs text-stone mt-1">
              Focus on accuracy and decision speed to improve readiness in{" "}
              {weakestTopic.topic.toLowerCase()}.
            </p>
          </div>
        </Card>
      )}

      {/* Mode status */}
      {!paymentsEnabled && (
        <div className="flex items-center gap-2 text-xs font-semibold text-clay animate-fade-in">
          <LockOpen size={16} className="text-teal" />
          All study modes enabled
        </div>
      )}

      {paymentsEnabled && membershipPlan === "free" && (
        <Card className="p-4 bg-teal-subtle border-none flex items-center gap-3 animate-fade-in">
          <Trophy className="text-teal" size={20} />
          <span className="text-xs font-bold text-ink flex-1">
            Unlock Premium
          </span>
          <Button
            variant="link"
            className="text-xs font-bold text-teal p-0 h-auto"
          >
            Upgrade
          </Button>
        </Card>
      )}
    </div>
  )
}

function ReadinessRing({ score }: { score: number }) {
  const r = 30
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  return (
    <div className="relative w-[72px] h-[72px] flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
        <circle
          cx="36" cy="36" r={r}
          fill="none" stroke="#E6EEFF" strokeWidth="5"
        />
        <circle
          cx="36" cy="36" r={r}
          fill="none" stroke="#00685F" strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: "drop-shadow(0 0 4px rgba(0,104,95,0.2))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-teal">{score}%</span>
      </div>
    </div>
  )
}

function QuickActionCard({
  icon: Icon,
  title,
  subtitle,
  accent,
  onClick,
}: {
  icon: typeof Clipboard
  title: string
  subtitle: string
  accent: string
  onClick: () => void
}) {
  return (
    <Card
      className="flex-1 p-5 border-mist/30 cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
      onClick={onClick}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 transition-transform duration-200 group-hover:scale-110"
        style={{ backgroundColor: `${accent}12` }}
      >
        <Icon size={20} color={accent} />
      </div>
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="text-[10px] text-stone mt-1 leading-relaxed">
        {subtitle}
      </p>
    </Card>
  )
}
