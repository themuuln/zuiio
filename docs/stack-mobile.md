# zuiio — Mobile Stack (React Native + Expo)

Recommended library stack for all zuiio React Native / Expo apps.

## Core

| Library | Purpose |
|---------|---------|
| `expo` SDK 53+ | Platform framework |
| `expo-router` v3 | File-based routing (same mental model as Next.js App Router) |
| `react-native-screens` + `react-native-safe-area-context` | Native screen optimization (expo-router dep) |
| `react-native-reanimated` | High-perf UI-thread animations |
| `react-native-gesture-handler` | Gesture primitives (reanimated dep) |

## Data Layer

| Library | Purpose |
|---------|---------|
| `@tanstack/react-query` | Server state, caching, optimistic updates |
| `@tanstack/react-table` | Data grids for SaaS screens |
| `@tanstack/react-form` | Type-safe form validation |
| `zustand` | Lightweight client state (auth, UI flags, selected user) |
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
| `expo-blur` | Blur effects, glass morphism surfaces |
| `expo-haptics` | Tactile feedback (set completion, timers, PRs) |
| `@gorhom/bottom-sheet` | Bottom sheet modals (exercise selection, filters, actions) |

## Charts & Visualization

| Library | Purpose |
|---------|---------|
| `victory-native` (XL) | Line, bar, area, pie charts — **Hevy's charting choice** |
| `@shopify/react-native-skia` | GPU rendering engine for Victory Native XL |
| `react-native-svg` | SVG rendering (chart axes, custom icons) |
| `react-native-calendars` | Calendar views (workout consistency, booking) |

## Health Integration

| Library | Purpose |
|---------|---------|
| `react-native-health` | Apple HealthKit (workouts, calories, steps from Apple Watch) |
| `react-native-health-connect` | Google Health Connect (Android equivalent) |

## Camera & Media

| Library | Purpose |
|---------|---------|
| `expo-camera` | Camera + barcode/QR scanning |
| `expo-image-picker` | Photo selection (progress photos, avatars, workout media) |
| `expo-video` | Video playback (exercise demos, form review) |
| `expo-file-system` | File operations (download/export, cache media) |
| `expo-sharing` | Native share sheet (workout summaries, progress reports) |

## System

| Library | Purpose |
|---------|---------|
| `expo-notifications` | Push notifications (PR alerts, coach messages, reminders) |
| `expo-linking` | Deep links (for SaaS invite flows) |
| `expo-dev-client` | Custom dev builds for native-module testing |
| `expo-splash-screen` | App launch experience |
| `expo-status-bar` | Per-screen status bar control |

## Utilities

| Library | Purpose |
|---------|---------|
| `date-fns` | Date utilities (already in `@zuiio/core`) |
| `zod` | Schema validation (already in `@zuiio/core`) |

## Monorepo packages

All apps consume shared `@zuiio/*` packages:

| Package | What it provides |
|---------|------------------|
| `@zuiio/branding` | OKLch color tokens, theme types |
| `@zuiio/core` | Formatting, validation, errors, timezone, domain rules |
| `@zuiio/hooks` | Generic React hooks |
| `@zuiio/query` | TanStack Query wrappers, optimistic CRUD |
| `@zuiio/ui-native` | RN UI primitives (shadcn-style, NativeWind-based) |
