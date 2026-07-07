"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import {
  User,
  ChartBar,
  Target,
  Trophy,
  ArrowClockwise,
  CheckCircle,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import type {
  LearnerPath,
  LearningGoal,
  MembershipPlan,
  SchoolPartner,
} from "@/lib/models"
import {
  LearnerPathLabels,
  LearningGoalLabels,
  MembershipPlanLabels,
  PremiumBenefits,
} from "@/lib/models"

interface ProfileScreenProps {
  isLoggedIn: boolean
  onLogin: () => void
  onLogout: () => void
  learnerPath: LearnerPath
  goal: LearningGoal
  membershipPlan: MembershipPlan
  paymentsEnabled: boolean
  school: SchoolPartner | null
  readinessScore: number
  onResetOnboarding: () => void
}

export default function ProfileScreen({
  isLoggedIn,
  onLogin,
  onLogout,
  learnerPath,
  goal,
  membershipPlan,
  paymentsEnabled,
  school,
  readinessScore,
  onResetOnboarding,
}: ProfileScreenProps) {
  if (!isLoggedIn) {
    return (
      <div className="px-5 pb-6 space-y-6 animate-fade-in flex flex-col justify-center min-h-[75vh]">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-ink">Welcome to ZRAf</h2>
          <p className="text-xs text-stone">Sign in to sync your progress and track performance.</p>
        </div>

        <Card className="p-6 border-mist/30 space-y-4 shadow-sm">
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider text-clay uppercase">Email Address</label>
              <input
                type="email"
                placeholder="learner@example.com"
                defaultValue="learner@example.com"
                disabled
                className="w-full h-11 px-4 rounded-xl border border-mist/60 bg-surface/50 text-xs text-ink/70 font-semibold focus:outline-none cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider text-clay uppercase">Password</label>
              <input
                type="password"
                value="••••••••••••"
                disabled
                className="w-full h-11 px-4 rounded-xl border border-mist/60 bg-surface/50 text-xs text-ink/70 font-semibold focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <Button
            onClick={onLogin}
            className="w-full h-12 rounded-2xl bg-teal hover:bg-teal-light text-white font-bold shadow-md shadow-teal/15 hover:shadow-lg transition-all cursor-pointer mt-2"
          >
            Sign In with Email
          </Button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-mist/40"></div>
            <span className="flex-shrink mx-3 text-[10px] font-bold text-stone uppercase">or</span>
            <div className="flex-grow border-t border-mist/40"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onLogin}
              className="h-11 rounded-xl border border-mist/60 hover:bg-mist/30 transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs font-bold text-ink bg-white"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.186 4.114-3.48 0-6.3-2.82-6.3-6.3s2.82-6.3 6.3-6.3c1.614 0 3.15.58 4.35 1.725l3.06-3.06C19.176 2.52 15.9 1.5 12.24 1.5c-5.79 0-10.5 4.71-10.5 10.5s4.71 10.5 10.5 10.5c5.79 0 10.5-4.71 10.5-10.5 0-.585-.045-1.17-.15-1.715H12.24z"
                />
              </svg>
              Google
            </button>
            <button
              onClick={onLogin}
              className="h-11 rounded-xl border border-mist/60 hover:bg-mist/30 transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs font-bold text-ink bg-white"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.83-.98 2.94.1.08 1.15.08 2.81-1.33z" />
              </svg>
              Apple
            </button>
          </div>
        </Card>
      </div>
    )
  }

  const currentPlan = membershipPlan
  const planBenefits = paymentsEnabled
    ? PremiumBenefits[currentPlan]
    : [
        "All study modes are enabled during the school rollout",
        "Weak-topic and image practice stay available",
      ]

  const settingsRows = [
    { label: "Goal", value: LearningGoalLabels[goal] },
    { label: "Learning path", value: LearnerPathLabels[learnerPath] },
  ]

  return (
    <div className="px-5 pb-6 space-y-5">
      {/* Profile card */}
      <Card className="p-6 border-mist/30 flex flex-col items-center animate-slide-up">
        <Avatar
          className="w-20 h-20 text-white text-lg font-bold ring-2 ring-teal/20"
          style={{
            backgroundColor: school?.brandColor ?? "#00685F",
          }}
        >
          {school?.initials ?? "ZR"}
        </Avatar>
        <p className="text-base font-bold text-ink mt-3.5">
          Learner account
        </p>
        <p className="text-xs text-stone mt-1">
          {LearnerPathLabels[learnerPath]}
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <Badge
            variant="outline"
            className="rounded-full gap-1.5 px-3 py-1.5 text-xs font-semibold border-mist/50"
          >
            <ChartBar size={14} className="text-clay" />
            {readinessScore}% Readiness
          </Badge>
          <Badge
            variant="outline"
            className="rounded-full gap-1.5 px-3 py-1.5 text-xs font-semibold border-mist/50"
          >
            <Target size={14} />
            Goal: {LearningGoalLabels[goal]}
          </Badge>
          <Badge
            variant="outline"
            className="rounded-full gap-1.5 px-3 py-1.5 text-xs font-semibold border-mist/50"
          >
            <Trophy size={14} className="text-teal" />
            {paymentsEnabled
              ? `Plan: ${MembershipPlanLabels[membershipPlan]}`
              : "Rollout access"}
          </Badge>
        </div>
      </Card>

      {/* Account settings */}
      <div className="animate-slide-up stagger-1">
        <p className="text-sm font-bold text-ink">Account Settings</p>
        <p className="text-xs text-stone mt-1">
          Account details and simple controls.
        </p>
      </div>

      <Card className="border-mist/30 overflow-hidden animate-slide-up stagger-1">
        {settingsRows.map((row, i) => (
          <div
            key={row.label}
            className={cn(
              "flex items-center gap-3 p-4",
              i !== settingsRows.length - 1 &&
                "border-b border-mist/30",
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center flex-shrink-0">
              <User size={20} color="#00685F" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink">{row.label}</p>
              <p className="text-xs text-stone">{row.value}</p>
            </div>
          </div>
        ))}
        <button
          onClick={onResetOnboarding}
          className="w-full flex items-center gap-3 p-4 hover:bg-mist/50 transition-colors cursor-pointer border-b border-mist/30"
        >
          <div className="w-10 h-10 rounded-xl bg-red/10 flex items-center justify-center flex-shrink-0">
            <ArrowClockwise size={20} color="#BA1A1A" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-ink">Reset onboarding</p>
            <p className="text-xs text-stone">Clear preferences and start over</p>
          </div>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 p-4 hover:bg-mist/50 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-stone/10 flex items-center justify-center flex-shrink-0">
            <User size={20} color="#576260" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-ink">Sign Out</p>
            <p className="text-xs text-stone">Sign out of this account</p>
          </div>
        </button>
      </Card>

      {/* Plan & billing */}
      <div className="animate-slide-up stagger-2">
        <p className="text-sm font-bold text-ink">
          {paymentsEnabled ? "Plan & Billing" : "Billing"}
        </p>
        <p className="text-xs text-stone mt-1">
          {paymentsEnabled
            ? "Current plan, purchase access, and restore tools."
            : "Payments are deferred until auth is ready."}
        </p>
      </div>

      <Card
        className={cn(
          "border overflow-hidden animate-slide-up stagger-2",
          membershipPlan === "premium"
            ? "border-teal/20 bg-teal/5"
            : "border-mist/30",
        )}
      >
        <div className="p-4 border-b border-mist/30">
          <p className="text-sm font-bold text-ink">Current plan</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-base font-bold text-ink">
              {paymentsEnabled
                ? MembershipPlanLabels[currentPlan]
                : "Rollout access"}
            </span>
            <span className="text-sm font-bold text-ink">
              {paymentsEnabled
                ? currentPlan === "premium"
                  ? "Purchased"
                  : "₮0"
                : "Deferred"}
            </span>
          </div>
        </div>
        <div className="p-4 space-y-2.5">
          {planBenefits.map((b) => (
            <div key={b} className="flex items-start gap-2">
              <CheckCircle
                size={14}
                className="text-teal mt-0.5 flex-shrink-0"
                weight="fill"
              />
              <span className="text-xs text-clay">{b}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* School membership */}
      {school && (
        <>
          <div className="animate-slide-up stagger-3">
            <p className="text-sm font-bold text-ink">School Membership</p>
            <p className="text-xs text-stone mt-1">
              Visible here, not in the main tabs.
            </p>
          </div>
          <Card
            className="p-4 border flex gap-3 animate-slide-up stagger-3"
            style={{
              backgroundColor: `${school.brandColor}12`,
              borderColor: `${school.brandColor}20`,
            }}
          >
            <Avatar
              className="w-10 h-10 text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: school.brandColor }}
            >
              {school.initials}
            </Avatar>
            <div>
              <p className="text-sm font-bold text-ink">{school.name}</p>
              <p className="text-xs text-stone">
                {school.websiteUrl.replace("https://", "").replace("http://", "")}
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
