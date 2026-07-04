# Auth Guard & Routing Investigation Report

## 1. Auth Guard Redirect Code

**File:** `lib/src/app/router/app_router.dart`

### The guard function
```dart
@visibleForTesting
String? authGuardRedirect(AuthState? authState, String location) {
  if (authState == null || authState.isLoading) return null;
  if (authState.isUnauthenticated) {
    if (!_publicRoutes.contains(location)) return '/login';
    return null;
  }
  if (authState.isAuthenticated) {
    if (location == '/login' || location == '/register') return '/lineage';
    return null;
  }
  return null;
}
```

### How it's wired in the GoRouter
```dart
redirect: (context, state) {
  final authValue = ref.read(authStateProvider);
  final authState = authValue.valueOrNull;
  final redirect = authGuardRedirect(authState, state.uri.path);
  if (redirect == null || redirect == '/login') return redirect;
  if (authState != null && authState.isAuthenticated) {
    final preservedRoute = ref.read(preservedRouteAfterReAuthProvider);
    if (preservedRoute != null && !_publicRoutes.contains(preservedRoute)) {
      ref.read(preservedRouteAfterReAuthProvider.notifier).state = null;
      return preservedRoute;
    }
  }
  return redirect;
},
```

**Behavior:**
- **Loading / null state:** No redirect (the splash screen in `TamgaApp` handles this by gating `MaterialApp.router` until auth resolves)
- **Unauthenticated:** Non-public routes → redirect to `/login`. Public routes → allow (`null`)
- **Authenticated:** `/login` or `/register` → redirect to `/lineage`. All other routes → allow. If there is a `preservedRouteAfterReAuth` (set from session expiry dialog), restore it instead of going to `/lineage`.

---

## 2. Auth State Provider Lifecycle

**File:** `lib/src/features/auth/application/auth_providers.dart`

### Provider chain
```
authRepositoryProvider (Provider<AuthRepository>)
    └─ depends on AppConfig.isSupabaseConfigured
    └─ returns SupabaseAuthRepository or _NoOpAuthRepository

authStateProvider (StreamNotifierProvider<AuthStateNotifier, AuthState>)
    └─ AuthStateNotifier.build() is the core lifecycle
```

### AuthStateNotifier.build() lifecycle
```dart
@override
Stream<AuthState> build() async* {
  final repository = ref.read(authRepositoryProvider);
  final currentResult = await repository.getCurrentUser();
  yield currentResult.isSuccess
      ? currentResult.value
      : const AuthState.unauthenticated();
  yield* repository.authStateChanges;
}
```

**Sequence:**
1. Provider is first subscribed (by `ref.watch(authStateProvider)` in `TamgaApp`)
2. `build()` runs asynchronously: calls `getCurrentUser()` (an async DB/Supabase call)
3. While waiting for `getCurrentUser()`, `authStateProvider` is in `AsyncLoading` state (`valueOrNull` is `null`)
4. `getCurrentUser()` returns: yields `AuthState.authenticated(...)` or `AuthState.unauthenticated()`
5. Then subscribes to `authStateChanges` stream (Supabase `onAuthStateChange`)
6. Future auth events (login, logout, token refresh) are emitted through this stream

### AuthState model (from `lib/src/features/auth/domain/auth_state.dart`)
```
AuthStatus: authenticated | unauthenticated | loading
AuthState: { status, userId?, email?, phone?, displayName?, avatarUrl?, isAnonymous }
```

---

## 3. All Route Paths Defined in the App

**File:** `lib/src/app/router/app_router.dart`

### Public routes (`_publicRoutes` constant, line 49-55)
| Route | Screen |
|---|---|
| `/login` | LoginScreen |
| `/register` | RegisterScreen |
| `/phone-login` | PhoneLoginScreen |
| `/phone-verify` | OtpVerifyScreen |
| `/onboarding` | OnboardingScreen |

### Top-level routes outside StatefulShell (PROTECTED)
| Route | Screen |
|---|---|
| `/race-videos` | RaceVideosScreen |
| `/search` | SearchScreen |
| `/payment` | PaymentScreen |
| `/stable` | StableScreen |
| `/certificates/verify` | VerifyCertificateScreen |
| `/certificates/:certificateId` | CertificateScreen |
| `/horses/:horseId/documents` | HorseDocumentsScreen |
| `/breeding` | BreedingScreen |

### StatefulShell tabs (PROTECTED)
| Branch | Route | Screen | Child routes |
|---|---|---|---|
| Tab 0 — Lineage | `/lineage` | LineageHomeScreen | `/lineage/coi` (InbreedingCalculatorScreen) |
| Tab 1 — Market | `/market` | MarketScreen | `/market/create`, `/market/my-listings`, `/market/price-history`, `/market/favorites`, `/market/:listingId` |
| Tab 2 — Events | `/events` | EventsScreen | — |
| Tab 3 — Lost Horse | `/lost-horse` | LostHorseFinderScreen | `/lost-horse/report`, `/lost-horse/active` |
| Tab 4 — Profile | `/profile` | ProfileScreen | `/profile/notifications` |

**Total route count:** ~23 paths (5 public + 8 top-level protected + ~10 shell routes)

---

## 4. The Race Condition: When and How It Manifests

### The current protection (already in place)

**In `app.dart` — `TamgaApp.build()`:**
```dart
final authAsync = ref.watch(authStateProvider);
final isLoading = authAsync.valueOrNull?.isLoading ?? true;

return AnimatedSwitcher(
  child: isLoading
      ? _SplashApp(key: const ValueKey('splash'))  // Shown during loading
      : MaterialApp.router(key: const ValueKey('app'), ...),  // Shown after auth resolves
);
```

**In `app_router.dart` — `authGuardRedirect()`:**
```dart
if (authState == null || authState.isLoading) return null;
```

### How the race condition is handled
1. App starts → `main()` runs → `runApp()` with `ProviderScope`
2. `TamgaApp.build()` watches `authStateProvider` → triggers `AuthStateNotifier.build()`
3. StreamNotifier starts as `AsyncLoading` → `isLoading` = `true` → **SplashScreen is shown**
4. `AuthStateNotifier.build()` awaits `getCurrentUser()` (Supabase session check)
5. `getCurrentUser()` resolves → yields `AuthState.authenticated/unauthenticated` → `isLoading` = `false` → **`MaterialApp.router` rendered**
6. GoRouter `redirect` callback fires → reads `authStateProvider` (now has a value) → applies `authGuardRedirect`

**Conclusion:** The race condition is **resolved** by the SplashScreen gating mechanism. The `MaterialApp.router` is never rendered while auth is still loading. The `authGuardRedirect` also has a null-safety check (`authState == null` → returns `null`).

### Remaining edge case
If the auth stream re-emits a `loading` state mid-session (e.g., during token refresh), the `AnimatedSwitcher` would switch back to the SplashScreen, which could be a jarring UX. This is a cosmetic issue, not a security one.

---

## 5. Public vs Private Routes — Current State

| Route | Currently Public? | Likely Should Be Public? | Rationale |
|---|---|---|---|
| `/login` | ✅ Yes | ✅ Yes | Auth screen |
| `/register` | ✅ Yes | ✅ Yes | Auth screen |
| `/phone-login` | ✅ Yes | ✅ Yes | Auth screen |
| `/phone-verify` | ✅ Yes | ✅ Yes | Auth screen |
| `/onboarding` | ✅ Yes | ✅ Yes | Pre-auth onboarding |
| `/race-videos` | ❌ No | ❓ Maybe | If videos are public content |
| `/search` | ❌ No | ❓ Maybe | If searching public horse data |
| `/certificates/verify` | ❌ No | ✅ **Yes** | QR-based verification by non-logged-in users |
| `/certificates/:certificateId` | ❌ No | ❓ Maybe | Viewing a specific certificate |
| `/lineage` | ❌ No | ❌ No | Main app home |
| `/market/*` | ❌ No | ❌ No | Marketplace |
| `/events` | ❌ No | ❌ No | Events |
| `/lost-horse/*` | ❌ No | ❌ No | Lost horse finder |
| `/profile` | ❌ No | ❌ No | User profile |
| `/stable` | ❌ No | ❌ No | Stable |
| `/breeding` | ❌ No | ❌ No | Breeding tools |
| `/horses/:horseId/documents` | ❌ No | ❌ No | User's horse docs |
| `/payment` | ❌ No | ❌ No | Payments |

---

## 6. Splash Screen / Loading State

**File:** `lib/src/core/widgets/splash_screen.dart`

- Branded splash with "Тамга" text, orange background, logo circle, and spinner
- Integrated in `TamgaApp` via `AnimatedSwitcher` (300ms transition)
- Shown during initial auth resolution (before first `AuthState` yield)
- Not shown as a GoRouter route — it's a separate `MaterialApp` wrapper used while loading

**Limitation:** No dedicated splash/loading route in GoRouter for mid-session transitions.

---

## 7. Recommended Fixes

### Issue 1: Race condition on initial load
**Severity:** LOW (already handled)
**Current protection:** SplashScreen gates `MaterialApp.router` rendering until auth state has its first value. The `authGuardRedirect` also null-checks `authState`.
**Recommendation:** No code changes needed. The existing mechanism is correct.

### Issue 2: Incomplete public route whitelist
**Severity:** MEDIUM
**Affected routes that should be public:**
- `/certificates/verify` — QR-based certificate verification is typically accessed by non-authenticated users (e.g., scanning a QR code to verify a certificate)

**Recommendation:** Add `/certificates/verify` to `_publicRoutes`:
```dart
const _publicRoutes = <String>{
  '/login',
  '/register',
  '/phone-login',
  '/phone-verify',
  '/onboarding',
  '/certificates/verify',
};
```

**Optional consideration:** `/race-videos` and `/search` could also be added if those features are intended for anonymous browsing. Review product requirements to decide.

### Issue 3: No splash/loading route during auth resolution
**Severity:** LOW (coverable by existing mechanism)
**Recommendation:** The current approach (gating `MaterialApp.router` via `AnimatedSwitcher` in `TamgaApp`) works correctly for the initial load. For mid-session re-auth, consider adding a dedicated loading route to GoRouter so the user stays within the router during transitions. This is a UX polish, not a security fix.

### Issue 4: Mid-session auth state changes could flash splash
**Severity:** LOW (cosmetic)
**Recommendation:** In `app.dart`, refine the splash display condition to only show splash on first load, not on subsequent `loading` emissions. Use a `Ref` counter to track initial resolution vs. re-auth events.

---

## 8. Files Examined

| File | Role |
|---|---|
| `lib/src/app/router/app_router.dart` | GoRouter setup, redirect guard, route definitions |
| `lib/src/app/app.dart` | `TamgaApp` widget with splash screen gating |
| `lib/main.dart` | App entry-point, initialization, initial route determination |
| `lib/src/features/auth/application/auth_providers.dart` | Auth state provider, `AuthStateNotifier` |
| `lib/src/features/auth/domain/auth_state.dart` | `AuthState` model with `AuthStatus` enum |
| `lib/src/features/auth/data/auth_repository.dart` | `AuthRepository` interface |
| `lib/src/features/auth/data/supabase_auth_repository.dart` | Supabase implementation |
| `lib/src/core/widgets/splash_screen.dart` | SplashScreen widget |
| `lib/src/app/supabase_bootstrap.dart` | Supabase initialization |
| `lib/src/app/app_config.dart` | Configuration flags |
| `.mission-investigation/auth-gaps.md` | Previous investigation report |
