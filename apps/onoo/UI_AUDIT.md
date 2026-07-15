## UI Audit Report — 2026-07-15

### Score before changes: 5.9 / 10

| Category | Score | Notes |
|---|---:|---|
| Visual Hierarchy | 5/10 | Identity, biography, season rows, and charts had similar weight. Several completed showcase components were not composed into the page. |
| Typography | 7/10 | The base type scale was clear, but the player name and statement statistics did not feel like the primary story. |
| Depth & Layering | 5/10 | Nearly every region used the same light card treatment, flattening the profile into a settings-page rhythm. |
| Interactive States | 6/10 | Core shadcn controls were sound; public links lacked consistent active and focus treatment. |
| Responsiveness | 5/10 | The global navigation and three fixed-size shooting gauges were vulnerable to overflow at 360px. |
| Accessibility | 7/10 | Landmarks and table headers were present. Several empty components returned nothing, and chart animation was not reduced-motion aware. |
| Motion | 6/10 | Count-up motion was purposeful, but Recharts animation and hover transforms needed explicit restraint. |

### Top 3 improvements

1. **Visual hierarchy** — consolidate athlete identity and season statements into one unmistakable hero.

   Before:

   ```tsx
   <HeroCard />
   <BioCard />
   <SeasonStatsTable />
   ```

   After:

   ```tsx
   <HeroCard competitionId={activeCompetitionId} />
   <RecentGames gameLines={playerGameLog} />
   <PlayerAnalysisGrid />
   ```

2. **Responsive analysis** — keep the three shooting splits legible without horizontal page overflow.

   Before:

   ```tsx
   const GAUGE_SIZE = 112;
   <div className="flex gap-6 sm:gap-10">...</div>
   ```

   After:

   ```tsx
   const GAUGE_SIZE = 88;
   <div className="grid grid-cols-3 gap-2 sm:gap-4">...</div>
   ```

3. **Cold-start clarity** — every visual section explains what will appear when verified data arrives.

   Before:

   ```tsx
   if (gameLines.length === 0) return null;
   ```

   After:

   ```tsx
   <div className="rounded-2xl border border-dashed bg-muted/30">
     <Activity />
     <h3>Тоглолтын мэдээлэл хараахан алга</h3>
   </div>
   ```

---

## Public Surface Content Audit — 2026-07-15

### Score: 4.8 / 10

| Category | Score | Notes |
|---|---:|---|
| Visual Hierarchy | 4/10 | Most routes repeat a title, subtitle, card, and table. The live game, latest result, athlete story, and league race rarely become the dominant visual. |
| Typography | 6/10 | Type is readable, but the same scale is used for editorial stories, navigation, and database-like records. |
| Depth & Layering | 4/10 | Uniform bordered cards flatten the content; there is little distinction between primary story, supporting context, and complete records. |
| Interactive States | 5/10 | Basic hover states exist, but active navigation, useful filtering, comparison selection, and contextual actions are incomplete. |
| Responsiveness | 5/10 | Mobile access is preserved, but wide tables remain the default presentation for discovery pages. |
| Accessibility | 6/10 | Semantic headings and tables are present. Empty states lack a next action, and status/color dots often carry too much visual meaning. |
| Motion | 4/10 | The player showcase has purposeful motion, but public discovery surfaces otherwise feel static and do not communicate live or changing state. |

### Core product hierarchy

Public Onoo should answer these questions in this order:

1. What is happening now or next?
2. Who performed best?
3. How does this change the league race?
4. How do I find my player or team?
5. Where can I inspect the complete trusted record?

Tables remain available, but they belong below the visual story rather than acting as the first impression on every route.

### Recommended public navigation

- Primary: Нүүр, Тоглолт, Тоглогчид, Шалгуур, Хайлт
- Secondary: Тэргүүлэгчид, Багууд, Тоглогч харьцуулах
- Persistent context: league/competition and season selector
- Persistent trust language: `Шууд · Урьдчилсан`, `Лиг баталсан`, or `Албан ёсны`
- Mobile: five-item bottom navigation; search opens a full-width sheet
- Desktop: visible global player/team search and an active-route state

### What each page should show

| Route | Primary job | Content order |
|---|---|---|
| `/` | Give a fan the league pulse in under ten seconds | Live/tonight scoreboard; next game fallback; latest final recap with top performer; featured athlete or Player of the Week; top-three leaders snapshot; top-five standings/form; player/team search; sponsor slot |
| `/games` | Find a game by date, league, team, or status | Sticky date strip; live games; upcoming games; completed results; league/team filters; venue and competition context; useful next/previous scheduled-day empty state |
| `/games/[id]` | Tell the story of one game and preserve the trusted record | Scoreboard hero; status/review provenance; period scores; top performers; team comparison; plain-language recap; live play-by-play or final game flow; full box score; report-stat-error action |
| `/standings` | Make the league race instantly understandable and screenshot-worthy | League/season selector; qualification/playoff legend; visual top race; full standings; recent form; streak and movement; games behind; points differential; tie-break explanation |
| `/leaders` | Celebrate athletes, then allow statistical inspection | Category selector; top-three podium with photos; ranked 4–10 list; qualification rule; games played/minutes context; more categories; compare action; Player of the Week/MVP race |
| `/players` | Find a person in two taps | Prominent search; league/team/position filters; featured and recent standout players; photo-based player grid with PTS/REB/AST; sortable full directory as a secondary view; no-results recovery |
| `/players/[id]` | Be the athlete's shareable home | Identity hero; season averages; recent form; plain-language season story; trend chart; shooting profile; skill shape vs league; milestones; complete game log; share and report-error actions |
| `/players/compare` | Create a clear two-player visual duel | Real autocomplete; two large player selectors; mirrored headline stats; radar overlay; category winners; shooting/efficiency comparison; season and minimum-games context; shareable comparison card |
| `/teams/[slug]` | Express team identity and connect fans to roster and games | Team crest/colors and record; next/recent game; last-five form; team leaders; photo roster cards; team averages/differential; schedule/results; standings position |
| `/teams/[slug]/analytics` | Avoid a separate dead-end public analytics page | Fold useful verified team analytics into the team page. Keep advanced internal projections in admin unless the route is rebuilt entirely on curated public views. |

### Home page composition

Use an asymmetric editorial layout instead of a generic centered brand hero with three navigation buttons:

```text
┌──────────────────────── LIVE / TONIGHT SCOREBOARD ───────────────────────┐
│ League + date                    home  72 — 68  away        Q4  01:42    │
└───────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────┐ ┌─────────────────────────────────┐
│ Latest result + visual recap         │ │ Featured athlete                │
│ final score, turning point, leaders  │ │ photo, story, 3 statement stats│
└──────────────────────────────────────┘ └─────────────────────────────────┘
┌────────────────────────────┐ ┌────────────────────────────────────────────┐
│ Leaders: top 3             │ │ Standings: top 5 + form                   │
└────────────────────────────┘ └────────────────────────────────────────────┘
┌──────────────────── Find a player or team ────────────────────────────────┐
└───────────────────────────────────────────────────────────────────────────┘
```

Cold-start rules:

- No games today: show the next scheduled games and the latest verified result.
- No verified results: show scheduled games plus a league/roster discovery feature.
- No player photo: use the designed identity fallback, never a blank circle.
- No qualifying leaders: explain the minimum-games rule and show who is closest to qualifying.
- Never show a one-line empty card with no next action.

### Highest-return corrections before visual expansion

1. Fix logo/color modeling. `home_team_logo_url` and `team_logo_url` are currently assigned to `*_color` aliases and later used as CSS background colors.
2. Replace hardcoded team slugs in the player directory and leaders table with real public slugs from curated views.
3. Remove standings placeholders (`0`, `—`) and correct mislabeled wins/losses, percentage formatting, streak, last-10, and games-behind fields.
4. Build real comparison search; its current query function always returns `[]`.
5. Make every public empty state explain what belongs there and provide one useful route or filter reset.
6. Use Ulaanbaatar's local date for “today” instead of deriving the date from UTC.

### Top 3 public-surface improvements

1. **Home hierarchy** — replace brand-only hero navigation with a live/next-game surface.

   Before:

   ```tsx
   <section className="text-center">
     <h1>Оноо</h1>
     <Link href="/games">Тоглолтууд</Link>
     <Link href="/standings">Шалгуур</Link>
   </section>
   ```

   After:

   ```tsx
   <HomeScoreboard liveGames={liveGames} nextGames={nextGames} />
   <LatestGameStory game={latestFinal} />
   <FeaturedAthlete player={featuredPlayer} />
   ```

2. **Discovery** — replace spreadsheet-first player browsing with search and visual identity cards.

   Before:

   ```tsx
   <PlayerGrid players={players} />
   ```

   After:

   ```tsx
   <PlayerSearch />
   <FeaturedPlayers players={featuredPlayers} />
   <PlayerCardGrid players={filteredPlayers} />
   <PlayerDirectoryTable players={filteredPlayers} />
   ```

3. **Empty states** — give cold-start pages a useful next step.

   Before:

   ```tsx
   <CardContent>Энэ өдөр тоглолт товлогоогүй байна.</CardContent>
   ```

   After:

   ```tsx
   <EmptySchedule
     title="Энэ өдөр тоглолтгүй"
     nextGame={nextScheduledGame}
     actionHref="/games?date=next"
   />
   ```

### Admin and tracker direction

- `/admin`: operational queue first—games requiring setup, pending review, open stat reports, tracker health—not generic entity cards.
- `/admin/games`: status pipeline with explicit next action per game.
- `/admin/ops`: keep as the trust/reliability command center with severity, owner, age, and resolution actions.
- CRUD pages: consistent search, filter, count, complete empty state, and side-sheet editing.
- `/tracker/[gameId]`: the current game state, possession/clock context, unsynced journal count, undo/void, and handoff status must remain visible at all times.
- `/tracker/paper`: optimize only for print legibility and recovery workflow; it should not inherit public-page decoration.
