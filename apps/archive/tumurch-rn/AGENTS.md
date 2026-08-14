# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Tumurch RN — Agent Instructions

Load shared context per root `../../AGENTS.md`. For the full Tumurch product vision, read `docs/product/VISION.md`.

Tumurch RN is the React Native (Expo 57) version of the Tumurch gym platform — an all-in-one app for workout logging, coach workflows, gym operations, shop/ERP, and health tracking.

## Core Rules

1. **Expo Router file-based routing.** Entry via `expo-router/entry`. Routes live in `app/`.
2. **Supabase + TanStack Query.** All data fetching through TanStack Query. Supabase client for auth and data. Never bypass the query layer.
3. **NativeWind for styling.** Tailwind v4 classes via NativeWind. No inline style objects.
4. **Role-based navigation.** AppRole: `member | reception | manager | coach`. Role determines visible routes and actions.
5. **Mongolian-first.** All UI text in Mongolian. Currency in ₮. Phone format +976.
6. **Zustand for client state.** Lightweight local state only — server state belongs in TanStack Query.

## Commands

```bash
pnpm start                # Expo dev server
pnpm ios                  # Start on iOS simulator
pnpm android              # Start on Android emulator
pnpm web                  # Start web build
```

## Permission Boundaries

### ✅ Always
- Read the nearest `AGENTS.md` and source files being changed
- Use TanStack Query for server state, Zustand for client state
- Validate with TypeScript checks and Expo's bundler
- Preserve branch ownership and role authorization on all mutations

### ⚠️ Ask First
- Add, remove, or upgrade dependencies
- Change Supabase schema, RLS policies, or auth flow
- Modify role-based access control logic
- Add native modules beyond those already installed (Skia, camera, etc.)

### 🚫 Never
- Commit secrets, credentials, `.env` files, keys, or tokens
- Bypass RLS or omit branch/role scoping on queries
- Trust client-provided actor, role, branch, or amounts
- Silently fall back from cloud to local data
- Force-push the default branch

**Package APIs change across versions. Always use current docs, never training data.**
