// ── Enums ──

export type LearnerPath = "individual" | "school"

export const LearnerPathLabels: Record<LearnerPath, string> = {
  individual: "Individual learner",
  school: "Joined through a school",
}

export type LearningGoal = "passSoon" | "dailyPractice" | "weakTopics"

export const LearningGoalLabels: Record<LearningGoal, string> = {
  passSoon: "Pass exam soon",
  dailyPractice: "Build daily practice",
  weakTopics: "Fix weak topics",
}

export type MembershipPlan = "free" | "premium"

export const MembershipPlanLabels: Record<MembershipPlan, string> = {
  free: "Free",
  premium: "Premium",
}

export const PremiumBenefits: Record<MembershipPlan, string[]> = {
  free: [
    "Quick practice and topic drills",
    "Basic progress and readiness view",
    "One mock exam every 7 days",
  ],
  premium: [
    "Unlimited mock exams",
    "Weak-topic and image practice",
    "Advanced explanations and premium packs",
    "Offline access after one purchase",
  ],
}

export type SessionMode =
  | "quickPractice"
  | "officialTest"
  | "topicPractice"
  | "weakTopicPractice"
  | "mistakeReview"
  | "rememberMode"
  | "imagePractice"
  | "mockExam"

export const SessionModeLabels: Record<SessionMode, string> = {
  quickPractice: "Quick Practice",
  officialTest: "Official Test",
  topicPractice: "Topic Practice",
  weakTopicPractice: "Weak Topic Practice",
  mistakeReview: "Mistake Review",
  rememberMode: "Remember Mode",
  imagePractice: "Image Test Practice",
  mockExam: "Mock Exam",
}

export const SessionModeIcons: Record<SessionMode, string> = {
  quickPractice: "play",
  officialTest: "clipboard",
  topicPractice: "rows",
  weakTopicPractice: "trend-up",
  mistakeReview: "clock-counter-clockwise",
  rememberMode: "brain",
  imagePractice: "image",
  mockExam: "exam",
}

export const PremiumOnlyModes: Set<SessionMode> = new Set([
  "weakTopicPractice",
  "imagePractice",
])

export type Difficulty = "starter" | "standard" | "advanced"

export const DifficultyLabels: Record<Difficulty, string> = {
  starter: "Starter",
  standard: "Standard",
  advanced: "Advanced",
}

export type VisualKind = "sign" | "intersection" | "hazard" | "parking" | "roundabout"

export type QuestionSourceGroup = "main" | "plus" | "officialTest"

export const QuestionSourceGroupLabels: Record<QuestionSourceGroup, string> = {
  main: "Main",
  plus: "Plus",
  officialTest: "Official Test",
}

export type MasteryStatus = "notStarted" | "weak" | "improving" | "ready" | "mastered"

export const MasteryStatusLabels: Record<MasteryStatus, string> = {
  notStarted: "Not started",
  weak: "Weak",
  improving: "Improving",
  ready: "Ready",
  mastered: "Mastered",
}

export type StudentStatus = "inactive" | "improving" | "examReady" | "followUp"

export const StudentStatusLabels: Record<StudentStatus, string> = {
  inactive: "Inactive",
  improving: "Improving",
  examReady: "Exam ready",
  followUp: "Needs follow-up",
}

// ── Interfaces ──

export interface QuestionVisual {
  kind: VisualKind
  title: string
  caption: string
  symbol?: string
  assetPath?: string
}

export interface Question {
  id: string
  prompt: string
  choices: string[]
  correctIndex: number
  shortExplanation: string
  longExplanation: string
  topic: string
  subtopic: string
  difficulty: Difficulty
  sourceType: string
  tags: string[]
  commonMistakeReason: string
  visual?: QuestionVisual
  pack?: string
  premiumOnly: boolean
  sourceGroup: QuestionSourceGroup
  whyExplanationMn?: string
  whyConfidencePercent?: number
  whyIsLowConfidence?: boolean
}

export interface AnswerRecord {
  questionId: string
  selectedIndex: number | null
  flagged: boolean
  elapsed: number // seconds
  prompt: string
  choices: string[]
  correctIndex: number
  shortExplanation: string
  longExplanation: string
  topic: string
  commonMistakeReason: string
  visual?: QuestionVisual
}

export interface SessionResult {
  mode: SessionMode
  answers: AnswerRecord[]
  duration: number // seconds
  completedAt: number // timestamp
}

export interface TopicMetric {
  topic: string
  total: number
  correct: number
  slow: number
  exposures: number
}

export function topicAccuracy(metric: TopicMetric): number {
  return metric.total === 0 ? 0 : metric.correct / metric.total
}

export interface LearningSnapshot {
  topicMetrics: TopicMetric[]
  readinessScore: number
  confidenceScore: number
  streakDays: number
  totalExposures: number
  weeklyMockAttempts: number
  recommendation: string
  topicOpportunities: TopicOpportunity[]
  recentTrend: number
}

export interface TopicOpportunity {
  topic: string
  reason: string
}

export interface SchoolBranch {
  name: string
  city: string
  students: number
}

export interface SchoolPartner {
  id: string
  name: string
  initials: string
  inviteCode: string
  websiteUrl: string
  brandColor: string
  branches: SchoolBranch[]
}

export interface StudentSnapshot {
  name: string
  readiness: number
  status: StudentStatus
  weakTopic: string
  lastActive: string
  paid: boolean
  sessions: number
  branch: string
}

export interface AppState {
  isLoggedIn: boolean
  learnerPath: LearnerPath
  goal: LearningGoal
  membershipPlan: MembershipPlan
  selectedSchool: SchoolPartner | null
  isOnboarded: boolean
  selectedTab: number
  sessionHistory: SessionResult[]
}

export function masteryFromAccuracy(total: number, accuracy: number): MasteryStatus {
  if (total === 0) return "notStarted"
  if (accuracy < 0.55 || total < 3) return "weak"
  if (accuracy < 0.75) return "improving"
  if (accuracy < 0.9) return "ready"
  return "mastered"
}

export function readinessLabel(score: number): string {
  if (score < 50) return "Not ready"
  if (score < 75) return "Improving"
  if (score < 90) return "Almost ready"
  return "Exam ready"
}
