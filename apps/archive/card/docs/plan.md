# Product Plan — 18+ Adult Party Night App

## Core Identity Shift

**Before**: A general game night app with UNO as the flagship game.
**After**: The definitive 18+ party game app for Friday nights — spicy questions, dares, drinking games, and UNO as a bonus.

The existing infrastructure (rooms, lobby, game picker, realtime) stays. The game library, content strategy, and visual identity shift to adult.

---

## Vibe Tier System (Content Safety)

Every party game respects a configurable vibe tier set by the host:

| Tier | Label | Content Filter | Price |
|------|-------|---------------|-------|
| 🟢 Spicy | Free tier | Flirty/cheeky, no explicit sex, mild drinking | Free |
| 🟠 Wild | Free tier | Raunchy, sexual references, heavy drinking | Free (opt-in) |
| 🔥 After Dark | Paid pack | Explicit, no limits, intended for close groups | $2.99 one-time / included in Premium |

The host sets the vibe when creating the room. Players see a content warning if Wild/After Dark is enabled.

---

## Phase 1 — Build the Party Game Engine (Current Sprint)

**Goal**: Ship Truth or Dare, Never Have I Ever, and Hot Takes — the three most-requested adult party game modes — alongside existing UNO.

### New Infrastructure Needed

1. **Question/Content Engine** (shared by all party games)
   - Central content database (Supabase table: `game_content`)
   - Each entry: `id, game_type, category, tier, text, extra_data (JSON), language`
   - Categories per game (e.g. Truth: spicy secrets, relationship, fantasies)
   - Tier filtering (spicy/wild/after-dark)
   - Content can be community-rated or flagged

2. **Voting/Reveal System** (used by Hot Takes, Most Likely To, Would You Rather)
   - Players submit votes anonymously
   - Votes revealed simultaneously after all locked in (suspense delay)
   - Results shown with breakdown per player (who voted what)
   - Built on Supabase Realtime broadcast

3. **Drinking Engine** (cross-game feature)
   - Tracks drink counts per player (optional, honor system)
   - Action types: sip, shot, assign, waterfall, group shot
   - "Play dry" mode replaces drinking with penalty points
   - Configurable per game and per room

4. **Content Management**
   - Seed content: 400+ truths, 200+ dares, 400+ Never Have I Ever statements, 300+ Hot Takes
   - Content comes from research of popular commercial games and community sources
   - Flag/report system for inappropriate content (player safety)
   - Custom content upload for hosts (v2)

### Screen Additions

- **Party Game Screen** (shared by Truth or Dare, NHIE, Hot Takes):
  - Active card/question displayed large
  - Timer per action (configurable)
  - Voting/response buttons
  - Reveal animation
  - Drinking action prompt
  - "Next" / "Skip" buttons
  - Round counter

---

## Phase 1.5 — Themed Visual Refresh

- **App color palette**: Shift to moody nightclub aesthetic (deep purples, neon pinks, dark mode default)
- **Emoji set**: Replace family-friendly emojis with suggestive alternatives
- **Icon**: Wine glass, cocktail, or devilish card suit instead of generic card
- **UI copy**: "Friday Night" positioning, "Drinks are flowing" language
- **UNO reskin**: Dark mode card backs, cocktail-themed action cards, adult house rules presets

---

## Phase 2 — Grow the Party Library

### New Game Modes
- Would You Rather (with drinking variant: minority drinks)
- Paranoia / Truth or Drink (anonymous questions to a target)
- You Laugh, You Drink (challenge cards)
- Drunk, Stoned or Stupid (assign toxic traits)
- Socials (card-based drinking game)

### Quality of Life
- Custom content upload (host writes their own questions/dares)
- Content voting (players can 👍/👎 cards for better shuffle)
- Spectator mode with drinking
- Session history (what games, what questions hit hardest)

---

## Phase 3 — Monetize

### Pricing Model (Adult Focus)
| Tier | Price | What You Get |
|------|-------|-------------|
| Free | $0 | UNO + Truth or Dare + NHIE + Hot Takes (Spicy tier), up to 8 players |
| Wild Pass | $2.99 one-time | Unlocks Wild tier content across all games, up to 12 players |
| After Dark | $2.99 one-time per pack | Explicit content packs (themed: "Naughty Night", "Couples Only", "Extreme Dares") |
| Friday Premium | $4.99/mo or $34.99/yr | Everything: Wild + After Dark, up to 20 players, custom content, game history, priority rooms |
| Group Plan | $9.99/mo | Premium for up to 5 recurring group members with shared stats |

### What's Never Paywalled
- Joining a room as a guest (always free, no account)
- Core UNO gameplay
- Spicy-tier content (enough to have fun without paying)
- Basic scoreboard

---

## Game Library Roadmap (Reprioritized)

### Phase 1 (Ship NOW)
- UNO (existing, reskinned for adults)
- Truth or Dare (400+ truths, 200+ dares, Spicy/Wild/After Dark tiers)
- Never Have I Ever (400+ statements)
- Hot Takes / Most Likely To (300+ prompts)
- Drinking engine (cross-game)

### Phase 2
- Would You Rather (300+ dilemmas)
- Paranoia / Truth or Drink
- You Laugh, You Drink
- Drunk, Stoned or Stupid
- Socials (drinking card game)
- Custom content upload

### Phase 3
- Spin the Bottle (with action cards)
- Poker (Texas Hold'em) — drinking variant
- Blackjack — drinking variant
- Two Truths One Lie

### Phase 4 (Premium Packs)
- After Dark: Explicit content expansion for all party games
- Themed packs: "Couples Night", "Bachelorette", "Holiday Party"
- Regional content packs (localized questions for different cultures)
- UNO: Adult card back + action themes

---

## Key Metrics to Track

| Metric | Target | Why |
|--------|--------|-----|
| Time to first game | < 60s | Core value prop |
| Session length | 45–90 min | Optimal party length |
| Games per session | 3+ | Switching games keeps it fresh |
| Drink game adoption | > 60% of sessions | Signals adult content is working |
| After Dark conversion | > 15% of active users | Revenue primary driver |
| Return rate w/in 7 days | > 30% | Friday night habit formation |
| Guest join rate | > 80% | Zero-friction is working |
| Content flag rate | < 1% | Safety systems working |
