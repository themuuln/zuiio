import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ── Types ────────────────────────────────────────────────────────────────

/** Subscription tier — matches DB CHECK constraint. */
export type SubscriptionTier = "free" | "pro" | "breeder" | "stable";

/** Limits and feature flags for a single subscription tier. */
export interface TierLimits {
  /** Max horses allowed. null = unlimited. */
  maxHorses: number | null;
  /** Storage in bytes. null = unlimited. */
  storageBytes: number | null;
  /** Max pedigree generations. null = unlimited. */
  maxPedigreeGenerations: number | null;
  /** Inbreeding calculator access. */
  hasInbreedingCalc: boolean;
  /** Breeding tools access. */
  hasBreedingTools: boolean;
  /** Max multi-user collaborators. null = unlimited. */
  maxMultiUsers: number | null;
  /** Client portal access. */
  hasClientPortal: boolean;
  /** Listing boost access. */
  hasBoost: boolean;
  /** Seller badge access. */
  hasSellerBadge: boolean;
  /** AI breeding advisor access. */
  hasAiBreeding: boolean;
  /** Analytics dashboard access. */
  hasAnalytics: boolean;
}

/** Computed subscription state for the current user. */
export interface SubscriptionState {
  currentTier: SubscriptionTier;
  expiresAt: string | null;
  isActive: boolean;
  isExpired: boolean;
  isGracePeriod: boolean;
  daysRemaining: number;
  showsExpiryWarning: boolean;
}

/** Gate check result — allowed or denied with explanation. */
export interface GateCheck {
  allowed: boolean;
  reason: string;
  requiredTier: SubscriptionTier;
}

// ── Tier Limits ──────────────────────────────────────────────────────────

/** Feature limits per tier — mirrors Flutter kTierLimits. */
export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxHorses: 1,
    storageBytes: 50 * 1024 * 1024, // 50 MB
    maxPedigreeGenerations: 3,
    hasInbreedingCalc: false,
    hasBreedingTools: false,
    maxMultiUsers: 1,
    hasClientPortal: false,
    hasBoost: false,
    hasSellerBadge: false,
    hasAiBreeding: false,
    hasAnalytics: false,
  },
  pro: {
    maxHorses: null, // unlimited
    storageBytes: 5 * 1024 * 1024 * 1024, // 5 GB
    maxPedigreeGenerations: 5,
    hasInbreedingCalc: true,
    hasBreedingTools: false,
    maxMultiUsers: 1,
    hasClientPortal: false,
    hasBoost: true,
    hasSellerBadge: true,
    hasAiBreeding: true,
    hasAnalytics: true,
  },
  breeder: {
    maxHorses: null,
    storageBytes: 20 * 1024 * 1024 * 1024, // 20 GB
    maxPedigreeGenerations: null, // unlimited
    hasInbreedingCalc: true,
    hasBreedingTools: true,
    maxMultiUsers: 1,
    hasClientPortal: false,
    hasBoost: true,
    hasSellerBadge: true,
    hasAiBreeding: true,
    hasAnalytics: true,
  },
  stable: {
    maxHorses: null,
    storageBytes: 50 * 1024 * 1024 * 1024, // 50 GB
    maxPedigreeGenerations: null,
    hasInbreedingCalc: true,
    hasBreedingTools: true,
    maxMultiUsers: 10,
    hasClientPortal: true,
    hasBoost: true,
    hasSellerBadge: true,
    hasAiBreeding: true,
    hasAnalytics: true,
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────

const GRACE_PERIOD_DAYS = 7;
const WARNING_THRESHOLD_DAYS = 7;

/** Grace period end = expiresAt + GRACE_PERIOD_DAYS. */
function gracePeriodEnd(expiresAt: Date): Date {
  const end = new Date(expiresAt);
  end.setDate(end.getDate() + GRACE_PERIOD_DAYS);
  return end;
}

/** Compute SubscriptionState from tier + expiry date. */
function computeSubscriptionState(
  tier: SubscriptionTier,
  expiresAt: string | null,
): SubscriptionState {
  if (tier === "free") {
    return {
      currentTier: tier,
      expiresAt: null,
      isActive: true,
      isExpired: false,
      isGracePeriod: false,
      daysRemaining: -1,
      showsExpiryWarning: false,
    };
  }

  if (!expiresAt) {
    return {
      currentTier: tier,
      expiresAt: null,
      isActive: true,
      isExpired: false,
      isGracePeriod: false,
      daysRemaining: -1,
      showsExpiryWarning: false,
    };
  }

  const expiryDate = new Date(expiresAt);
  const now = new Date();

  const isExpired = now > expiryDate;
  const isGracePeriod =
    isExpired && now < gracePeriodEnd(expiryDate);
  const isActive = !isExpired || isGracePeriod;

  let daysRemaining: number;
  if (isExpired) {
    if (!isGracePeriod) {
      daysRemaining = 0;
    } else {
      const graceEnd = gracePeriodEnd(expiryDate);
      daysRemaining = Math.max(
        0,
        Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      );
    }
  } else {
    daysRemaining = Math.max(
      0,
      Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );
  }

  const daysUntilExpiry = Math.max(
    0,
    Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const showsExpiryWarning = isExpired || daysUntilExpiry <= WARNING_THRESHOLD_DAYS;

  return {
    currentTier: tier,
    expiresAt,
    isActive,
    isExpired,
    isGracePeriod,
    daysRemaining,
    showsExpiryWarning,
  };
}
// ── Raw data interfaces (Supabase row shapes) ────────────────────────────

interface ProfileRow {
  id: string;
  subscription_tier: string;
  subscription_expires_at: string | null;
}

interface PaymentRequestRow {
  id: string;
  user_id: string;
  tier: string;
  status: string;
  expires_at: string;
  created_at: string;
}

// ── useSubscription ──────────────────────────────────────────────────────

/**
 * Core hook: fetches subscription tier + latest verified payment,
 * computes the full SubscriptionState.
 */
export function useSubscription(userId: string | undefined) {
  return useQuery({
    queryKey: ["subscription", userId],
    queryFn: async (): Promise<SubscriptionState> => {
      if (!userId) return computeSubscriptionState("free", null);

      // 1. Fetch profile for current tier + expiry
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, subscription_tier, subscription_expires_at")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching subscription profile:", profileError);
        return computeSubscriptionState("free", null);
      }

      const row = profile as ProfileRow;
      const dbTier = row.subscription_tier;

      // Validate tier (fallback to free if somehow invalid)
      const validTiers: SubscriptionTier[] = ["free", "pro", "breeder", "stable"];
      const tier: SubscriptionTier =
        validTiers.includes(dbTier as SubscriptionTier) ? (dbTier as SubscriptionTier) : "free";

      // 2. If tier is free, no need to check payments
      if (tier === "free") {
        return computeSubscriptionState("free", null);
      }

      // 3. Fetch latest verified payment for expiry source of truth
      const { data: payment } = await supabase
        .from("payment_requests")
        .select("id, tier, status, expires_at, created_at")
        .eq("user_id", userId)
        .eq("tier", tier)
        .eq("status", "verified")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const paymentRow = payment as PaymentRequestRow | null;

      // 4. Determine expiry: prefer profile.subscription_expires_at,
      //    fall back to latest verified payment.expires_at
      const expiresAt =
        row.subscription_expires_at ?? paymentRow?.expires_at ?? null;

      return computeSubscriptionState(tier, expiresAt);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ── useSubscriptionTier ──────────────────────────────────────────────────

/** Convenience: just the current tier as a SubscriptionTier. */
export function useSubscriptionTier(userId: string | undefined) {
  const sub = useSubscription(userId);
  return {
    ...sub,
    tier: sub.data?.currentTier ?? "free" as SubscriptionTier,
  };
}

// ── useTierLimits ────────────────────────────────────────────────────────

/** Convenience: TierLimits for the user's current tier. */
export function useTierLimits(userId: string | undefined) {
  const sub = useSubscription(userId);
  const tier = sub.data?.currentTier ?? "free";
  return {
    ...sub,
    limits: TIER_LIMITS[tier],
  };
}

// ── Gate Check Hooks ─────────────────────────────────────────────────────

/**
 * Horse creation gate: checks subscription active + horse count vs limit.
 * @param currentHorseCount — how many horses the user currently owns
 */
export function useHorseCreationGate(
  userId: string | undefined,
  currentHorseCount: number,
): GateCheck {
  const sub = useSubscription(userId);
  const state = sub.data;

  // Loading or error → deny by default
  if (!state) {
    return {
      allowed: false,
      reason: "Түвшин мэдээлэл ачаалж байна…",
      requiredTier: "pro",
    };
  }

  // Subscription not active
  if (!state.isActive) {
    return {
      allowed: false,
      reason: state.isGracePeriod
        ? "Захиалгын хугацаа дууссан. Grace period-д байна."
        : "Идэвхтэй захиалга шаардлагатай.",
      requiredTier: "pro",
    };
  }

  const limits = TIER_LIMITS[state.currentTier];
  if (limits.maxHorses === null) {
    return { allowed: true, reason: "", requiredTier: state.currentTier };
  }

  if (currentHorseCount < limits.maxHorses) {
    return { allowed: true, reason: "", requiredTier: state.currentTier };
  }

  return {
    allowed: false,
    reason: `Үнэгүй түвшинд ${limits.maxHorses} морь нэмэх боломжтой. Pro захиалгаар хязгааргүй морь нэмэх боломжтой.`,
    requiredTier: "pro",
  };
}

/**
 * Storage gate: checks subscription active + used bytes vs limit.
 * @param usedBytes — total storage used in bytes
 */
export function useStorageGate(
  userId: string | undefined,
  usedBytes: number,
): GateCheck {
  const sub = useSubscription(userId);
  const state = sub.data;

  if (!state) {
    return {
      allowed: false,
      reason: "Түвшин мэдээлэл ачаалж байна…",
      requiredTier: "pro",
    };
  }

  if (!state.isActive) {
    return {
      allowed: false,
      reason: state.isGracePeriod
        ? "Захиалгын хугацаа дууссан. Grace period-д байна."
        : "Идэвхтэй захиалга шаардлагатай.",
      requiredTier: "pro",
    };
  }

  const limits = TIER_LIMITS[state.currentTier];
  if (limits.storageBytes === null) {
    return { allowed: true, reason: "", requiredTier: state.currentTier };
  }

  if (usedBytes < limits.storageBytes) {
    return { allowed: true, reason: "", requiredTier: state.currentTier };
  }

  const nextTier: SubscriptionTier = "pro";
  const nextLimits = TIER_LIMITS[nextTier];
  const formatBytes = (b: number) =>
    b >= 1024 * 1024 * 1024
      ? `${(b / (1024 * 1024 * 1024)).toFixed(0)} GB`
      : `${(b / (1024 * 1024)).toFixed(0)} MB`;

  return {
    allowed: false,
    reason: `Хадгалах зай дүүрсэн (${formatBytes(limits.storageBytes)}). Pro захиалгаар ${formatBytes(nextLimits.storageBytes!)} хүртэл ашиглах боломжтой.`,
    requiredTier: nextTier,
  };
}

/**
 * Pedigree depth gate: checks requested generations vs tier limit.
 * @param requestedGenerations — how deep the pedigree tree should go
 */
export function usePedigreeGate(
  userId: string | undefined,
  requestedGenerations: number,
): GateCheck {
  const sub = useSubscription(userId);
  const state = sub.data;

  if (!state) {
    return {
      allowed: false,
      reason: "Түвшин мэдээлэл ачаалж байна…",
      requiredTier: "pro",
    };
  }

  if (!state.isActive) {
    return {
      allowed: false,
      reason: state.isGracePeriod
        ? "Захиалгын хугацаа дууссан. Grace period-д байна."
        : "Идэвхтэй захиалга шаардлагатай.",
      requiredTier: "pro",
    };
  }

  const limits = TIER_LIMITS[state.currentTier];
  if (limits.maxPedigreeGenerations === null) {
    return { allowed: true, reason: "", requiredTier: state.currentTier };
  }

  if (requestedGenerations <= limits.maxPedigreeGenerations) {
    return { allowed: true, reason: "", requiredTier: state.currentTier };
  }

  return {
    allowed: false,
    reason: `Үнэгүй түвшинд ${limits.maxPedigreeGenerations} үеийн удам харах боломжтой. Pro захиалгаар 5 үе хүртэл.`,
    requiredTier: "pro",
  };
}

/**
 * Inbreeding calculator gate: requires Pro+ for the feature.
 */
export function useInbreedingCalcGate(userId: string | undefined): GateCheck {
  const sub = useSubscription(userId);
  const state = sub.data;

  if (!state) {
    return {
      allowed: false,
      reason: "Түвшин мэдээлэл ачаалж байна…",
      requiredTier: "pro",
    };
  }

  if (!state.isActive) {
    return {
      allowed: false,
      reason: state.isGracePeriod
        ? "Захиалгын хугацаа дууссан. Grace period-д байна."
        : "Идэвхтэй захиалга шаардлагатай.",
      requiredTier: "pro",
    };
  }

  const limits = TIER_LIMITS[state.currentTier];
  if (limits.hasInbreedingCalc) {
    return { allowed: true, reason: "", requiredTier: state.currentTier };
  }

  return {
    allowed: false,
    reason: "Цус ойртолтын тооцоолуур нь Pro захиалгын боломж юм.",
    requiredTier: "pro",
  };
}

/**
 * Boost gate: requires Pro+ for listing boosts.
 */
export function useBoostGate(userId: string | undefined): GateCheck {
  const sub = useSubscription(userId);
  const state = sub.data;

  if (!state) {
    return {
      allowed: false,
      reason: "Түвшин мэдээлэл ачаалж байна…",
      requiredTier: "pro",
    };
  }

  if (!state.isActive) {
    return {
      allowed: false,
      reason: state.isGracePeriod
        ? "Захиалгын хугацаа дууссан. Grace period-д байна."
        : "Идэвхтэй захиалга шаардлагатай.",
      requiredTier: "pro",
    };
  }

  const limits = TIER_LIMITS[state.currentTier];
  if (limits.hasBoost) {
    return { allowed: true, reason: "", requiredTier: state.currentTier };
  }

  return {
    allowed: false,
    reason: "Зар сурталчилгаа нь Pro захиалгын боломж юм.",
    requiredTier: "pro",
  };
}

/**
 * Seller badge gate: requires Pro+ for verified seller badge.
 */
export function useSellerBadgeGate(userId: string | undefined): GateCheck {
  const sub = useSubscription(userId);
  const state = sub.data;

  if (!state) {
    return {
      allowed: false,
      reason: "Түвшин мэдээлэл ачаалж байна…",
      requiredTier: "pro",
    };
  }

  if (!state.isActive) {
    return {
      allowed: false,
      reason: state.isGracePeriod
        ? "Захиалгын хугацаа дууссан. Grace period-д байна."
        : "Идэвхтэй захиалга шаардлагатай.",
      requiredTier: "pro",
    };
  }

  const limits = TIER_LIMITS[state.currentTier];
  if (limits.hasSellerBadge) {
    return { allowed: true, reason: "", requiredTier: state.currentTier };
  }

  return {
    allowed: false,
    reason: "Дэлгүүрийн тэмдэг нь Pro захиалгын боломж юм.",
    requiredTier: "pro",
  };
}

/**
 * Multi-users gate: requires Stable for team/multi-user access.
 */
export function useMultiUsersGate(userId: string | undefined): GateCheck {
  const sub = useSubscription(userId);
  const state = sub.data;

  if (!state) {
    return {
      allowed: false,
      reason: "Түвшин мэдээлэл ачаалж байна…",
      requiredTier: "stable",
    };
  }

  if (!state.isActive) {
    return {
      allowed: false,
      reason: state.isGracePeriod
        ? "Захиалгын хугацаа дууссан. Grace period-д байна."
        : "Идэвхтэй захиалга шаардлагатай.",
      requiredTier: "stable",
    };
  }

  const limits = TIER_LIMITS[state.currentTier];
  if (limits.maxMultiUsers !== null && limits.maxMultiUsers > 1) {
    return { allowed: true, reason: "", requiredTier: state.currentTier };
  }

  return {
    allowed: false,
    reason:
      "Олон хэрэглэгчийн удирдлага нь Stable захиалгын боломж юм. " +
      "Stable захиалгаар 10 хүртэл хамтын хэрэглэгчтэй ажиллах боломжтой.",
    requiredTier: "stable",
  };
}
