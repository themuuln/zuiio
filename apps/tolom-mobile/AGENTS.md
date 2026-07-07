# Tolom Mobile

React Native (Expo) mobile app for Tolom ERP/CRM. Connects to the same Supabase backend as the web app.

## Stack

- **Framework**: Expo SDK 52 + Expo Router 4
- **UI**: NativeWind (Tailwind CSS for React Native)
- **State**: TanStack Query v5 + @zuiio/query
- **Auth**: @zuiio/auth + expo-secure-store
- **Backend**: Supabase (shared with web app)

## Setup

```bash
# Install dependencies
pnpm install

# Start Expo dev server
pnpm dev

# Run on iOS
pnpm ios

# Run on Android
pnpm android
```

## Environment Variables

Create `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Project Structure

```
src/
├── app/                 # Expo Router screens
│   ├── (tabs)/          # Tab navigation
│   │   ├── index.tsx    # Home screen
│   │   ├── work-orders/
│   │   ├── customers/
│   │   └── settings/
│   ├── (auth)/          # Auth screens
│   └── _layout.tsx      # Root layout
├── components/          # React Native components
├── lib/                 # Utilities
│   └── supabase.ts      # Supabase client config
```

## Shared Packages

Uses workspace packages from root monorepo:
- `@zuiio/core` — Pure TypeScript utilities
- `@zuiio/query` — TanStack Query patterns
- `@zuiio/supabase` — Supabase utilities
- `@zuiio/auth` — Auth context/hooks
- `@zuiio/hooks` — React hooks
- `@zuiio/branding` — Design tokens

## Code Style

- Biome formatter (tabs, double quotes)
- TypeScript strict mode
- `interface` over `type`
- Named exports only

## Tasks (Agent Router)

Use this section to find the right context for your task.

### Common tasks

- **Add a new screen** → Create in `src/app/` with Expo Router file-based routing
- **Add a new component** → Create in `src/components/` (React Native only)
- **Fetch data** → Use TanStack Query with `isPending` (not `isLoading`)
- **Auth state** → Use `useAuth()` from `@zuiio/auth`
- **Supabase queries** → Use `supabase` client from `@/lib/supabase`

### Important patterns

- **TanStack Query v5**: Use `isPending` not `isLoading`, object syntax required
- **Auth**: Web uses cookies, mobile uses expo-secure-store
- **Navigation**: Expo Router file-based routing (not React Navigation directly)
