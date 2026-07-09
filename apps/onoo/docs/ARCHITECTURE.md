# Onoo — Architecture

## System Overview

Onoo is a sports statistics platform with the following architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Public Pages │  │ Admin Pages  │  │   Tracker    │      │
│  │  (SSR/PPR)   │  │  (Client)    │  │   (Client)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                          │                  │                │
│                          ▼                  ▼                │
│                   ┌─────────────────────────────┐           │
│                   │      @onoo/core             │           │
│                   │  (events, stats, format)    │           │
│                   └─────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Database   │  │ Edge Funcs   │  │   Realtime   │      │
│  │  (Postgres)  │  │ (Deno)       │  │  (WebSocket) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Event Recording (Tracker → Database)

```
1. User taps action in Tracker UI
2. createEvent() validates payload
3. EventQueue stores in IndexedDB (offline-first)
4. Queue syncs to Supabase via REST API
5. Realtime broadcasts to other clients
```

### Box Score Derivation (Database → UI)

```
1. Game ends (status = "final")
2. derive-game Edge Function triggered
3. Queries stat_events for game
4. deriveBoxScore() calculates totals
5. Writes to game_player_stats, game_team_stats
6. UI reads derived tables for display
```

### Live Updates (Realtime → UI)

```
1. Tracker client inserts stat_event
2. Supabase Realtime broadcasts change
3. LiveGameCenter receives event
4. describeEvent() renders Mongolian text
5. Box score updates in real-time
```

## Key Design Decisions

### 1. Offline-First with Sync Queue
- **Decision**: Events stored in IndexedDB before syncing to server
- **Why**: Scorekeepers need reliability in venues with poor connectivity
- **Implementation**: `EventQueue` in `@onoo/core/sync`

### 2. Derived Stats (Not Raw Aggregation)
- **Decision**: Pre-calculate box scores via Edge Function
- **Why**: Fast reads for public pages, complex calculations done once
- **Implementation**: `derive-game` function, `game_player_stats` table

### 3. Mongolian-First i18n
- **Decision**: All user-facing text in Mongolian by default
- **Why**: Primary users are Mongolian league operators
- **Implementation**: `describeEvent()` in `@onoo/core/i18n`

### 4. Server Components for Public Pages
- **Decision**: Public pages use React Server Components
- **Why**: Better SEO, faster initial load, simpler data fetching
- **Implementation**: Next.js App Router with PPR

## Database Schema

### Core Tables

```
sports ──┬── leagues ──┬── seasons ──┬── competitions
         │             │             └── games ──┬── game_rosters
         │             │                         ├── game_team_stats
         │             │                         └── game_player_stats
         │             └── team_seasons ──┬── teams
         │                               └── roster_entries ── players
         │
         └── organizations ── memberships
```

### Event System

```
stat_events ──┬── event_type (FK to stat_event_types)
              ├── game_id
              ├── player_id
              └── payload (JSONB)
```

## Security

### Row-Level Security (RLS)

| Table | Policy | Access |
|-------|--------|--------|
| `games` | Public read | Everyone |
| `games` | Admin write | Members with owner/admin role |
| `stat_events` | Public read | Everyone |
| `stat_events` | Admin write | Scorekeeper + admin |
| `profiles` | Own profile | Authenticated users |
| `memberships` | Org members | Org members only |

### Auth Flow

```
1. User signs in via Supabase Auth (email/password)
2. Session token stored in httpOnly cookie
3. RLS policies enforce org membership
4. Admin pages check membership_role
```

## Performance

### Caching Strategy

- **Public pages**: ISR with 60s revalidation
- **Admin pages**: Client-side fetching (no caching)
- **Realtime**: WebSocket connection (no polling)

### Database Optimization

- Indexes on frequently queried columns
- Materialized views for standings/leaders
- Derived stats computed async (not on read)

## Future Considerations

### Phase 3 (Mobile)

- Expo app with same `@onoo/core` package
- Offline-first with local SQLite
- Push notifications via Expo Notifications

### Scaling

- Read replicas for high-traffic periods
- Connection pooling via Supabase
- Edge Functions for compute-intensive tasks
