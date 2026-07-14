# Auth & Route Guard Audit Report

## 1. Current Auth Routing Architecture

### Entry Point (`lib/main.dart`)
- Reads onboarding state from SharedPreferences **before** `runApp()`
- Sets `initialRouteProvider` to `/lineage` (onboarding complete) or `/onboarding` (first launch)
- This pre-routing avoids GoRouter redirects/navigation during the warm-up frame — a deliberate optimization
- `ConnectionMonitor.instance.start()` is called **after** `runApp()` to avoid platform callback issues during first frame

### GoRouter Configuration (`lib/src/app/router/app_router.dart`)
- Routes are defined in a `Provider<GoRouter>` via `appRouterProvider`
- **No `redirect` function is defined** — the router has zero guards
- The router is a flat collection of routes: auth screens, main tab shell, standalone screens
- `initialLocation` is set from `initialRouteProvider` at construction time

### Auth State (`lib/src/features/auth/application/auth_providers.dart`)
- `AuthStateNotifier` is a `StreamNotifier<AuthState>`
- On `build()`:
  1. Calls `repository.getCurrentUser()` to get initial state
  2. Yields to `repository.authStateChanges` stream forever
- `authStateProvider` is a `StreamNotifierProvider` — its value is `AsyncValue<AuthState>`
- Auth state can be: `authenticated`, `unauthenticated`, `loading`

### Auth Repository (`lib/src/features/auth/data/supabase_auth_repository.dart`)
- Implements `AuthRepository` interface
- Uses Supabase's `onAuthStateChange` stream to detect auth changes
- Handles email/password, phone OTP, anonymous, Google OAuth, Apple OAuth
- `getCurrentUser()` reads `auth.currentSession` and `auth.currentUser` directly
- On `signOut()`: removes FCM token first, then calls `auth.signOut()`, silently swallows errors

### NoOp Fallback (`_NoOpAuthRepository`)
- If `AppConfig.isSupabaseConfigured` is false, returns `_NoOpAuthRepository`
- Allows app to function fully offline with local-only storage (Isar)
- Has a fallback check: `currentSupabaseUserId()` — if anonymous auth succeeded earlier, treats as authenticated

---

## 2. What's Protected vs Unprotected

**UNPROTECTED (no auth required):**
- `/onboarding` — Onboarding flow (7 screens)
- `/login` — Email login
- `/register` — Registration
- `/phone-login` — Phone OTP login
- `/phone-verify` — OTP verification
- `/lineage` — Main lineage/home screen (tab 0)
- `/market` — Marketplace (tab 1)
- `/events` — Events/tournaments (tab 2)
- `/lost-horse` — Lost horse finder (tab 3)
- `/profile` — Profile screen (tab 4)
- `/search` — Search screen
- `/stable` — Stable screen
- `/breeding` — Breeding tools
- `/race-videos` — Race videos
- `/payment` — Payment/subscriptions
- `/certificates/*` — Certificate viewing/verification
- `/horses/*/documents` — Horse documents

**PROTECTED (by design or intention):**
- **None.** Every single route in the app is fully accessible without authentication.

**What provides implicit "protection":**
- `initialRouteProvider` chooses `/onboarding` if onboarding not completed — this gates ALL main content behind onboarding completion
- But onboarding does NOT require authentication — guests complete onboarding, then can access everything
- `ensureSupabaseUserId()` in supabase_bootstrap.dart auto-signs-in-anonymously when repositories need a user ID
- The guest registration banner in `AppShell` is a gentle nudge, not a hard gate

---

## 3. Auth Gate Gaps

### CRITICAL: No GoRouter Redirect Guard
```dart
// router/app_router.dart — NO redirect function exists
final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: ...,
    routes: [...],
    // ⚠️ NO redirect: (context, state) => ... auth check here
  );
});
```
GoRouter supports a `redirect` callback for route guards, but it's completely absent. Any unauthenticated user can navigate to any route by URL or deep link.

### CRITICAL: No Sign-Out UI
- `AuthStateNotifier.signOut()` exists and works
- `SupabaseAuthRepository.signOut()` removes FCM tokens and calls Supabase signOut
- **There is zero UI to trigger sign-out** — no button, no menu item, no gesture
- Profile settings tab has no "Sign Out" option
- Once logged in, there is no way for the user to log out without force-quitting and clearing data

### CRITICAL: Onboarding-Only Gating, Not Auth Gating
- The app checks `isOnboardingCompleted` to choose initial route
- Anonymous users complete onboarding, then get full access to everything
- `pendingSync` flag is set when a guest completes onboarding, but doesn't restrict routes
- `ensureSupabaseUserId()` auto-signs-in-anonymously when repositories need a user ID — effectively making guest auth automatic and invisible

### Onboarding → Auth Flow Gap
- The onboarding flow has 7 screens (welcome → role → region → rank → horse → notifications → sync)
- **Auth/registration is completely separate** from onboarding
- Users complete onboarding as guests, then are asked to register later via a banner in AppShell
- The `syncPendingOnboarding()` method handles migrating guest data to cloud after auth
- But there's no prompt to register during onboarding, and no forced registration at any point

### OAuth Callback Handling
- Google and Apple sign-in use `signInWithOAuth()` with `redirectTo: 'io.supabase.tamga://login-callback/'`
- There is **no deep link handler** in the app to handle this callback
- If the OAuth callback scheme isn't registered on the device, the auth flow hangs

---

## 4. Token/Session Management Gaps

### Session Refresh: Handled by Supabase SDK
- Supabase Flutter SDK automatically handles token refresh via `currentSession`
- The app never explicitly refreshes tokens or checks session expiry
- This works in most cases but has gaps:

### No Session Expiry Handling
- `auth.currentSession` can be null if the session expired while the app was backgrounded
- When `getCurrentUser()` gets a null session, it returns `unauthenticated` — but then the stream still fires
- There's no "session expired, please re-authenticate" flow
- If a Supabase API call fails with 401, the error surfaces as a generic `AUTH_ERROR` without triggering re-authentication

### Anonymous Auth Auto-Provisioning
- `ensureSupabaseUserId()` in `supabase_bootstrap.dart` auto-signs-in-anonymously
- This is called by: `SupabaseHorsesRepository`, `SupabaseEventsRepository`, `SupabaseHealthRepository`, `SupabaseBreedingRepository`, `SupabaseProfileRepository`, `CloudSyncCoordinator`, `NotificationService`
- If anonymous sign-in fails (e.g., Supabase quota exceeded), these repositories silently degrade to local-only
- There's no user-visible indicator when anonymous auth fails

### Token Refresh Failure is Silently Swallowed
- Supabase SDK handles refresh internally, but if refresh fails (network, expired refresh token):
  - `onAuthStateChange` fires `AuthChangeEvent.signedOut`
  - The app transitions to `AuthState.unauthenticated()`
  - No UI notification, no re-auth prompt, no graceful degradation

---

## 5. Error Handling Gaps

### Auth Error Display
- Login screen catches errors and shows `e.toString()` to the user
- This can leak Supabase SDK error messages (might include technical details)
- No retry mechanism beyond user re-tapping the button
- Network errors during login show as raw exception strings

### Sign-Out Error Suppression
```dart
try {
  await _auth?.signOut();
} catch (_) {
  // Нэвтрэх эрхийг цуцлах нь амжилтгүй болсон ч үргэлжлүүлнэ.
}
```
- Sign-out errors are completely suppressed — even critical failures like network errors or partial state cleanup
- FCM token removal errors are also suppressed

### Onboarding Sync Error Suppression
```dart
} catch (_) {
  // Cloud sync алдааг чимээгүй алгасах
}
```
- Both `_saveHorseRecord` and `_syncToCloud` in onboarding silently swallow errors
- If cloud sync fails during onboarding, the user thinks data is saved but it's not in Supabase

### No Auth State Persistence Check
- The app doesn't verify that the persisted auth session is still valid on app start
- If Supabase token expired overnight, the app still shows authenticated state briefly until the session check fails

### No Network-Aware Auth Operations
- Login/signup don't check `ConnectionMonitor` before making network calls
- If offline, auth attempts fail with potentially confusing errors

---

## 6. Splash/Loading Screen

- `SplashScreen` exists in `lib/src/core/widgets/splash_screen.dart` — a branded splash with app name "Тамга" and a spinner
- **However, `SplashScreen` is never imported or used anywhere** in the app
- `main.dart` directly renders `TamgaApp()` after initialization — no splash screen
- The auth state loads asynchronously via `AuthStateNotifier.build()`, but there's no loading indicator between "app started" and "auth ready"
- The initial route is determined from onboarding state (synchronous SharedPreferences read), which is fast
- Auth state is `loading` briefly, but no widget subscribes to this to show a loading state

---

## 7. Suggested Approach to Make Auth Production-Ready

### Phase 1: GoRouter Auth Guard (HIGH priority)
1. Add a `redirect` closure to `GoRouter` that checks `authStateProvider`:
   - If state is `unauthenticated` and route requires auth → redirect to `/login`
   - If state is `authenticated` and user is on `/login`/`/register` → redirect to `/lineage`
   - If state is `loading` → redirect to a loading route or stay (but don't show protected content)
   - Define a whitelist of public routes: `/login`, `/register`, `/phone-login`, `/phone-verify`, `/onboarding`

### Phase 2: Auth State UI Integration (HIGH priority)
2. **Auth loading screen**: Use `SplashScreen` (already exists, unused) during auth state resolution:
   - Show it in `TamgaApp` when `authStateProvider` has `loading` state
   - Or use GoRouter's `redirect` to hold on a splash route until auth resolves
3. **Sign-out button**: Add to settings tab in profile screen
4. **Session expired handling**: When Supabase `onAuthStateChange` fires `signedOut` unexpectedly, show a dialog explaining session expiry and redirect to login

### Phase 3: Onboarding → Auth Integration (MEDIUM priority)
5. **Move registration into onboarding flow**: Add an auth step between horse entry and notifications/sync
   - Collect email/phone during onboarding rather than deferring to a banner
   - Or at minimum, offer a "Create Account" step before showing main content
6. **Guest auth gating**: Consider what anonymous users can do:
   - Max 1 horse (aligned with free tier)
   - Show upgrade prompts at key actions
   - Don't silently auto-sign-in-anonymously for every repository call

### Phase 4: Error Handling & Resilience (MEDIUM priority)
7. **Auth error messages**: Replace raw `e.toString()` with user-friendly Mongolian messages
8. **Network-aware auth**: Check `ConnectionMonitor` before auth operations
9. **Token refresh failure**: Listen for session expiry and redirect to login with context-preserving message
10. **Retry logic**: Add exponential backoff for transient auth failures

### Phase 5: Deep Linking & OAuth (LOW priority)
11. **Custom URL scheme handler**: Register `io.supabase.tamga://` for OAuth callback handling
12. **Deep link routing**: Use GoRouter's deep link support with auth guard integration

---

## Summary Table

| Concern | Status | Severity |
|---------|--------|----------|
| GoRouter auth redirect guard | ❌ None | CRITICAL |
| Sign-out UI | ❌ None | CRITICAL |
| Onboarding gates content, not auth | ❌ Auth never required | CRITICAL |
| OAuth callback handler | ❌ No deep link handler | HIGH |
| Session expiry handling | ❌ No re-auth flow | HIGH |
| Anonymous auth auto-provisioning | ⚠️ Silent fallback | MEDIUM |
| Error messages user-friendly | ❌ `e.toString()` shown | MEDIUM |
| Auth loading state | ❌ SplashScreen unused | LOW |
| Network-aware auth | ❌ No check before calls | LOW |
| Token refresh errors surfaced | ❌ Silently suppressed | LOW |
| Sign-out UI exists | ❌ No button anywhere | CRITICAL |

---

## Files Examined

| File | Role |
|------|------|
| `lib/main.dart` | App entry, initial route from onboarding state |
| `lib/src/app/app.dart` | TamgaApp widget with MaterialApp.router |
| `lib/src/app/router/app_router.dart` | GoRouter definition, route list |
| `lib/src/app/app_config.dart` | Supabase config check |
| `lib/src/app/supabase_bootstrap.dart` | Supabase init, anonymous auth auto-provisioning |
| `lib/src/features/auth/domain/auth_state.dart` | AuthState model (authenticated/unauthenticated/loading) |
| `lib/src/features/auth/application/auth_providers.dart` | AuthStateNotifier, authRepositoryProvider |
| `lib/src/features/auth/data/auth_repository.dart` | AuthRepository interface |
| `lib/src/features/auth/data/supabase_auth_repository.dart` | Supabase auth implementation |
| `lib/src/features/auth/presentation/login_screen.dart` | Login UI (email, guest, Google, Apple) |
| `lib/src/features/auth/presentation/register_screen.dart` | Registration UI |
| `lib/src/features/auth/presentation/phone_login_screen.dart` | Phone OTP login UI |
| `lib/src/features/auth/presentation/otp_verify_screen.dart` | OTP verification UI |
| `lib/src/features/onboarding/presentation/onboarding_screen.dart` | 7-step onboarding flow |
| `lib/src/features/onboarding/application/onboarding_providers.dart` | Onboarding state (completion, pendingSync) |
| `lib/src/features/shell/presentation/app_shell.dart` | Main app shell with guest banner |
| `lib/src/features/shell/presentation/fab_menu.dart` | FAB menu (no sign-out) |
| `lib/src/features/profile/presentation/profile_screen.dart` | Profile with settings tab (no sign-out) |
| `lib/src/core/widgets/splash_screen.dart` | Branded splash screen (unused) |
| `lib/src/core/error/result.dart` | Result type for error handling |
| `lib/src/core/error/app_exception.dart` | AppException with authRequired constant |
| `lib/src/core/sync/connection_status.dart` | ConnectionMonitor singleton |
| `lib/src/features/shared/application/sync_providers.dart` | Cloud sync coordinator |
| `lib/src/features/onboarding/data/onboarding_repository.dart` | Onboarding local storage |
