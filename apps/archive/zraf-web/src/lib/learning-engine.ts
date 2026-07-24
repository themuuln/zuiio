import type {
  Question,
  SessionResult,
  LearningSnapshot,
  TopicMetric,
  TopicOpportunity,
  LearningGoal,
  MembershipPlan,
  SessionMode,
  AnswerRecord,
  StudentSnapshot,
} from "./models"
import { PremiumOnlyModes } from "./models"
import { masteryFromAccuracy } from "./models"

export function buildSnapshot(
  questionBank: Question[],
  sessionHistory: SessionResult[],
  goal: LearningGoal,
  plan: MembershipPlan,
): LearningSnapshot {
  const topicMetrics = computeTopicMetrics(questionBank, sessionHistory)
  const readinessScore = computeReadiness(sessionHistory, topicMetrics)
  const confidenceScore = computeConfidence(sessionHistory, topicMetrics)
  const streakDays = computeStreakDays(sessionHistory)
  const totalExposures = sessionHistory.reduce(
    (sum, session) => sum + session.answers.length,
    0,
  )
  const weeklyMockAttempts = computeWeeklyMockAttempts(sessionHistory)
  const recentTrend = computeRecentTrend(sessionHistory)

  return {
    topicMetrics,
    readinessScore,
    confidenceScore,
    streakDays,
    totalExposures,
    weeklyMockAttempts,
    recommendation: computeRecommendation(goal, plan, topicMetrics, weeklyMockAttempts),
    topicOpportunities: computeTopicOpportunities(topicMetrics),
    recentTrend,
  }
}

function computeTopicMetrics(
  questionBank: Question[],
  sessionHistory: SessionResult[],
): TopicMetric[] {
  const metricsMap = new Map<string, TopicMetric>()

  for (const q of questionBank) {
    if (!metricsMap.has(q.topic)) {
      metricsMap.set(q.topic, {
        topic: q.topic,
        total: 0,
        correct: 0,
        slow: 0,
        exposures: 0,
      })
    }
  }

  for (const session of sessionHistory) {
    for (const answer of session.answers) {
      const topic = answer.topic
      const current = metricsMap.get(topic) ?? {
        topic,
        total: 0,
        correct: 0,
        slow: 0,
        exposures: 0,
      }
      metricsMap.set(topic, {
        ...current,
        total: current.total + 1,
        correct: current.correct + (answer.selectedIndex === answer.correctIndex ? 1 : 0),
        slow: current.slow + (answer.elapsed >= 20 ? 1 : 0),
        exposures: current.exposures + 1,
      })
    }
  }

  return Array.from(metricsMap.values()).sort(
    (a, b) => accuracy(a) - accuracy(b),
  )
}

function accuracy(metric: TopicMetric): number {
  return metric.total === 0 ? 0 : metric.correct / metric.total
}

function computeReadiness(
  sessionHistory: SessionResult[],
  topicMetrics: TopicMetric[],
): number {
  if (sessionHistory.length === 0) return 0

  const totalAnswers = sessionHistory.reduce(
    (sum, s) => sum + s.answers.length,
    0,
  )
  const correctAnswers = sessionHistory.reduce(
    (sum, s) => sum + s.answers.filter((a) => a.selectedIndex === a.correctIndex).length,
    0,
  )
  const overallAccuracy = totalAnswers === 0 ? 0 : correctAnswers / totalAnswers

  const mockAttempts = sessionHistory.filter(
    (s) => s.mode === "mockExam",
  )
  const mockAverage =
    mockAttempts.length === 0
      ? 0
      : mockAttempts.reduce((sum, s) => {
          const correct = s.answers.filter(
            (a) => a.selectedIndex === a.correctIndex,
          ).length
          return sum + (s.answers.length === 0 ? 0 : correct / s.answers.length)
        }, 0) / mockAttempts.length

  const topicBalance =
    topicMetrics.length === 0
      ? 0
      : topicMetrics.reduce((sum, m) => sum + accuracy(m), 0) /
        topicMetrics.length

  const streak = computeStreakDays(sessionHistory)
  const streakComponent = Math.min(1, streak / 7) * 10

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        28 + overallAccuracy * 30 + mockAverage * 18 + topicBalance * 14 + streakComponent,
      ),
    ),
  )
}

function computeConfidence(
  sessionHistory: SessionResult[],
  topicMetrics: TopicMetric[],
): number {
  if (sessionHistory.length === 0) return 0

  const speedComponent =
    topicMetrics.length === 0
      ? 0
      : topicMetrics.reduce((sum, m) => {
          return sum + (1 - Math.min(m.slow / Math.max(m.total, 1), 1))
        }, 0) / topicMetrics.length

  const recent = sessionHistory.slice(0, 3)
  const recentAverage =
    recent.length === 0
      ? 0
      : recent.reduce((sum, s) => {
          const correct = s.answers.filter(
            (a) => a.selectedIndex === a.correctIndex,
          ).length
          return sum + (s.answers.length === 0 ? 0 : correct / s.answers.length)
        }, 0) / recent.length

  return Math.min(100, Math.max(0, Math.round(recentAverage * 70 + speedComponent * 30)))
}

function computeStreakDays(sessionHistory: SessionResult[]): number {
  if (sessionHistory.length === 0) return 0

  const uniqueDays = new Set(
    sessionHistory.map((s) => {
      const d = new Date(s.completedAt)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }),
  )

  const sortedDays = Array.from(uniqueDays)
    .map((key) => {
      const [y, m, day] = key.split("-").map(Number)
      return new Date(y, m, day)
    })
    .sort((a, b) => b.getTime() - a.getTime())

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let cursor = new Date(today)
  let streak = 0

  for (const day of sortedDays) {
    const diff = Math.round(
      (cursor.getTime() - day.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (diff === 0) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
      continue
    }
    if (streak === 0 && diff === 1) {
      streak++
      cursor = new Date(day)
      cursor.setDate(cursor.getDate() - 1)
      continue
    }
    if (diff === 1) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
      continue
    }
    break
  }

  return streak
}

function computeWeeklyMockAttempts(sessionHistory: SessionResult[]): number {
  const threshold = Date.now() - 7 * 24 * 60 * 60 * 1000
  return sessionHistory.filter(
    (s) => s.mode === "mockExam" && s.completedAt >= threshold,
  ).length
}

function computeRecentTrend(sessionHistory: SessionResult[]): number {
  if (sessionHistory.length < 2) return 0

  const recent = sessionHistory.slice(0, 3)
  const older = sessionHistory.slice(3, 6)

  const recentAvg =
    recent.length === 0
      ? 0
      : recent.reduce((sum, s) => {
          const correct = s.answers.filter(
            (a) => a.selectedIndex === a.correctIndex,
          ).length
          return sum + (s.answers.length === 0 ? 0 : correct / s.answers.length)
        }, 0) / recent.length

  const olderAvg =
    older.length === 0
      ? recentAvg
      : older.reduce((sum, s) => {
          const correct = s.answers.filter(
            (a) => a.selectedIndex === a.correctIndex,
          ).length
          return sum + (s.answers.length === 0 ? 0 : correct / s.answers.length)
        }, 0) / older.length

  return recentAvg - olderAvg
}

function computeRecommendation(
  goal: LearningGoal,
  plan: MembershipPlan,
  topicMetrics: TopicMetric[],
  weeklyMockAttempts: number,
): string {
  const weakest = topicMetrics[0]
  if (plan === "free" && weeklyMockAttempts >= 1) {
    return "Review mistakes or upgrade for unlimited mock exams"
  }
  if (goal === "weakTopics" && weakest) {
    return `Target ${weakest.topic} next`
  }
  if (goal === "passSoon") {
    return weeklyMockAttempts === 0
      ? "Take a mock exam this week"
      : "Run a mixed review before your next mock"
  }
  return "Keep your streak alive with a short practice set"
}

function computeTopicOpportunities(
  topicMetrics: TopicMetric[],
): TopicOpportunity[] {
  return topicMetrics.slice(0, 3).map((metric) => {
    const ms = masteryFromAccuracy(metric.total, accuracy(metric))
    const reason =
      ms === "notStarted"
        ? "No practice yet"
        : ms === "weak"
          ? "Low accuracy or too few reps"
          : ms === "improving"
            ? "Close to stable understanding"
            : ms === "ready"
              ? "One more strong session could lock it in"
              : "Maintain occasionally"
    return { topic: metric.topic, reason }
  })
}

export function buildSchoolStudents(
  readinessScore: number,
  weakestTopic: string,
): StudentSnapshot[] {
  return [
    {
      name: "Танаа",
      readiness: readinessScore,
      status: readinessScore >= 85 ? "examReady" : "improving",
      weakTopic: weakestTopic,
      lastActive: "Today",
      paid: true,
      sessions: 8,
      branch: "Central Branch",
    },
    {
      name: "Номин",
      readiness: 92,
      status: "examReady",
      weakTopic: "Parking",
      lastActive: "2 hours ago",
      paid: true,
      sessions: 19,
      branch: "Central Branch",
    },
    {
      name: "Тэмүүжин",
      readiness: 74,
      status: "followUp",
      weakTopic: "Intersections",
      lastActive: "Yesterday",
      paid: true,
      sessions: 11,
      branch: "Bayanzurkh Branch",
    },
    {
      name: "Ариунболд",
      readiness: 61,
      status: "improving",
      weakTopic: "Speed rules",
      lastActive: "Today",
      paid: false,
      sessions: 7,
      branch: "Bayanzurkh Branch",
    },
    {
      name: "Одгэрэл",
      readiness: 45,
      status: "inactive",
      weakTopic: "Road signs",
      lastActive: "4 days ago",
      paid: false,
      sessions: 3,
      branch: "Central Branch",
    },
  ]
}

export function cohortWeakTopics(
  students: StudentSnapshot[],
): Array<{ topic: string; count: number }> {
  const counts = new Map<string, number>()
  for (const s of students) {
    counts.set(s.weakTopic, (counts.get(s.weakTopic) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
}

export function buildQuestionsForMode(
  mode: SessionMode,
  count: number,
  questionBank: Question[],
  officialTestBank: Question[],
  sessionHistory: SessionResult[],
  topicMetrics: TopicMetric[],
  topic?: string,
): Question[] {
  const visibleBank = questionBank
  const combined = [...visibleBank, ...officialTestBank]

  const shuffle = <T>(arr: T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  let pool: Question[] = []

  switch (mode) {
    case "officialTest":
      pool = [...officialTestBank]
      break
    case "quickPractice":
      pool = shuffle(visibleBank)
      break
    case "mockExam":
      pool = shuffle(visibleBank)
      const visualIdx = pool.findIndex((q) => q.visual)
      if (visualIdx > 0) {
        const [visual] = pool.splice(visualIdx, 1)
        pool.unshift(visual)
      }
      break
    case "topicPractice":
      pool = shuffle(visibleBank.filter((q) => q.topic === topic))
      break
    case "weakTopicPractice": {
      const weakTopics = new Set(topicMetrics.slice(0, 2).map((m) => m.topic))
      pool = shuffle(visibleBank.filter((q) => weakTopics.has(q.topic)))
      break
    }
    case "mistakeReview": {
      const reviewIds = new Set(
        sessionHistory
          .flatMap((s) => s.answers)
          .filter(
            (a) =>
              a.flagged ||
              a.selectedIndex === null ||
              a.selectedIndex !== a.correctIndex ||
              a.elapsed >= 20,
          )
          .map((a) => a.questionId),
      )
      pool = shuffle(combined.filter((q) => reviewIds.has(q.id)))
      break
    }
    case "rememberMode":
      pool = shuffle(officialTestBank.length > 0 ? officialTestBank : visibleBank)
      break
    case "imagePractice":
      pool = shuffle(visibleBank.filter((q) => q.visual))
      break
  }

  if (pool.length === 0) return []

  const selected: Question[] = []
  if (pool.length >= count) {
    selected.push(...pool.slice(0, count))
  } else {
    while (selected.length < count) {
      const copy = shuffle(pool)
      selected.push(...copy)
    }
  }

  return selected.slice(0, count)
}

export function accessForMode(
  mode: SessionMode,
  plan: MembershipPlan,
  sessionHistory: SessionResult[],
  paymentsEnabled: boolean,
): { allowed: boolean; title?: string; message?: string } {
  if (!paymentsEnabled) return { allowed: true }
  if (plan === "premium") return { allowed: true }
  if (PremiumOnlyModes.has(mode)) {
    return {
      allowed: false,
      title: "Premium mode",
      message:
        "Weak-topic drills and image practice are part of the premium preview.",
    }
  }
  if (mode === "mockExam" && computeWeeklyMockAttempts(sessionHistory) >= 1) {
    return {
      allowed: false,
      title: "Weekly mock limit reached",
      message:
        "Free learners get one mock exam every 7 days.",
    }
  }
  return { allowed: true }
}
