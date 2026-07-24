# NBA.com & Basketball-Reference UI Analysis

## NBA.com

### Landing Page

- **Layout**: Full-width, dark theme (black/very dark background), single-column hero with multi-column content sections below. Heavy visual-first design — the page is essentially a media portal, not a data portal.
- **Hero treatment**: Large image/video carousel (5 featured stories). Currently showing Summer League content: player standout highlights, game recaps, feature stories (Rookie Roundtable, Giannis trade). Each hero card has a full-bleed image, headline, brief description, and "MORE"/"READ" CTA. Video content is prioritized with play button overlays. Broadcast partner logos (Prime Video) are shown alongside game content.
- **Navigation**: Complex mega-menu system with deep hierarchy:
  - Top bar: Seasonal/promotional links (Summer League, Free Agency, NBA Cup)
  - Primary nav: Games, Schedule, Watch, News, Draft, Stats, Standings, Teams, Players, NBA Play, Fantasy, League Pass, Store, Tickets, Affiliates
  - Teams dropdown: Organized by division (Atlantic, Central, Southeast, Northwest, Pacific, Southwest) with team logos
  - Stats dropdown: Players/Teams/Leaders/Stats 101 with sub-categories
  - Massive nav footprint — over 150 links in the full navigation
- **Content sections** (in scroll order):
  1. **Live Scores Carousel** — horizontal scrollable game cards at top with "SEE ALL GAMES" CTA. Each card shows matchup with team logos and scores. Toggle to "Hide Scores" available.
  2. **Hero Story Carousel** — 5 large story cards with images, auto-rotating. Primary editorial content surface.
  3. **Stories/Headlines** — sidebar list of 12 recent article links, text-only
  4. **Trending Now** — horizontally scrollable video/article cards with thumbnails
  5. **Free Agency News** — horizontally scrollable transaction news cards
  6. **Around the NBA** — article cards with images, headlines, descriptions, and source attribution. 2-column grid layout.

### Stats/Leaderboard (nba.com/stats/leaders)

- **Table design**: The page uses a card-based leaderboard layout, NOT a dense table. Shows top 10 per stat category. Each leader shown as a card with player photo, name, team, and stat value. Multiple stat categories displayed simultaneously.
- **Player presentation**: Player headshot photos, name, team abbreviation, and the leading stat value. Cards are visually rich with player imagery.
- **Filtering/sorting**: Three dropdown filters:
  - **Season** (e.g., 2025-26)
  - **Season Type** (Regular Season, Playoffs, Preseason)
  - **Per Mode** (Totals, Per Game, Per 48 Minutes, etc.)
- **Sub-navigation**: 
  - Top-level tabs: Players / Teams / Lineups
  - Leader types: Official Leaders, Advanced Leaders, Hustle Leaders
  - Stats categories: General, Clutch, Playtype, Tracking, Defense Dashboard, Shot Dashboard, Box Scores, Shooting, Dunk Scores, Opponent Shooting, Hustle, Box Outs, All Time Summary, All Time Leaders, Bios
- **Breadcrumb**: Stats Home > Players > Season Leaders
- **Stats branding**: SAP partnership banner ("SAP presents Stats") and NBA Advanced Stats logo

### Key Patterns

1. **Media-first, data-second**: NBA.com leads with video and editorial content. Stats are a separate destination, not integrated into the homepage experience. The homepage is designed for casual fans consuming highlights and news.
2. **Visual richness**: High-quality player photos, team logos, broadcast partner branding. Every content piece has imagery.
3. **Carousel-heavy**: Both hero content and trending sections use horizontal carousels, encouraging exploration through swiping.
4. **Live score prominence**: Game scores are given the highest visual priority (above the hero), with a dedicated horizontal scroll component.
5. **Layered navigation**: Extremely deep navigation hierarchy. Stats alone have 4+ levels of nesting. Discovery requires knowing what you're looking for.
6. **Content categorization**: Strong separation between editorial (news, features), transactional (scores, standings), and analytical (stats) content.
7. **CTA hierarchy**: Primary CTAs are "WATCH" (video) and "READ" (articles). Stats pages don't have prominent CTAs — they're tool-oriented.

### Strengths

- **Visual impact**: The dark theme with high-quality imagery creates a premium, entertainment-focused feel
- **Live game integration**: Score ticker/carousel is immediately visible without scrolling
- **Video-first approach**: Aligns with how modern fans consume basketball content
- **Rich player presentation**: Stats leaders show player photos, creating emotional connection
- **Comprehensive filter controls**: Season, type, and per-mode filters on stats pages are well-designed
- **Mobile-responsive**: The design adapts well to mobile with touch-friendly carousels

### Weaknesses/Gaps

- **Low information density**: Stats and data are buried behind navigation. A stats-focused user must navigate multiple levels to find data.
- **No homepage stats preview**: No stat leaders, standings, or data summaries on the homepage
- **Carousel fatigue**: Multiple competing carousels can overwhelm and hide content
- **Navigation overload**: 150+ navigation links create decision paralysis
- **Stats feel disconnected**: The stats section feels like a separate product from the editorial content
- **No comparison tools**: No player-vs-player or team-vs-team comparison on the leaders page
- **Table density**: Leaderboard cards are visually appealing but show less data per screen than a dense table

---

## Basketball-Reference

### Landing Page

- **Layout**: Classic web 1.0/2.0 aesthetic. Light theme (white background), dense text layout with minimal visual design. Two-column layout on some sections, predominantly single-column flow. Extremely information-dense — the entire site philosophy is "more data, less chrome."
- **Hero treatment**: No hero. The page opens with a search bar and a heading: "Basketball Stats and History — Statistics, scores, and history for the NBA, ABA, WNBA, and top European competition." Pure function over form.
- **Navigation**: 
  - Top bar: SportsReference.com cross-links (Baseball, Football, Basketball, Hockey, Soccer) — part of a larger sports data network
  - Main nav: Players, Teams, Seasons, Leaders, Scores, WNBA, Draft, Stathead, Newsletter
  - Full Site Menu (expandable): Massive alphabetical index of every page on the site
  - Two search inputs: One for "search suggestions based on user search input" and one for "Enter a player, team or section name"
- **Content sections** (in scroll order):
  1. **Every NBA & Every WNBA Player** — Random player name links (12 names), a "human discovery" pattern
  2. **Immaculate Grid Stats** — Promotes their partnership game with "See Your Stats" link
  3. **Trending Player Pages** — 10 currently popular player pages (LeBron, MJ, Curry, Kobe, Shaq, Giannis, etc.)
  4. **Recent Debuts** — 6 recently debuted player links with "See more"
  5. **League Selector** — NBA & ABA, WNBA, NBL, G League, International links
  6. **Recently Deceased** — Memorial links
  7. **Born On This Day** — Birthday player links
  8. **Every NBA Team** — 2025-26 Standings table (East/West conferences), with Summary/Schedule/Scores/Leaders/Rookies tabs
  9. **Massive footer/sitemap**: Seasons (every year back to 1946-47), Leaders (Season Points, Career Rebounds, Active Assists, Yearly Steals, Progressive Blocks, Trailers, Season FG%, Career Blocks Per Game), Scores, Schedules, Standings, Stathead tools (Season Finder, Game Finder, Streak Finder, Span Finder, Versus Finder, Shot Finder), Coaches, Awards (MVP, All-NBA, DPOY, ROY, All-Rookie, Hall of Fame), Contracts, Playoffs, All-Star Games, Draft, Frivolities, Executives, Referees, G League Stats, International, WNBA, NBL

### Leaders Page (basketball-reference.com/leaders/)

- **Layout**: Full-page data reference. No images, no visual chrome. Pure tabular data with expandable/collapsible sections.
- **Table design**: Each statistical category is a row with expandable sub-rows. The hierarchy is:
  - **Stat Category** (e.g., "Games", "Field Goals", "Assists") — clickable row
  - **Sub-categories**: Single Season, Career, Active, Progressive, Year-by-Year, Year-by-Year Top 10, Single Game
  - Each sub-category links to a detailed leaders page
- **Stats covered** (exhaustive list):
  - Games, Minutes Played
  - Field Goals, FG Attempts, 2-Pt FG, 2-Pt FG Attempts, 3-Pt FG, 3-Pt FG Attempts, FG Missed
  - Free Throws, FT Attempts
  - Offensive Rebounds, Defensive Rebounds, Total Rebounds
  - Assists, Steals, Blocks, Turnovers, Personal Fouls
  - Plus "Per 100 Possessions" variants for most categories
- **Player presentation**: Text-only links. Player names are hyperlinked to their individual pages. No photos, no team logos, no visual differentiation.
- **Filtering/sorting**: Season selector dropdown (every season from 2025-26 back to 1946-47 — 80+ seasons). Sub-tabs: Regular Season Leaders, Playoffs Leaders, Combined Leaders, Finals Leaders.
- **Additional sections**:
  - "2025-26 Leaders & Top 20s" — current season snapshot
  - "Regular Season Leaders" — full category matrix
  - "Opponent Stats" section
  - "More Leaders Pages" — links to every individual season's leaders page
  - "Full Site Menu" — complete alphabetical site index

### Key Patterns

1. **Density as feature**: Basketball-Reference treats information density as a feature, not a bug. Power users can see everything at once. The site never hides data behind clicks when it can show it inline.
2. **Hyperlinked everything**: Every player name, every stat category, every season, every team — everything is a link. The site is a massive web of interconnected data.
3. **Consistent structure**: Every page follows the same layout pattern: heading, navigation, content, full site menu. Users learn the pattern once and it applies everywhere.
4. **Progressive disclosure via expandable rows**: The leaders page uses clickable rows that expand to show sub-categories, managing the massive amount of data.
5. **Historical depth**: 80+ seasons of data accessible from every page. The season selector is a core UI pattern.
6. **Search-first**: Two search boxes at the top of every page — one for suggestions, one for direct entry. The site assumes users know what they're looking for.
7. **No visual differentiation between content types**: Articles, stats, standings, player pages — all use the same visual language. Consistency over differentiation.

### Strengths

- **Unmatched data depth**: Every statistical category, every season, every player — comprehensively linked
- **Speed and simplicity**: No heavy images, no JavaScript-heavy interactions. Pages load fast.
- **Power user efficiency**: The dense layout means experts can find what they need quickly
- **Historical completeness**: The ability to drill from current leaders to any historical season is unparalleled
- **Cross-referencing**: Every stat links to deeper data, creating a research-friendly experience
- **Trust and authority**: The no-frills design signals "we're about the data, not the aesthetics"
- **Consistent navigation**: Full site menu is always available, always the same structure

### Weaknesses/Gaps

- **Zero visual appeal**: The site looks like it was designed in 2003. No images, no modern UI patterns, no visual hierarchy beyond bold text.
- **No player photos or team branding**: Player pages have photos, but the leaders/homepage have none. No emotional connection.
- **Overwhelming for new users**: The sheer volume of links and data is intimidating for casual fans.
- **No interactive features**: No sorting, no filtering beyond season selection. No dynamic tables.
- **No comparison tools on leaders page**: You can't compare two players side-by-side from the leaders view.
- **Poor mobile experience**: The dense desktop layout doesn't adapt well to mobile screens.
- **No live data integration**: No scores, no live updates. The site is purely historical/seasonal data.
- **No visual storytelling**: No infographics, no charts, no data visualization.

---

## Comparative Insights

### Convergent Patterns (Both Do This)

| Pattern | NBA.com | BBRef | Notes |
|---------|---------|-------|-------|
| Season selector | Dropdown on stats pages | Dropdown on every page | Both treat "season" as the primary data dimension |
| Navigation to leaders | Stats > Leaders in mega-menu | Leaders in main nav | Both make leaders a top-level destination |
| Player linking | Player names link to profiles | Player names link to profiles | Universal pattern for basketball data sites |
| Team organization | By division in dropdown | By conference/standing | Both organize teams geographically |
| Multiple stat categories | Separate pages per type | Expandable rows per category | Both categorize stats extensively |

### Differentiators (NBA.com X, BBRef Y)

| Dimension | NBA.com | Basketball-Reference |
|-----------|---------|---------------------|
| **Primary audience** | Casual fans, entertainment seekers | Power users, researchers, analysts |
| **Content strategy** | Media-first (video, articles, news) | Data-first (tables, statistics, records) |
| **Visual design** | Dark theme, premium imagery, modern UI | Light theme, text-only, Web 1.0 aesthetic |
| **Information density** | Low — curated, spaced-out content | Extreme — packed, every pixel used |
| **Live data** | Prominent score ticker, live game cards | No live data whatsoever |
| **Player presentation** | Photos + stats + team branding | Text-only hyperlinks |
| **Historical depth** | Current season focus | 80+ seasons, every stat tracked |
| **Navigation complexity** | Deep mega-menus (4+ levels) | Flat, full-site alphabetical menu |
| **Filtering** | Season + Type + Per Mode dropdowns | Season dropdown + category links |
| **Comparison tools** | None on leaders page | Versus Finder (separate tool) |
| **Monetization signals** | League Pass, Store, Tickets, Fantasy | Stathead subscription, ads |
| **Mobile design** | Responsive, touch-friendly carousels | Minimal mobile optimization |
| **Data visualization** | Implicit in player cards | None — pure tables |
| **Video integration** | Central to experience | Completely absent |
| **Social features** | None visible | Social media links in footer |

### Opportunities for Onoo (Basketball Tournament Stats Platform)

Based on the gap analysis between these two competitors:

1. **Bridge the gap**: Neither site serves the "informed casual fan" — someone who wants data presented beautifully. NBA.com is all sizzle, BBRef is all substance. Onoo can be both.

2. **Tournament-specific UX**: Both sites are built for full-season NBA data. A tournament format (single-elimination, group stages, fixed schedule) needs different UI patterns:
   - **Bracket visualization** — neither site has this
   - **Tournament timeline** — game-day focused, not season-focused
   - **Head-to-head matchup cards** — pre-game stats comparison
   - **Round-by-round leaderboards** — not available on either site

3. **Modern data density**: Take BBRef's information density but present it with NBA.com's visual quality. Dense tables with player photos, team colors, and subtle data visualization (sparklines, progress bars).

4. **Mobile-first stats**: Both sites treat mobile as secondary. Onoo should be designed for phone-first stat consumption — swipeable leaderboards, tap-to-expand stat cards, thumb-friendly filters.

5. **Player comparison as a first-class feature**: Neither site makes player comparison easy from the leaders page. A "Compare" toggle on leaderboard rows would be novel.

6. **Visual stat presentation**: Neither site uses modern data visualization. Bar charts for stat comparison, radar charts for player profiles, heat maps for shot charts — all represent white space.

7. **Contextual stats**: Show stats in context — "This player's 28.5 PPG is 3rd in the tournament and 15% above their regular season average." Neither site provides this contextual layer.

8. **Social/shareable stat cards**: Instagram/Twitter-ready stat graphics. NBA.com has video highlights but no stat cards. BBRef has nothing shareable.

9. **Real-time leaderboard updates**: During games, update leaderboards in real-time. NBA.com does live scores but not live leaderboards. BBRef has nothing live.

10. **Simplified navigation**: Both sites have overwhelming navigation. Onoo should have a focused nav: Bracket, Teams, Players, Stats, Schedule — 5 top-level destinations maximum.

---

## Screenshots

Saved to `notes/ui-research/2026-07-19-basketball-stats-landing/artifacts/`:
- `bbref-home.png` — Basketball-Reference homepage
- `bbref-leaders.png` — Basketball-Reference leaders page

**Note**: NBA.com blocked automated browser access (Access Denied). NBA.com analysis is based on content scraped via the `read` tool (which uses Jina reader). The visual analysis of NBA.com is inferred from the DOM structure, class names, and content organization rather than direct screenshot observation.
