/**
 * @process tamga-phase2-5
 * @description Sprint 2.5 — Onboarding & User Roles for Tamga Flutter app
 * @inputs { projectRoot: string, userTypes: object[], phases: string[] }
 * @outputs { success: boolean, artifacts: string[] }
 *
 * Redesign onboarding flow with proper user types, auth integration,
 * profile sync, and guided first-run experience.
 *
 * User Types:
 *   - casual: "Нэг морьтой эзэн" — Single horse owner
 *   - breeder: "Үржүүлэгч / Уяач" — Breeder/trainer
 *   - stable: "Жүчээ / Бизнес" — Stable/business
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

// ── Phase P1: Domain Model Update ────────────────────────────────────

const p1DomainModel = defineTask("onboarding-domain", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Onboarding Domain Model Update",
	description: `Update the onboarding domain models and Supabase schema for Sprint 2.5.

## Changes

1. **Add role column to Supabase profiles table**:
   - SQL: ALTER TABLE profiles ADD COLUMN role TEXT CHECK (IN ('casual', 'breeder', 'stable')) DEFAULT 'casual';
   - Update RLS policies if needed

2. **Update OnboardingData model** (lib/src/features/onboarding/domain/onboarding_data.dart):
   - Add displayName field
   - Add region field (aimag)
   - Add phone field (optional, for later auth)

3. **Update OnboardingRepository** (lib/src/features/onboarding/data/onboarding_repository.dart):
   - Save all new fields to SharedPreferences

4. **Update ProfileSettings model** (lib/src/features/profile/domain/profile_settings.dart):
   - Add role field matching the DB column

5. **Update SupabaseProfileRepository**:
   - Include role in get/update methods
   - Map role field correctly

6. **Create migration 003** (supabase/migrations/003_add_user_role.sql):
   - Add role column to profiles
   - Update any affected triggers

Files to modify:
- lib/src/features/onboarding/domain/onboarding_data.dart
- lib/src/features/onboarding/data/onboarding_repository.dart
- lib/src/features/profile/domain/profile_settings.dart
- lib/src/features/profile/data/supabase_profile_repository.dart
- supabase/migrations/003_add_user_role.sql (new)`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-2.5", "onboarding", "schema", "domain"],
}));

const p1Verify = defineTask("p1-build-verify", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Build verification: Domain Model",
	description: `Run flutter analyze to verify domain model changes compile without errors.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "build"],
}));

// ── Phase P2: Onboarding UI Redesign ─────────────────────────────────

const p2OnboardingUI = defineTask("onboarding-ui", (args, ctx) => ({
	kind: "orchestrator_task",
	title: "Onboarding UI Redesign",
	description: `Redesign the onboarding flow with 5 steps in ${args.projectRoot}.

## New Flow
1. **Welcome** — Brand intro, "ЭХЛЭХ" button
2. **Role Selection** — Pick user type (casual/breeder/stable) with description cards
3. **Profile Setup** — Display name, region (dropdown of aimags), phone (optional)
4. **First Horse** — Add first horse (name, gender, coat color, birth year). Skip option.
5. **Auth Prompt** — "Тохиргоо хадгалах" (Save Progress) — prompt to register/login to save data to cloud. Skip saves locally only.

## Implementation

### Step 1: WelcomePage (update existing)
- Keep existing design

### Step 2: RoleSelectionPage (update existing)
- Add detailed description for each role:
  - casual: "Ганц морь эзэмшдэг, энгийн хэрэгцээ"
  - breeder: "Олон морьтай, удам судалгаа, уралдаан"
  - stable: "Жүчээ бизнес, олон хэрэглэгч"
- Add icon for each role
- Visual feedback on selection

### Step 3: ProfileSetupPage (NEW)
- Text field for display name (required)
- Dropdown for region/aimag (21 aimags of Mongolia)
- Optional phone number field

### Step 4: FirstHorsePage (update existing HorseEntryPage)
- Keep existing form, add skip button

### Step 5: AuthPromptPage (NEW)
- Two options: "Бүртгүүлэх" (Register), "Нэвтрэх" (Login), "Дараа" (Later)
- Show what's saved locally vs cloud
- Loss-aversion messaging

### Files to create/modify:
- lib/src/features/onboarding/presentation/onboarding_screen.dart
- lib/src/features/onboarding/presentation/pages/role_selection_page.dart
- lib/src/features/onboarding/presentation/pages/profile_setup_page.dart (NEW)
- lib/src/features/onboarding/presentation/pages/horse_entry_page.dart
- lib/src/features/onboarding/presentation/pages/auth_prompt_page.dart (NEW)`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-2.5", "onboarding", "ui"],
}));

const p2Verify = defineTask("p2-build-verify", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Build verification: Onboarding UI",
	description: `Run flutter analyze to verify onboarding UI changes compile without errors.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "build"],
}));

// ── Phase P3: Auth Integration & Profile Sync ────────────────────────

const p3AuthIntegration = defineTask("auth-integration", (args, ctx) => ({
	kind: "orchestrator_task",
	title: "Auth Integration & Profile Sync",
	description: `Integrate onboarding with auth and sync profile to Supabase in ${args.projectRoot}.

## What to implement

1. **Onboarding completion flow**:
   - After onboarding: save to Isar (local)
   - If authenticated: push profile + horse to Supabase
   - If anonymous: keep local only, show banner to register

2. **Profile sync on login**:
   - When user logs in after onboarding locally:
     - Merge local data with cloud profile
     - Push unsynced horses to Supabase
     - Update profile role in Supabase

3. **Update OnboardingNotifier**:
   - After complete(): check auth state
   - If authenticated: call SupabaseProfileRepository.update() with role
   - If authenticated: push horses to Supabase

4. **Update AppShell**:
   - After onboarding, if anonymous:
     - Show banner: "Өгөгдөө хамгаалахын тулд бүртгүүлнэ үү"

Files to modify:
- lib/src/features/onboarding/application/onboarding_notifier.dart
- lib/src/features/shell/presentation/app_shell.dart
- lib/src/features/auth/data/supabase_auth_repository.dart`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-2.5", "onboarding", "auth", "sync"],
}));

const p3Verify = defineTask("p3-build-verify", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Build verification: Auth Integration",
	description: `Run flutter analyze to verify auth integration changes compile without errors.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "build"],
}));

// ── Phase P4: Post-Onboarding Guided Tour ────────────────────────────

const p4GuidedTour = defineTask("guided-tour", (args, ctx) => ({
	kind: "orchestrator_task",
	title: "Post-Onboarding Guided Tour",
	description: `Add guided first-run experience after onboarding in ${args.projectRoot}.

## What to implement

1. **Feature tour overlay** (lib/src/features/shell/presentation/feature_tour.dart):
   - Semi-transparent overlay highlighting each bottom nav tab
   - 5 steps: Lineage → Horses → Events → Market → Profile
   - Each step: highlight tab, show tooltip with description
   - "Дараагийх" (Next) and "Өнгөрүүлэх" (Skip) buttons
   - Save completion to SharedPreferences (show only once)

2. **Quick action cards** (lib/src/features/shell/presentation/quick_actions.dart):
   - Contextual cards on home screen based on role:
     - casual: "Морь нэмэх", "Удам харах"
     - breeder: "Морь нэмэх", "Уралдаан нэмэх", "Үржүүлэлт"
     - stable: "Морь нэмэх", "Зах дээр зарах", "Хэрэглэгч нэмэх"
   - Cards dismissible

3. **Wire SearchScreen and BreedingScreen into router**:
   - Add routes for /search and /breeding

Files to create:
- lib/src/features/shell/presentation/feature_tour.dart
- lib/src/features/shell/presentation/quick_actions.dart

Files to modify:
- lib/src/features/shell/presentation/app_shell.dart
- lib/src/app/router.dart`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-2.5", "onboarding", "tour", "ux"],
}));

const p4Verify = defineTask("p4-build-verify", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Build verification: Guided Tour",
	description: `Run flutter analyze to verify guided tour changes compile without errors.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "build"],
}));

// ── Phase P5: Onboarding Tests ───────────────────────────────────────

const p5Tests = defineTask("onboarding-tests", (args, ctx) => ({
	kind: "orchestrator_task",
	title: "Onboarding Tests",
	description: `Write comprehensive tests for the onboarding feature in ${args.projectRoot}.

## Tests to create

1. **test/features/onboarding/onboarding_data_test.dart**:
   - Test UserRole enum values
   - Test OnboardingData serialization
   - Test OnboardingData.copyWith

2. **test/features/onboarding/onboarding_repository_test.dart**:
   - Test save/load onboarding data
   - Test skipAll marks complete

3. **test/features/onboarding/onboarding_notifier_test.dart**:
   - Test state transitions (step 1→2→3→4→5)
   - Test skip functionality
   - Test complete with/without horse

4. **test/features/onboarding/presentation/role_selection_page_test.dart**:
   - Test renders 3 role cards
   - Test selection highlights card

5. **test/features/onboarding/presentation/profile_setup_page_test.dart**:
   - Test form validation (name required)
   - Test region dropdown

6. **test/features/onboarding/presentation/auth_prompt_page_test.dart**:
   - Test shows register/login/later options

Run: flutter test test/features/onboarding/`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-2.5", "onboarding", "tests"],
}));

const p5Verify = defineTask("p5-test-verify", (_args, ctx) => ({
	kind: "orchestrator_task",
	title: "Test verification: Onboarding Tests",
	description: `Run flutter test test/features/onboarding/ to verify all tests pass.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "tests"],
}));

// ── Main Process ─────────────────────────────────────────────────────

export default async function process(inputs, ctx) {
	const { projectRoot } = inputs;
	const artifacts = [];

	// ── P1: Domain Model Update ──────────────────────────────────
	ctx.log?.("Starting P1: Domain Model Update");
	const p1Result = await ctx.task(
		p1DomainModel,
		{ projectRoot },
		{ label: "p1:domain-model" },
	);
	artifacts.push(...(p1Result.artifacts || []));

	const p1Build = await ctx.task(
		p1Verify,
		{ phase: "Domain Model" },
		{ label: "p1:build-verify" },
	);
	if (!p1Build.ok) {
		const approval = await ctx.breakpoint({
			question:
				"Build failed after domain model update. How should we proceed?",
			expert: "owner",
			tags: ["approval-gate", "build-failure"],
			previousFeedback: p1Build.error,
		});
		if (!approval.approved) {
			return {
				ok: false,
				reason: "Build failed at P1",
				phase: "domain-model",
				feedback: approval.response,
			};
		}
	}

	// ── P2: Onboarding UI Redesign ────────────────────────────────
	ctx.log?.("Starting P2: Onboarding UI Redesign");
	const p2Result = await ctx.task(
		p2OnboardingUI,
		{ projectRoot },
		{ label: "p2:onboarding-ui" },
	);
	artifacts.push(...(p2Result.artifacts || []));

	const p2Build = await ctx.task(
		p2Verify,
		{ phase: "Onboarding UI" },
		{ label: "p2:build-verify" },
	);
	if (!p2Build.ok) {
		const approval = await ctx.breakpoint({
			question: "Build failed after onboarding UI. How should we proceed?",
			expert: "owner",
			tags: ["approval-gate", "build-failure"],
			previousFeedback: p2Build.error,
		});
		if (!approval.approved) {
			return {
				ok: false,
				reason: "Build failed at P2",
				phase: "onboarding-ui",
				feedback: approval.response,
			};
		}
	}

	// ── P3: Auth Integration ──────────────────────────────────────
	ctx.log?.("Starting P3: Auth Integration & Profile Sync");
	const p3Result = await ctx.task(
		p3AuthIntegration,
		{ projectRoot },
		{ label: "p3:auth-integration" },
	);
	artifacts.push(...(p3Result.artifacts || []));

	const p3Build = await ctx.task(
		p3Verify,
		{ phase: "Auth Integration" },
		{ label: "p3:build-verify" },
	);
	if (!p3Build.ok) {
		const approval = await ctx.breakpoint({
			question: "Build failed after auth integration. How should we proceed?",
			expert: "owner",
			tags: ["approval-gate", "build-failure"],
			previousFeedback: p3Build.error,
		});
		if (!approval.approved) {
			return {
				ok: false,
				reason: "Build failed at P3",
				phase: "auth-integration",
				feedback: approval.response,
			};
		}
	}

	// ── P4: Guided Tour ──────────────────────────────────────────
	ctx.log?.("Starting P4: Post-Onboarding Guided Tour");
	const p4Result = await ctx.task(
		p4GuidedTour,
		{ projectRoot },
		{ label: "p4:guided-tour" },
	);
	artifacts.push(...(p4Result.artifacts || []));

	const p4Build = await ctx.task(
		p4Verify,
		{ phase: "Guided Tour" },
		{ label: "p4:build-verify" },
	);
	if (!p4Build.ok) {
		const approval = await ctx.breakpoint({
			question: "Build failed after guided tour. How should we proceed?",
			expert: "owner",
			tags: ["approval-gate", "build-failure"],
			previousFeedback: p4Build.error,
		});
		if (!approval.approved) {
			return {
				ok: false,
				reason: "Build failed at P4",
				phase: "guided-tour",
				feedback: approval.response,
			};
		}
	}

	// ── P5: Tests ────────────────────────────────────────────────
	ctx.log?.("Starting P5: Onboarding Tests");
	const p5Result = await ctx.task(
		p5Tests,
		{ projectRoot },
		{ label: "p5:onboarding-tests" },
	);
	artifacts.push(...(p5Result.artifacts || []));

	const p5Test = await ctx.task(p5Verify, {}, { label: "p5:test-verify" });
	if (!p5Test.ok) {
		const approval = await ctx.breakpoint({
			question: "Tests failed. How should we proceed?",
			expert: "owner",
			tags: ["approval-gate", "test-failure"],
			previousFeedback: p5Test.error,
		});
		if (!approval.approved) {
			return {
				ok: false,
				reason: "Tests failed at P5",
				phase: "onboarding-tests",
				feedback: approval.response,
			};
		}
	}

	// ── Final Approval ────────────────────────────────────────────
	let lastFeedback = null;
	for (let attempt = 0; attempt < 2; attempt++) {
		const approval = await ctx.breakpoint({
			question: `Sprint 2.5 Onboarding complete. All phases done. Final approval?`,
			expert: "owner",
			tags: ["final-gate"],
			previousFeedback: lastFeedback || undefined,
			attempt: attempt > 0 ? attempt + 1 : undefined,
		});
		if (approval.approved) break;
		lastFeedback =
			approval.response || approval.feedback || "Changes requested";
	}

	return {
		ok: true,
		phases: [
			"P1:domain-model",
			"P2:onboarding-ui",
			"P3:auth-integration",
			"P4:guided-tour",
			"P5:tests",
		],
		artifacts,
		summary: "Tamga Sprint 2.5 Onboarding & User Roles complete",
	};
}
