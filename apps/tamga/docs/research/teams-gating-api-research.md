---
title: Multi-user Teams, Premium Tier Gating & Organizer API — Technical Research
description: Research findings and implementation plans for three features: completing the teams system, subscription feature gating, and a public organizer API.
---

# Teams, Gating & Organizer API — Technical Research

> Research for Tamga horse management app. Covers three features that collectively unlock the **Stable tier** (₮49,900/mo) value proposition: multi-user teams, premium tier enforcement, and a public API for event organizers.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Feature 1: Multi-user Teams](#feature-1-multi-user-teams)
3. [Feature 2: Premium Tier Gating](#feature-2-premium-tier-gating)
4. [Feature 3: Organizer API](#feature-3-organizer-api)
5. [Cross-cutting Concerns](#cross-cutting-concerns)
6. [Implementation Timeline](#implementation-timeline)

---

## Executive Summary

| Feature | Effort | Business Value | Risk Level |
|---|---|---|---|
| **Multi-user Teams** | 3 days | Unlocks Stable tier's core differentiator (10 users) | Medium — RLS complexity |
| **Premium Tier Gating** | 2 days | Enables revenue from all paid tiers | Low — architecture exists |
| **Organizer API** | 3 days | New B2B revenue stream, ecosystem expansion | Medium — auth + rate limiting |

**Key insight:** These three features are independent and can be parallelized. Teams and Gating share a prerequisite (Stable tier subscription enforcement), but their implementations don't overlap. The Organizer API depends on Gating being in place to gate API access by tier.

---

## Feature 1: Multi-user Teams

### 1.1 Current State Assessment

The teams feature has **substantial existing code** but several gaps:

| Layer | Exists | Status | Gap |
|---|---|---|---|
| **Domain models** | `Team`, `TeamMember`, `TeamInvitation` | ✅ Complete | Roles defined: `owner`, `manager`, `vet`, `groom`, `viewer` |
| **Permissions enum** | `TeamPermission` (12 values) | ✅ Complete | Granular permissions per role |
| **Repository interface** | `TeamRepository` | ✅ Complete | CRUD + invitation flow |
| **Supabase repo** | `SupabaseTeamRepository` | ✅ Complete | Full implementation |
| **Local repo** | `LocalTeamRepository` (Isar + SyncQueue) | ✅ Complete | Offline-first with sync queue |
| **Providers** | `team_providers.dart` | ✅ Complete | Includes `hasMultiUsersGateProvider` |
| **UI screens** | Management, Invite, Pending Invitations, Stable Profile | ✅ Complete | 55KB+ of presentation code |
| **Database tables** | `teams`, `team_members`, `team_invitations` | ⚠️ **Missing** | Tables exist in code but **not in `database.md`** |
| **RLS policies** | Team-scoped RLS | ⚠️ **Missing** | No team RLS policies defined |
| **Real-time subscriptions** | None | ❌ **Missing** | No live team updates |
| **Team-horse association** | None | ❌ **Missing** | No way to scope horses to teams |
| **Activity/audit log** | None | ❌ **Missing** | No team action history |

**Critical gap:** The `database.md` schema reference documents `profiles`, `horses`, `events`, `market_listings`, `co_ownerships`, etc. — but **never mentions teams**. The team tables, their RLS policies, and the relationship between teams and horses are undefined in the schema.

### 1.2 Role System

The existing `TeamRole` enum is well-designed:

```
owner  → All permissions (full control)
manager → Most permissions (add horses, edit health, create listings, manage team)
vet    → Health permissions only (view/add health logs, view training)
groom  → Care permissions (view/add training, view health)
viewer → Read-only (view health, view training)
```

**Recommendation:** Keep the existing 5 roles. They map well to real Mongolian stable operations:

| Real Role | Tamga Role | Typical Person |
|---|---|---|
| Жүчээний эзэн (Stable owner) | `owner` | The subscriber paying for Stable tier |
| Менежер (Manager) | `manager` | Day-to-day operations lead |
| Малын эмч (Veterinarian) | `vet` | Visiting or in-house vet |
| Тэжээвэрч (Groom) | `groom` | Horse caretaker |
| Үзэгч (Observer) | `viewer` | Hired hand, family member, investor |

### 1.3 Permission Model

The existing `TeamPermission` enum provides 12 granular permissions. Recommended mapping:

| Permission | owner | manager | vet | groom | viewer |
|---|:---:|:---:|:---:|:---:|:---:|
| `manageTeam` | ✅ | ✅ | | | |
| `addHorses` | ✅ | ✅ | | | |
| `editHorses` | ✅ | ✅ | | | |
| `deleteHorses` | ✅ | ✅ | | | |
| `addHealthLogs` | ✅ | ✅ | ✅ | | |
| `viewHealth` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `addTraining` | ✅ | ✅ | | ✅ | |
| `viewTraining` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `createListings` | ✅ | ✅ | | | |
| `viewAnalytics` | ✅ | ✅ | ✅ | | |
| `manageMembers` | ✅ | | | | |
| `viewTeam` | ✅ | ✅ | ✅ | ✅ | ✅ |

**Key decision:** `manageMembers` is restricted to `owner` only. Managers can add horses and edit data but cannot invite/remove other members. This prevents privilege escalation.

### 1.4 Database Schema — New Tables

The following tables need to be created and added to `database.md`:

```sql
-- ============================================================
-- TEAMS
-- ============================================================

CREATE TABLE teams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT DEFAULT '',
  horse_count     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_teams_owner ON teams(owner_user_id);

-- ============================================================
-- TEAM MEMBERS
-- ============================================================

CREATE TABLE team_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'viewer'
                  CHECK (role IN ('owner', 'manager', 'vet', 'groom', 'viewer')),
  permissions     TEXT[] DEFAULT '{}',
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- ============================================================
-- TEAM INVITATIONS
-- ============================================================

CREATE TABLE team_invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  team_name       TEXT NOT NULL DEFAULT '',
  invited_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'viewer'
                  CHECK (role IN ('owner', 'manager', 'vet', 'groom', 'viewer')),
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_invitations_user ON team_invitations(invited_user_id)
  WHERE status = 'pending';

-- ============================================================
-- TEAM HORSES (association table)
-- ============================================================

CREATE TABLE team_horses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  horse_id        UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  added_by        UUID REFERENCES profiles(id),
  added_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, horse_id)
);

CREATE INDEX idx_team_horses_team ON team_horses(team_id);
CREATE INDEX idx_team_horses_horse ON team_horses(horse_id);
```

**Why `team_horses` instead of modifying `horses.owner_id`?**

The existing `horses.owner_id` is the single owner (the person who created the horse record). Teams need a many-to-many relationship: the same horse can appear in a team's context without changing its ownership. This also preserves backward compatibility — all existing RLS policies on `horses` remain unchanged.

### 1.5 Invitation Flow

The existing invitation model supports user-ID-based invitations. For Mongolia, the primary flow should be **phone-number-based**:

```
1. Owner opens Team → Invite → enters phone number
2. System looks up profiles.phone for that number
   → If found: create invitation linking to their user_id
   → If not found: create invitation with phone only (pending until they register)
3. Invited user sees invitation in "Pending Invitations" screen
4. On accept: team_members row created, status → 'accepted'
```

**Phone format:** Mongolia uses +976 XXXX XXXX. The existing `profiles.phone` field stores this.

**SMS vs In-app:** For v1, in-app only (invitation appears in the "Pending Invitations" tab). SMS notifications are a Phase 2 enhancement requiring FCM push integration (already planned in `tech-stack.md` under "Push Notifications (Phase 2)").

### 1.6 Team-Horse Association

This is the **biggest gap** in the current implementation. Teams exist, but there's no way to associate horses with teams.

**Design:**

- `team_horses` table links `teams` ↔ `horses`
- An owner adds horses to the team via a "Manage Horses" screen
- Team members with `addHorses` permission can also add horses (from the team context)
- A horse can belong to multiple teams (a vet might work with multiple stables)

**UI changes needed:**
- `TeamManagementScreen` — add "Horses" tab alongside "Members"
- Horse selection widget for adding horses to team
- Horse list in team context showing team-scoped horses

### 1.7 RLS Policies for Teams

```sql
-- ============================================================
-- TEAM RLS POLICIES
-- ============================================================

-- Teams: members can read, owner can modify
CREATE POLICY "Team members can read team"
  ON teams FOR SELECT
  USING (
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Team owner can update team"
  ON teams FOR UPDATE
  USING (owner_user_id = auth.uid());

CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Team owner can delete team"
  ON teams FOR DELETE
  USING (owner_user_id = auth.uid());

-- Team Members: members can read, owner/manager can modify
CREATE POLICY "Team members can read members"
  ON team_members FOR SELECT
  USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Team owner can insert members"
  ON team_members FOR INSERT
  WITH CHECK (
    team_id IN (SELECT team_id FROM teams WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Team owner can update members"
  ON team_members FOR UPDATE
  USING (
    team_id IN (SELECT team_id FROM teams WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Team owner can delete members"
  ON team_members FOR DELETE
  USING (
    team_id IN (SELECT team_id FROM teams WHERE owner_user_id = auth.uid())
  );

-- Team Invitations: sender and recipient can read
CREATE POLICY "Invitation participants can read"
  ON team_invitations FOR SELECT
  USING (
    invited_user_id = auth.uid()
    OR invited_by = auth.uid()
    OR team_id IN (SELECT team_id FROM teams WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Team owner can create invitations"
  ON team_invitations FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND team_id IN (SELECT team_id FROM teams WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Invitee can update invitation status"
  ON team_invitations FOR UPDATE
  USING (invited_user_id = auth.uid());

-- Team Horses: team members can read, owner/manager can modify
CREATE POLICY "Team members can read team horses"
  ON team_horses FOR SELECT
  USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Team owner/manager can add horses"
  ON team_horses FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Team owner/manager can remove horses"
  ON team_horses FOR DELETE
  USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'manager')
    )
  );
```

**Performance note:** These policies use `IN (SELECT ...)` subqueries. For small teams (<10 members), this is fine. If teams grow large, materialize membership via a `team_memberships` view or a `has_team_role(user_id, team_id, min_role)` helper function.

### 1.8 Offline Sync for Teams

The existing `LocalTeamRepository` already queues operations via `SyncQueue`. The sync flow is:

```
WRITE:  UI → LocalTeamRepository → Isar (local) → SyncQueue → Background sync → Supabase
READ:   Repository → Isar (instant) → Supabase refresh if stale
```

**Conflict resolution for concurrent team edits:**

| Scenario | Resolution | Rationale |
|---|---|---|
| Two members edit same horse health log | Last-write-wins (timestamp) | Same as existing horse conflict resolution |
| Owner removes member while member edits horse | RLS denies member's write after removal | Server-side enforcement |
| Two managers add different horses to team | Union (both succeed) | Additive operations don't conflict |
| Role change + member edit concurrent | Role change wins | Role is authoritative; member edits re-validated against new role |

### 1.9 Real-time Updates

Supabase Realtime for team events:

```dart
// Subscribe to team_members changes
supabase
  .from('team_members')
  .stream(primaryKey: ['id'])
  .eq('team_id', teamId)
  .listen((data) {
    // Refresh team members list
    ref.invalidate(teamMembersProvider(teamId));
  });

// Subscribe to team_invitations for current user
supabase
  .from('team_invitations')
  .stream(primaryKey: ['id'])
  .eq('invited_user_id', currentUserId)
  .eq('status', 'pending')
  .listen((data) {
    // Show notification badge
    ref.invalidate(pendingInvitationsProvider);
  });
```

**Implementation:** Add to `team_providers.dart` as a new `teamRealtimeProvider` that manages subscriptions per active team.

### 1.10 Day-by-day Breakdown

| Day | Task | Files |
|---|---|---|
| **Day 1** | Database migration (tables + RLS), team-horse association domain model, update `TeamRepository` interface | `supabase/migrations/`, `domain/team_horse.dart`, `data/team_repository.dart` |
| **Day 1** | Implement `team_horses` in local + Supabase repos, wire providers | `data/local_team_repository.dart`, `data/supabase_team_repository.dart`, `application/team_providers.dart` |
| **Day 2** | Team horses management UI (add/remove horses in team), Real-time subscriptions | `presentation/team_management_screen.dart` (add horses tab), `team_providers.dart` |
| **Day 2** | Invitation flow polish: phone lookup, pending invitation notifications badge | `presentation/team_invite_screen.dart`, `presentation/pending_invitations_screen.dart` |
| **Day 3** | Audit log (team_actions table), team-scoped horse queries, integration testing | `domain/team_action.dart`, `data/team_action_repository.dart`, test files |
| **Day 3** | Edge cases: owner transfer, team deletion cascades, member limit enforcement (10 for Stable) | Various |

---

## Feature 2: Premium Tier Gating

### 2.1 Current State Assessment

The gating infrastructure is **mostly built**:

| Component | Status | Location |
|---|---|---|
| `SubscriptionTier` enum | ✅ Complete | `payments/domain/payment_request.dart` |
| `TierLimits` class | ✅ Complete | `core/features/feature_gate.dart` |
| `kTierLimits` map | ✅ Complete | `core/features/feature_gate.dart` — all 4 tiers |
| `GateCheck` sealed class | ✅ Complete | `feature_gate.dart` — `GateAllowed` / `GateDenied` |
| Gate providers | ✅ Complete | `horseCreationGateProvider`, `storageGateProvider`, `pedigreeDepthGateProvider`, `inbreedingCalcGateProvider`, `boostGateProvider`, `sellerBadgeGateProvider` |
| `FeatureFlagService` | ✅ Complete | `feature_flags.dart` — SharedPreferences-based toggles |
| `hasMultiUsersGateProvider` | ✅ Complete | `team_providers.dart` — gates at Stable tier |
| `profiles.subscription_tier` | ✅ Complete | DB column, defaults to `'free'` |
| `payment_requests` table | ✅ Complete | Manual bank transfer verification |
| `subscriptions` table | ✅ Complete | RevenueCat/App Store sync |
| **Server-side tier enforcement** | ❌ **Missing** | No RLS policies checking `subscription_tier` |
| **Subscription expiry handling** | ❌ **Missing** | No logic to downgrade when subscription expires |
| **Payment flow UI** | ⚠️ Partial | Payment request creation exists, but no upgrade screen |
| **RevenueCat integration** | ❌ **Missing** | Planned Phase 3 per `tech-stack.md` |

### 2.2 Architecture Decision: Hybrid Enforcement

**Decision:** Client-side gating for UX (hide/disable features) + Server-side gating for security (RLS + Edge Function validation).

| Layer | Enforcement | Purpose | Essential? |
|---|---|---|---|
| **UI** | `GateCheck` providers → hide/disable premium buttons | Prevent accidental attempts, guide upgrade | ✅ Essential |
| **Data** | RLS policies checking `profiles.subscription_tier` | Prevent data access from unauthorized tiers | ✅ Essential |
| **API** | Edge Function middleware validating tier before mutations | Prevent direct API bypass of client checks | ⚠️ Nice-to-have for v1 |
| **Background** | Cron job to expire subscriptions | Downgrade users when billing period ends | ✅ Essential |

**Why not server-only?** Mongolian users have intermittent connectivity. The offline-first architecture means users interact with local Isar data. Client-side gates ensure the UI correctly reflects tier limits even when offline. Server-side RLS is the security backstop.

### 2.3 RLS Policies for Tier Enforcement

```sql
-- ============================================================
-- TIER-GATED RLS (additive to existing policies)
-- ============================================================

-- Helper function: check if user's subscription is active
CREATE OR REPLACE FUNCTION user_active_tier()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT tier FROM subscriptions
     WHERE profile_id = auth.uid()
     AND is_active = true
     AND expires_at > now()
     LIMIT 1),
    'free'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if user meets minimum tier
CREATE OR REPLACE FUNCTION user_meets_tier(min_tier TEXT)
RETURNS BOOLEAN AS $$
  SELECT CASE user_active_tier()
    WHEN 'stable' THEN true
    WHEN 'breeder' THEN min_tier IN ('free', 'pro', 'breeder')
    WHEN 'pro' THEN min_tier IN ('free', 'pro')
    WHEN 'free' THEN min_tier = 'free'
    ELSE false
  END;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Horses: Free tier limited to 1 horse
CREATE POLICY "Free tier: max 1 horse"
  ON horses FOR INSERT
  WITH CHECK (
    user_meets_tier('pro')
    OR (
      SELECT COUNT(*) FROM horses
      WHERE owner_id = auth.uid()
    ) < 1
  );

-- Breeding records: Breeder tier or above
CREATE POLICY "Breeding: Breeder tier required"
  ON breeding_records FOR INSERT
  WITH CHECK (user_meets_tier('breeder'));

CREATE POLICY "Breeding: Breeder tier required (select)"
  ON breeding_records FOR SELECT
  USING (
    user_meets_tier('breeder')
    OR owner_id = auth.uid()  -- still allow owner to read their own
  );
```

**Important:** These policies are *additive* to existing owner-based policies. A user must satisfy BOTH the ownership check AND the tier check.

### 2.4 Subscription Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                    SUBSCRIPTION LIFECYCLE                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Free ──upgrade──> Pro ──upgrade──> Breeder ──> Stable   │
│   ↑                  ↑                  ↑                │
│   │ expiry           │ downgrade        │ downgrade      │
│   │ (7-day grace)    │ (7-day grace)    │ (7-day grace)  │
│   ←──────────────────←──────────────────←─────────────── │
│                                                          │
│  Trial: 14 days free Pro (optional, configurable)        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Key lifecycle rules:**

| Event | Behavior |
|---|---|
| **Upgrade** | Immediate access to new tier. Prorated billing handled by RevenueCat/Apple/Google. |
| **Downgrade** | Access continues until end of current billing period, then drops to lower tier. |
| **Expiration** | 7-day grace period. After grace: downgrade to `free`. Local data preserved. |
| **Cancellation** | Same as expiration — continues until period end. |
| **Trial start** | `subscription_tier` → `pro` for 14 days. No payment required. |
| **Trial expiry** | Back to `free` with upgrade prompt. |

**Database additions:**

```sql
-- Add subscription tracking columns to profiles
ALTER TABLE profiles ADD COLUMN subscription_started_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN subscription_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN trial_ends_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN grace_period_ends_at TIMESTAMPTZ;

-- Subscription history (audit trail)
CREATE TABLE subscription_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier            TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'breeder', 'stable')),
  action          TEXT NOT NULL CHECK (action IN (
                    'upgrade', 'downgrade', 'expire', 'trial_start', 'trial_end',
                    'renewal', 'grace_start', 'grace_end'
                  )),
  previous_tier   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sub_history_profile ON subscription_history(profile_id);
```

### 2.5 Feature Matrix Implementation

The existing `kTierLimits` and `TierLimits` class already define limits for:
- `maxHorses`, `storageBytes`, `maxPedigreeGenerations`
- `hasInbreedingCalc`, `hasPedigreeTools`, `hasBreedingTracker`
- `hasMultiUsers`, `maxMultiUsers`
- `hasClientPortal`, `hasBusinessTools`, `hasApiAccess`

**What's missing from `TierLimits` (per pricing.md):**

| Feature | Free | Pro | Breeder | Stable | In TierLimits? |
|---|---|---|---|---|---|
| Max horses | 1 | ∞ | ∞ | ∞ | ✅ `maxHorses` |
| Health logs | Basic | Full + graph | Advanced analytics | Full | ❌ Add `healthLogLevel` |
| Document vault | 50 MB | 5 GB | 20 GB | 50 GB | ✅ `storageBytes` |
| Smart reminders | — | ✅ | ✅ | ✅ | ❌ Add `hasSmartReminders` |
| Competition records | View | Register + stats | Advanced analysis | Multi-horse | ❌ Add `competitionAccess` |
| Marketplace posting | View only | ✅ Featured | ✅ Verified | ✅ Full | ❌ Add `canPostListings` |
| Ownership transfer | Receive only | Send + receive | Digital certificate | Full | ❌ Add `transferLevel` |
| Inbreeding calc | — | ✅ | ✅ + prediction | Full | ✅ `hasInbreedingCalc` |
| Pedigree depth | 3 gen | 5 gen | ∞ + tools | Full | ✅ `maxPedigreeGenerations` |
| Multi-user | — | — | — | 10 users | ✅ `hasMultiUsers` |

**Add to `TierLimits`:**

```dart
class TierLimits {
  // ... existing fields ...

  // New fields for complete feature coverage
  final HealthLogLevel healthLogLevel;  // basic, full, advanced
  final bool hasSmartReminders;
  final CompetitionAccessLevel competitionAccess;  // view, register, advanced
  final bool canPostListings;
  final TransferLevel transferLevel;  // receive, sendReceive, digital, full
  final String supportResponseTime;  // '72h', '24h', '12h', 'live'
}
```

### 2.6 Entitlement Checking Strategy

The existing pattern is already efficient — Riverpod providers memoize tier checks:

```dart
// Existing: provider-based, memoized per session
final tierLimitsProvider = Provider<TierLimits>((ref) {
  final tier = ref.watch(subscriptionTierProvider).valueOrNull ?? SubscriptionTier.free;
  return kTierLimits[tier]!;
});

// Usage in UI:
final gate = ref.watch(horseCreationGateProvider(horseCount));
switch (gate) {
  case GateAllowed(): // show button
  case GateDenied(:final message, :final requiredTier): // show upgrade prompt
}
```

**Performance:** Riverpod's dependency graph means tier checks are computed once and cached until `subscriptionTierProvider` changes. No performance concern.

**Offline consideration:** When offline, `subscriptionTierProvider` reads from the local `profiles` cache in Isar. The last-known tier is used. This is acceptable — a user who was `pro` yesterday is still `pro` today even if their subscription expired and they're offline.

### 2.7 Payment Integration for Mongolia

| Method | Feasibility | Notes |
|---|---|---|
| **Manual bank transfer** (current) | ✅ Implemented | `payment_requests` table, admin verification. Works but doesn't scale. |
| **SocialPay** | ⚠️ Research needed | Mongolia's dominant mobile payment (Khan Bank). REST API exists but requires merchant registration. |
| **In-app purchases** (Apple/Google) | ✅ Planned | RevenueCat integration in `tech-stack.md`. Handles subscription lifecycle automatically. |
| **Mongolian bank transfer** (automated) | ⚠️ Research needed | Some banks (TDB, XacBank) have merchant APIs. Need to evaluate each. |

**Recommendation for v1:** Keep manual bank transfer + add RevenueCat for app store purchases. This covers both power users (who pay via bank transfer to avoid app store commission) and casual users (who prefer app store simplicity).

**RevenueCat integration sketch:**

```dart
// After RevenueCat SDK init
final customerInfo = await Purchases.getCustomerInfo();
final entitlement = customerInfo.entitlements['tamga_pro'];
if (entitlement?.isActive == true) {
  // Sync to Supabase: update profiles.subscription_tier
  await supabase.from('profiles').update({
    'subscription_tier': entitlement!.identifier == 'tamga_pro' ? 'pro'
      : entitlement.identifier == 'tamga_breeder' ? 'breeder'
      : 'stable',
    'subscription_expires_at': entitlement.expirationDate?.toIso8601String(),
  }).eq('id', userId);
}
```

### 2.8 Day-by-day Breakdown

| Day | Task | Files |
|---|---|---|
| **Day 1** | Extend `TierLimits` with missing feature flags, add `subscription_history` table + migration, implement `user_meets_tier()` SQL function | `core/features/feature_gate.dart`, `supabase/migrations/` |
| **Day 1** | Subscription lifecycle Edge Function (expiry check cron, grace period logic), update `profiles` with subscription tracking columns | `supabase/functions/`, `supabase/migrations/` |
| **Day 2** | Upgrade/subscription management screen (shows current tier, billing, upgrade options), wire `payment_requests` to tier upgrade flow | `presentation/subscription_screen.dart`, `features/payments/` |
| **Day 2** | Add tier checks to remaining ungated features (health log levels, competition access, listing creation, transfer capabilities), audit all gate providers | `core/features/feature_gate.dart`, various presentation files |

---

## Feature 3: Organizer API

### 3.1 Use Cases

Based on the existing `partner_dashboard_screen.dart` (23.2KB) and `tournament_providers.dart`, the primary organizer workflows are:

| Use Case | Current State | API Needed |
|---|---|---|
| **Create event** | Partner dashboard UI only | `POST /v1/events` |
| **Register horses for event** | In-app registration | `POST /v1/events/{id}/registrations` |
| **Submit results** | Manual entry in event detail | `PATCH /v1/events/{id}/results` |
| **View registrations** | Partner dashboard | `GET /v1/events/{id}/registrations` |
| **Manage participants** | Event detail screen | `GET /v1/events/{id}/participants` |
| **Bulk register** | Not implemented | `POST /v1/events/{id}/registrations/bulk` |
| **Generate certificates** | Not implemented | `POST /v1/events/{id}/certificates` |
| **Webhook for results** | Not implemented | `POST /v1/webhooks` |

### 3.2 API Design

RESTful API with Supabase Edge Functions as the compute layer:

```
Base URL: https://{project-ref}.supabase.co/functions/v1/organizer-api

Authentication: Bearer <api_key>

Endpoints:
  GET    /v1/events                          — List organizer's events
  POST   /v1/events                          — Create new event
  GET    /v1/events/{id}                     — Get event details
  PATCH  /v1/events/{id}                     — Update event
  DELETE /v1/events/{id}                     — Cancel event

  GET    /v1/events/{id}/registrations       — List registrations
  POST   /v1/events/{id}/registrations       — Register a horse
  POST   /v1/events/{id}/registrations/bulk  — Bulk register
  PATCH  /v1/events/{id}/registrations/{rid} — Update registration status
  DELETE /v1/events/{id}/registrations/{rid} — Cancel registration

  POST   /v1/events/{id}/results             — Submit results (batch)
  GET    /v1/events/{id}/results             — Get results

  POST   /v1/events/{id}/certificates        — Generate certificates
  GET    /v1/events/{id}/certificates/{cid}  — Download certificate

  GET    /v1/horses/{id}                     — Get horse public profile
  GET    /v1/horses/{id}/tournament-profile   — Get horse tournament stats
```

### 3.3 Data Model Additions

The existing `events` table is designed for personal horse tracking (horse_id, owner_id), not for organizer-created public events. We need a separate model:

```sql
-- ============================================================
-- ORGANIZER EVENTS (separate from personal events tracking)
-- ============================================================

CREATE TABLE organizer_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  event_type      TEXT NOT NULL CHECK (event_type IN (
                    'race', 'competition', 'expo', 'training', 'festival'
                  )),
  description     TEXT DEFAULT '',
  location        TEXT NOT NULL,
  location_lat    DOUBLE PRECISION,
  location_lng    DOUBLE PRECISION,
  start_date      TIMESTAMPTZ NOT NULL,
  end_date        TIMESTAMPTZ,
  registration_deadline TIMESTAMPTZ,
  max_participants INTEGER,
  entry_fee_mnt   INTEGER DEFAULT 0,
  prize_pool_mnt  INTEGER DEFAULT 0,
  rules           TEXT DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN (
                    'draft', 'published', 'registration_open',
                    'registration_closed', 'in_progress',
                    'completed', 'cancelled'
                  )),
  is_public       BOOLEAN DEFAULT false,
  banner_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizer_events_organizer ON organizer_events(organizer_id);
CREATE INDEX idx_organizer_events_status ON organizer_events(status);
CREATE INDEX idx_organizer_events_date ON organizer_events(start_date);

-- ============================================================
-- ORGANIZER EVENT REGISTRATIONS
-- ============================================================

CREATE TABLE organizer_registrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES organizer_events(id) ON DELETE CASCADE,
  horse_id        UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  owner_user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  horse_name      TEXT DEFAULT '',
  owner_name      TEXT DEFAULT '',
  phone           TEXT DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'registered'
                  CHECK (status IN (
                    'registered', 'confirmed', 'checked_in',
                    'competing', 'disqualified', 'withdrawn'
                  )),
  notes           TEXT DEFAULT '',
  registered_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, horse_id)
);

CREATE INDEX idx_organizer_reg_event ON organizer_registrations(event_id);
CREATE INDEX idx_organizer_reg_horse ON organizer_registrations(horse_id);
CREATE INDEX idx_organizer_reg_owner ON organizer_registrations(owner_user_id);

-- ============================================================
-- ORGANIZER EVENT RESULTS
-- ============================================================

CREATE TABLE organizer_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES organizer_events(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES organizer_registrations(id) ON DELETE CASCADE,
  horse_id        UUID NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
  placement       INTEGER CHECK (placement > 0),
  time_seconds    DOUBLE PRECISION,
  score           DOUBLE PRECISION,
  prize_mnt       INTEGER DEFAULT 0,
  notes           TEXT DEFAULT '',
  photo_urls      TEXT[] DEFAULT '{}',
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, registration_id)
);

CREATE INDEX idx_organizer_results_event ON organizer_results(event_id);

-- ============================================================
-- API KEYS
-- ============================================================

CREATE TABLE organizer_api_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  key_hash        TEXT NOT NULL UNIQUE,
  key_prefix      TEXT NOT NULL,  -- first 8 chars for identification
  name            TEXT NOT NULL DEFAULT '',
  scopes          TEXT[] DEFAULT '{events:read,events:write,registrations:read,registrations:write}',
  rate_limit_per_minute INTEGER DEFAULT 60,
  is_active       BOOLEAN DEFAULT true,
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_user ON organizer_api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON organizer_api_keys(key_hash);

-- ============================================================
-- API USAGE LOG (for rate limiting + analytics)
-- ============================================================

CREATE TABLE organizer_api_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id      UUID NOT NULL REFERENCES organizer_api_keys(id) ON DELETE CASCADE,
  endpoint        TEXT NOT NULL,
  method          TEXT NOT NULL,
  status_code     INTEGER NOT NULL,
  response_ms     INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_usage_key ON organizer_api_usage(api_key_id, created_at);
```

### 3.4 Authentication: API Key System

**Key generation flow:**

```
1. Organizer goes to "API Settings" in app (Stable tier only)
2. Clicks "Generate API Key"
3. App calls Edge Function: POST /v1/api-keys
4. Edge Function:
   a. Verifies user has Stable subscription
   b. Generates random 32-byte key
   c. Stores SHA-256 hash in organizer_api_keys
   d. Returns the raw key ONCE (shown only at creation)
5. Organizer copies key and uses in external integrations
```

**Key validation flow (Edge Function middleware):**

```typescript
// Edge Function: validateApiKey
const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
if (!apiKey) return 401;

const keyPrefix = apiKey.substring(0, 8);
const keyHash = sha256(apiKey);

const { data: key } = await supabase
  .from('organizer_api_keys')
  .select('*')
  .eq('key_hash', keyHash)
  .eq('key_prefix', keyPrefix)
  .single();

if (!key || !key.is_active) return 401;
if (key.expires_at && new Date(key.expires_at) < new Date()) return 401;

// Rate limiting check
const recentCalls = await supabase
  .from('organizer_api_usage')
  .select('id')
  .eq('api_key_id', key.id)
  .gte('created_at', new Date(Date.now() - 60000).toISOString());

if (recentCalls.length >= key.rate_limit_per_minute) return 429;

// Log usage
await supabase.from('organizer_api_usage').insert({
  api_key_id: key.id,
  endpoint: req.path,
  method: req.method,
  status_code: responseStatus,
});

return { userId: key.user_id, scopes: key.scopes };
```

### 3.5 Relationship to Partner Dashboard

The existing `PartnerDashboardScreen` (23.2KB) provides a **Flutter UI** for the same organizer workflows. The API is an **alternative access path** for the same data:

```
                    ┌─────────────────────────┐
                    │    organizer_events      │
                    │    organizer_registrations│
                    │    organizer_results      │
                    └──────────┬──────────────┘
                               │
                    ┌──────────┴──────────────┐
                    │                         │
              ┌─────┴─────┐           ┌───────┴───────┐
              │  Flutter   │           │  Edge Function │
              │  Partner   │           │  API Server    │
              │  Dashboard │           │  (REST)        │
              └─────┬─────┘           └───────┬───────┘
                    │                         │
              ┌─────┴─────┐           ┌───────┴───────┐
              │  Mobile    │           │  External      │
              │  App User  │           │  Integrations  │
              └───────────┘           │  (Web, 3rd     │
                                      │   party tools) │
                                      └───────────────┘
```

**Key insight:** The API doesn't replace the partner dashboard — it extends access to organizers who want to integrate with their own tools (event websites, registration platforms, result reporting systems). The Flutter dashboard remains the primary experience for mobile-first users.

**Migration plan:** The partner dashboard's existing `events` and `event_registration` tables track personal horse event history. The new `organizer_events` and `organizer_registrations` tables track events created by organizers for public participation. These are **complementary, not competing**:

| Aspect | `events` (existing) | `organizer_events` (new) |
|---|---|---|
| **Perspective** | Horse owner tracking their horse's events | Event organizer managing their event |
| **Data ownership** | `owner_id` = horse owner | `organizer_id` = event creator |
| **Registrations** | Single horse → event | Event → multiple horses from different owners |
| **Results** | Personal record (`event.result`) | Official results (`organizer_results`) |
| **Access** | Owner only + team members | Public (read), organizer (write) |

### 3.6 Tier Access & Rate Limits

| Tier | API Access | Rate Limit | Key Limit |
|---|---|---|---|
| Free | ❌ | — | 0 |
| Pro | ❌ | — | 0 |
| Breeder | Read-only (view events, horse profiles) | 30 req/min | 1 key |
| Stable | Full access (create, manage, results) | 60 req/min | 3 keys |

**Implementation:** The `organizer_api_keys` table's `rate_limit_per_minute` is set based on the user's tier at key creation time. Changing tier updates the limit.

### 3.7 Documentation Strategy

| Deliverable | Format | Location |
|---|---|---|
| OpenAPI 3.1 spec | YAML | `docs/api/openapi.yaml` |
| Interactive docs | Swagger UI / Redoc | Hosted at `/{project}/functions/v1/organizer-api/docs` |
| Quickstart guide | Markdown | `docs/api/quickstart.md` |
| Code examples | cURL + Python + JavaScript | Inline in OpenAPI spec |

**OpenAPI spec structure:**

```yaml
openapi: 3.1.0
info:
  title: Tamga Organizer API
  version: 1.0.0
  description: API for horse event organizers to manage events, registrations, and results.
servers:
  - url: https://{project-ref}.supabase.co/functions/v1/organizer-api
security:
  - BearerAuth: []
paths:
  /v1/events:
    get:
      summary: List organizer's events
      tags: [Events]
    post:
      summary: Create new event
      tags: [Events]
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateEventRequest'
  /v1/events/{eventId}/registrations:
    post:
      summary: Register a horse for an event
      tags: [Registrations]
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
```

### 3.8 Day-by-day Breakdown

| Day | Task | Files |
|---|---|---|
| **Day 1** | Database migration (organizer tables + API keys + usage), API key management Edge Function (CRUD), API auth middleware | `supabase/migrations/`, `supabase/functions/organizer-api/` |
| **Day 1** | Core Edge Functions: events CRUD, registration endpoints | `supabase/functions/organizer-api/handlers/` |
| **Day 2** | Results submission, bulk registration, certificate generation Edge Functions | `supabase/functions/organizer-api/handlers/` |
| **Day 2** | OpenAPI spec, rate limiting middleware, usage logging | `docs/api/openapi.yaml`, `supabase/functions/organizer-api/middleware/` |
| **Day 3** | API settings screen in Flutter (key management, usage stats), wire to Stable tier gate | `presentation/api_settings_screen.dart`, `features/organizer/` |
| **Day 3** | Quickstart guide, test with cURL, integration with partner dashboard (sync organizer_events ↔ events) | `docs/api/quickstart.md`, `features/events/` |

---

## Cross-cutting Concerns

### Shared Migration Strategy

All three features require Supabase migrations. To avoid conflicts, apply in order:

1. **Teams migration** (Feature 1) — standalone tables, no dependencies
2. **Tier gating migration** (Feature 2) — modifies `profiles`, adds `subscription_history`
3. **Organizer API migration** (Feature 3) — standalone tables, depends on stable tier existing

### Error Handling

All features should use the existing `Result<T>` pattern from `core/error/result.dart`:

```dart
// Repository layer returns Result<T>
Future<Result<Team>> createTeam(Team team) async { ... }

// Providers expose AsyncValue
final userTeamsProvider = FutureProvider<List<Team>>((ref) async { ... });

// UI handles both states
teamsAsync.when(
  data: (teams) => _buildTeamList(teams),
  loading: () => const CircularProgressIndicator(),
  error: (e, _) => ErrorWidget(message: e.toString()),
);
```

### Testing Strategy

| Test Type | Scope | Priority |
|---|---|---|
| **Unit** | Domain models, permission calculations, tier limit checks | High |
| **Repository** | Local + Supabase repos with mocked Supabase client | High |
| **Widget** | Key screens with overridden providers | Medium |
| **RLS** | Direct SQL tests against Supabase local (Supabase CLI) | High — security critical |
| **Integration** | Full flow: create team → invite → accept → add horse | Medium |
| **API** | cURL/Postman tests for all Edge Function endpoints | High |

---

## Implementation Timeline

```
Week 1: Parallel track (3 developers or sequential with no blockers)

  Track A (Teams):        Day 1 ──── Day 2 ──── Day 3
                           │ DB       │ UI       │ Audit
                           │ + repo   │ + RT     │ + test

  Track B (Gating):       Day 1 ──── Day 2
                           │ Schema   │ Screen
                           │ + cron   │ + gates

  Track C (API):          Day 1 ──── Day 2 ──── Day 3
                           │ DB       │ Functions │ UI +
                           │ + auth   │ + docs   │ guide

Total: 8 person-days (parallel) or 8 days (sequential)
```

**Dependencies:**

```
Teams ───────────────────────────────────── (standalone)
Gating ──────────────────────────────────── (standalone)
API ──── depends on ──→ Gating (Stable tier must be enforceable)
```

The API can start Day 1 with DB and auth, but the tier-based access control wiring happens after Gating Day 1 is complete.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **RLS performance** — team membership subqueries on every query | High for large teams | Use `SECURITY DEFINER` helper functions; materialize with a view if needed |
| **Offline sync conflicts** — concurrent team edits by different members | Medium | Last-write-wins with timestamp; add conflict resolution UI for critical data |
| **API abuse** — organizers sharing API keys | Medium | Rate limiting per key; key rotation; usage monitoring dashboard |
| **Subscription expiry during offline** — user thinks they're still premium | Low | 7-day grace period; sync tier on reconnect; never delete data on expiry |
| **Mongolian payment integration** — SocialPay/bank APIs may not be available | Medium | Manual bank transfer as fallback; RevenueCat as primary path |
| **Team data isolation** — accidental cross-team data leakage via RLS gap | High | Comprehensive RLS test suite; no policy goes live without SQL-level tests |
| **Organizer API scope creep** — too many endpoints before real usage | Low | Start with CRUD + registration; add results/certificates based on organizer feedback |

---

## Appendix A: SubscriptionTier Enum (Current)

```dart
// lib/src/features/payments/domain/payment_request.dart
enum SubscriptionTier {
  free('Үнэгүй', 0),
  pro('Pro', 9900),
  breeder('Breeder', 29900),   // Note: pricing.md says 24900
  stable('Stable', 49900);

  const SubscriptionTier(this.displayName, this.priceMnt);
  // ...
}
```

**⚠️ Price discrepancy:** The `SubscriptionTier` enum has `breeder` at ₮29,900 but `pricing.md` defines it as ₮24,900. This should be corrected to ₮24,900 to match the published pricing.

## Appendix B: TeamPermission Enum (Current)

```dart
// lib/src/features/teams/domain/team_member.dart
enum TeamPermission {
  viewTeam,
  manageTeam,
  addHorses,
  editHorses,
  deleteHorses,
  addHealthLogs,
  viewHealth,
  addTraining,
  viewTraining,
  createListings,
  viewAnalytics,
  manageMembers,
}
```

## Appendix C: Existing GateCheck Providers

```
horseCreationGateProvider(int currentHorseCount) → GateCheck
storageGateProvider(int usedBytes) → GateCheck
pedigreeDepthGateProvider(int requestedGenerations) → GateCheck
inbreedingCalcGateProvider → GateCheck
boostGateProvider → GateCheck
sellerBadgeGateProvider → GateCheck
hasMultiUsersGateProvider → GateCheck
```

All follow the same pattern: read `tierLimitsProvider`, compare against limits, return `GateAllowed` or `GateDenied`.
