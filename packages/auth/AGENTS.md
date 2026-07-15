# @zuiio/auth

React authentication context and hooks for Supabase Auth. Provides a provider pattern with typed state and actions. All products federate to the central Zuiio identity via SSO — no product handles password/email signup directly.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `SupabaseAuthProvider` | Component | Wraps app root, provides auth context |
| `useAuth` | Hook | Access auth state + actions (signInWithZuiio, signOut) |
| `useSession` | Hook | Returns current Session or null |
| `useRequireAuth` | Hook | Redirects to login if unauthenticated |
| `startZuiioSso` | Function | Initiates SSO login via `custom:zuiio` provider |
| `exchangeZuiioSsoCode` | Function | Exchanges product-project PKCE code for session |
| `ZUIIO_OIDC_PROVIDER` | Constant | `"custom:zuiio"` provider identifier |
| `AuthState` | Type | `{ status: "loading" \| "authenticated" \| "unauthenticated" }` |
| `AuthActions` | Type | `{ signInWithZuiio, signOut }` |
| `AuthContextValue` | Type | Combined state + actions |
| `ZuiioSsoResult` | Type | `{ url: string \| null, error: string \| null }` |

## Usage

### Provider setup

```tsx
"use client";
import { SupabaseAuthProvider } from "@zuiio/auth";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RootLayout({ children }) {
  return (
    <SupabaseAuthProvider
      supabase={supabase}
      onSignOut={() => router.push("/login")}
      loadingFallback={<LoadingSpinner />}
    >
      {children}
    </SupabaseAuthProvider>
  );
}
```

### Using the hooks

```tsx
"use client";
import { useAuth, useSession, useRequireAuth } from "@zuiio/auth";

function Dashboard() {
  const { state, actions } = useAuth();
  const session = useSession();
  
  // Redirect if not authenticated
  useRequireAuth("/login");
  
  if (state.status === "loading") return <Spinner />;
  if (state.status === "unauthenticated") return null;
  
  return (
    <div>
      <p>Welcome, {session?.user.email}</p>
      <button onClick={() => actions.signOut()}>Sign out</button>
    </div>
  );
}
```

## Dependencies

- `@supabase/supabase-js` — Supabase client
- `react` — React 19+

## Notes

- Client-side only (`"use client"` directive)
- Session is cached in React state, synced via Supabase auth listener
- `useRequireAuth` handles redirect logic — no manual checks needed
