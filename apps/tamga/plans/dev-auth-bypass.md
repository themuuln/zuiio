# Dev Auth Bypass

## Context

During development, every app launch requires manual Supabase auth (email/phone/OAuth). This slows iteration. The request is to auto-authenticate when running in development/debug mode so developers land directly on the main app.

## Files to Change

| File | Action | What changes |
|------|--------|--------------|
| `lib/src/features/auth/application/auth_providers.dart` | Modify | `AuthStateNotifier.build()` — when `kDebugMode`, yield a hardcoded `AuthState.authenticated()` with a dev userId, skip real Supabase session check |
| `src/lib/auth.ts` | Modify | `useAuth()` — when `__DEV__`, return a mock session object instead of calling `supabase.auth.getSession()` |

No other files change. The auth guard (`authGuardRedirect`), router, and all downstream consumers remain untouched — they already react to `AuthState.isAuthenticated`.

## Implementation Order

### 1. Flutter: `auth_providers.dart`

In `AuthStateNotifier.build()` (line 43), add an early return at the top:

```dart
@override
Stream<AuthState> build() async* {
  // Dev mode: skip Supabase, auto-authenticate.
  if (kDebugMode) {
    yield const AuthState.authenticated(
      userId: 'dev-user-000',
      email: 'dev@tamga.local',
      displayName: 'Development User',
    );
    return; // no stream — stays authenticated
  }

  // ... existing Supabase logic unchanged ...
}
```

Import `flutter/foundation.dart` for `kDebugMode` — already imported at line 1 of `app_router.dart`, but this file doesn't have it yet. Add the import.

### 2. Expo: `src/lib/auth.ts`

Wrap the existing logic in a `__DEV__` guard:

```typescript
export function useAuth() {
  // Dev mode: skip Supabase, auto-authenticate.
  if (__DEV__) {
    return {
      session: {
        user: {
          id: "dev-user-000",
          email: "dev@tamga.local",
          user_metadata: { display_name: "Development User" },
        },
        access_token: "dev-token",
      } as any,
      loading: false,
      user: {
        id: "dev-user-000",
        email: "dev@tamga.local",
      } as any,
    };
  }

  // ... existing Supabase logic unchanged ...
}
```

## Edge Cases

- **`kDebugMode` / `__DEV__`** are compile-time constants — dead code eliminated in release builds. Zero production risk.
- **Dev userId `'dev-user-000'`** won't match any real Supabase row. Features that write to DB (sync, marketplace) will fail with FK/RLS errors in dev — acceptable; the user said "for now."
- **`signOut()` still works** — it's defined on the notifier, not gated by debug mode. Toggling debug off on hot reload restores real auth.

## Verification

1. **Flutter**: `flutter run` → app launches directly to `/lineage` (no login screen)
2. **Expo**: `npx expo start` → app launches directly to main tabs (no auth screen)
3. **Release build**: `flutter build apk` / `eas build` → auth flow unchanged (compile-time dead code elimination)
