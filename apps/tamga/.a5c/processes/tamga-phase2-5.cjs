/**
 * Sprint 2.5 — Onboarding & User Roles
 *
 * Purpose: Redesign onboarding to properly collect user type, connect to auth,
 * set up profile, and provide a guided first-run experience.
 *
 * User Types (from analysis):
 * - casual: "Нэг морьтой эзэн" — Single horse owner, basic needs
 * - breeder: "Үржүүлэгч / Уяач" — Breeder/trainer with multiple horses
 * - stable: "Жүчээ / Бизнес" — Stable/business with multiple users
 *
 * Current Gaps:
 * - UserRole collected but never synced to Supabase (no role column in profiles)
 * - No profile setup step (name, region)
 * - No auth prompt during onboarding
 * - Notification permission not actually requested
 * - SearchScreen and BreedingScreen exist but unreachable
 */

const phases = [
	{
		id: "P1",
		step: "S000001",
		task: {
			kind: "agent",
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
			labels: ["sprint-2.5", "onboarding", "schema", "domain"],
		},
	},
	{
		id: "P1-verify",
		step: "S000002",
		task: {
			kind: "shell",
			command: "flutter analyze --no-pub 2>&1 | tail -15",
			title: "Build verification: Domain Model",
		},
		blockedBy: ["P1"],
	},
	{
		id: "P2",
		step: "S000003",
		task: {
			kind: "agent",
			title: "Onboarding UI Redesign",
			description: `Redesign the onboarding flow with 5 steps in the Tamga Flutter app.

## Current Flow (to replace)
1. Welcome → 2. Role Selection → 3. Horse Entry → 4. Pedigree Preview → 5. Notifications

## New Flow
1. **Welcome** — Brand intro, "ЭХЛЭХ" button
2. **Role Selection** — Pick user type (casual/breeder/stable) with description cards
3. **Profile Setup** — Display name, region (dropdown of aimags), phone (optional)
4. **First Horse** — Add first horse (name, gender, coat color, birth year). Skip option.
5. **Auth Prompt** — "Тохиргоо хадгалах" (Save Progress) — prompt to register/login to save data to cloud. Skip saves locally only.

## Implementation

### Step 1: WelcomePage (update existing)
- Keep existing design
- No changes needed

### Step 2: RoleSelectionPage (update existing)
- Add detailed description for each role:
  - casual: "Ганц морь эзэмшдэг, энгийн хэрэгцээ"
  - breeder: "Олон морьтай, удам судалгаа, уралдаан"
  - stable: "Жүчээ бизнес, олон хэрэглэгч"
- Add icon for each role
- Visual feedback on selection (highlight, checkmark)

### Step 3: ProfileSetupPage (NEW)
- Text field for display name (required)
- Dropdown for region/aimag (21 aimags of Mongolia)
- Optional phone number field
- "Үргэлжлүүлэх" button

### Step 4: FirstHorsePage (update existing HorseEntryPage)
- Keep existing form
- Add skip button
- Show progress indicator

### Step 5: AuthPromptPage (NEW)
- Two options:
  - "Бүртгүүлэх" (Register) — navigate to register screen, then return
  - "Нэвтрэх" (Login) — navigate to login screen, then return
  - "Дараа" (Later) — save locally only, complete onboarding
- Show what's saved locally vs cloud
- Loss-aversion: "Үүлэнд хадгалалгүй бол утсаа соливол өгөгдөө алдана"

### Files to create/modify:
- lib/src/features/onboarding/presentation/onboarding_screen.dart (update page list)
- lib/src/features/onboarding/presentation/pages/welcome_page.dart (minor updates)
- lib/src/features/onboarding/presentation/pages/role_selection_page.dart (enhance)
- lib/src/features/onboarding/presentation/pages/profile_setup_page.dart (NEW)
- lib/src/features/onboarding/presentation/pages/horse_entry_page.dart (rename from HorseEntryPage)
- lib/src/features/onboarding/presentation/pages/auth_prompt_page.dart (NEW)
- Remove: pedigree_preview_page.dart, notification_page.dart (move to post-onboarding)`,
			labels: ["sprint-2.5", "onboarding", "ui", "presentation"],
		},
		blockedBy: ["P1"],
	},
	{
		id: "P2-verify",
		step: "S000004",
		task: {
			kind: "shell",
			command: "flutter analyze --no-pub 2>&1 | tail -15",
			title: "Build verification: Onboarding UI",
		},
		blockedBy: ["P2"],
	},
	{
		id: "P3",
		step: "S000005",
		task: {
			kind: "agent",
			title: "Auth Integration & Profile Sync",
			description: `Integrate onboarding with auth and sync profile to Supabase in the Tamga Flutter app.

## What to implement

1. **Onboarding completion flow**:
   - After onboarding (whether user registers or skips):
     - Save all data to Isar (local)
     - If user is authenticated: push profile + horse to Supabase
     - If user is anonymous: keep local only, show banner to register later

2. **Profile sync on login**:
   - When user logs in after completing onboarding locally:
     - Merge local data with cloud profile
     - Push any unsynced horses to Supabase
     - Update profile role in Supabase

3. **Update OnboardingNotifier** (lib/src/features/onboarding/application/onboarding_notifier.dart):
   - After complete(): check auth state
   - If authenticated: call SupabaseProfileRepository.update() with role
   - If authenticated: call SupabaseHorsesRepository for each horse
   - Mark sync status

4. **Update AppShell** (lib/src/features/shell/presentation/app_shell.dart):
   - After onboarding completion, if user is anonymous:
     - Show persistent banner: "Өгөгдөө хамгаалахын тулд бүртгүүлнэ үү"
     - Tap opens auth screen

5. **Update AuthRepository**:
   - After successful registration/login:
     - Check if there's local onboarding data
     - If yes: push to Supabase
     - Clear onboarding pending flag

Files to modify:
- lib/src/features/onboarding/application/onboarding_notifier.dart
- lib/src/features/shell/presentation/app_shell.dart
- lib/src/features/auth/data/supabase_auth_repository.dart
- lib/src/features/horses/data/supabase_horses_repository.dart`,
			labels: ["sprint-2.5", "onboarding", "auth", "sync"],
		},
		blockedBy: ["P2"],
	},
	{
		id: "P3-verify",
		step: "S000006",
		task: {
			kind: "shell",
			command: "flutter analyze --no-pub 2>&1 | tail -15",
			title: "Build verification: Auth Integration",
		},
		blockedBy: ["P3"],
	},
	{
		id: "P4",
		step: "S000007",
		task: {
			kind: "agent",
			title: "Post-Onboarding Guided Tour",
			description: `Add a guided first-run experience after onboarding completes in the Tamga Flutter app.

## What to implement

1. **Feature tour overlay** (lib/src/features/shell/presentation/feature_tour.dart):
   - Show a semi-transparent overlay highlighting each bottom nav tab
   - 5 steps: Lineage → Horses → Events → Market → Profile
   - Each step: highlight the tab, show tooltip with description
   - "Дараагийх" (Next) and "Өнгөрүүлэх" (Skip) buttons
   - Save completion to SharedPreferences (show only once)

2. **Quick action cards** (lib/src/features/shell/presentation/quick_actions.dart):
   - After tour, show contextual quick action cards on the home screen:
     - If role=casual: "Морь нэмэх" (Add horse), "Удам харах" (View lineage)
     - If role=breeder: "Морь нэмэх", "Уралдаан нэмэх" (Add event), "Үржүүлэлт" (Breeding)
     - If role=stable: "Морь нэмэх", "Зах дээр зарах" (List on market), "Хэрэглэгч нэмэх" (Add user)
   - Cards dismissible, save dismissal to SharedPreferences

3. **Wire SearchScreen and BreedingScreen into router**:
   - Add routes for /search and /breeding in go_router config
   - Add to bottom nav or as sub-routes

4. **Update AppShell**:
   - Check if tour has been shown
   - If not: show FeatureTour overlay
   - After tour: show QuickActions on home tab

Files to create:
- lib/src/features/shell/presentation/feature_tour.dart (new)
- lib/src/features/shell/presentation/quick_actions.dart (new)

Files to modify:
- lib/src/features/shell/presentation/app_shell.dart
- lib/src/app/router.dart (add missing routes)`,
			labels: ["sprint-2.5", "onboarding", "tour", "ux"],
		},
		blockedBy: ["P3"],
	},
	{
		id: "P4-verify",
		step: "S000008",
		task: {
			kind: "shell",
			command: "flutter analyze --no-pub 2>&1 | tail -15",
			title: "Build verification: Guided Tour",
		},
		blockedBy: ["P4"],
	},
	{
		id: "P5",
		step: "S000009",
		task: {
			kind: "agent",
			title: "Onboarding Tests",
			description: `Write comprehensive tests for the onboarding feature in the Tamga Flutter app.

## Tests to create

1. **test/features/onboarding/onboarding_data_test.dart**:
   - Test UserRole enum values
   - Test OnboardingData serialization
   - Test OnboardingData.copyWith

2. **test/features/onboarding/onboarding_repository_test.dart**:
   - Test save/load onboarding data
   - Test skipAll marks complete
   - Test role persistence

3. **test/features/onboarding/onboarding_notifier_test.dart**:
   - Test state transitions (step 1→2→3→4→5)
   - Test skip functionality
   - Test complete with/without horse
   - Test complete with auth vs anonymous

4. **test/features/onboarding/presentation/role_selection_page_test.dart**:
   - Test renders 3 role cards
   - Test selection highlights card
   - Test auto-advances on selection

5. **test/features/onboarding/presentation/profile_setup_page_test.dart**:
   - Test form validation (name required)
   - Test region dropdown
   - Test phone optional

6. **test/features/onboarding/presentation/auth_prompt_page_test.dart**:
   - Test shows register/login/later options
   - Test skip saves locally only

Files to create:
- test/features/onboarding/onboarding_data_test.dart
- test/features/onboarding/onboarding_repository_test.dart
- test/features/onboarding/onboarding_notifier_test.dart
- test/features/onboarding/presentation/role_selection_page_test.dart
- test/features/onboarding/presentation/profile_setup_page_test.dart
- test/features/onboarding/presentation/auth_prompt_page_test.dart

Run: flutter test test/features/onboarding/ to verify`,
			labels: ["sprint-2.5", "onboarding", "tests"],
		},
		blockedBy: ["P4"],
	},
	{
		id: "P5-verify",
		step: "S000010",
		task: {
			kind: "shell",
			command: "flutter test test/features/onboarding/ 2>&1 | tail -20",
			title: "Test verification: Onboarding Tests",
		},
		blockedBy: ["P5"],
	},
	{
		id: "final-review",
		step: "S000011",
		task: {
			kind: "breakpoint",
			title: "Sprint 2.5 Onboarding — Final Approval",
		},
		blockedBy: ["P5-verify"],
	},
];

module.exports = { phases, default: () => phases };
