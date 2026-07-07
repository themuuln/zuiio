"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Fire,
  Lightning,
  ClockCounterClockwise,
  CheckCircle,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import type {
  MembershipPlan,
  SessionResult,
  LearningSnapshot,
  SessionMode,
} from "@/lib/models"
import { SessionModeLabels, MasteryStatusLabels } from "@/lib/models"
import { masteryFromAccuracy, topicAccuracy } from "@/lib/models"

interface ProgressScreenProps {
  isLoggedIn: boolean
  onLoginClick: () => void
  membershipPlan: MembershipPlan
  sessionHistory: SessionResult[]
  learningSnapshot: LearningSnapshot
}

export default function ProgressScreen({
  isLoggedIn,
  onLoginClick,
  membershipPlan,
  sessionHistory,
  learningSnapshot,
}: ProgressScreenProps) {
  if (!isLoggedIn) {
    return (
      <div className="px-5 pb-6 space-y-5 flex flex-col justify-center min-h-[70vh] animate-fade-in">
        <Card className="p-6 border-mist/30 text-center space-y-5 py-10 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-teal/8 flex items-center justify-center mx-auto shadow-inner">
            <Lightning size={32} className="text-teal" weight="fill" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-ink">Unlock detailed analytics</h3>
            <p className="text-xs text-stone max-w-xs mx-auto leading-relaxed">
              Sign in to track your readiness score, daily streak, confidence levels, weak topics, and past exam results.
            </p>
          </div>
          <Button
            onClick={onLoginClick}
            className="bg-teal hover:bg-teal-light text-white font-bold h-12 px-8 rounded-2xl cursor-pointer w-full max-w-xs shadow-md shadow-teal/15 transition-all"
          >
            Sign In to Continue
          </Button>
        </Card>
      </div>
    )
  }

  const weakTopics = learningSnapshot.topicMetrics.slice(0, 4)
  const recentSessions = sessionHistory.slice(0, 4)
  const readinessTone =
    learningSnapshot.readinessScore >= 80
      ? "Exam Ready"
      : learningSnapshot.readinessScore >= 60
        ? "Improving"
        : "Needs Focus"

  return (
    <div className="px-5 pb-6 space-y-5">
      {/* Readiness card */}
      <Card className="p-6 border-mist/30 animate-slide-up">
        <div className="flex items-center gap-5">
          <ReadinessGauge score={learningSnapshot.readinessScore} />
          <div className="flex-1">
            <Badge
              variant="outline"
              className="rounded-full px-2.5 py-1 text-[10px] font-bold border-teal/30 text-teal"
            >
              {readinessTone}
            </Badge>
            <p className="text-base font-bold text-ink mt-3">
              Mastery Reached
            </p>
            <p className="text-xs text-stone mt-2">
              {learningSnapshot.recommendation}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 animate-slide-up stagger-1">
        <StatCard
          label="Streak"
          value={`${learningSnapshot.streakDays}`}
          icon={Fire}
          color="#924628"
        />
        <StatCard
          label="Confidence"
          value={`${learningSnapshot.confidenceScore}%`}
          icon={Lightning}
          color="#00685F"
        />
        <StatCard
          label="Mocks"
          value={`${learningSnapshot.weeklyMockAttempts}`}
          icon={ClockCounterClockwise}
          color="#3F6560"
        />
      </div>

      {/* Focus areas */}
      <div className="animate-slide-up stagger-2">
        <p className="text-sm font-bold text-ink">Focus Areas</p>
        <p className="text-xs text-stone mt-1">Focus here next.</p>
      </div>

      <div className="space-y-3 animate-slide-up stagger-2">
        {weakTopics.map((metric, i) => (
          <TopicRow
            key={metric.topic}
            metric={metric}
            accent={i % 2 === 0 ? "#924628" : "#00685F"}
          />
        ))}
      </div>

      {/* Recent sessions */}
      <div className="animate-slide-up stagger-3">
        <p className="text-sm font-bold text-ink">Recent sessions</p>
        <p className="text-xs text-stone mt-1">
          Recent practice and mock sessions.
        </p>
      </div>

      {recentSessions.length === 0 ? (
        <Card className="p-4 border-mist/30 animate-fade-in">
          <p className="text-xs text-stone">
            Complete a practice or mock exam to start tracking recent sessions.
          </p>
        </Card>
      ) : (
        <Card className="border-mist/30 overflow-hidden animate-slide-up stagger-4">
          {recentSessions.map((session, i) => {
            const correct = session.answers.filter(
              (a) => a.selectedIndex === a.correctIndex,
            ).length
            const score =
              session.answers.length === 0
                ? 0
                : Math.round((correct / session.answers.length) * 100)
            const passed = score >= 80
            const modeLabel = SessionModeLabels[session.mode]
            const completedDate = new Date(session.completedAt)
            const dateStr = `${completedDate.getMonth() + 1}/${completedDate.getDate()}`
            const durationStr = formatDuration(session.duration)
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 p-4",
                  i !== recentSessions.length - 1 &&
                    "border-b border-mist/30",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    passed ? "bg-teal/10" : "bg-teal/5",
                  )}
                >
                  <CheckCircle
                    size={20}
                    color={passed ? "#00685F" : "#3F6560"}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink truncate">
                    {modeLabel}
                  </p>
                  <p className="text-[10px] text-stone">
                    {dateStr} · {durationStr}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-ink">{score}%</p>
                  <p className="text-[10px] font-semibold text-teal">
                    {passed ? "Pass" : "Practice"}
                  </p>
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}

function ReadinessGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 48
  const offset = circumference - (score / 100) * circumference
  return (
    <div className="relative w-[118px] h-[118px] flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 118 118">
        <circle cx="59" cy="59" r="48" fill="none" stroke="#E6EEFF" strokeWidth="6" />
        <circle cx="59" cy="59" r="48" fill="none" stroke="#00685F" strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: "drop-shadow(0 0 4px rgba(0,104,95,0.2))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-teal">{score}%</span>
        <span className="text-[10px] font-semibold text-stone">Ready</span>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  icon: typeof Fire
  color: string
}) {
  return (
    <Card className="p-4 border-mist/30 flex flex-col items-center gap-2">
      <Icon size={20} color={color} />
      <span className="text-lg font-bold text-ink">{value}</span>
      <span className="text-[10px] font-semibold text-stone">{label}</span>
    </Card>
  )
}

function TopicRow({
  metric,
  accent,
}: {
  metric: { topic: string; total: number; correct: number; slow: number; exposures: number }
  accent: string
}) {
  const acc = topicAccuracy(metric)
  const ms = masteryFromAccuracy(metric.total, acc)
  const pct = Math.round(acc * 100)
  return (
    <Card className="p-4 border-mist/30">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-ink">{metric.topic}</p>
        <span className="text-xs font-bold" style={{ color: accent }}>
          {pct}%
        </span>
      </div>
      <div className="w-full h-1.5 bg-mist rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: accent }}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-stone">
          {metric.total} question{metric.total !== 1 ? "s" : ""} ·{" "}
          {metric.exposures} exposure{metric.exposures !== 1 ? "s" : ""}
        </span>
        <span className="text-[10px] font-semibold" style={{ color: accent }}>
          {MasteryStatusLabels[ms]}
        </span>
      </div>
    </Card>
  )
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}
