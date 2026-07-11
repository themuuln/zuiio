// Tumurch data models — TypeScript interfaces
// Ported from Flutter's models.dart

// ─── Enums ──────────────────────────────────────────────

export type AppRole = "member" | "reception" | "manager" | "coach";

export type MemberStatus =
  | "active"
  | "frozen"
  | "overdue"
  | "expired"
  | "canceled";

export type WorkoutSessionKind =
  | "scheduled"
  | "freeform"
  | "coach_assigned";

export type WorkoutSetType =
  | "normal"
  | "warmup"
  | "drop"
  | "failure"
  | "amrap"
  | "superset";

// ─── Core Models ────────────────────────────────────────

export interface AppUser {
  id: number;
  name: string;
  phone: string;
  role: AppRole;
  branchId: number;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Branch {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
}

export interface MemberProfile {
  id: number;
  userId: number;
  name: string;
  phone: string;
  email: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  height: number | null;
  trainingGoal: string | null;
  trainingExperience: string | null;
  trainingDaysPerWeek: number | null;
  injuries: string | null;
  avatarUrl: string | null;
  branchId: number;
  createdAt: string;
}

export interface MembershipPlan {
  id: number;
  name: string;
  price: number;
  durationDays: number;
  branchId: number;
  isActive: boolean;
  description: string | null;
}

export interface Membership {
  id: number;
  memberId: number;
  planId: number;
  status: MemberStatus;
  startDate: string;
  endDate: string | null;
  branchId: number;
  frozenDaysUsed: number;
  frozenDaysMax: number;
  createdAt: string;
}

// ─── Member Overview ────────────────────────────────────

export interface MemberOverview {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  status: MemberStatus;
  branchId: number;
  branchName: string | null;
  membershipPlanName: string | null;
  membershipEndDate: string | null;
  membershipId: number | null;
  avatarUrl: string | null;
  lastCheckIn: string | null;
  trainingGoal: string | null;
}

// ─── Member Dashboard ───────────────────────────────────

export interface MemberDashboardData {
  member: MemberOverview;
  currentPlan: MembershipPlan | null;
  membership: Membership | null;
  recentCheckIns: CheckIn[];
  workoutStreak: number;
  totalWorkouts: number;
  latestMeasurement: MeasurementLog | null;
  latestPR: PersonalRecord | null;
}

export interface CheckIn {
  id: number;
  memberId: number;
  branchId: number;
  checkInTime: string;
  checkOutTime: string | null;
  method: "qr" | "manual" | "override";
  overrideReason: string | null;
  overrideBy: number | null;
}

// ─── Workouts ───────────────────────────────────────────

export interface WorkoutTemplate {
  id: number;
  name: string;
  branchId: number;
  description: string | null;
  goal: string | null;
  experienceLevel: string | null;
  daysPerWeek: number | null;
  isActive: boolean;
  exercises: WorkoutTemplateExercise[];
}

export interface WorkoutTemplateExercise {
  id: number;
  templateId: number;
  exerciseId: number;
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  restSeconds: number;
  order: number;
  notes: string | null;
}

export interface WorkoutSessionLog {
  id: number;
  memberId: number;
  templateId: number | null;
  branchId: number;
  kind: WorkoutSessionKind;
  startedAt: string;
  completedAt: string | null;
  durationMinutes: number | null;
  notes: string | null;
  exercises: WorkoutSessionExerciseLog[];
}

export interface WorkoutSessionExerciseLog {
  id: number;
  sessionId: number;
  exerciseId: number;
  exerciseName: string;
  order: number;
  sets: WorkoutSetLog[];
}

export interface WorkoutSetLog {
  id: number;
  exerciseLogId: number;
  setType: WorkoutSetType;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  restSeconds: number | null;
  isCompleted: boolean;
  order: number;
}

// ─── Measurements & PRs ─────────────────────────────────

export interface MeasurementLog {
  id: number;
  memberId: number;
  date: string;
  weight: number | null;
  waist: number | null;
  chest: number | null;
  hips: number | null;
  arms: number | null;
  thighs: number | null;
  notes: string | null;
}

export interface PersonalRecord {
  id: number;
  memberId: number;
  exerciseId: number;
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
  notes: string | null;
}

// ─── Exercise Library ───────────────────────────────────

export interface ExerciseLibraryEntry {
  id: number;
  name: string;
  category: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  equipment: string;
  instructions: string;
  commonMistakes: string;
  videoUrl: string | null;
  imageUrl: string | null;
}

export interface ExerciseHistoryEntry {
  id: number;
  exerciseId: number;
  exerciseName: string;
  date: string;
  sets: WorkoutSetLog[];
  totalVolume: number;
  bestSet: WorkoutSetLog | null;
}

// ─── Reception ──────────────────────────────────────────

export interface MemberLookupRecord {
  memberId: number;
  name: string;
  phone: string;
  status: MemberStatus;
  branchId: number;
  branchName: string | null;
  membershipPlanName: string | null;
  membershipEndDate: string | null;
  avatarUrl: string | null;
  lastCheckIn: string | null;
}

export interface CheckInResult {
  allowed: boolean;
  reason: string;
  member: MemberOverview | null;
  requiresOverride: boolean;
  checkIn: CheckIn | null;
}

export interface GuestPassEntry {
  id: number;
  guestName: string;
  guestPhone: string | null;
  branchId: number;
  issuedAt: string;
  expiresAt: string;
  issuedBy: number;
}

// ─── Shop ───────────────────────────────────────────────

export interface SupplementProduct {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string;
  stockQuantity: number;
  branchId: number;
  isActive: boolean;
}

export interface SupplementOrder {
  id: number;
  memberId: number;
  branchId: number;
  status: "pending" | "confirmed" | "ready" | "picked_up" | "cancelled";
  totalAmount: number;
  items: SupplementOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SupplementOrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

// ─── Coach ──────────────────────────────────────────────

export interface CoachAssignedPlan {
  id: number;
  memberId: number;
  coachId: number;
  templateId: number;
  templateName: string;
  startDate: string;
  schedule: string | null;
  isActive: boolean;
}

export interface CoachWorkoutRecap {
  sessionId: number;
  date: string;
  exerciseCount: number;
  totalSets: number;
  totalVolume: number;
  durationMinutes: number | null;
}

export interface CoachProgressSignal {
  kind: "personal_record" | "measurement";
  date: string;
  exerciseName: string | null;
  value: string;
}

export interface CoachClientDetailData {
  member: MemberOverview;
  assignedPlan: CoachAssignedPlan | null;
  latestWorkout: CoachWorkoutRecap | null;
  progressSignals: CoachProgressSignal[];
  recentMeasurements: MeasurementLog[];
  recentPRs: PersonalRecord[];
}

// ─── Manager ────────────────────────────────────────────

export interface ManagerMemberRecord {
  memberId: number;
  name: string;
  phone: string;
  status: MemberStatus;
  planName: string | null;
  membershipEndDate: string | null;
  lastCheckIn: string | null;
  totalCheckIns: number;
}

export interface ManagerSnapshot {
  totalMembers: number;
  activeMembers: number;
  frozenMembers: number;
  overdueMembers: number;
  todayCheckIns: number;
  weekCheckIns: number;
  monthlyRevenue: number;
  pendingFreezeRequests: number;
}

export interface AuditEvent {
  id: number;
  actorId: number;
  actorName: string;
  action: string;
  targetType: string;
  targetId: number;
  details: string | null;
  branchId: number;
  createdAt: string;
}

// ─── Billing ────────────────────────────────────────────

export interface InvoiceHistoryEntry {
  id: number;
  memberId: number;
  membershipId: number;
  amount: number;
  status: "paid" | "pending" | "overdue" | "cancelled";
  issuedAt: string;
  paidAt: string | null;
  planName: string;
}

// ─── Freeze ─────────────────────────────────────────────

export interface FreezeRequest {
  id: number;
  memberId: number;
  memberName: string;
  branchId: number;
  requestedAt: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: "pending" | "approved" | "denied";
  reviewedBy: number | null;
  reviewedAt: string | null;
}
