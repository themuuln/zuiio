# zuiio — Mobile Stack (React Native + Expo)

Recommended library stack for all zuiio React Native / Expo apps.

## Core

| Library | Purpose |
|---------|---------|
| `expo` SDK 52+ | Platform framework |
| `expo-router` | File-based routing (same mental model as Next.js App Router) |
| `react-native-screens` + `react-native-safe-area-context` | Native screen optimization (expo-router dep) |
| `react-native-reanimated` | High-perf UI-thread animations |
| `react-native-gesture-handler` | Gesture primitives (reanimated dep) |

## Data Layer

| Library | Purpose |
|---------|---------|
| `@tanstack/react-query` | Server state, caching, optimistic updates |
| `@tanstack/react-table` | Data grids for SaaS screens |
| `@tanstack/react-form` | Type-safe form validation |
| `zustand` | Lightweight client state (auth, UI flags) |
| `@react-native-async-storage/async-storage` | KV persistence for Zustand persist |
| `expo-secure-store` | Encrypted storage for tokens |

## Backend

| Library | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Database, auth, realtime, storage |
| `@supabase/ssr` | SSR helpers (if auth is needed on web) |

## UI / Styling

| Library | Purpose |
|---------|---------|
| `nativewind` | Tailwind CSS for RN — maps to `@zuiio/branding` tokens |
| `expo-image` | Optimized images with caching |
| `phosphor-react-native` | Icons (mirrors `@phosphor-icons/react` on web) |

## System

| Library | Purpose |
|---------|---------|
| `expo-notifications` | Push notifications |
| `expo-linking` | Deep links (for SaaS invite flows) |
| `expo-dev-client` | Custom dev builds for native-module testing |

## Monorepo packages

All apps consume shared `@zuiio/*` packages:

| Package | What it provides |
|---------|------------------|
| `@zuiio/branding` | OKLch color tokens, theme types |
| `@zuiio/core` | Formatting, validation, errors, timezone, domain rules |
| `@zuiio/hooks` | Generic React hooks |
| `@zuiio/query` | TanStack Query wrappers, optimistic CRUD |
| `@zuiio/ui-native` | RN UI primitives (shadcn-style, NativeWind-based) |
