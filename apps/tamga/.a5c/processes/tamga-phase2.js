/**
 * @process tamga-phase2
 * @description Sprint 2 Core Features MVP for Tamga Flutter app
 * @inputs { projectRoot: string, phases: string[] }
 * @outputs { success: boolean, artifacts: string[] }
 *
 * Sequential process:
 *   1. Cloud repositories (Supabase CRUD per entity)
 *   2. SyncEngine push (wire SyncQueueItem → Supabase upserts)
 *   3. Auth tests (verify phone/email auth works)
 *   4. Horse list/detail screen polish
 *   5. Health log CRUD
 *   6. Event CRUD
 *   7. Full test suite (unit + widget + integration)
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

// ── Phase D1: Cloud Repositories ─────────────────────────────────────

const cloudReposTask = defineTask("cloud-repos", (args, ctx) => ({
	kind: "orchestrator_task",
	title: "Supabase Cloud Repositories",
	description: `Create Supabase-backed repository implementations for all entities in ${args.projectRoot}.

## Architecture
- One repository per entity (Clean Architecture aligned)
- Each cloud repository implements the same interface as its local counterpart
- Use Riverpod provider to swap local vs cloud based on auth state
- All cloud repos return Result<T> for error handling

## Repositories to create
1. **SupabaseHorsesRepository** — CRUD for horses table
   - list(), get(id), create(horse), update(horse), delete(id)
   - Map Horse ↔ Supabase JSON (snake_case columns)
   
2. **SupabaseHealthRepository** — CRUD for health_logs table
   - list(horseId), create(log), update(log), delete(id)
   - Map HealthLog ↔ Supabase JSON
   
3. **SupabaseEventsRepository** — CRUD for events table
   - list(horseId), create(event), update(event), delete(id)
   - Map EventRecord ↔ Supabase JSON
   
4. **SupabaseMarketRepository** — CRUD for market_listings table
   - listPublished(), listBySeller(sellerId), create(listing), update(listing), delete(id)
   - Map MarketListing ↔ Supabase JSON
   
5. **SupabaseBreedingRepository** — CRUD for breeding_records table
   - list(ownerId), create(record), update(record), delete(id)
   - Map BreedingRecord ↔ Supabase JSON

6. **SupabaseProfileRepository** — CRUD for profiles table
   - get(userId), update(profile)
   - Map ProfileSettings ↔ Supabase JSON

## Files to create
- lib/src/features/horses/data/supabase_horses_repository.dart
- lib/src/features/horses/data/supabase_health_repository.dart
- lib/src/features/events/data/supabase_events_repository.dart
- lib/src/features/market/data/supabase_market_repository.dart
- lib/src/features/breeding/data/supabase_breeding_repository.dart
- lib/src/features/profile/data/supabase_profile_repository.dart

## Files to modify
- lib/src/features/*/application/*_providers.dart — add cloud repository providers
- lib/src/app/supabase_bootstrap.dart — ensure client is initialized

## Key patterns
- Use Supabase.instance.client.from('table_name') for queries
- Handle Supabase exceptions → AppException → Result.fail
- Map field names: camelCase (Dart) ↔ snake_case (PostgreSQL)
- Use .select() .insert() .update() .delete() .eq() from Supabase SDK`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-2", "cloud", "repositories", "supabase"],
}));

// ── Phase D2: SyncEngine Push ────────────────────────────────────────

const syncEngineTask = defineTask("sync-engine", (args, ctx) => ({
	kind: "orchestrator_task",
	title: "SyncEngine Push Implementation",
	description: `Wire the SyncEngine to actually push local changes to Supabase in ${args.projectRoot}.

## Current state
- SyncEngine exists in lib/src/core/sync/
- SyncQueueItem model exists with entity type, operation, payload
- CloudSyncCoordinator has connection gating and periodic sync
- But push logic is a TODO placeholder

## Scope
- Implement per-entity push in SyncEngine:
  - SyncQueueItem with entityType='horse' → SupabaseHorsesRepository.upsert()
  - SyncQueueItem with entityType='health' → SupabaseHealthRepository.upsert()
  - SyncQueueItem with entityType='event' → SupabaseEventsRepository.upsert()
  - SyncQueueItem with entityType='market' → SupabaseMarketRepository.upsert()
- Add conflict resolution: last-write-wins (use updated_at timestamp)
- Handle push failures: mark item as failed, retry on next sync cycle
- Add sync status indicator in UI (syncing/synced/error)
- Clear successfully pushed items from queue

## Files to modify
- lib/src/core/sync/sync_engine.dart — implement push logic
- lib/src/core/sync/cloud_sync_coordinator.dart — wire to real repos
- lib/src/core/sync/sync_queue_item.dart — add status enum (pending, synced, failed)
- lib/src/features/shell/presentation/app_shell.dart — add sync status indicator

## Testing
- Unit tests for sync queue operations
- Integration test: create local horse → trigger sync → verify Supabase has it
- Test failure handling: mock network error → verify retry behavior`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-2", "sync", "engine", "push"],
}));

// ── Phase D3: Auth Tests ─────────────────────────────────────────────

const authTestsTask = defineTask("auth-tests", (args, ctx) => ({
	kind: "orchestrator_task",
	title: "Auth Feature Test Suite",
	description: `Write comprehensive tests for the auth feature in ${args.projectRoot}.

## Test types
1. **Unit tests** — AuthState transitions, repository methods
2. **Widget tests** — Login screen, register screen UI
3. **Integration tests** — Full auth flow (register → login → authenticated state)

## Files to create/modify
- test/features/auth/auth_state_test.dart
- test/features/auth/supabase_auth_repository_test.dart
- test/features/auth/presentation/login_screen_test.dart
- test/features/auth/presentation/register_screen_test.dart
- integration_test/auth_flow_test.dart

## Test scenarios
- Register with phone (no OTP)
- Register with email + password
- Login with phone
- Login with email + password
- Auth state transitions: unauthenticated → authenticated
- Error states: invalid credentials, network error
- Anonymous → registered migration`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-2", "auth", "tests"],
}));

// ── Phase D4: Horse Screens ──────────────────────────────────────────

const horseScreensTask = defineTask("horse-screens", (args, ctx) => ({
	kind: "orchestrator_task",
	title: "Horse List/Detail Screen Polish",
	description: `Polish the horse list and detail screens in ${args.projectRoot}.

## Scope
- Horse list: pull-to-refresh, search/filter, empty state
- Horse detail: tabbed layout (info, health, events, lineage)
- Add horse: form with validation
- Edit horse: pre-filled form
- Delete horse: confirmation dialog
- Offline indicator: show when data is from local cache

## Files to modify
- lib/src/features/horses/presentation/horses_screen.dart
- lib/src/features/horses/presentation/horse_detail_screen.dart
- lib/src/features/horses/presentation/add_horse_screen.dart
- lib/src/features/horses/presentation/widgets/*.dart

## Testing
- Widget tests for list, detail, form screens
- Verify pull-to-refresh triggers sync
- Verify search filters correctly`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-2", "horses", "screens", "ui"],
}));

// ── Phase D5: Health Log CRUD ────────────────────────────────────────

const healthCrudTask = defineTask("health-crud", (args, ctx) => ({
	kind: "orchestrator_task",
	title: "Health Log CRUD Screens",
	description: `Create health log CRUD screens in ${args.projectRoot}.

## Scope
- Health log list (filtered by horse)
- Add health log form (type, date, notes, cost, farrier name)
- Edit health log
- Delete health log with confirmation
- Log types: vaccination, deworming, treatment, vetVisit, shoeing, trimming

## Files to create/modify
- lib/src/features/horses/presentation/health_logs_screen.dart
- lib/src/features/horses/presentation/add_health_log_screen.dart
- lib/src/features/horses/presentation/widgets/health_log_card.dart

## Testing
- Widget tests for health log list and form
- Verify log type selection works
- Verify date picker works`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-2", "health", "crud"],
}));

// ── Phase D6: Event CRUD ─────────────────────────────────────────────

const eventCrudTask = defineTask("event-crud", (args, ctx) => ({
	kind: "orchestrator_task",
	title: "Event CRUD Screens",
	description: `Create event CRUD screens in ${args.projectRoot}.

## Scope
- Event list (filtered by horse, with upcoming/past toggle)
- Add event form (type, title, date, location, result, prize)
- Edit event
- Delete event with confirmation
- Event types: race, competition, exhibition, training

## Files to create/modify
- lib/src/features/events/presentation/events_screen.dart
- lib/src/features/events/presentation/add_event_screen.dart
- lib/src/features/events/presentation/widgets/event_card.dart

## Testing
- Widget tests for event list and form
- Verify upcoming/past filter works
- Verify event type selection works`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-2", "events", "crud"],
}));

// ── Phase T1-T3: Full Test Suite ─────────────────────────────────────

const fullTestSuiteTask = defineTask("full-test-suite", (args, ctx) => ({
	kind: "orchestrator_task",
	title: "Full Test Suite",
	description: `Run and fix the full test suite in ${args.projectRoot}.

## Test categories
1. **Unit tests** — All domain models, repositories, providers
2. **Widget tests** — All screens and widgets
3. **Integration tests** — Critical user flows

## Commands
- flutter test (unit + widget)
- flutter test integration_test/ (integration)

## Fix any failures
- Analyze error messages
- Fix test setup issues (mocking, providers)
- Fix actual bugs discovered by tests
- Ensure all tests pass before completion`,
	io: {
		inputJsonPath: `tasks/${ctx.effectId}/input.json`,
		outputJsonPath: `tasks/${ctx.effectId}/result.json`,
	},
	labels: ["sprint-2", "tests", "quality"],
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

// ── Main Process ─────────────────────────────────────────────────────

export async function process(inputs, ctx) {
	const {
		projectRoot,
		phases = [
			"cloud-repos",
			"sync-engine",
			"auth-tests",
			"horse-screens",
			"health-crud",
			"event-crud",
			"tests",
		],
	} = inputs;
	const artifacts = [];

	// ── D1: Cloud Repositories ────────────────────────────────────
	if (phases.includes("cloud-repos")) {
		ctx.log?.("Starting D1: Cloud Repositories");
		const result = await ctx.task(
			cloudReposTask,
			{ projectRoot },
			{ label: "d1:cloud-repos" },
		);
		artifacts.push(...(result.artifacts || []));

		const buildResult = await ctx.task(
			buildVerifyTask,
			{ phase: "Cloud Repositories" },
			{ label: "d1:build-verify" },
		);
		if (!buildResult.ok) {
			const approval = await ctx.breakpoint({
				question:
					"Build failed after cloud repositories. How should we proceed?",
				expert: "owner",
				tags: ["approval-gate", "build-failure"],
				previousFeedback: buildResult.error,
			});
			if (!approval.approved) {
				return {
					ok: false,
					reason: "Build failed at D1",
					phase: "cloud-repos",
					feedback: approval.response,
				};
			}
		}
	}

	// ── D2: SyncEngine Push ──────────────────────────────────────
	if (phases.includes("sync-engine")) {
		ctx.log?.("Starting D2: SyncEngine Push");
		const result = await ctx.task(
			syncEngineTask,
			{ projectRoot },
			{ label: "d2:sync-engine" },
		);
		artifacts.push(...(result.artifacts || []));

		const buildResult = await ctx.task(
			buildVerifyTask,
			{ phase: "SyncEngine Push" },
			{ label: "d2:build-verify" },
		);
		if (!buildResult.ok) {
			const approval = await ctx.breakpoint({
				question: "Build failed after sync engine. How should we proceed?",
				expert: "owner",
				tags: ["approval-gate", "build-failure"],
				previousFeedback: buildResult.error,
			});
			if (!approval.approved) {
				return {
					ok: false,
					reason: "Build failed at D2",
					phase: "sync-engine",
					feedback: approval.response,
				};
			}
		}
	}

	// ── D3: Auth Tests ────────────────────────────────────────────
	if (phases.includes("auth-tests")) {
		ctx.log?.("Starting D3: Auth Tests");
		const result = await ctx.task(
			authTestsTask,
			{ projectRoot },
			{ label: "d3:auth-tests" },
		);
		artifacts.push(...(result.artifacts || []));
	}

	// ── D4: Horse Screens ─────────────────────────────────────────
	if (phases.includes("horse-screens")) {
		ctx.log?.("Starting D4: Horse Screens");
		const result = await ctx.task(
			horseScreensTask,
			{ projectRoot },
			{ label: "d4:horse-screens" },
		);
		artifacts.push(...(result.artifacts || []));

		const buildResult = await ctx.task(
			buildVerifyTask,
			{ phase: "Horse Screens" },
			{ label: "d4:build-verify" },
		);
		if (!buildResult.ok) {
			const approval = await ctx.breakpoint({
				question: "Build failed after horse screens. How should we proceed?",
				expert: "owner",
				tags: ["approval-gate", "build-failure"],
				previousFeedback: buildResult.error,
			});
			if (!approval.approved) {
				return {
					ok: false,
					reason: "Build failed at D4",
					phase: "horse-screens",
					feedback: approval.response,
				};
			}
		}
	}

	// ── D5: Health CRUD ───────────────────────────────────────────
	if (phases.includes("health-crud")) {
		ctx.log?.("Starting D5: Health Log CRUD");
		const result = await ctx.task(
			healthCrudTask,
			{ projectRoot },
			{ label: "d5:health-crud" },
		);
		artifacts.push(...(result.artifacts || []));

		const buildResult = await ctx.task(
			buildVerifyTask,
			{ phase: "Health CRUD" },
			{ label: "d5:build-verify" },
		);
		if (!buildResult.ok) {
			const approval = await ctx.breakpoint({
				question: "Build failed after health CRUD. How should we proceed?",
				expert: "owner",
				tags: ["approval-gate", "build-failure"],
				previousFeedback: buildResult.error,
			});
			if (!approval.approved) {
				return {
					ok: false,
					reason: "Build failed at D5",
					phase: "health-crud",
					feedback: approval.response,
				};
			}
		}
	}

	// ── D6: Event CRUD ────────────────────────────────────────────
	if (phases.includes("event-crud")) {
		ctx.log?.("Starting D6: Event CRUD");
		const result = await ctx.task(
			eventCrudTask,
			{ projectRoot },
			{ label: "d6:event-crud" },
		);
		artifacts.push(...(result.artifacts || []));

		const buildResult = await ctx.task(
			buildVerifyTask,
			{ phase: "Event CRUD" },
			{ label: "d6:build-verify" },
		);
		if (!buildResult.ok) {
			const approval = await ctx.breakpoint({
				question: "Build failed after event CRUD. How should we proceed?",
				expert: "owner",
				tags: ["approval-gate", "build-failure"],
				previousFeedback: buildResult.error,
			});
			if (!approval.approved) {
				return {
					ok: false,
					reason: "Build failed at D6",
					phase: "event-crud",
					feedback: approval.response,
				};
			}
		}
	}

	// ── T1-T3: Full Test Suite ────────────────────────────────────
	if (phases.includes("tests")) {
		ctx.log?.("Starting T1-T3: Full Test Suite");
		const result = await ctx.task(
			fullTestSuiteTask,
			{ projectRoot },
			{ label: "t1-t3:full-test-suite" },
		);
		artifacts.push(...(result.artifacts || []));

		// Final breakpoint
		let lastFeedback = null;
		for (let attempt = 0; attempt < 2; attempt++) {
			const approval = await ctx.breakpoint({
				question: `Sprint 2 complete. All tests pass. Final approval?`,
				expert: "owner",
				tags: ["final-gate"],
				previousFeedback: lastFeedback || undefined,
				attempt: attempt > 0 ? attempt + 1 : undefined,
			});
			if (approval.approved) break;
			lastFeedback =
				approval.response || approval.feedback || "Changes requested";
		}
	}

	return {
		ok: true,
		phases,
		artifacts,
		summary: "Tamga Sprint 2 Core Features MVP complete",
	};
}
