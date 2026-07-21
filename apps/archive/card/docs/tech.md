# Tech Stack

## Decision: Next.js PWA (Web-Only for MVP)

**Why not React Native first:**
- Guests must join without installing anything — a web URL is the only zero-friction option
- App Store review takes 1–2 weeks, kills early iteration speed
- A PWA can be installed on the home screen when users want it
- The whole MVP can be validated with friends before touching native code

**When to add React Native:**
- After the core loop is proven (scan → join → play in 60s)
- When push notifications become critical ("Friday tonight?")
- When you want App Store presence for organic discovery

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | React, fast, Vercel-native, PWA support |
| **Styling** | Tailwind CSS + shadcn/ui | Fast to build, good mobile defaults |
| **Real-time** | Supabase Realtime | WebSocket channels for game state sync |
| **Database** | Supabase Postgres | Game state, rooms, sessions, scores |
| **Auth** | Supabase Auth | Host only — guests are anonymous |
| **Hosting** | Vercel | Zero-config, instant deploys, edge network |
| **Package manager** | pnpm | Fast, disk-efficient |

---

## Architecture

### Room System
- Host creates room → Supabase generates room record with 4-letter code
- Guests join → anonymous session tied to room ID
- All game state lives in Supabase, synced via Realtime channels
- Room expires after 24h of inactivity

### Real-time Game State
```
Room (FROG)
├── players: [{ id, name, hand: [...cards] }]
├── deck: [...remaining cards]
├── discard_pile: [...played cards]
├── current_turn: player_id
├── direction: clockwise | counterclockwise
└── state: lobby | playing | round_end | game_end
```

Each player subscribes to the room channel. State changes broadcast to all connected clients instantly.

### Guest Join (No Account)
- Guest visits `friday.app/FROG`
- Enters display name → Supabase anonymous auth session created
- Joined to room channel
- Hand dealt server-side, only their own cards visible client-side

---

## Project Structure

```
card/
├── app/
│   ├── page.tsx              # Home — "Create Room"
│   ├── [code]/
│   │   ├── page.tsx          # Lobby
│   │   └── game/page.tsx     # Active game
│   └── api/
│       ├── room/route.ts     # Create/get room
│       └── game/route.ts     # Game actions (play card, draw, etc.)
├── components/
│   ├── lobby/
│   ├── games/
│   │   └── uno/
│   └── ui/                   # shadcn components
├── lib/
│   ├── supabase.ts
│   ├── game-engine/
│   │   └── uno.ts            # UNO rules logic (pure functions)
│   └── room.ts
└── docs/
```

---

## Game Engine Design

Game logic lives in pure functions, framework-agnostic:

```ts
// lib/game-engine/uno.ts
export function playCard(state: GameState, playerId: string, card: Card): GameState
export function drawCard(state: GameState, playerId: string): GameState
export function isValidPlay(state: GameState, card: Card): boolean
export function getNextPlayer(state: GameState): string
```

State is stored in Supabase. Each action:
1. Client calls API route with action
2. Server validates action against current state (prevent cheating)
3. Server computes new state
4. New state saved to Supabase
5. Realtime broadcasts update to all clients

This pattern works for every card game — swap out the engine, same infrastructure.

---

## MVP Scope

Build in this order:

1. `Create Room` → generates code + QR code
2. `Join Room` via URL → shows lobby with player list (live)
3. `Game Picker` → simple vote UI
4. `UNO` → deal hands, play cards, enforce rules, track turns
5. `Scoreboard` → points after each round
6. PWA manifest → "Add to Home Screen" works on iOS + Android

Estimated: 2–3 weeks solo for a working MVP.
