# FIBA.basketball & MaxPreps UI Analysis

> Research conducted 2026-07-19 via Firecrawl scraping of public pages. Visual screenshots attempted but browser automation was not available; analysis is based on scraped HTML/markdown structure and metadata.

---

## FIBA.basketball

### Landing Page
- **Layout**: Content-heavy, editorial-first design. Single-column feed flow with a right sidebar for rankings and countdown timers. Dark theme with high-contrast imagery.
- **Hero treatment**: Horizontal scrollable carousel of ~40+ social-media-style cards (image + short caption, e.g. "Joker's back", "Ankle-breaker?", "7'5\" girl dominating!"). These are visual-first, headline-driven — optimized for casual browsing and sharing.
- **Navigation**: Top nav bar with mega-menu dropdowns. Key sections: Men, Women, 3x3, Players, Teams, Events, News, Stats & Rankings. Language selector for multilingual support. Sign-in for accounts.
- **Content sections**:
  1. **Social carousel** — Instagram-story-style visual cards, scrollable horizontally
  2. **Top News** — 20+ article cards in a grid (216×330px portrait images), each with bold headline
  3. **"For you" personalized feed** — Mixed content: articles (tagged "Short Read", "Preview", "Poll"), YouTube video embeds, live game scorecards, player spotlight cards with FIBA profile links
  4. **Courtside 1891 streaming promo** — Sponsored streaming CTA
  5. **Nike World Rankings sidebar** — Top 5 men's rankings with +/- changes
  6. **Countdown timers** — Days/Hours/Minutes to next major events (Women's WC, Men's WC 2027)
  7. **Ticket registration CTA** — "Register Now" for World Cup 2027

### Tournament/Stats (Event Pages)
- **Tournament presentation**: Each competition gets its own branded sub-site (e.g., `/en/events/fiba-u17-womens-basketball-world-cup-2026`). Events organized hierarchically: World Cups → Continental → Qualifiers → Age groups (U16/U17/U18/U20) → Regional (EuroBasket, AfroBasket, Asia Cup). Each event page is a self-contained hub.
- **Event page structure** (observed from U17 Women's WC and U20 EuroBasket):
  1. **News carousel** — Featured stories with article type tags ("Preview", "Short Read", "Poll", "Game Report", "Long Read")
  2. **Games section** — Every game displayed as a compact scorecard: Round label (e.g. "Group Phase · Group A"), status ("Final", "Live", "Half-Time", "Warm-up"), team 3-letter codes with flag images, scores. Games grouped by phase (Group → Round of 16 → QF → SF → Final). Live games show quarter/time info.
  3. **Video highlights** — YouTube embeds with thumbnails, timestamps, and share buttons
  4. **Standings** — Group Phase tables + Classification tables + visual bracket for knockout rounds
  5. **Bracket view** — Visual tournament bracket showing matchups with scores, game numbers, dates
  6. **Leaderboard** — Top 3 per stat category: Efficiency, Points, Rebounds, Assists, Steals, Blocks (all "Per game"). Each entry shows: country code, player first/last name, stat value. "View All" links to full stats page.
  7. **Latest news** — Article cards with portrait thumbnails

- **Ranking table design** (from `/en/ranking/men`):
  - Full-width table: `# | country | zone rank | PTS | +/-`
  - 160 countries listed, clickable rows linking to team profiles
  - Region filter tabs: World, Africa, Americas, Asia, Europe
  - Historical date selector dropdown (2010–2026)
  - Side panels: "Biggest Climbers" and "Biggest Droppers" mini-tables (top 5)
  - "How it works?", "FAQ", "Detailed Examples" links for transparency

- **Player presentation**: Players linked to individual FIBA profiles (e.g., `/en/players/347171-anthony-edwards`). Player spotlight cards appear in the "For you" feed with name + "Check out his FIBA profile" CTA. In leaderboards: player name (first/last) + country flag + stat value. No headshots in leaderboard view — focus is on country representation.

### Key Patterns
1. **Event-as-hub**: Each tournament is a self-contained microsite with its own news, games, standings, stats, videos — not just a page in a list. This creates deep engagement per competition.
2. **Social-first content**: The homepage carousel uses short, punchy captions on dramatic images — borrowed from Instagram/TikTok patterns. Low friction, high visual impact.
3. **Dual-feed approach**: "Top News" (editorial, curated) + "For you" (algorithmic/personalized) — catters to both discovery and return visitors.
4. **Countdown urgency**: Prominent countdown timers to upcoming events create FOMO and drive ticket registration.
5. **Classification rounds**: Even lower-ranked teams get their own classification brackets (9-16, 13-16, 15-16) — every team plays meaningful games until the end.
6. **Leaderboard as preview**: The event page shows only top 3 per category as a teaser, with "View All" to the full stats page — keeps the page scannable.

### Strengths
- Rich, editorial storytelling woven into stats (player spotlights, game previews, MVP voting polls)
- Complete tournament lifecycle: qualification → group → knockout → classification → final stats
- International breadth: 160 countries in rankings, multi-regional qualifiers
- YouTube integration for free game streaming/highlights
- Interactive voting (MVP polls, "Group of Death" polls) drive engagement
- Sponsor integration is tasteful (Nike ranking, Tissot timekeeping, Courtside 1891 streaming)

### Weaknesses/Gaps
- Homepage is overwhelming — 40+ carousel items, 20+ news cards, mixed content types compete for attention
- No visible player stat rankings on the homepage — you must drill into specific events
- Leaderboard on event pages shows only top 3 per category — no quick top-10 glance
- No clear "live now" persistent indicator — live games appear in the feed but aren't surfaced prominently
- Tournament bracket visual is text-heavy in the scraped version — unclear if it renders as a proper visual bracket
- Mobile navigation complexity (mega-menu with 6+ sports × gender × sub-sections) could be challenging

---

## MaxPreps.com

### Landing Page
- **Layout**: Sports portal pattern — top mega-nav, hero area with featured article, two-column content below (main feed + sidebar). Clean white/light theme with dark nav bar.
- **Hero treatment**: Single large featured article with full-width image and headline overlay. Author attribution + date. Below: video player with thumbnail. Typical news portal hero pattern.
- **Navigation**: Multi-tier navigation:
  1. **Top bar**: MaxPreps | GoFan | NFHS Network | MaxPreps Advantage (PlayOn family brands)
  2. **Sport tabs**: Football, Baseball, B. Basketball, G. Basketball, G. Volleyball, All Sports
  3. **Mega-menu**: Each sport expands to: Home, Teams, Players, States, Scores, Rankings, Stat Leaders, Photos, Playoffs, Videos, Record Book, News, Live Streams
  4. **Quick links**: Home, Schools, Athletes, Sports, States, Rankings, Stat Leaders, Scores, Photos, Playoffs, News, Videos
- **Content sections**:
  1. **Hero article** — Featured story with large image (e.g., "FOOTBALL: Who is the best team in your state?")
  2. **Video player** — Embedded video with play button (e.g., "Best Football Team in Every State | 2026 Season")
  3. **Article feed** — Stacked article cards with 156×156 thumbnails, sport tag badges ("Football", "Boys Basketball", "Softball"), author + date
  4. **State directory** — All 50 states + DC as clickable links
  5. **Popular schools** — 24 named high schools (Allen, Montverde Academy, Sierra Canyon, etc.)
  6. **Popular athletes** — 25 named athletes with links (Bronny James Jr., Cooper Flagg, Arch Manning, etc.)
  7. **Video carousel** — 5 video thumbnails with titles and view counts
  8. **Footer** — Apps, Pro Photography, Watch, Content Contributors, Tickets sections

### Basketball Stats/Leaders Page
- **Stat leaders page** (`/basketball/stat-leaders/`): 
  - Page title: "National High School Boys Basketball Stat Leaders"
  - **Leaderboard categories**: Scoring (ppg), Rebounds (rpg), Assists (apg), Steals (spg), Blocks (bpg)
  - **Each category shows top 5 leaders** with:
    - Player photo (headshot, 96px width)
    - Player name (linked to profile)
    - School name + state (linked to schedule)
    - Stat value (e.g., "44.3\n\nP/G")
    - Rank number
  - **"All Leaders"** link per category → full leaderboard page
  - **Qualification note**: "Leaderboard Qualifications - 1" (minimum games threshold)
  
- **Rankings page** (`/basketball/rankings/1/`):
  - Title: "National Boys Basketball (26-27) Rankings"
  - Currently showing "No Data" for 2026-27 preseason
  - Video embed at top explaining rankings methodology
  - Related content links: Playoffs, Stat Leaders, Scores, Live Streams, Player Directory, Teams
  - Off-season state: "We do not have rankings for this selection"

- **Navigation for basketball sub-sections**:
  - Boys Basketball Home, Teams, Players, States, Scores, Rankings, Stat Leaders, Photos, Playoffs, Videos, Record Book, News, Live Streams
  - Girls Basketball has parallel structure with `/girls/` prefix

### Key Patterns
1. **Sport-first taxonomy**: Everything organized by sport → then by data type (teams, players, scores, rankings, stats). Gender is a sub-divider within each sport.
2. **Stats as leaderboards**: Individual stat categories presented as compact top-5 cards with player photos. Quick-scan format with "See All" expansion.
3. **Geographic drill-down**: State → School → Team → Player hierarchy. Every entity has a geographic address.
4. **Athlete spotlight in nav**: Popular athletes surface in the main navigation — celebrity-driven discovery.
5. **Season-aware**: Rankings show season year (26-27), pages gracefully handle off-season with "No Data" states.
6. **Coach-sourced data**: "MP Stats for iPad" app for coaches to enter stats — the data pipeline is coach-fed, not scraped.
7. **Ecosystem integration**: GoFan (tickets), NFHS Network (live streams), MaxPreps Advantage (playon) — the platform is a hub for the entire high school sports ecosystem.

### Strengths
- Clean, information-dense stat leaderboards — top 5 per category with photos, scannable in seconds
- Massive geographic coverage — all 50 states, all high schools
- Clear data hierarchy: National → State → School → Team → Player
- Off-season handling is graceful — explains missing data rather than showing errors
- Mobile app ecosystem (MaxPreps app + MP Stats for iPad)
- Pro photography integration (purchasable game photos)
- Record Book section provides historical context

### Weaknesses/Gaps
- Homepage is football-heavy (it's the dominant sport on the platform) — basketball gets secondary treatment
- Rankings page is empty in off-season — no historical rankings visible, no "all-time" view
- No live game integration on basketball pages (live streams are outsourced to NFHS Network)
- Leaderboard shows only top 5 per category without a visible "top 10" or comparison view
- No player comparison tool visible
- Article headlines are ALL CAPS and keyword-heavy — reads like SEO copy
- No tournament bracket visualization visible from basketball section
- Stat categories are basic (5 core stats) — no advanced metrics (PER, TS%, etc.)

---

## Comparative Insights

### Convergent Patterns (Both Do X)
1. **Stat leaderboards as entry point**: Both surface top performers prominently — FIBA in event leaderboards, MaxPreps in dedicated stat leaders pages. The "top N per category" card pattern is universal.
2. **Geographic/team/player hierarchy**: Both use a drill-down from competition/league → team → player. FIBA: Event → Team → Player Profile. MaxPreps: State → School → Team → Athlete.
3. **News woven into stats**: Both integrate editorial content (previews, recaps, spotlights) alongside raw data — stats are never presented in isolation.
4. **Video integration**: Both embed YouTube/video highlights prominently on event and homepage surfaces.
5. **Sponsor integration**: FIBA has Nike (ranking sponsor), Tissot (timekeeping), Courtside 1891 (streaming). MaxPreps has GoFan (tickets), NFHS Network (live streams). Both tie sponsors to specific data features.
6. **Photo-driven content**: Both use player/team photos extensively — FIBA in the social carousel and news cards, MaxPreps in athlete thumbnails and article images.

### Differentiators (FIBA Does X, MaxPreps Does Y)

| Dimension | FIBA.basketball | MaxPreps.com |
|-----------|----------------|--------------|
| **Scale** | International (160 countries) | National (US high schools) |
| **Event model** | Event-as-microsite with full lifecycle | Sport-as-hub with continuous season |
| **Tournament brackets** | Visual brackets for knockout rounds | No bracket visualization |
| **Classification rounds** | Full classification brackets (9-16, etc.) | Simple playoff brackets |
| **Content tone** | Editorial, storytelling, social-first | Data-forward, informational |
| **Social features** | MVP voting polls, "Group of Death" polls | None visible |
| **Countdown/urgency** | Prominent countdown timers to events | Season-based (no countdown) |
| **Stat depth** | Top 3 per category on event pages | Top 5 per category, dedicated pages |
| **Player profiles** | Individual FIBA profiles with international stats | School/team-level profiles with season stats |
| **Data source** | Official FIBA game data | Coach-submitted via iPad app |
| **Mobile apps** | Courtside 1891 (streaming) | MaxPreps app + MP Stats for iPad |
| **Historical data** | Ranking date selector (2010-2026) | Record Book section |
| **Live integration** | Live scores in event feeds | Outsourced to NFHS Network |
| **Off-season** | Calendar + upcoming events | "No Data" states |
| **Dark/light theme** | Dark theme (editorial feel) | Light theme (data/utility feel) |

### Opportunities for Onoo

Based on this competitive analysis, here are UI patterns and gaps that Onoo could exploit:

1. **Tournament-as-hub (from FIBA)**: Adopt the event microsite pattern — give each tournament its own branded page with games, standings, brackets, stats, and news. This is the single most engaging pattern observed.

2. **Advanced stat leaderboards (gap in both)**: Neither FIBA nor MaxPreps offers advanced analytics (PER, True Shooting %, Usage Rate, Net Rating). A basketball stats platform that shows not just PPG/RPG/APG but also contextual metrics would differentiate strongly.

3. **Player comparison tool (gap in both)**: No side-by-side player comparison is visible on either site. Building a "Player A vs Player B" stat comparison would fill a real gap.

4. **Classification round display (from FIBA)**: Show the full tournament bracket including classification rounds — every game matters, not just the championship path.

5. **Live game center with play-by-play (hybrid)**: FIBA shows live scores but no play-by-play in the scraped data. MaxPreps outsources live to NFHS. A unified live game experience with real-time box scores would be superior.

6. **Social/interactive features (from FIBA)**: MVP voting, "best play" polls, and shareable stat cards would drive engagement. MaxPreps has none of this.

7. **Season history + trend lines (gap in both)**: Neither shows player/team stat trends over time visually. A simple line chart showing PPG over a season or career would add enormous value.

8. **Clean stat card design (from MaxPreps)**: The compact top-5-per-category layout with player photo, school, and stat value is highly scannable. Adopt this for leaderboard surfaces.

9. **Geographic discovery (from MaxPreps)**: The state → school → team drill-down is excellent for local/high-school context. If Onoo covers high school or youth tournaments, replicate this geographic hierarchy.

10. **Mobile-first stat entry (from MaxPreps)**: The MP Stats for iPad app for coaches to enter stats is a critical data pipeline innovation. Building a mobile stat-entry tool for tournament organizers would solve the data problem at the source.

---

*Research conducted via Firecrawl MCP scraping of public pages on 2026-07-19. Browser-based visual analysis was not completed due to tooling limitations; findings are based on HTML/markdown structure analysis.*
