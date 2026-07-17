# Tamga Flutter → RN Expo: Remaining Features

## Context

The Tamga React Native Expo app is ~80% migrated from Flutter. This plan covers the 9 remaining features. All features follow existing patterns: TanStack Query hooks, Supabase client, NativeWind styling, Expo Router, Ionicons.

## Existing Patterns

- **Query hooks**: `useQuery({ queryKey, queryFn, enabled })` — see `useHorses.ts`
- **Mutation hooks**: `useMutation({ mutationFn, onSuccess })` with `queryClient.invalidateQueries` — see `useHorseMutations.ts`
- **Supabase client**: `src/lib/supabase.ts` — pre-configured with SecureStore
- **Auth**: `useAuth()` from `src/lib/auth.ts` — returns `{ session, user, loading }`
- **Components**: `LoadingState`, `EmptyState`, `ErrorState` from `src/components/states.tsx`
- **Styling**: NativeWind classes, `className` prop, CSS var colors (`hsl(var(--primary))`)
- **Icons**: `Ionicons` from `@expo/vector-icons`
- **Navigation**: `useRouter` from `expo-router`
- **Dev user**: `DEV_USER_ID = "11111111-1111-1111-1111-111111111111"`

## Features to Implement

### 1. Google/Apple Sign-In (Worker 1 — dispatched)
**Files**: `src/app/(auth)/login.tsx`
**Approach**: Add `expo-auth-session` OAuth buttons below phone input, separated by "Эсвэл" divider. Uses `supabase.auth.signInWithOAuth()`.
**Supabase config**: Enable Google/Apple providers in Supabase dashboard.

### 2. Tab Bar Layout Fix (Worker 1 — dispatched)
**Files**: `src/app/(tabs)/_layout.tsx`
**Approach**: Add 3 missing tabs: Documents (Баримт), Transfers (Шилжүүлэг), Notifications (Мэдэгдэл). Tab bar scrolls horizontally.

### 3. Lost Horse Finder (Worker 2)
**Files to create**:
- `src/app/lost-horse/report.tsx` — Report lost horse form (description, photo, location, contact)
- `src/app/lost-horse/search.tsx` — Map view of lost horse sightings + list
- `src/hooks/useLostHorses.ts` — Query hooks for lost_horses table
- `src/hooks/useLostHorseMutations.ts` — Create/update/report sighting

**Supabase table** (migration needed):
```sql
create table lost_horses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id),
  horse_id uuid references horses(id),
  horse_name text not null,
  description text,
  last_seen_lat double precision,
  last_seen_lng double precision,
  last_seen_location text,
  contact_phone text,
  photo_url text,
  status text default 'lost', -- lost, found, expired
  reward_amount numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**Screens**:
- Report: Form with horse name, description, photo picker, location picker, contact, reward
- Search: MapLibre map showing lost markers + FlatList of recent reports

### 4. Co-Ownership (Worker 3)
**Files to create**:
- `src/app/horse/[id]/co-owners.tsx` — List co-owners, invite, revoke
- `src/hooks/useCoOwners.ts` — Query + mutation hooks

**Supabase table**:
```sql
create table co_owners (
  id uuid primary key default gen_random_uuid(),
  horse_id uuid references horses(id) on delete cascade,
  user_id uuid references auth.users(id),
  role text default 'viewer', -- owner, manager, viewer
  invited_by uuid references auth.users(id),
  status text default 'pending', -- pending, accepted, revoked
  created_at timestamptz default now()
);
```

**Screen**: Shows current co-owners, invite by phone/email, change roles, revoke access.

### 5. Digital Certificates (Worker 4a)
**Files to create**:
- `src/app/horse/[id]/certificates.tsx` — List + create certificates
- `src/hooks/useCertificates.ts` — Query + mutation hooks

**Supabase table**:
```sql
create table certificates (
  id uuid primary key default gen_random_uuid(),
  horse_id uuid references horses(id) on delete cascade,
  owner_id uuid references auth.users(id),
  type text not null, -- registration, health, breeding, ownership
  title text not null,
  data jsonb default '{}',
  issued_at timestamptz default now(),
  expires_at timestamptz,
  created_at timestamptz default now()
);
```

**Screen**: List certificates per horse, create new with type/title, export as image (use `expo-sharing` + `expo-file-system` to generate and share).

### 6. Public Tournament Profiles (Worker 4b)
**Files to create**:
- `src/app/marketplace/tournament/[id].tsx` — Public tournament profile
- `src/hooks/useTournamentProfiles.ts` — Query hooks

**Supabase table**:
```sql
create table tournament_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  horse_id uuid references horses(id),
  tournament_name text not null,
  placement text,
  date date,
  notes text,
  is_public boolean default true,
  created_at timestamptz default now()
);
```

**Screen**: Public profile showing horse's tournament history, stats, placement badges. Linked from marketplace listing.

### 7. Marketplace Boost/VIP (Worker 5)
**Files to create**:
- `src/app/market/boost.tsx` — Boost management screen
- `src/hooks/useBoostMutations.ts` — Boost create/cancel hooks

**Supabase table**:
```sql
create table listing_boosts (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade,
  user_id uuid references auth.users(id),
  tier text default 'featured', -- featured, vip, premium
  starts_at timestamptz default now(),
  expires_at timestamptz,
  payment_amount numeric default 0,
  created_at timestamptz default now()
);
```

**Screen**: Select boost tier, see pricing (MNT), activate boost for a listing. Shows active boosts with expiry countdown.

### 8. Offline Sync Queue (Worker 6)
**Files to create**:
- `src/database/sync/SyncEngine.ts` — Core sync engine class
- `src/database/sync/PullStrategy.ts` — Pull from Supabase → WatermelonDB
- `src/database/sync/PushStrategy.ts` — Push dirty records from WatermelonDB → Supabase
- `src/database/sync/ConflictResolver.ts` — Last-write-wins strategy
- `src/hooks/useSync.ts` — useSyncStatus hook + manual sync trigger

**Approach**:
- WatermelonDB already has `sync_queue` table in schema (version 1)
- SyncEngine iterates dirty records, batches upserts to Supabase, marks clean
- Pull uses `updated_at` watermark per table — only fetches newer records
- Push sends dirty records (watermelondb `_status` column), resolves conflicts with last-write-wins
- `useSyncStatus` returns `{ isSyncing, lastSync, pendingChanges, error }`
- Auto-sync on app foreground + network reconnect

**Pattern**: Follow WatermelonDB's official sync protocol pattern (watermelondb/Sync)

### 9. Pagination (Worker 6)
**Files to modify**:
- `src/app/(tabs)/index.tsx` — Horse list
- `src/app/(tabs)/market.tsx` — Marketplace
- `src/app/(tabs)/events.tsx` — Events

**Approach**: Add `FlatList` pagination:
- `onEndReachedThreshold={0.5}`
- `onEndReached` callback loads next page
- Query hooks gain `page` param, Supabase queries use `.range(offset, offset + limit)`
- Loading indicator at bottom during fetch
- Pull-to-refresh on all lists

## Implementation Order

1. **Worker 1** (dispatched): Auth providers + Tab bar
2. **Worker 2**: Lost horse finder (standalone)
3. **Worker 3**: Co-ownership (standalone)
4. **Worker 4**: Certificates + Tournament profiles (standalone)
5. **Worker 5**: Marketplace boost (standalone)
6. **Worker 6**: Offline sync + Pagination (standalone)
7. **Supabase migration**: Apply all new tables after workers complete
8. **Verification**: Typecheck + smoke test

## Verification

1. `npx tsc --noEmit` — zero type errors
2. `expo start` — app launches without crashes
3. Each new screen is navigable from its entry point
4. All hooks return proper types (no `any`)
5. Supabase tables exist via `list_tables` MCP
