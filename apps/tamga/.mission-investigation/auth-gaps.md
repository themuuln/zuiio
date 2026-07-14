# Auth & Routing Security Gaps — Investigation Report

## Status Overview

The existing `auth_routing_report.md` was written before the GoRouter redirect guard and splash screen integration were implemented. The current code (uncommitted changes in `app_router.dart` and `app.dart`) has **partially addressed** some of the gaps, but several critical issues remain.

---

## 1. GoRouter Auth Redirect Guard

### Current Status: ✅ IMPLEMENTED (recently added)

The redirect guard was added in uncommitted changes to `app_router.dart`.

**File:** `lib/src/app/router/app_router.dart`

**Implementation details:**
- `_publicRoutes` (line 49-55) — Whitelist of routes accessible without auth:
  ```dart
  const _publicRoutes = <String>{
    '/login',
    '/register',
    '/phone-login',
    '/phone-verify',
    '/onboarding',
  };
  ```
- `authGuardRedirect()` (line 62-83) — Pure function with redirect logic:
  - `null`/loading state → `null` (no redirect, splash screen shown)
  - Unauthenticated + non-public route → redirect to `/login`
  - Authenticated + on `/login`/`/register` → redirect to `/lineage`
- `routerRefreshProvider` (line 40-44) — `ValueNotifier<int>` incremented when auth state changes, triggering GoRouter redirect re-evaluation
- Redirect wired in `appRouterProvider` (line 101-105):
  ```dart
  redirect: (context, state) {
    final authValue = ref.read(authStateProvider);
    return authGuardRedirect(authValue.valueOrNull, state.uri.path);
  },
  ```

### Key observation — The file changed from "no redirect" to having a full guard. The report's #1 critical gap is now addressed.

### Remaining issues with the redirect guard:

| Issue | Detail |
|-------|--------|
| **Race on initial load** | `ref.read(authStateProvider)` returns `AsyncValue.loading()` before the stream emits. If `MaterialApp.router` is shown before auth resolves (shouldn't happen per `app.dart` logic, but worth hardening) |
| **Public route whitelist is incomplete** | `/race-videos` and `/search` are top-level routes outside the StatefulShell. Should they be public? `/certificates/verify` (certificate verification via QR code) might need to be public too |
| **No splash/loading route** | During auth resolution, no intermediate route exists — the splash screen in `app.dart` gates the entire `MaterialApp.router`, so there's no "stay on current page" during re-auth |

### Suggested improvements:
1. Consider adding routes like `/race-videos`, `/search`, `/certificates/verify` to `_publicRoutes` if they're meant to be publicly accessible
2. Add a dedicated splash/loading route to GoRouter for mid-session re-auth scenarios

---

## 2. Public vs Protected Routes

### Current Whitelist (from `app_router.dart`):

| Route | Access | Notes |
|-------|--------|-------|
| `/login` | Public | Auth screen |
| `/register` | Public | Auth screen |
| `/phone-login` | Public | Auth screen |
| `/phone-verify` | Public | Auth screen |
| `/onboarding` | Public | 7-step onboarding flow |
| `/lineage` | Protected | Main home (tab 0) |
| `/market` | Protected | Marketplace (tab 1) |
| `/events` | Protected | Events (tab 2) |
| `/lost-horse` | Protected | Lost horse finder (tab 3) |
| `/profile` | Protected | Profile (tab 4) |
| `/search` | Protected | Outside shell — should it be public? |
| `/stable` | Protected | Outside shell |
| `/breeding` | Protected | Outside shell |
| `/race-videos` | Protected | Outside shell — should it be public? |
| `/payment` | Protected | Outside shell |
| `/certificates/*` | Protected | Includes `/certificates/verify` which should be public |
| `/horses/*/documents` | Protected | |


### Routes that might need public access:
- `/certificates/verify` — QR-based certificate verification, typical use case is by non-logged-in users
- `/race-videos` — If race videos are public content
- `/search` — If searching public horse data

### Suggested changes to `_publicRoutes`:
```dart
const _publicRoutes = <String>{
  '/login',
  '/register',
  '/phone-login',
  '/phone-verify',
  '/onboarding',
  '/certificates/verify',  // Public certificate verification
};
```

---

## 3. Sign-Out UI — Add to Profile Screen

### Current Status: ❌ MISSING

`AuthStateNotifier.signOut()` exists and works:
- **File:** `lib/src/features/auth/application/auth_providers.dart` (line 99-103)
- Signature: `Future<void> signOut()`
- `SupabaseAuthRepository.signOut()` removes FCM tokens, then calls `_auth?.signOut()`

But there is **zero UI** to trigger sign-out anywhere in the app.

### Where to add it:

**File:** `lib/src/features/profile/presentation/profile_screen.dart`

**Location:** In the `_SettingsTab` widget (approximately line 300+, after the "Restart onboarding" card in the settings list).

**Component to add:** A card with a "Sign Out" / "Гарах" option, using `Icons.logout` or `Icons.exit_to_app`. The button should:
1. Call `ref.read(authStateProvider.notifier).signOut()`
2. After sign-out, the redirect guard will automatically redirect to `/login`
3. Show a confirmation dialog before signing out (in case of accidental tap)

**Suggested implementation pattern (for insertion after the onboarding restart card in `_SettingsTab`):**

```dart
// ── Sign Out ─────────────────────────────────────────
const SizedBox(height: AppSpacing.md),
Card(
  child: ListTile(
    leading: Icon(
      Icons.logout,
      color: theme.colorScheme.error,
    ),
    title: Text(
      'Гарах / Sign Out',
      style: TextStyle(color: theme.colorScheme.error),
    ),
    subtitle: const Text('Нэвтрэх хуудас руу буцах'),
    onTap: () async {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Гарах уу?'),
          content: const Text(
            'Та системээс гарахдаа итгэлтэй байна уу? '
            'Өгөгдөл устахгүй.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Цуцлах'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Гарах'),
            ),
          ],
        ),
      );
      if (confirmed == true && context.mounted) {
        await ref.read(authStateProvider.notifier).signOut();
      }
    },
  ),
),
```

---

## 4. Splash Screen Status

### Current Status: ✅ NOW INTEGRATED (in uncommitted changes)

The `SplashScreen` was previously unused but has been integrated in `app.dart`:

**File:** `lib/src/core/widgets/splash_screen.dart`
- Displays "Тамга" branding with orange background, logo circle, and spinner
- Uses `TamgaColors` for theming

**Integration in `app.dart`:**
```dart
final authAsync = ref.watch(authStateProvider);
final isLoading = authAsync.valueOrNull?.isLoading ?? true;

return AnimatedSwitcher(
  child: isLoading
      ? _SplashApp(key: const ValueKey('splash'))
      : MaterialApp.router(key: const ValueKey('app'), ...),
);
```

### Does it work?
- ✅ Shows during initial auth state resolution (first stream emission)
- ✅ Smooth 300ms `AnimatedSwitcher` transition to the main app
- ❌ Only covers **initial** loading. During mid-session re-auth events (e.g., token refresh failure → stream fires loading), the `AnimatedSwitcher` would switch back to splash, which could be jarring

### What's needed:
1. Consider a GoRouter loading route for mid-session auth transitions instead of switching the entire app
2. The splash is a static `StatelessWidget` — consider making it an animated landing page with the app's brand

---

## 5. Auth Providers and Their Signatures

### Available providers (from `lib/src/features/auth/application/auth_providers.dart`):

| Provider | Type | Description |
|----------|------|-------------|
| `authRepositoryProvider` | `Provider<AuthRepository>` | Auth repository (Supabase or NoOp) |
| `authStateProvider` | `StreamNotifierProvider<AuthStateNotifier, AuthState>` | Auth state stream |

### `AuthStateNotifier` methods (available for the redirect guard / sign-out):

| Method | Signature | Description |
|--------|-----------|-------------|
| `signOut()` | `Future<void> signOut()` | Signs out current user |
| `signInWithEmail()` | `Future<void> signInWithEmail({required String email, required String password})` | Email/password login |
| `signInAnonymously()` | `Future<void> signInAnonymously()` | Guest login |
| `signInWithGoogle()` | `Future<void> signInWithGoogle()` | Google OAuth |
| `signInWithApple()` | `Future<void> signInWithApple()` | Apple OAuth |
| `signInWithPhone()` | `Future<void> signInWithPhone({required String phone})` | Phone OTP |
| `verifyPhoneOtp()` | `Future<void> verifyPhoneOtp({required String phone, required String token})` | OTP verification |

### `AuthState` model (from `lib/src/features/auth/domain/auth_state.dart`):

| Property | Type | Description |
|----------|------|-------------|
| `status` | `AuthStatus` | `authenticated`, `unauthenticated`, `loading` |
| `userId` | `String?` | Supabase user ID |
| `email` | `String?` | User email |
| `phone` | `String?` | User phone |
| `isAnonymous` | `bool` | Whether guest user |
| `isAuthenticated` | `bool` (getter) | Status == authenticated |
| `isUnauthenticated` | `bool` (getter) | Status == unauthenticated |
| `isLoading` | `bool` (getter) | Status == loading |

### How to consume in the redirect guard (already done):
```dart
final authValue = ref.read(authStateProvider);  // AsyncValue<AuthState>
final authState = authValue.valueOrNull;         // AuthState?
```

---

## 6. Gaps That Remain Unaddressed

### CRITICAL: OAuth Deep Link Handler
**Files involved:** `lib/src/features/auth/data/supabase_auth_repository.dart` (lines with `redirectTo: 'io.supabase.tamga://login-callback/'`)

**Issue:** Google and Apple OAuth use a custom URL scheme `io.supabase.tamga://login-callback/` but:
- No URL scheme is registered in any platform config:
  - `ios/Runner/Info.plist` — no `CFBundleURLTypes` for the scheme
  - `android/app/src/main/AndroidManifest.xml` — no intent filter for the scheme
  - `macos/Runner/Info.plist` — no scheme handler
- No Supabase `deepLink` handler is configured in `main.dart` or bootstrap

**What needs to happen:**
1. Register the URL scheme on each platform:
   - **iOS** (`ios/Runner/Info.plist`): Add `CFBundleURLTypes` with `io.supabase.tamga` scheme
   - **Android** (`android/app/src/main/AndroidManifest.xml`): Add intent filter for `io.supabase.tamga://login-callback/`
   - **macOS** (`macos/Runner/Info.plist`): Similar to iOS
2. Configure Supabase deep link handler in `main.dart`:
   ```dart
   await Supabase.initialize(
     url: ...,
     anonKey: ...,
     // No deepLinkHandler currently configured
   );
   ```

### CRITICAL: Session Expiry Handling
**Issue:** There's no mechanism to handle session expiry gracefully. If the Supabase session expires while the app is backgrounded:
1. `getCurrentUser()` returns `unauthenticated`
2. The auth stream fires `signedOut`
3. User is silently redirected to `/login` with no explanation
4. Any in-progress work is lost

**What's needed:**
1. Listen for `AuthChangeEvent.signedOut` and show a "Session expired" dialog
2. Capture the current route before redirect to restore after re-auth (context preservation)
3. Consider a `GoRouter` error page for "session expired" state

### MEDIUM: Auth Error Handling
- Login screen shows raw `e.toString()` errors — needs user-friendly Mongolian messages
- No network check before auth operations

### MEDIUM: Guest Banner in AppShell
- The guest banner at `lib/src/features/shell/presentation/app_shell.dart` (lines 140-148) only nudges users to register but doesn't restrict functionality
- Consider whether anonymous users should have limited access (e.g., max 1 horse)

---

## 7. Summary: Files That Need Changes

| File | What to Change | Priority |
|------|---------------|----------|
| `lib/src/app/router/app_router.dart` | Possibly add `/certificates/verify` to `_publicRoutes` | LOW |
| `lib/src/features/profile/presentation/profile_screen.dart` | Add sign-out button in `_SettingsTab` | HIGH |
| `lib/src/features/auth/data/supabase_auth_repository.dart` | Improve error handling, expose session expiry events | MEDIUM |
| `ios/Runner/Info.plist` | Register `io.supabase.tamga` URL scheme for OAuth | HIGH |
| `android/app/src/main/AndroidManifest.xml` | Register intent filter for OAuth callback | HIGH |
| `macos/Runner/Info.plist` | Register URL scheme for OAuth | HIGH |
| `lib/main.dart` | Configure Supabase `deepLinkHandler` | HIGH |
| `lib/src/features/auth/presentation/login_screen.dart` | Replace `e.toString()` with user-friendly messages | MEDIUM |

---

## 8. Implementation Approach per Issue

### Approach 1: Sign-Out UI (HIGH)
1. Edit `lib/src/features/profile/presentation/profile_screen.dart`
2. Add a "Гарах / Sign Out" card at the bottom of `_SettingsTab` (after the onboarding restart item)
3. Use confirmation dialog before executing `ref.read(authStateProvider.notifier).signOut()`
4. The redirect guard automatically navigates to `/login` after sign-out

### Approach 2: OAuth Deep Link Handler (HIGH)
1. Register URL scheme `io.supabase.tamga` in all platform config files
2. In `main.dart`, configure Supabase deep link handler:
   - `Supabase.initialize(..., deepLinkHandler: ...)`
   - Or use `appRef` to handle incoming links
3. Test with Google/Apple OAuth flow end-to-end

### Approach 3: Session Expiry (MEDIUM)
1. In `AuthStateNotifier` or a new middleware, listen for `AuthChangeEvent.signedOut`
2. Store the pre-signout route
3. Show a dialog: "Таны нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү."
4. Provide a "Re-authenticate" button that preserves the intended destination
5. After re-auth, redirect to the preserved route instead of `/lineage`

### Approach 4: Auth Error Messages (MEDIUM)
1. Create a map of error codes → Mongolian user-friendly messages
2. Replace `e.toString()` in `login_screen.dart`, `register_screen.dart`, etc.
3. Add network checks before auth operations using `ConnectionMonitor`
