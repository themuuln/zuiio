// Preview repository — seeded in-memory data for fast UI validation
// Ported from Flutter's debug_preview_repository.dart

import type { GymRepository } from "./repository";
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

// ─── Seeded Data ────────────────────────────────────────

const BRANCH = { id: 1, name: "Tumurch Main", address: "Ulaanbaatar", phone: null, isActive: true };

const USERS: AppUser[] = [
  { id: 1, name: "Бат-Эрдэнэ", phone: "+97699110001", role: "member", branchId: 1, avatarUrl: null, createdAt: "2026-01-15" },
  { id: 2, name: "Саруул", phone: "+97699110002", role: "reception", branchId: 1, avatarUrl: null, createdAt: "2026-01-10" },
  { id: 3, name: "Оюун", phone: "+97699110003", role: "manager", branchId: 1, avatarUrl: null, createdAt: "2026-01-10" },
  { id: 4, name: "Тэмүүлэн", phone: "+97699110004", role: "coach", branchId: 1, avatarUrl: null, createdAt: "2026-02-01" },
  { id: 5, name: "Мөнх-Эрдэнэ", phone: "+97699110005", role: "member", branchId: 1, avatarUrl: null, createdAt: "2026-02-15" },
  { id: 6, name: "Анхцэцэг", phone: "+97699110006", role: "member", branchId: 1, avatarUrl: null, createdAt: "2026-03-01" },
];

const MEMBERSHIP_PLANS: MembershipPlan[] = [
  { id: 1, name: "Сарын гишүүнчлэл", price: 150000, durationDays: 30, branchId: 1, isActive: true, description: "Бүх төрлийн хэрэглээ" },
  { id: 2, name: "Улирлын гишүүнчлэл", price: 380000, durationDays: 90, branchId: 1, isActive: true, description: "3 сарын хөнгөлөлттэй үнэ" },
  { id: 3, name: "Жилийн гишүүнчлэл", price: 1200000, durationDays: 365, branchId: 1, isActive: true, description: "Хамгийн их хэмнэлт" },
];

const EXERCISES: ExerciseLibraryEntry[] = [
  { id: 1, name: "БENCH PRESS", category: "Chest", muscleGroup: "Pectoralis Major", secondaryMuscles: ["Anterior Deltoid", "Triceps"], equipment: "Barbell", instructions: "Lie on bench, grip bar slightly wider than shoulders, lower to chest, press up.", commonMistakes: "Bouncing off chest, flaring elbows too wide", videoUrl: null, imageUrl: null },
  { id: 2, name: "SQUAT", category: "Legs", muscleGroup: "Quadriceps", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Barbell", instructions: "Bar on upper back, feet shoulder-width, squat down until thighs parallel, drive up.", commonMistakes: "Knees caving in, not going deep enough", videoUrl: null, imageUrl: null },
  { id: 3, name: "DEADLIFT", category: "Back", muscleGroup: "Erector Spinae", secondaryMuscles: ["Glutes", "Hamstrings", "Traps"], equipment: "Barbell", instructions: "Stand over bar, hinge at hips, grip bar, drive through heels, lock out at top.", commonMistakes: "Rounding lower back, jerking the bar", videoUrl: null, imageUrl: null },
  { id: 4, name: "OVERHEAD PRESS", category: "Shoulders", muscleGroup: "Deltoids", secondaryMuscles: ["Triceps", "Upper Chest"], equipment: "Barbell", instructions: "Bar at shoulder height, press overhead until arms locked, lower with control.", commonMistakes: "Leaning back excessively, using legs", videoUrl: null, imageUrl: null },
  { id: 5, name: "BARBELL ROW", category: "Back", muscleGroup: "Latissimus Dorsi", secondaryMuscles: ["Rhomboids", "Biceps"], equipment: "Barbell", instructions: "Hinge forward, grip bar, pull to lower chest, squeeze shoulder blades.", commonMistakes: "Standing too upright, using momentum", videoUrl: null, imageUrl: null },
  { id: 6, name: "PULL-UP", category: "Back", muscleGroup: "Latissimus Dorsi", secondaryMuscles: ["Biceps", "Rhomboids"], equipment: "Bodyweight", instructions: "Hang from bar, pull chin over bar, lower with control.", commonMistakes: "Swinging, not full range of motion", videoUrl: null, imageUrl: null },
  { id: 7, name: "DUMBBELL LUNGE", category: "Legs", muscleGroup: "Quadriceps", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Dumbbells", instructions: "Step forward into lunge, both knees at 90°, push back to start.", commonMistakes: "Front knee going past toes, torso leaning", videoUrl: null, imageUrl: null },
  { id: 8, name: "CABLE FLY", category: "Chest", muscleGroup: "Pectoralis Major", secondaryMuscles: ["Anterior Deltoid"], equipment: "Cable", instructions: "Stand between cables, arms slightly bent, bring hands together in front.", commonMistakes: "Bending elbows too much, using too much weight", videoUrl: null, imageUrl: null },
];

const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 1, name: "Upper Body A", branchId: 1, description: "Chest, shoulders, triceps focus", goal: " strength",
    experienceLevel: "intermediate", daysPerWeek: 3, isActive: true,
    exercises: [
      { id: 1, templateId: 1, exerciseId: 1, exerciseName: "BENCH PRESS", targetSets: 4, targetReps: "6-8", restSeconds: 180, order: 1, notes: null },
      { id: 2, templateId: 1, exerciseId: 4, exerciseName: "OVERHEAD PRESS", targetSets: 3, targetReps: "8-10", restSeconds: 120, order: 2, notes: null },
      { id: 3, templateId: 1, exerciseId: 8, exerciseName: "CABLE FLY", targetSets: 3, targetReps: "12-15", restSeconds: 90, order: 3, notes: null },
    ],
  },
  {
    id: 2, name: "Lower Body A", branchId: 1, description: "Squat and deadlift focus", goal: "strength",
    experienceLevel: "intermediate", daysPerWeek: 2, isActive: true,
    exercises: [
      { id: 4, templateId: 2, exerciseId: 2, exerciseName: "SQUAT", targetSets: 5, targetReps: "5", restSeconds: 240, order: 1, notes: null },
      { id: 5, templateId: 2, exerciseId: 3, exerciseName: "DEADLIFT", targetSets: 3, targetReps: "5", restSeconds: 240, order: 2, notes: null },
      { id: 6, templateId: 2, exerciseId: 7, exerciseName: "DUMBBELL LUNGE", targetSets: 3, targetReps: "10 each", restSeconds: 120, order: 3, notes: null },
    ],
  },
  {
    id: 3, name: "Back & Biceps", branchId: 1, description: "Back thickness and width", goal: "hypertrophy",
    experienceLevel: "intermediate", daysPerWeek: 2, isActive: true,
    exercises: [
      { id: 7, templateId: 3, exerciseId: 5, exerciseName: "BARBELL ROW", targetSets: 4, targetReps: "8-10", restSeconds: 120, order: 1, notes: null },
      { id: 8, templateId: 3, exerciseId: 6, exerciseName: "PULL-UP", targetSets: 3, targetReps: "max", restSeconds: 120, order: 2, notes: null },
    ],
  },
];

const MEMBERS: MemberOverview[] = [
  { id: 1, name: "Бат-Эрдэнэ", phone: "+97699110001", email: null, status: "active", branchId: 1, branchName: "Tumurch Main", membershipPlanName: "Сарын гишүүнчлэл", membershipEndDate: "2026-08-15", membershipId: 1, avatarUrl: null, lastCheckIn: "2026-07-07", trainingGoal: "Булчин нэмэх" },
  { id: 5, name: "Мөнх-Эрдэнэ", phone: "+97699110005", email: null, status: "active", branchId: 1, branchName: "Tumurch Main", membershipPlanName: "Улирлын гишүүнчлэл", membershipEndDate: "2026-09-01", membershipId: 2, avatarUrl: null, lastCheckIn: "2026-07-06", trainingGoal: "Турших" },
  { id: 6, name: "Анхцэцэг", phone: "+97699110006", email: null, status: "frozen", branchId: 1, branchName: "Tumurch Main", membershipPlanName: "Сарын гишүүнчлэл", membershipEndDate: "2026-07-20", membershipId: 3, avatarUrl: null, lastCheckIn: "2026-06-28", trainingGoal: "Ерөнхий фитнес" },
];

const MEASUREMENTS: MeasurementLog[] = [
  { id: 1, memberId: 1, date: "2026-07-01", weight: 82.5, waist: 84, chest: 102, hips: 98, arms: 36, thighs: 58, notes: null },
  { id: 2, memberId: 1, date: "2026-06-01", weight: 81.0, waist: 85, chest: 101, hips: 97, arms: 35.5, thighs: 57, notes: null },
  { id: 3, memberId: 1, date: "2026-05-01", weight: 80.0, waist: 86, chest: 100, hips: 97, arms: 35, thighs: 57, notes: null },
];

const PRS: PersonalRecord[] = [
  { id: 1, memberId: 1, exerciseId: 1, exerciseName: "BENCH PRESS", weight: 100, reps: 3, date: "2026-07-05", notes: null },
  { id: 2, memberId: 1, exerciseId: 2, exerciseName: "SQUAT", weight: 140, reps: 5, date: "2026-06-28", notes: null },
  { id: 3, memberId: 1, exerciseId: 3, exerciseName: "DEADLIFT", weight: 180, reps: 3, date: "2026-07-02", notes: null },
];

const SUPPLEMENT_PRODUCTS: SupplementProduct[] = [
  { id: 1, name: "Whey Protein Isolate", description: "Pure whey isolate, 25g protein per serving", price: 89000, imageUrl: null, category: "Protein", stockQuantity: 24, branchId: 1, isActive: true },
  { id: 2, name: "Creatine Monohydrate", description: "5g creatine monohydrate, unflavored", price: 35000, imageUrl: null, category: "Performance", stockQuantity: 48, branchId: 1, isActive: true },
  { id: 3, name: "BCAA Powder", description: "Branched-chain amino acids, tropical flavor", price: 42000, imageUrl: null, category: "Recovery", stockQuantity: 18, branchId: 1, isActive: true },
  { id: 4, name: "Pre-Workout Energy", description: "Caffeine + beta-alanine + citrulline", price: 55000, imageUrl: null, category: "Performance", stockQuantity: 30, branchId: 1, isActive: true },
];

// ─── Preview Repository Implementation ──────────────────

export class PreviewGymRepository implements GymRepository {
  async fetchUsers(): Promise<AppUser[]> {
    return USERS;
  }

  async authenticate(userId: number): Promise<AppUser> {
    const user = USERS.find((u) => u.id === userId);
    if (!user) throw new Error(`User ${userId} not found`);
    return user;
  }

  async fetchMemberOverview(memberId: number): Promise<MemberOverview> {
    const member = MEMBERS.find((m) => m.id === memberId);
    if (!member) throw new Error(`Member ${memberId} not found`);
    return member;
  }

  async fetchMemberDashboard(memberId: number): Promise<MemberDashboardData> {
    const member = await this.fetchMemberOverview(memberId);
    return {
      member,
      currentPlan: MEMBERSHIP_PLANS.find((p) => p.name === member.membershipPlanName) ?? null,
      membership: null,
      recentCheckIns: [],
      workoutStreak: 5,
      totalWorkouts: 47,
      latestMeasurement: MEASUREMENTS.find((m) => m.memberId === memberId) ?? null,
      latestPR: PRS.find((p) => p.memberId === memberId) ?? null,
    };
  }

  async fetchMembershipPlans(_branchId: number): Promise<MembershipPlan[]> {
    return MEMBERSHIP_PLANS;
  }

  async fetchWorkoutTemplates(_branchId: number): Promise<WorkoutTemplate[]> {
    return WORKOUT_TEMPLATES;
  }

  async fetchWorkoutHistory(_memberId: number, _limit?: number): Promise<WorkoutSessionLog[]> {
    return [];
  }

  async startWorkoutSession(templateId: number, memberId: number): Promise<WorkoutSessionLog> {
    const template = WORKOUT_TEMPLATES.find((t) => t.id === templateId);
    return {
      id: Date.now(),
      memberId,
      templateId,
      branchId: 1,
      kind: "scheduled",
      startedAt: new Date().toISOString(),
      completedAt: null,
      durationMinutes: null,
      notes: null,
      exercises: template?.exercises.map((ex) => ({
        id: ex.id,
        sessionId: Date.now(),
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        order: ex.order,
        sets: [],
      })) ?? [],
    };
  }

  async completeWorkoutSession(_sessionId: number): Promise<void> {}

  async fetchMeasurements(memberId: number, _limit?: number): Promise<MeasurementLog[]> {
    return MEASUREMENTS.filter((m) => m.memberId === memberId);
  }

  async logMeasurement(_measurement: Omit<MeasurementLog, "id">): Promise<void> {}

  async fetchPersonalRecords(memberId: number): Promise<PersonalRecord[]> {
    return PRS.filter((p) => p.memberId === memberId);
  }

  async searchExercises(query: string, _branchId: number): Promise<ExerciseLibraryEntry[]> {
    const q = query.toLowerCase();
    return EXERCISES.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.muscleGroup.toLowerCase().includes(q)
    );
  }

  async fetchExerciseHistory(_memberId: number, _exerciseId: number): Promise<ExerciseHistoryEntry[]> {
    return [];
  }

  async searchMembers(query: string, _branchId: number): Promise<MemberLookupRecord[]> {
    const q = query.toLowerCase();
    return MEMBERS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.phone.includes(q)
    ).map((m) => ({
      memberId: m.id,
      name: m.name,
      phone: m.phone,
      status: m.status,
      branchId: m.branchId,
      branchName: m.branchName,
      membershipPlanName: m.membershipPlanName,
      membershipEndDate: m.membershipEndDate,
      avatarUrl: m.avatarUrl,
      lastCheckIn: m.lastCheckIn,
    }));
  }

  async validateCheckIn(memberId: number, branchId: number): Promise<CheckInResult> {
    const member = MEMBERS.find((m) => m.id === memberId && m.branchId === branchId);
    if (!member) {
      return { allowed: false, reason: "Member not found in this branch", member: null, requiresOverride: false, checkIn: null };
    }
    if (member.status === "frozen") {
      return { allowed: false, reason: "Membership is frozen", member, requiresOverride: true, checkIn: null };
    }
    if (member.status === "overdue") {
      return { allowed: false, reason: "Membership payment overdue", member, requiresOverride: true, checkIn: null };
    }
    return {
      allowed: true,
      reason: "Welcome!",
      member,
      requiresOverride: false,
      checkIn: { id: Date.now(), memberId, branchId, checkInTime: new Date().toISOString(), checkOutTime: null, method: "qr", overrideReason: null, overrideBy: null },
    };
  }

  async fetchGuestPasses(_branchId: number): Promise<GuestPassEntry[]> {
    return [];
  }

  async fetchCoachRoster(_coachId: number): Promise<MemberOverview[]> {
    return MEMBERS.filter((m) => m.status === "active");
  }

  async fetchCoachClientDetail(memberId: number): Promise<CoachClientDetailData> {
    const member = await this.fetchMemberOverview(memberId);
    return {
      member,
      assignedPlan: { id: 1, memberId, coachId: 4, templateId: 1, templateName: "Upper Body A", startDate: "2026-06-01", schedule: "Mon/Wed/Fri", isActive: true },
      latestWorkout: { sessionId: 100, date: "2026-07-07", exerciseCount: 3, totalSets: 14, totalVolume: 4200, durationMinutes: 52 },
      progressSignals: [
        { kind: "personal_record", date: "2026-07-05", exerciseName: "BENCH PRESS", value: "100kg × 3" },
        { kind: "measurement", date: "2026-07-01", exerciseName: null, value: "82.5kg" },
      ],
      recentMeasurements: MEASUREMENTS.filter((m) => m.memberId === memberId),
      recentPRs: PRS.filter((p) => p.memberId === memberId),
    };
  }

  async fetchCoachWorkoutRecap(_memberId: number): Promise<CoachWorkoutRecap | null> {
    return { sessionId: 100, date: "2026-07-07", exerciseCount: 3, totalSets: 14, totalVolume: 4200, durationMinutes: 52 };
  }

  async fetchMemberShop(_memberId: number, _branchId: number): Promise<{ products: SupplementProduct[]; orders: SupplementOrder[] }> {
    return { products: SUPPLEMENT_PRODUCTS, orders: [] };
  }

  async fetchStaffShopSnapshot(_branchId: number): Promise<{ products: SupplementProduct[]; pendingOrders: SupplementOrder[] }> {
    return { products: SUPPLEMENT_PRODUCTS, pendingOrders: [] };
  }

  async fetchManagerSnapshot(_branchId: number): Promise<ManagerSnapshot> {
    return {
      totalMembers: 127,
      activeMembers: 98,
      frozenMembers: 12,
      overdueMembers: 17,
      todayCheckIns: 34,
      weekCheckIns: 189,
      monthlyRevenue: 18500000,
      pendingFreezeRequests: 3,
    };
  }

  async fetchManagerMembers(_branchId: number, query?: string): Promise<ManagerMemberRecord[]> {
    let members = MEMBERS;
    if (query) {
      const q = query.toLowerCase();
      members = members.filter((m) => m.name.toLowerCase().includes(q) || m.phone.includes(q));
    }
    return members.map((m) => ({
      memberId: m.id,
      name: m.name,
      phone: m.phone,
      status: m.status,
      planName: m.membershipPlanName,
      membershipEndDate: m.membershipEndDate,
      lastCheckIn: m.lastCheckIn,
      totalCheckIns: Math.floor(Math.random() * 30) + 5,
    }));
  }

  async fetchAuditLog(_branchId: number, _limit?: number): Promise<AuditEvent[]> {
    return [
      { id: 1, actorId: 2, actorName: "Саруул", action: "check_in", targetType: "member", targetId: 1, details: "QR scan", branchId: 1, createdAt: "2026-07-07T08:30:00Z" },
      { id: 2, actorId: 3, actorName: "Оюун", action: "freeze_approved", targetType: "freeze_request", targetId: 1, details: "Approved 7-day freeze for Анхцэцэг", branchId: 1, createdAt: "2026-07-06T14:20:00Z" },
      { id: 3, actorId: 2, actorName: "Саруул", action: "check_in", targetType: "member", targetId: 5, details: "Phone search", branchId: 1, createdAt: "2026-07-07T09:15:00Z" },
    ];
  }

  async fetchFreezeRequests(_branchId: number): Promise<FreezeRequest[]> {
    return [
      { id: 1, memberId: 6, memberName: "Анхцэцэг", branchId: 1, requestedAt: "2026-07-05", startDate: "2026-07-10", endDate: "2026-07-17", reason: "Амралт", status: "approved", reviewedBy: 3, reviewedAt: "2026-07-06" },
    ];
  }

  async approveFreezeRequest(_requestId: number, _approved: boolean): Promise<void> {}

  async fetchInvoiceHistory(_memberId: number): Promise<InvoiceHistoryEntry[]> {
    return [
      { id: 1, memberId: 1, membershipId: 1, amount: 150000, status: "paid", issuedAt: "2026-06-15", paidAt: "2026-06-15", planName: "Сарын гишүүнчлэл" },
      { id: 2, memberId: 1, membershipId: 1, amount: 150000, status: "paid", issuedAt: "2026-05-15", paidAt: "2026-05-15", planName: "Сарын гишүүнчлэл" },
    ];
  }
}
