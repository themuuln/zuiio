"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Person,
  GraduationCap,
  Lightning,
  CalendarDots,
  Wrench,
  CheckCircle,
  ArrowRight,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import type { LearnerPath, LearningGoal, SchoolPartner } from "@/lib/models"
import { LearnerPathLabels, LearningGoalLabels } from "@/lib/models"

interface OnboardingScreenProps {
  learnerPath: LearnerPath
  goal: LearningGoal
  schools: SchoolPartner[]
  selectedSchool: SchoolPartner | null
  onLearnerPathChanged: (path: LearnerPath) => void
  onGoalChanged: (goal: LearningGoal) => void
  onSchoolChanged: (schoolId: string) => void
  onStart: () => void
}

const goalIcons: Record<LearningGoal, typeof Lightning> = {
  passSoon: Lightning,
  dailyPractice: CalendarDots,
  weakTopics: Wrench,
}

export default function OnboardingScreen({
  learnerPath,
  goal,
  schools,
  selectedSchool,
  onLearnerPathChanged,
  onGoalChanged,
  onSchoolChanged,
  onStart,
}: OnboardingScreenProps) {
  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      <div className="flex-1 overflow-y-auto px-5 pb-40">
        <div className="py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold tracking-tight text-teal font-display">
              ZRAf
            </span>
            <span className="text-xs font-semibold text-stone bg-mist/60 px-3 py-1 rounded-full">
              Step 1 of 3
            </span>
          </div>

          {/* Hero */}
          <div className="animate-slide-up">
            <span className="text-xs font-bold tracking-widest text-warm uppercase">
              Theory prep
            </span>
            <h1 className="text-2xl font-display leading-tight mt-2 text-ink">
              Pass the Mongolian<br />driving theory exam<br />faster
            </h1>
            <p className="text-sm text-clay mt-3 leading-relaxed max-w-sm">
              Practice with visuals, mock exams, and focused drills.
            </p>
            {learnerPath === "school" && selectedSchool && (
              <p className="text-xs font-bold text-teal mt-3">
                {selectedSchool.name}
              </p>
            )}
          </div>

          {/* Path selection */}
          <div className="space-y-3 animate-slide-up stagger-1">
            <div>
              <h2 className="text-sm font-bold text-ink">Choose your path</h2>
              <p className="text-xs text-stone mt-1">
                Study solo or join your school.
              </p>
            </div>
            <PathCard
              icon={Person}
              title={LearnerPathLabels.individual}
              subtitle="Self-paced study with full library access."
              selected={learnerPath === "individual"}
              onSelect={() => onLearnerPathChanged("individual")}
            />
            <PathCard
              icon={GraduationCap}
              title={LearnerPathLabels.school}
              subtitle="Sync progress with your driving instructor."
              selected={learnerPath === "school"}
              onSelect={() => onLearnerPathChanged("school")}
            />
          </div>

          {/* School selection */}
          {learnerPath === "school" && (
            <div className="animate-slide-up stagger-2">
              <Card className="p-4 bg-teal-subtle border border-teal/10">
                <p className="text-sm font-bold text-ink">
                  {schools.length === 1 ? "School partner" : "Join a school"}
                </p>
                <p className="text-xs text-stone mt-2">
                  {schools.length === 1
                    ? "Select the verified school partner for this rollout."
                    : "Select your school to continue."}
                </p>
                <div className="mt-4 space-y-3">
                  {schools.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onSchoolChanged(s.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer",
                        selectedSchool?.id === s.id
                          ? "border-teal bg-white shadow-sm"
                          : "border-mist/50 bg-white hover:border-stone/20",
                      )}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: s.brandColor }}
                      >
                        {s.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-ink truncate">
                          {s.name}
                        </p>
                        <p className="text-xs text-stone">
                          {s.websiteUrl.replace("https://", "").replace("http://", "")}
                        </p>
                      </div>
                      {selectedSchool?.id === s.id && (
                        <CheckCircle
                          className="text-teal flex-shrink-0"
                          size={20}
                          weight="fill"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Goal selection */}
          <div className="space-y-3 animate-slide-up stagger-3">
            <div>
              <h2 className="text-sm font-bold text-ink">Choose your goal</h2>
              <p className="text-xs text-stone mt-1">
                Pick your focus for today.
              </p>
            </div>
            {(Object.keys(LearningGoalLabels) as LearningGoal[]).map((g) => {
              const Icon = goalIcons[g]
              return (
                <button
                  key={g}
                  onClick={() => onGoalChanged(g)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer",
                    "hover:border-teal/30 hover:shadow-sm",
                    goal === g
                      ? "border-teal bg-white shadow-sm"
                      : "border-mist/60 bg-white",
                  )}
                >
                  <div
                    className={cn(
                      "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                      goal === g
                        ? "bg-teal/10 text-teal"
                        : "bg-mist text-clay",
                    )}
                  >
                    <Icon size={20} />
                  </div>
                  <span className="text-sm font-bold text-ink">
                    {LearningGoalLabels[g]}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Trust card */}
          <Card className="p-4 bg-teal-subtle border-none flex gap-3.5 animate-slide-up stagger-4">
            <div className="w-12 h-12 rounded-full bg-teal/15 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="text-teal" size={22} weight="fill" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink">
                Regulatory compliant content
              </p>
              <p className="text-xs text-stone mt-1">
                Updated for recent traffic-law revisions and structured for exam success.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full p-5 pb-[max(env(safe-area-inset-bottom,1.5rem),1.5rem)] bg-gradient-to-t from-surface via-surface to-transparent">
        <Button
          onClick={onStart}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-teal to-teal-light text-white font-bold shadow-lg shadow-teal/20 hover:shadow-xl hover:shadow-teal/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
        >
          Start practicing
          <ArrowRight className="ml-2" size={18} weight="bold" />
        </Button>
        <p className="text-xs text-center text-stone mt-3">
          Start in under two minutes.
        </p>
      </div>
    </div>
  )
}

function PathCard({
  icon: Icon,
  title,
  subtitle,
  selected,
  onSelect,
}: {
  icon: typeof Person
  title: string
  subtitle: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer",
        "hover:border-teal/30 hover:shadow-sm",
        selected
          ? "border-teal bg-white shadow-sm"
          : "border-mist/60 bg-white",
      )}
    >
      <div
        className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
          selected
            ? "bg-teal text-white"
            : "bg-mist text-clay",
        )}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm font-bold text-ink">{title}</p>
        <p className="text-xs text-stone mt-1">{subtitle}</p>
      </div>
    </button>
  )
}
