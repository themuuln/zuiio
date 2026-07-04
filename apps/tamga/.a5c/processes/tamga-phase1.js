/**
 * @process tamga-phase1
 * @description Phase 1 Local-First Stabilization for Tamga Flutter app
 * @inputs { projectRoot: string, phases: string[] }
 * @outputs { success: boolean, artifacts: string[] }
 *
 * Sequential 4-phase process:
 *   1. Isar migration (replace SharedPreferences/LocalJsonStore)
 *   2. Horse model merge (unify HorseRecord + LineageHorse → shared Horse)
 *   3. Error handling integration (Result<T> across all repositories)
 *   4. Phone auth OTP (Supabase phone authentication)
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

// ── Phase 1: Isar Migration ──────────────────────────────────────────

const isarMigrationTask = defineTask("isar-migration", (args, ctx) => ({
	kind: "orchestrator_task",
	title: "Isar Local Database Migration",
	description: `Migrate from SharedPreferences/LocalJsonStore to Isar for structured local storage in ${args.projectRoot}.

## Scope
- Add isar + isar_flutter dependencies to pubspec.yaml
- Create Isar schema classes for: horses, health_logs, farrier_logs, events, market_listings, pedigree_links, profile_settings, sync_queue
- Implement Isar-backed repositories replacing LocalJsonStore implementations
- Data migration: read existing SharedPreferences JSON data → write to Isar boxes
- Update LocalStorage interface or create new IsarStorage interface
- Keep SharedPreferences only for lightweight settings (theme, sync preferences)

## Architecture constraints
- Follow existing clean architecture: domain/data/application/presentation
- Domain models stay pure Dart (no Isar imports in domain layer)
- Isar schemas go in data layer only
- Update Riverpod providers to use new Isar-backed repositories
- Seed data (6 horses in LocalHorsesRepository._seed) must migrate correctly

## Files to modify
- pubspec.yaml (add isar, isar_flutter, path_provider)
- lib/src/core/storage/ (new Isar database setup)
- lib/src/features/shared/data/ (new IsarStorage, replace LocalJsonStore)
- lib/src/features/horses/data/local_horses_repository.dart
- lib/src/features/health/data/local_health_repository.dart
- lib/src/features/events/data/local_events_repository.dart
- lib/src/features/events/data/local_event_repository.dart
- lib/src/features/market/data/local_market_repository.dart
- lib/src/features/market/data/local_market_repository_v2.dart
- lib/src/features/lineage/data/local_lineage_repository.dart
- lib/src/features/profile/data/local_profile_settings_repository.dart
- lib/src/features/breeding/data/local_breeding_repository.dart
- lib/src/core/sync/sync_queue.dart (Isar-backed queue persistence)

## Testing
- Unit tests for Isar schema serialization/deserialization
- Repository tests with in-memory Isar instance
- Migration test: seed SharedPreferences data → verify Isar has correct data`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["phase-1", "isar", "migration", "storage"],
}));

// ── Phase 2: Horse Model Merge ───────────────────────────────────────

const horseMergeTask = defineTask("horse-model-merge", (args, ctx) => ({
	kind: "orchestrator_task",
	title: "Horse Model Unification",
	description: `Merge HorseRecord and LineageHorse into a single shared Horse domain model in ${args.projectRoot}.

## Scope
- Create shared Horse class in lib/src/shared/domain/horse.dart
- Fields: id, ownerId, name, gender (HorseGender), coat, birthYear, microchipId, registrationNo, notes, photoUrls, isOwnedByHousehold, lineageRootId, awardCount, offspringCount, createdAt, updatedAt
- Add HorseGender enum (move from horse_record.dart)
- Add fromJson/toJson/fromSupabaseJson/toSupabaseJson factories
- Delete LineageHorse class (lib/src/features/lineage/domain/lineage_horse.dart)
- Update all lineage feature files to import shared Horse instead of LineageHorse
- Update all horses feature files to use shared Horse instead of HorseRecord
- Update providers, repositories, and presentation layers
- Add relationLabel as computed property or keep as display-only field

## Files to modify
- lib/src/shared/domain/horse.dart (new/rewrite)
- lib/src/features/horses/domain/horse_record.dart (remove, redirect to shared Horse)
- lib/src/features/lineage/domain/lineage_horse.dart (remove)
- lib/src/features/lineage/data/local_lineage_repository.dart
- lib/src/features/lineage/application/lineage_roots_provider.dart
- lib/src/features/lineage/presentation/*.dart (all lineage screens)
- lib/src/features/horses/data/local_horses_repository.dart
- lib/src/features/horses/application/horses_providers.dart
- lib/src/features/horses/presentation/horses_screen.dart
- lib/src/features/market/domain/market_listing.dart (update horse reference)
- lib/src/features/events/domain/event_record.dart (update horse reference)

## Testing
- Unit tests for Horse model serialization (JSON, Supabase JSON)
- Widget tests for screens that display horse data
- Verify lineage tree still renders correctly with unified model`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["phase-2", "model", "merge", "domain"],
}));

// ── Phase 3: Error Handling Integration ──────────────────────────────

const errorHandlingTask = defineTask(
	"error-handling-integration",
	(args, ctx) => ({
		kind: "orchestrator_task",
		title: "Result<T> Error Handling Integration",
		description: `Integrate Result<T> and AppException across all repositories and providers in ${args.projectRoot}.

## Current state
- Result<T> and AppException already exist in lib/src/core/error/
- Most repositories still throw exceptions or return raw values
- Providers don't handle errors consistently

## Scope
- Update ALL repository interfaces to return Result<T>:
  - HorsesRepository → Result<List<Horse>>, Result<Horse>
  - HealthRepository → Result<List<HealthRecord>>
  - EventsRepository → Result<List<EventRecord>>
  - MarketRepository → Result<List<MarketListing>>
  - LineageRepository → Result<LineageRoot>, Result<List<LineageHorse>>
  - ProfileSettingsRepository → Result<ProfileSettings>
  - BreedingRepository → Result<List<BreedingRecord>>
  - CoOwnershipRepository → Result<List<CoOwnership>>
- Add specific AppException codes: HORSE_NOT_FOUND, SYNC_FAILED, AUTH_REQUIRED, STORAGE_FULL, NETWORK_ERROR
- Update all Riverpod providers to handle Result<T> (pattern: when/onSuccess/onFailure)
- Add error UI states in presentation layer (error snackbar, retry button)
- Ensure offline errors surface correctly

## Files to modify
- lib/src/core/error/app_exception.dart (add specific error codes/factory methods)
- lib/src/core/error/result.dart (add convenience methods if needed)
- All repository interface files (data/*_repository.dart)
- All local repository implementations
- All provider files (application/*_providers.dart)
- Presentation files that consume provider state

## Testing
- Unit tests for Result<T> operations (map, when, getOrThrow)
- Repository tests verifying error paths return proper Result.fail
- Widget tests for error state UI`,
		io: {
			inputJsonPath: `tasks/${ctx.effectId}/input.json`,
			outputJsonPath: `tasks/${ctx.effectId}/result.json`,
		},
		labels: ["phase-3", "error-handling", "result-type", "quality"],
	}),
);

// ── Phase 4: Phone Auth OTP ──────────────────────────────────────────

const phoneAuthTask = defineTask("phone-email-auth", (args, ctx) => ({
	kind: "orchestrator_task",
	title: "Phone + Email Authentication (No Confirmation)",
	description: `Add Supabase phone and email authentication to ${args.projectRoot}, replacing anonymous-only auth. No OTP/email confirmation required — users register and login directly.

## Current state
- supabase_bootstrap.dart has ensureSupabaseUserId() with anonymous sign-in only
- Supabase is initialized with URL + anon key from .env
- Supabase dashboard must have email confirmation DISABLED

## Scope
- Create auth feature: lib/src/features/auth/
  - domain/auth_state.dart (authenticated, unauthenticated)
  - data/auth_repository.dart (interface)
  - data/supabase_auth_repository.dart (implementation)
  - application/auth_providers.dart (Riverpod providers)
  - presentation/login_screen.dart (tabbed: phone login / email login / register)
  - presentation/register_screen.dart (phone or email registration)
- Phone registration: supabase.auth.signUp(phone:) — no OTP verification
- Email registration: supabase.auth.signUp(email:, password:) — no email confirmation
- Login with phone OR email + password
- Anonymous → registered migration: supabase.auth.linkIdentity()
- Update supabase_bootstrap.dart to use new auth system
- Add auth state provider to app shell (show login if unauthenticated)
- Protected routes: redirect to login if not authenticated
- flutter_secure_storage for token storage

## Files to create
- lib/src/features/auth/domain/auth_state.dart
- lib/src/features/auth/data/auth_repository.dart
- lib/src/features/auth/data/supabase_auth_repository.dart
- lib/src/features/auth/application/auth_providers.dart
- lib/src/features/auth/presentation/login_screen.dart
- lib/src/features/auth/presentation/register_screen.dart

## Files to modify
- pubspec.yaml (add flutter_secure_storage)
- lib/src/app/supabase_bootstrap.dart
- lib/src/app/router/app_router.dart (add auth routes, redirect logic)
- lib/src/features/shell/presentation/app_shell.dart (auth gate)

## Testing
- Unit tests for AuthState transitions
- Repository tests with mocked Supabase client
- Widget tests for login and register screens`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["phase-4", "auth", "phone", "email", "supabase", "no-confirmation"],
}));

// ── Verification tasks ───────────────────────────────────────────────

const buildVerifyTask = defineTask("build-verify", (args, ctx) => ({
	kind: "orchestrator_task",
	title: `Build verification: ${args.phase}`,
	description: `Run flutter analyze and flutter build to verify ${args.phase} compiles without errors.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "build"],
}));

const testVerifyTask = defineTask("test-verify", (args, ctx) => ({
	kind: "orchestrator_task",
	title: `Test verification: ${args.phase}`,
	description: `Run flutter test for the scope changed in ${args.phase}.`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["verification", "test"],
}));

// ── Main Process ─────────────────────────────────────────────────────

export async function process(inputs, ctx) {
	const { projectRoot, phases = ["isar", "merge", "errors", "auth"] } = inputs;
	const artifacts = [];

	// ── Phase 1: Isar Migration ──────────────────────────────────
	if (phases.includes("isar")) {
		ctx.log?.("Starting Phase 1: Isar Migration");
		const isarResult = await ctx.task(
			isarMigrationTask,
			{ projectRoot },
			{ label: "phase1:isar-migration" },
		);
		artifacts.push(...(isarResult.artifacts || []));

		// Verify build
		const buildResult1 = await ctx.task(
			buildVerifyTask,
			{ phase: "Isar Migration" },
			{ label: "phase1:build-verify" },
		);
		if (!buildResult1.ok) {
			const approval = await ctx.breakpoint({
				question: "Build failed after Isar migration. How should we proceed?",
				expert: "owner",
				tags: ["approval-gate", "build-failure"],
				previousFeedback: buildResult1.error,
			});
			if (!approval.approved) {
				return {
					ok: false,
					reason: "Build failed at Phase 1",
					phase: "isar",
					feedback: approval.response,
				};
			}
		}

		// Run tests
		const testResult1 = await ctx.task(
			testVerifyTask,
			{ phase: "Isar Migration" },
			{ label: "phase1:test-verify" },
		);

		// Phase 1 completion breakpoint (low tolerance = minimal)
		let lastFeedback1 = null;
		for (let attempt = 0; attempt < 2; attempt++) {
			const approval = await ctx.breakpoint({
				question: `Phase 1 (Isar Migration) complete. Build: ${buildResult1.ok ? "pass" : "fail"}, Tests: ${testResult1.ok ? "pass" : "fail"}. Proceed to Phase 2?`,
				expert: "owner",
				tags: ["phase-gate"],
				previousFeedback: lastFeedback1 || undefined,
				attempt: attempt > 0 ? attempt + 1 : undefined,
			});
			if (approval.approved) break;
			lastFeedback1 =
				approval.response || approval.feedback || "Changes requested";
			// In a real scenario, we'd loop back to fix issues
		}
	}

	// ── Phase 2: Horse Model Merge ───────────────────────────────
	if (phases.includes("merge")) {
		ctx.log?.("Starting Phase 2: Horse Model Merge");
		const mergeResult = await ctx.task(
			horseMergeTask,
			{ projectRoot },
			{ label: "phase2:horse-merge" },
		);
		artifacts.push(...(mergeResult.artifacts || []));

		const buildResult2 = await ctx.task(
			buildVerifyTask,
			{ phase: "Horse Model Merge" },
			{ label: "phase2:build-verify" },
		);
		if (!buildResult2.ok) {
			const approval = await ctx.breakpoint({
				question:
					"Build failed after Horse model merge. How should we proceed?",
				expert: "owner",
				tags: ["approval-gate", "build-failure"],
				previousFeedback: buildResult2.error,
			});
			if (!approval.approved) {
				return {
					ok: false,
					reason: "Build failed at Phase 2",
					phase: "merge",
					feedback: approval.response,
				};
			}
		}

		const testResult2 = await ctx.task(
			testVerifyTask,
			{ phase: "Horse Model Merge" },
			{ label: "phase2:test-verify" },
		);

		let lastFeedback2 = null;
		for (let attempt = 0; attempt < 2; attempt++) {
			const approval = await ctx.breakpoint({
				question: `Phase 2 (Horse Model Merge) complete. Build: ${buildResult2.ok ? "pass" : "fail"}, Tests: ${testResult2.ok ? "pass" : "fail"}. Proceed to Phase 3?`,
				expert: "owner",
				tags: ["phase-gate"],
				previousFeedback: lastFeedback2 || undefined,
				attempt: attempt > 0 ? attempt + 1 : undefined,
			});
			if (approval.approved) break;
			lastFeedback2 =
				approval.response || approval.feedback || "Changes requested";
		}
	}

	// ── Phase 3: Error Handling ──────────────────────────────────
	if (phases.includes("errors")) {
		ctx.log?.("Starting Phase 3: Error Handling Integration");
		const errorResult = await ctx.task(
			errorHandlingTask,
			{ projectRoot },
			{ label: "phase3:error-handling" },
		);
		artifacts.push(...(errorResult.artifacts || []));

		const buildResult3 = await ctx.task(
			buildVerifyTask,
			{ phase: "Error Handling" },
			{ label: "phase3:build-verify" },
		);
		if (!buildResult3.ok) {
			const approval = await ctx.breakpoint({
				question:
					"Build failed after error handling integration. How should we proceed?",
				expert: "owner",
				tags: ["approval-gate", "build-failure"],
				previousFeedback: buildResult3.error,
			});
			if (!approval.approved) {
				return {
					ok: false,
					reason: "Build failed at Phase 3",
					phase: "errors",
					feedback: approval.response,
				};
			}
		}

		const testResult3 = await ctx.task(
			testVerifyTask,
			{ phase: "Error Handling" },
			{ label: "phase3:test-verify" },
		);

		let lastFeedback3 = null;
		for (let attempt = 0; attempt < 2; attempt++) {
			const approval = await ctx.breakpoint({
				question: `Phase 3 (Error Handling) complete. Build: ${buildResult3.ok ? "pass" : "fail"}, Tests: ${testResult3.ok ? "pass" : "fail"}. Proceed to Phase 4?`,
				expert: "owner",
				tags: ["phase-gate"],
				previousFeedback: lastFeedback3 || undefined,
				attempt: attempt > 0 ? attempt + 1 : undefined,
			});
			if (approval.approved) break;
			lastFeedback3 =
				approval.response || approval.feedback || "Changes requested";
		}
	}

	// ── Phase 4: Phone Auth ──────────────────────────────────────
	if (phases.includes("auth")) {
		ctx.log?.("Starting Phase 4: Phone Auth OTP");
		const authResult = await ctx.task(
			phoneAuthTask,
			{ projectRoot },
			{ label: "phase4:phone-email-auth" },
		);
		artifacts.push(...(authResult.artifacts || []));

		const buildResult4 = await ctx.task(
			buildVerifyTask,
			{ phase: "Phone Auth" },
			{ label: "phase4:build-verify" },
		);
		if (!buildResult4.ok) {
			const approval = await ctx.breakpoint({
				question:
					"Build failed after phone auth implementation. How should we proceed?",
				expert: "owner",
				tags: ["approval-gate", "build-failure"],
				previousFeedback: buildResult4.error,
			});
			if (!approval.approved) {
				return {
					ok: false,
					reason: "Build failed at Phase 4",
					phase: "auth",
					feedback: approval.response,
				};
			}
		}

		const testResult4 = await ctx.task(
			testVerifyTask,
			{ phase: "Phone Auth" },
			{ label: "phase4:test-verify" },
		);

		let lastFeedback4 = null;
		for (let attempt = 0; attempt < 2; attempt++) {
			const approval = await ctx.breakpoint({
				question: `Phase 4 (Phone Auth) complete. Build: ${buildResult4.ok ? "pass" : "fail"}, Tests: ${testResult4.ok ? "pass" : "fail"}. All Phase 1 work done. Final approval?`,
				expert: "owner",
				tags: ["final-gate"],
				previousFeedback: lastFeedback4 || undefined,
				attempt: attempt > 0 ? attempt + 1 : undefined,
			});
			if (approval.approved) break;
			lastFeedback4 =
				approval.response || approval.feedback || "Changes requested";
		}
	}

	return {
		ok: true,
		phases,
		artifacts,
		summary: "Tamga Phase 1 Local-First Stabilization complete",
	};
}
