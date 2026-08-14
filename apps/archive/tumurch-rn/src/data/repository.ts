// Tumurch repository interface — defines all data operations
// Implementations: PreviewRepository (seeded data), SupabaseRepository (live)

import type {
  AppUser,
  CheckInResult,
  CoachClientDetailData,
  CoachWorkoutRecap,
  GuestPassEntry,
  ManagerMemberRecord,
  ManagerSnapshot,
  MemberDashboardData,
  MemberLookupRecord,
  MemberOverview,
  MembershipPlan,
  MeasurementLog,
  PersonalRecord,
  SupplementOrder,
  SupplementProduct,
  WorkoutSessionLog,
  WorkoutTemplate,
  AuditEvent,
  FreezeRequest,
  InvoiceHistoryEntry,
  ExerciseLibraryEntry,
  ExerciseHistoryEntry,
} from "./models";

export interface GymRepository {
  // ─── Auth ──────────────────────────────────────────
  fetchUsers(): Promise<AppUser[]>;
  authenticate(userId: number): Promise<AppUser>;

  // ─── Member ────────────────────────────────────────
  fetchMemberOverview(memberId: number): Promise<MemberOverview>;
  fetchMemberDashboard(memberId: number): Promise<MemberDashboardData>;
  fetchMembershipPlans(branchId: number): Promise<MembershipPlan[]>;

  // ─── Workouts ──────────────────────────────────────
  fetchWorkoutTemplates(branchId: number): Promise<WorkoutTemplate[]>;
  fetchWorkoutHistory(
    memberId: number,
    limit?: number
  ): Promise<WorkoutSessionLog[]>;
  startWorkoutSession(
    templateId: number,
    memberId: number
  ): Promise<WorkoutSessionLog>;
  completeWorkoutSession(sessionId: number): Promise<void>;

  // ─── Measurements & PRs ────────────────────────────
  fetchMeasurements(
    memberId: number,
    limit?: number
  ): Promise<MeasurementLog[]>;
  logMeasurement(measurement: Omit<MeasurementLog, "id">): Promise<void>;
  fetchPersonalRecords(memberId: number): Promise<PersonalRecord[]>;

  // ─── Exercise Library ──────────────────────────────
  searchExercises(
    query: string,
    branchId: number
  ): Promise<ExerciseLibraryEntry[]>;
  fetchExerciseHistory(
    memberId: number,
    exerciseId: number
  ): Promise<ExerciseHistoryEntry[]>;

  // ─── Reception ─────────────────────────────────────
  searchMembers(
    query: string,
    branchId: number
  ): Promise<MemberLookupRecord[]>;
  validateCheckIn(
    memberId: number,
    branchId: number
  ): Promise<CheckInResult>;
  fetchGuestPasses(branchId: number): Promise<GuestPassEntry[]>;

  // ─── Coach ─────────────────────────────────────────
  fetchCoachRoster(coachId: number): Promise<MemberOverview[]>;
  fetchCoachClientDetail(
    memberId: number
  ): Promise<CoachClientDetailData>;
  fetchCoachWorkoutRecap(
    memberId: number
  ): Promise<CoachWorkoutRecap | null>;

  // ─── Shop ──────────────────────────────────────────
  fetchMemberShop(
    memberId: number,
    branchId: number
  ): Promise<{ products: SupplementProduct[]; orders: SupplementOrder[] }>;
  fetchStaffShopSnapshot(
    branchId: number
  ): Promise<{ products: SupplementProduct[]; pendingOrders: SupplementOrder[] }>;

  // ─── Manager ───────────────────────────────────────
  fetchManagerSnapshot(branchId: number): Promise<ManagerSnapshot>;
  fetchManagerMembers(
    branchId: number,
    query?: string
  ): Promise<ManagerMemberRecord[]>;
  fetchAuditLog(
    branchId: number,
    limit?: number
  ): Promise<AuditEvent[]>;
  fetchFreezeRequests(
    branchId: number
  ): Promise<FreezeRequest[]>;
  approveFreezeRequest(
    requestId: number,
    approved: boolean
  ): Promise<void>;

  // ─── Billing ───────────────────────────────────────
  fetchInvoiceHistory(memberId: number): Promise<InvoiceHistoryEntry[]>;
}
