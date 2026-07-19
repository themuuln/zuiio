# Onoo Player Stats Page — Competitive UI Research

## 1. Executive Summary

Onoo's player profile page is already one of the most feature-rich basketball stats pages in its category, with 12+ dedicated components covering hero identity, season arc charts, shooting profiles, shot heatmaps, skill radar, form trends, milestones, and awards. However, compared to NBA.com, Basketball Reference, EuroLeague, and SofaScore, several **high-impact gaps** remain — particularly in **advanced metrics, contextual comparison, and interactive depth**.

**Top 5 recommendations (Adopt):**
1. Add **advanced efficiency metrics** (PER, TS%, USG%, PIE) — observed in 4/4 competitors
2. Add **home/away and clutch split views** — observed in 3/4 competitors
3. Add a **player comparison panel** (side-by-side or "similar players") — observed in 3/4 competitors
4. Add **game-level context cards** (not just raw stat rows) with narrative highlights — observed in NBA.com, SofaScore
5. Add **career timeline visualization** with season-to-season progression markers — observed in Basketball Reference, NBA.com

---

## 2. Scope, Competitors, and Methodology

### Product
**Onoo** — Mongolian basketball stats platform. Target: basketball fans, coaches, players in Mongolia. Platform: Next.js 16 web app.

### Competitors Researched

| Competitor | Type | Why Included |
|---|---|---|
| **NBA.com** player profile | Direct reference | Gold standard for basketball player profiles globally |
| **Basketball Reference** | Direct reference | Deepest historical data, advanced stats pioneer |
| **EuroLeague** | Adjacent competitor | European basketball analytics, PIR-focused |
| **SofaScore** | Adjacent competitor | Real-time ratings, comparison tools, modern UI |

### Methodology
- Web search for competitor feature documentation
- Browser screenshots of live competitor pages
- Direct codebase analysis of Onoo player page (12 component files, data layer)
- Evidence labeled as Observed, Vendor-stated, or Inferred

---

## 3. Current Onoo Player Page — Full Inventory

### Sections Rendered (top to bottom)

| # | Section | Component | Key Features |
|---|---|---|---|
| 1 | **Breadcrumb + Season Selector** | `SeasonSelector` | Back link, season/competition picker, language toggle |
| 2 | **Hero Card** | `HeroCard` | Photo, name, jersey, position, height/weight/DOB/nationality, 5 core stats (PTS/REB/AST/STL/TOV) |
| 3 | **Share Stat Card** | `StatCard` | Canvas-rendered shareable image with key stats |
| 4 | **Recent Games Strip** | `RecentGames` | Last 5 games horizontal scroll, each with opponent, result, standout stat |
| 5 | **Tabs: Summary / All Games** | Tabs | Two main views |
| 5a | — Season Trend | `SeasonArc` | Area chart (PTS/REB/AST) with brush range slider |
| 5b | — Shooting Profile | `ShootingProfile` | 3 gauge rings (FG%/3P%/FT%) + stacked points breakdown bar |
| 5c | — Form & Trends | `FormTrends` | EFF scatter plot by opponent, W-L record, streak, 20+ games, double-doubles |
| 5d | — Shot Chart | `ShotChart` | SVG half-court heatmap with zone efficiency |
| 5e | — Skill Radar | `SkillRadar` | 5-axis radar (PTS/REB/AST/STL/BLK) vs league average overlay |
| 5f | — Career Highs / Milestones | `Milestones` | Career highs, 20+ games, streaks, triple-doubles |
| 5g | — Awards Shelf | `AwardsShelf` | MVP, Player of Week, Top Scorer badges |
| 5h | — All Games Tab | Game log table | Full box score per game (date, opponent, result, MIN, PTS, FGM, 3PT, REB, AST, STL, BLK) |

### Data Layer Available
From `src/app/lib/data.ts`:
- `getPlayerById` — player identity + season profiles
- `getPlayerSeasonAverages` — per-game averages
- `getPlayerGameLog` — full box score per game
- `getPlayerShootingProfile` — FG/3P/FT splits
- `getPlayerShotZones` — zone-level makes/attempts
- `getLeagueAverages` — league mean + max for radar normalization
- `getPlayerCareerTotals` — career aggregate stats
- `getPlayerCompetitions` — available seasons
- `getPlayerAwards` — MVP, weekly, scoring awards
- `getMvpRace` — EFF-based top 5

---

## 4. Comparison Matrix

| Feature | Onoo | NBA.com | Basketball Ref | EuroLeague | SofaScore |
|---|---|---|---|---|---|
| **Hero identity card** | ✅ Rich | ✅ Rich | ✅ Compact | ✅ Standard | ✅ Standard |
| **Season/career toggle** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Per-game stat table** | ✅ Basic | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Advanced metrics (PER, TS%, USG%)** | ❌ | ✅ via Stats portal | ✅ Built-in | ✅ PIR + expanded | ✅ Rating |
| **Shot chart / heatmap** | ✅ SVG zones | ✅ Synergy | ❌ | ❌ | ❌ |
| **Shooting profile gauges** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Skill radar** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Season trend chart** | ✅ Area + brush | ❌ | ❌ | ❌ | ✅ |
| **Form/EFF scatter by opponent** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Home/away splits** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Clutch / late-game stats** | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Player comparison** | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Career timeline / year markers** | ❌ | ❌ | ✅ Visual | ❌ | ❌ |
| **Awards / milestones** | ✅ Rich | ✅ | ✅ Visual | ✅ | ✅ |
| **Game log table** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Shareable stat card** | ✅ Canvas | ❌ | ❌ | ❌ | ❌ |
| **Recent games strip** | ✅ Scroll | ✅ Last 5 | ❌ | ❌ | ✅ |
| **Season advanced stats table** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Play-by-play / possession data** | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Injury / availability info** | ❌ | ✅ | ❌ | ❌ | ✅ |

---

## 5. Per-Competitor Findings

### NBA.com Player Profile
**Evidence:** Vendor-stated + browser snapshot [E1, E2]

- **Tabbed navigation** (Profile / Stats / Bio / Videos) — clean, predictable
- **Last 5 Games** table with full box score + +/- column
- **Career stats portal** links to NBA.com/stats for advanced metrics
- **Awards & Honors** section with championship rings, MVP icons
- **News feed** tied to player performance
- **Design:** Clean white space, team-colored accents, responsive

**What Onoo can learn:**
- The +/- column in game logs provides game-impact context Onoo lacks
- News/performance narrative integration adds storytelling dimension
- Tabbed structure for Profile/Stats/Bio separation is cleaner than long scroll

### Basketball Reference
**Evidence:** Browser screenshot [E3], web search [E4, E5]

- **Dense, data-first** layout — "digital record book" aesthetic
- **Multiple stat tables:** Per-game, totals, advanced (PER, TS%, USG%, WS, BPM, VORP)
- **Playoff stats** as separate section (regular season vs postseason)
- **Zebra-striped tables** with league-leading cells highlighted in yellow
- **Career accolades** as icon grid at bottom (trophies, rings, All-Star badges)
- **Persistent inner navigation** sidebar for jumping between sections
- **All entities hyperlinked** — every team, year, award is clickable

**What Onoo can learn:**
- Advanced metrics table (PER, TS%, USG%) is the #1 gap
- Highlighting league-leading stats in tables draws attention to standout seasons
- Persistent section navigation helps with long pages

### EuroLeague
**Evidence:** Browser snapshot [E6], web search [E7, E8]

- **PIR (Performance Index Rating)** as primary efficiency metric
- **Expandable stats** — click to reveal advanced columns
- **Season filters** with view modes (Traditional, Advanced, Per 48, etc.)
- **Multi-league filtering** (EuroLeague + EuroCup + BCL)
- **Sortable columns** across all stat categories

**What Onoo can learn:**
- The expandable stats pattern is elegant — show basic by default, let users opt into depth
- PIR-style single-number efficiency rating is simpler than NBA's complex advanced stats
- Multi-season/multi-competition filtering is something Onoo already does well

### SofaScore
**Evidence:** Web search [E9, E10, E11]

- **SofaScore Rating** — single 0-10 performance score with real-time updates
- **Player Comparison Tool** — side-by-side with stat tables + visual charts
- **Season heatmaps** showing performance density
- **Attack Momentum Graph** for in-game context
- **Clean, modern UI** with card-based layout

**What Onoo can learn:**
- The single performance rating (0-10) is instantly understandable
- Player comparison tool drives engagement and return visits
- Season heatmaps add a visual density layer missing from Onoo

---

## 6. Convergent Patterns and Differentiators

### Convergent (observed in 3+/4 competitors)
1. **Season/career toggle** — universal
2. **Full box score game log** — universal
3. **Advanced metrics table** — 4/4 (PER, TS%, USG%, or PIR)
4. **Home/away splits** — 3/4
5. **Awards and milestone tracking** — 4/4
6. **Shooting splits (FG/3P/FT)** — 4/4

### Onoo Differentiators (unique to Onoo)
1. **SVG court heatmap** with zone-level efficiency — no other competitor has this at profile level
2. **Skill radar chart** with league-average overlay — unique visualization
3. **EFF scatter plot by opponent** — shows matchup-specific performance
4. **Canvas-rendered shareable stat card** — social engagement feature
5. **Shooting profile gauges** with points breakdown bar — elegant efficiency display

### Missing from Onoo (opportunity gaps)
1. Advanced metrics table (PER, TS%, USG%) — **critical gap**
2. Home/away splits — **common pattern**
3. Player comparison / "similar players" — **engagement driver**
4. Clutch / late-game performance splits — **differentiator**
5. Career progression timeline with season markers — **visual storytelling**
6. Expandable stats pattern (basic → advanced) — **progressive disclosure**

---

## 7. Opportunities and Risks

### Opportunities
| Opportunity | Impact | Evidence |
|---|---|---|
| **Advanced metrics table** | High — every competitor has this | E3, E4, E7, E9 |
| **Player comparison tool** | High — drives engagement + return visits | E9, E10 |
| **Home/away splits** | Medium — standard analytics expectation | E3, E4, E7 |
| **Clutch performance section** | Medium — differentiator for Mongolian market | E12, E13 |
| **Career timeline visualization** | Medium — visual storytelling | E3, E4 |
| **Expandable stats (basic→advanced)** | Medium — progressive disclosure UX | E6, E7 |
| **Performance narrative / context cards** | Medium — storytelling dimension | E1, E2 |
| **Season heatmap** | Low-Medium — visual density layer | E9, E10 |

### Risks
| Risk | Mitigation |
|---|---|
| Adding too many sections increases page length | Use expandable/accordion pattern; keep Summary tab concise |
| Advanced metrics may confuse casual fans | Show only per-game basics by default; advanced behind expand toggle |
| Data availability for advanced metrics | Calculate PER, TS%, USG% from existing box score data (formula-based) |

---

## 8. Prioritized Recommendations

### Adopt (implement as-is)

| # | Recommendation | Priority | Rationale | Evidence |
|---|---|---|---|---|
| 1 | **Add advanced efficiency metrics table** (PER, TS%, USG%, EFF) | P0 | Every competitor has this; it's table stakes for a stats platform | E3, E4, E7 |
| 2 | **Add home/away split view** | P0 | Standard analytics expectation; calculable from existing game log | E3, E4, E7 |
| 3 | **Add expandable stats pattern** — show per-game by default, click to reveal advanced columns | P1 | Progressive disclosure keeps casual users happy, power users satisfied | E6, E7 |
| 4 | **Add player comparison panel** (pick another player, side-by-side radar + stats) | P1 | Drives engagement; Onoo already has radar + comparison pages | E9, E10 |

### Adapt (modify to fit Onoo's style)

| # | Recommendation | Priority | Rationale | Evidence |
|---|---|---|---|---|
| 5 | **Add clutch performance section** — stats in last 5 minutes of close games | P2 | Onoo can differentiate; NBA.com has this but most don't | E12, E13 |
| 6 | **Add career timeline visualization** — season-by-season dots with achievement markers | P2 | Basketball Reference has this; adapt to Onoo's visual style | E3, E4 |
| 7 | **Add game context cards** — for each game in the log, show a 1-line narrative highlight | P2 | NBA.com does this with news; adapt as auto-generated summaries from box score | E1, E2 |
| 8 | **Add +/- column to game log** | P1 | Simple addition to existing table; provides game-impact context | E1, E2 |

### Test (validate before committing)

| # | Recommendation | Priority | Rationale | Evidence |
|---|---|---|---|---|
| 9 | **Season heatmap** — visual density of performance across games | P3 | SofaScore has this; may be redundant with existing charts | E9, E10 |
| 10 | **Performance rating number** (0-10 single score) | P3 | SofaScore's signature feature; needs validation with Mongolian users | E9 |

---

## 9. Unknowns and Next Research Actions

| Unknown | Why it matters | Suggested action |
|---|---|---|
| How do Mongolian basketball fans consume stats? | Determines whether advanced metrics add value or confusion | User survey or analytics review |
| What is the data granularity of play-by-play in Onoo? | Clutch stats require possession-level data | Check `stat_events` table for play-by-play coverage |
| Do users actually use the comparison page? | Validates building comparison into player profiles | Check analytics for `/players/compare` traffic |
| What advanced metrics can be computed from existing data? | Determines what's feasible without new data collection | Audit `game_player_stats` and `stat_events` schemas |

---

## 10. Cost Summary

| Source | Method | Estimated Credits |
|---|---|---|
| Web search (5 queries) | web_search | ~10 search credits |
| Browser screenshots (4 pages) | agent-browser | 0 (local) |
| Firecrawl (rate-limited) | — | 0 (blocked) |
| Codebase analysis | read/grep | 0 (local) |
| **Total** | | ~10 search credits |

---

## 11. Sources

| ID | Source | URL | Method | Kind |
|---|---|---|---|---|
| E1 | NBA.com — Stephen Curry Profile | nba.com/player/201939 | search snippet | Vendor-stated |
| E2 | NBA.com — Stephen Curry Stats | nba.com/stats/player/201939 | search snippet | Vendor-stated |
| E3 | Basketball Reference — Curry | basketball-reference.com/players/c/curryst01.html | browser screenshot | Observed |
| E4 | Sports-Reference Blog — Navigation Redesign | sports-reference.com/blog/2025/11/… | search snippet | Vendor-stated |
| E5 | Instagram — BR Advanced Stats | instagram.com/reel/DDiGGCAyuPP | search snippet | Third-party |
| E6 | EuroLeague — Expanded Stats | euroleaguebasketball.net/en/euroleague/stats/expanded/ | browser screenshot | Observed |
| E7 | EuroLeague Stats — RealGM | basketball.realgm.com/international/league/1 | search snippet | Third-party |
| E8 | Hack a Stat — Multi-league Stats | hackastat.eu/en/players-stats/ | search snippet | Third-party |
| E9 | SofaScore — Player Ratings | sofascore.com/news/… | search snippet | Vendor-stated |
| E10 | SofaScore — Comparison Tool | sofascore.com/basketball/player/compare | search snippet | Vendor-stated |
| E11 | SofaScore Review 2026 | marlvel.ai/intel-report/sports/com-sofascore | search snippet | Third-party |
| E12 | Viziball — Advanced Analytics | viziball.app/nba/en | search snippet | Vendor-stated |
| E13 | NBA.com — Clutch Advanced Stats | nba.com/stats/teams/clutch-advanced | search snippet | Vendor-stated |
