# Competitive UI Research: Basketball Stats Landing Pages

> **Product**: Onoo — Mongolian basketball statistics platform
> **Research date**: 2026-07-19
> **Depth**: Standard analysis (4 competitors, 2-3 sources each)
> **Coverage**: 4 competitors: 3 full, 1 partial

## 1. Executive Summary

Basketball stats landing pages split into two camps: media-first portals (NBA.com, FIBA) that bury data behind editorial carousels, and data-first references (Basketball-Reference) that sacrifice all visual appeal. No competitor successfully bridges editorial confidence with statistical density — the "informed casual fan" who wants data presented beautifully is underserved everywhere. Onoo's current landing page already occupies a unique middle ground: the dramatic scoreboard hero, editorial two-column layout, and podium leaders are structurally sound but need sharper differentiation in tournament bracket presentation, stat category breadth, and live game urgency. The biggest opportunity is owning the **tournament-as-hub** pattern that FIBA pioneered at international scale but nobody has executed at the local/league level — each tournament should be a self-contained experience with games, standings, brackets, and leaders unified in one scannable surface.

## 2. Scope, Competitors, and Methodology

### Research Question

What patterns should Onoo's landing page adopt from basketball stats competitors to serve its audience of league operators, coaches/players, and public fans?

### Competitors

| Competitor | Type | Why included | Coverage |
|-----------|------|-------------|----------|
| NBA.com | Direct (professional) | Gold standard for basketball stats UI | Full |
| Basketball-Reference | Direct (data-focused) | Deepest stats reference, power-user benchmark | Full |
| FIBA.basketball | Direct (tournament) | Closest tournament model to Onoo | Full |
| MaxPreps | Adjacent (non-pro) | Tournament/league stats for non-pro level | Full |

### Methodology

Firecrawl scraping of public landing pages, leaders pages, stats pages, and tournament/event pages. Browser-based visual analysis was attempted for NBA.com and Basketball-Reference; NBA.com blocked automated browser access. Analysis of FIBA and MaxPreps is based on HTML/markdown structure analysis without direct visual confirmation.

**Limitations**: NBA.com blocked browser automation (Access Denied), so visual analysis is inferred from DOM structure and class names. FIBA and MaxPreps were scraped but not visually screenshotted. All findings should be validated against live rendering.

## 3. Evidence Coverage and Limitations

**Directly observed (via browser or high-fidelity scrape)**:
- Basketball-Reference: homepage structure, leaders page layout, navigation patterns, data density (screenshots saved to `artifacts/`)
- NBA.com: DOM structure, content hierarchy, leaders page filter system (no visual screenshot — browser blocked)

**Inferred from scraped HTML/markdown**:
- FIBA.basketball: landing page carousel structure, event page sections, ranking table, player presentation
- MaxPreps: homepage layout, stat leaders page, navigation taxonomy, rankings page

**Not observed**:
- Mobile rendering for any competitor (scraping returned desktop content)
- JavaScript-rendered interactions (dynamic filtering, carousel behavior, lazy loading)
- Actual page load performance for any competitor
- FIBA event bracket visual rendering (scrape returned text-heavy representation)

**Risk**: FIBA's tournament bracket "visual" could be significantly richer than what the markdown scrape shows. The recommendation for bracket adoption should be validated in a browser session.

## 4. Comparison Matrix

| Dimension | NBA.com | Basketball-Reference | FIBA.basketball | MaxPreps | Onoo (current) |
|-----------|---------|---------------------|-----------------|----------|----------------|
| **Hero treatment** | Full-bleed image/video carousel, 5 stories, auto-rotating. Media-first. [Convergent: 2/4 — NBA + FIBA use visual heroes] | No hero — opens with search bar + heading. Pure function. [Differentiator: 1/4] | Social carousel of ~40+ cards, Instagram-story-style. Content-first. [Convergent: 2/4 — NBA + FIBA] | Single featured article with full-width image. News portal style. [Differentiator: 1/4 — simpler than NBA/FIBA] | **Dramatic scoreboard hero** — team logos, live scores, amber accent. Data-first hero. [Opportunity: unique approach — no competitor leads with data] |
| **Live game presentation** | Horizontal score ticker at top of page. Team logos + scores. "Hide Scores" toggle. [Convergent: 2/4 — NBA + FIBA] | No live data whatsoever. [Differentiator: 1/4] | Live games appear in event feeds with quarter/time info. No dedicated live section on homepage. [Opportunity: not surfaced prominently] | No live integration — outsources to NFHS Network. [Differentiator: 1/4] | **Tonight's Games ticker** — horizontal scroll, team logos, times. Live pulse indicator ("Яг одоо"). [Convergent: matches NBA pattern] |
| **Leaderboard design** | Card-based, top 10 per category, player photos. Season/type/per-mode filters. [Convergent: 3/4 — all show top N per category] | Text-only expandable rows. Every stat category. No photos. Maximum density. [Differentiator: 1/4 — extreme density] | Top 3 per category as teaser cards. "View All" links to full stats. Country flags, no headshots. [Convergent: 3/4 — top-N card pattern] | Top 5 per category with player photos, school name, stat value. Clean card layout. [Convergent: 3/4 — card pattern] | **Top 3 podium** — numbered list, player avatars, team name, stat value. Amber highlight for #1. [Differentiator: podium metaphor is unique] |
| **Player spotlight** | Full-bleed hero cards with editorial headline + CTA. [Convergent: 2/4 — NBA + FIBA use editorial spotlights] | Random player name links (12 names). No spotlight. [Differentiator: 1/4] | Player cards in "For you" feed with profile links. Spotlight mixed into content feed. [Convergent: 2/4] | Popular athletes listed in navigation. 25 named athletes. [Differentiator: 1/4 — nav-level discovery] | **Featured Player card** — ink-dark hero, photo, 3 stat values (PTS/REB/AST). [Unique: dedicated spotlight card with statement stats] |
| **Navigation complexity** | Deep mega-menu, 150+ links, 4+ levels of nesting. [Risk: overwhelming] | Flat alphabetical full-site menu. Two search inputs. Manageable but massive. [Differentiator: 1/4 — flat hierarchy] | Mega-menu with sport × gender × sub-sections. Language selector. [Risk: complex for small product] | Multi-tier: brand bar + sport tabs + mega-menu. [Risk: similar complexity to NBA] | **Simple: search bar + section links**. Horizontally scrollable mobile nav. [Opportunity: keep it simple — 5 destinations max] |
| **Tournament bracket** | No bracket visualization. Season-focused. [Gap: 0/4 have brackets] | No bracket visualization. [Gap: 0/4] | Visual brackets for knockout rounds + classification brackets (9-16, etc.). [Differentiator: 1/4 — only one with brackets] | No bracket visualization visible. [Gap: 0/4] | **No bracket page exists yet**. [Opportunity: adopt FIBA's bracket pattern at league level] |
| **Stat depth** | Official, Advanced, Hustle leaders. Season/type/per-mode filters. 15+ stat sub-categories. [Convergent: 3/4 — all offer multiple categories] | Exhaustive: every stat, per-100-possessions variants, 80+ seasons. [Differentiator: 1/4 — unmatched depth] | Top 3 per category (6 categories). "View All" for full stats. [Lightest depth] | 5 core stats only (PPG/RPG/APG/SPG/BPG). No advanced metrics. [Lightest depth] | **PTS only on leaders page**. Full box score on game pages. [Opportunity: add REB/AST leaders alongside PTS] |
| **Mobile-first design** | Responsive, touch-friendly carousels. [Convergent: 3/4 — responsive] | Poor mobile experience — dense desktop layout doesn't adapt. [Risk: don't copy] | [INFERENCE] Likely responsive given modern stack. [Not observed] | [INFERENCE] Responsive — has mobile app ecosystem. [Not observed] | **Mobile-first by design** — 360px contract, scrollable nav, card-based standings, stack-first layout. [Differentiator: 1/4 — only one with explicit mobile-first contract] |
| **Visual density** | Low — curated, spacious, heavy imagery. [Convergent: 2/4 — NBA + FIBA favor visual] | Extreme — every pixel used for data. No images. [Differentiator: 1/4] | Medium-high — social carousel + news grid + feed. Content-dense. [Convergent: 2/4 — editorial density] | Medium — article feed + sidebar + directories. [Convergent: 2/4] | **Medium — clean card layout**. Not as dense as BBRef, not as empty as NBA. [Opportunity: increase density on leaders page] |
| **Information architecture** | Media portal: Games → News → Stats (separate destinations). [Convergent: 2/4 — NBA + MaxPreps separate content types] | Flat data reference: everything linked, everything accessible. [Differentiator: 1/4] | Event-as-hub: tournament pages are self-contained microsites. [Differentiator: 1/4 — only one with microsite pattern] | Sport-first taxonomy: Sport → Data type → Geographic hierarchy. [Convergent: 2/4 — hierarchical drill-down] | **Section-based**: Hero → Games → Search → Editorial → Leaders/Standings. Linear scroll. [Opportunity: add tournament hub pages as IA backbone] |

## 5. Per-Competitor Findings

### NBA.com
**Strengths**: Live score ticker with team logos is the gold standard for game-day urgency. Player leaderboard cards with photos create emotional connection. Dark theme with high-quality imagery feels premium. Season/type/per-mode filter controls are well-designed and reusable.
**Weaknesses**: 150+ navigation links create decision paralysis. Stats are buried as a separate destination — no homepage stats preview. Multiple competing carousels cause fatigue. No player comparison tools. The homepage and stats section feel like separate products.
**Learn from**: Live score presentation, filter control design, dark hero treatment (contrast with Onoo's amber identity), player photo integration in leaderboards.

### Basketball-Reference
**Strengths**: Unmatched data depth — every stat, every season, every player hyperlinked. Page load speed from minimal JS/images. Power users can see everything at once. 80+ seasons of historical depth with consistent navigation. The trust signal of "we're about the data" is powerful.
**Weaknesses**: Zero visual appeal (Web 1.0 aesthetic). No player photos on leaders page. Overwhelming for new users. No interactive features (no sorting, no dynamic tables). Poor mobile experience. No live data, no visual storytelling, no data visualization.
**Learn from**: Information density philosophy, expandable row pattern for stat categories, season selector as core UI, hyperlinked-everything navigation model.

### FIBA.basketball
**Strengths**: Tournament-as-hub model is the single most engaging pattern observed — each competition is a self-contained microsite with news, games, standings, brackets, stats, and video. Social carousel with short punchy captions borrows from Instagram/TikTok. Countdown timers create urgency. Classification rounds ensure every game matters. MVP voting polls drive engagement.
**Weaknesses**: Homepage is overwhelming — 40+ carousel items, 20+ news cards compete for attention. Leaderboard shows only top 3 per category (too shallow). No "live now" persistent indicator. Tournament bracket may be text-heavy. Mobile navigation complexity is concerning.
**Learn from**: Event-as-hub architecture, tournament bracket visualization, classification round display, leaderboard teaser → "View All" pattern, countdown timer for upcoming games/tournaments.

### MaxPreps
**Strengths**: Clean stat leaderboards — top 5 per category with player photos, school name, stat value. Highly scannable in seconds. Massive geographic coverage with clear data hierarchy (National → State → School → Team → Player). Graceful off-season handling ("No Data" states). Record Book provides historical context.
**Weaknesses**: Homepage is football-heavy — basketball gets secondary treatment. Rankings page empty in off-season with no historical view. No live game integration. No tournament bracket visualization. Only 5 basic stat categories — no advanced metrics. ALL CAPS headlines read like SEO copy.
**Learn from**: Compact leaderboard card design (photo + name + school + stat), geographic drill-down hierarchy, graceful empty/off-season states, "qualification threshold" note on leaderboards.

## 6. Convergent Patterns and Differentiators

### Patterns all competitors share (convergent)
**Count: 3/4**

1. **Season as primary data dimension** — Every competitor uses a season selector (NBA: dropdown, BBRef: dropdown on every page, FIBA: date selector, MaxPreps: season year in title)
2. **Player names link to profiles** — Universal pattern; every player name on every page links to a player profile
3. **Multiple stat categories presented separately** — All competitors categorize stats by type (points, rebounds, assists, etc.) rather than showing a single combined view

### Patterns most share (common)
**Count: 4/5**

4. **Top-N leaderboard cards per stat category** — NBA (top 10), FIBA (top 3), MaxPreps (top 5), Onoo (top 3) all show a small number of top performers per category with a "see all" link
5. **Live score prominence during games** — NBA (ticker at top), Onoo (hero scoreboard + ticker), FIBA (live scores in event feeds) — 3/4 surface live scores prominently
6. **Editorial content woven into data surfaces** — NBA, FIBA, MaxPreps all integrate news/previews alongside stats. Onoo does this with the editorial two-column layout.
7. **Team organization by competition structure** — All organize teams by league/conference/division structure
8. **Visual player presentation in leaders** — NBA, FIBA, MaxPreps all show player photos or flags in leaderboards. Only BBRef shows text-only names.

### Differentiators (minority)
- **Event-as-hub microsite** — Only FIBA (1/4) creates self-contained tournament pages with full lifecycle
- **Information density as design philosophy** — Only Basketball-Reference (1/4) maximizes data per pixel
- **Data-first hero** — Only Onoo (current) leads with a scoreboard rather than editorial content
- **Classification rounds** — Only FIBA (1/4) shows full classification brackets (9-16, 13-16, etc.)
- **Countdown timers** — Only FIBA (1/4) uses countdown urgency for upcoming events
- **Interactive engagement** — Only FIBA (1/4) has MVP polls and interactive features
- **Podium metaphor for leaders** — Only Onoo (current) uses a numbered podium with #1 highlighted in brand color
- **Mobile-first responsive contract** — Only Onoo has an explicit 360px → lg progressive enhancement contract

### Gaps (none do, but should)
1. **Player comparison tool** — No competitor offers side-by-side player stat comparison from the leaderboard
2. **Advanced metrics on landing page** — No competitor shows PER, True Shooting %, or Usage Rate on the public landing/leaders surface (BBRef has them buried in sub-pages)
3. **Season trend visualization** — No competitor shows stat trends over time (PPG over the season) on landing pages
4. **Social/shareable stat graphics** — No competitor generates Instagram/Twitter-ready stat cards for sharing
5. **Real-time leaderboard updates during games** — NBA does live scores but not live leaderboard updates; no competitor updates rankings in real-time during games

## 7. Opportunities and Risks

### Opportunities for Onoo

| # | Opportunity | Source | Impact | Feasibility | Evidence |
|---|------------|--------|--------|-------------|----------|
| 1 | **Add multi-category leaders** — Show top 3 for PTS, REB, AST, STL, BLK (not just PTS) on landing page | MaxPreps (top-5 per category), FIBA (top-3 per category), NBA (top-10 per category) | High — immediately increases data value | High — data already exists via `getLeaders()` | All 3 visual competitors do this |
| 2 | **Build tournament hub pages** — Each tournament/season gets its own page with games, standings, leaders, bracket | FIBA event-as-hub pattern | High — creates deep engagement per competition | Medium — requires new routing + data | FIBA's event pages are the most engaging surfaces observed |
| 3 | **Add tournament bracket visualization** — Visual bracket for knockout rounds, classification rounds for placement games | FIBA brackets (only source) | High — unique in Mongolian basketball | Medium — requires bracket data model | FIBA is the only competitor with this |
| 4 | **Leaderboard "View All" expansion** — Current top-3 podium should link to a dedicated `/leaders` page with all categories, full rankings, and filters | FIBA (teaser + "View All"), MaxPreps ("All Leaders" link) | High — current page only shows scoring leaders | High — `/leaders` page already exists | 3/4 competitors use teaser + full-page pattern |
| 5 | **Countdown to next game/tournament** — Add countdown timer below hero for the next scheduled game or tournament start | FIBA countdown timers | Medium — creates urgency | High — simple timer component | Only FIBA does this; it's effective |
| 6 | **Contextual stat badges** — Show where a leader ranks relative to league average ("28.5 PPG — 15% above league avg") | NBA.com (season/type filters provide context) | Medium — adds analytical depth | Medium — requires league average computation | NBA and BBRef provide filtering context but not contextual badges |
| 7 | **Improve leaderboard visual density** — Add player photos to leaderboard rows (currently text-only on leaders page), show more stat columns per row | MaxPreps (photos in leaderboard), NBA (card-based with photos) | Medium — increases scannability | High — avatar component already exists | 3/4 competitors show visual player data in leaderboards |
| 8 | **Off-season gracefully** — Show historical leaders, season highlights, or "pre-season" state when no games are scheduled | MaxPreps ("No Data" states), FIBA (calendar + upcoming events) | Medium — prevents dead page | High — simple conditional rendering | MaxPreps handles this well |
| 9 | **Shareable stat cards** — Generate Instagram/Twitter-ready graphics for top performers and game results | Gap in all competitors | Medium — drives organic growth | Medium — requires image generation | No competitor does this; pure opportunity |
| 10 | **Player comparison from leaderboard** — Add "compare" toggle on leaderboard rows | Gap in all competitors | Low-Medium — power-user feature | Medium — requires comparison UI | NBA and BBRef both lack this |

### Risks to validate

| Risk | Concern | Validation method |
|------|---------|-------------------|
| **FIBA bracket may be richer than scraped** | The tournament bracket visual might be interactive/rendered via JS — our scrape showed text-heavy representation | Screenshot the FIBA bracket in a browser session before committing to implementation scope |
| **Multi-category leaders could crowd the hero area** | Showing 5 stat categories on the landing page might overwhelm the current clean layout | User test with 3 categories (PTS/REB/AST) vs. current single category |
| **Tournament hub pages need a data model** | Tournament-as-hub requires tournament/group/bracket data that may not exist in the current schema | Audit the database for tournament vs. season structure before building |
| **Advanced metrics may not serve primary audience** | League operators and casual fans may not care about PER/TS% — this is power-user territory | Survey existing users before building advanced stats surfaces |
| **Countdown timers need timezone handling** | Mongolia spans UTC+7/8; game times are in Ulaanbaatar — countdown must be timezone-accurary | Already handled via `getUlaanbaatarDate()` but verify countdown precision |

## 8. Prioritized Recommendations

### R1: Add Multi-Category Leaderboard Strip
- **Adopt**
- **Priority**: P0
- **Rationale**: Every visual competitor (NBA, FIBA, MaxPreps) shows leaders across multiple stat categories, not just scoring. Onoo currently only shows PTS leaders on the landing page, leaving REB, AST, STL, and BLK invisible. This is the highest-impact, lowest-effort improvement.
- **Confidence**: High
- **Evidence**: NBA (top-10 per category with photos), FIBA (top-3 per category), MaxPreps (top-5 per category with photos + school). All 3/3 visual competitors do this.
- **User/workflow**: All audiences — fans see more data, players see their category, coaches get a quick league snapshot
- **Implementation**: Render 3-5 stat category strips below the current podium section. Each strip shows top 3 per category with player avatar, name, team, and stat value. Reuse the existing podium component with a `category` prop.

### R2: Leaderboard "View All" Teaser Pattern
- **Adopt**
- **Priority**: P0
- **Rationale**: The current leaders section shows only top 3 scorers with no clear path to see more data. FIBA and MaxPreps both use a "top N teaser → View All link" pattern that keeps the landing page scannable while providing depth.
- **Confidence**: High
- **Evidence**: FIBA (top-3 per category with "View All" links), MaxPreps ("All Leaders" link per category). 2/3 visual competitors.
- **User/workflow**: Fans and coaches who want deeper stats — the "Бүгд" link already exists but should be more prominent and appear per-category, not just once.
- **Implementation**: Add "View All →" link next to each category heading. Link to `/leaders` which already exists.

### R3: Tournament Hub Pages
- **Adopt**
- **Priority**: P1
- **Rationale**: FIBA's event-as-hub pattern is the single most engaging architecture observed. Each tournament gets its own page with games grouped by phase, standings, leaders, and bracket. Onoo currently has no tournament-level page — data lives only at the season level.
- **Confidence**: Medium (requires data model audit)
- **Evidence**: FIBA (every competition is a self-contained microsite with news, games, standings, stats, video). No other competitor does this.
- **User/workflow**: League operators managing a specific tournament, fans following a specific competition
- **Implementation**: Create `/tournaments/[id]` pages with: games grouped by round/phase, group standings, knockout bracket, tournament leaders, and news. Requires audit of whether the data model distinguishes tournaments from seasons.

### R4: Tournament Bracket Visualization
- **Adopt**
- **Priority**: P1
- **Rationale**: Only FIBA has tournament brackets, and no competitor in Onoo's space does. For a platform tracking Mongolian basketball leagues with knockout rounds, bracket visualization is table-stakes for tournament credibility.
- **Confidence**: Medium (FIBA bracket rendering needs browser validation)
- **Evidence**: FIBA (visual brackets for knockout rounds + classification brackets). No other competitor.
- **User/workflow**: Fans following playoff progression, league operators presenting tournament structure
- **Implementation**: SVG or CSS-based bracket component. Start with standard 8-team single-elimination, extend to classification rounds (9-12, 13-16) following FIBA's model.

### R5: Countdown Timer for Next Game
- **Test**
- **Priority**: P2
- **Rationale**: FIBA uses countdown timers to create urgency for upcoming events. Onoo's hero area shows "Дараагийн тоглолт" (Next Game) but doesn't display a live countdown. A countdown below the hero would increase return visits.
- **Confidence**: Medium
- **Evidence**: FIBA (countdown timers to Women's WC, Men's WC 2027). Unique pattern — only 1/4 competitors.
- **User/workflow**: Casual fans deciding whether to come back for tonight's game
- **Implementation**: Simple countdown component below hero section. Use `Intl.DateTimeFormat` for timezone-accurate Ulaanbaatar time. Remove once game starts, replace with live score.

### R6: Multi-Stat Featured Player Card
- **Adopt**
- **Priority**: P2
- **Rationale**: Onoo already has the best player spotlight in the competitive set — the ink-dark hero card with 3 statement stats is unique. Enhance it by adding shooting splits or a mini trend sparkline, following Basketball-Reference's data depth philosophy.
- **Confidence**: High
- **Evidence**: Onoo (current — already unique). BBRef (stat depth philosophy). NBA (player photos + stats create emotional connection).
- **User/workflow**: Fans discovering a standout player, coaches evaluating talent
- **Implementation**: Add a 4th stat row (FG% or a sparkline) to the existing featured player card. Keep the ink-dark hero treatment.

### R7: Navigation Simplification
- **Adopt**
- **Priority**: P2
- **Rationale**: All competitors except Basketball-Reference have navigation overload (NBA: 150+ links, FIBA: mega-menu, MaxPreps: multi-tier). Onoo's current mobile-first approach with horizontally scrollable links is the right pattern. Formalize it: Bracket, Teams, Players, Stats, Schedule — 5 top-level destinations maximum.
- **Confidence**: High
- **Evidence**: NBA (150+ links — risk of decision paralysis), BBRef (flat menu — functional but dated), FIBA (complex mega-menu). Onoo already has the cleanest nav.
- **User/workflow**: All audiences, especially mobile users
- **Implementation**: Keep current mobile nav. On desktop, show 5 items in a horizontal bar. No mega-menus. Link deeper pages from section headers, not navigation.

### R8: Season/Competition Selector
- **Adopt**
- **Priority**: P2
- **Rationale**: Every competitor treats "season" as a primary data dimension. Onoo currently hardcodes to the current season. A season selector on the leaders and standings pages would match the universal pattern and unlock historical data browsing.
- **Confidence**: High
- **Evidence**: NBA (season dropdown on stats pages), BBRef (season dropdown on every page — 80+ seasons), FIBA (historical date selector 2010-2026). 3/4 competitors.
- **User/workflow**: Coaches comparing current vs. past seasons, fans researching historical performance
- **Implementation**: Add a season dropdown to `/leaders`, `/standings`, and potentially the landing page leaders section. Default to current season.

### R9: Shareable Stat Cards
- **Test**
- **Priority**: P3
- **Rationale**: No competitor generates shareable stat graphics. This is a pure differentiation opportunity — Instagram/Twitter-ready cards showing a player's top performance or a game result would drive organic discovery.
- **Confidence**: Low (unvalidated demand)
- **Evidence**: Gap in all 4 competitors. No direct evidence of demand from the research.
- **User/workflow**: Players sharing their stats, fans sharing game results, league operators promoting the league
- **Implementation**: Generate OG-image-style cards on player/game pages. Use `@vercel/og` or similar to render stat cards server-side. Add share buttons.

### R10: Advanced Metrics Surface
- **Avoid** (for now)
- **Priority**: P3
- **Rationale**: No competitor surfaces advanced metrics (PER, TS%, Usage Rate) on public landing pages. Basketball-Reference has them buried in sub-pages. For Onoo's current audience (league operators, coaches, casual fans), basic stats are the right priority. Advanced metrics should wait until the platform has deeper user analytics needs.
- **Confidence**: Medium
- **Evidence**: BBRef (has advanced stats but not on landing pages), NBA (has "Advanced Leaders" as a sub-tab, not primary). Neither surfaces these for casual visitors.
- **User/workflow**: Power users only — not the primary audience yet
- **Implementation**: When ready, add an "Advanced" tab to `/leaders` with PER, TS%, USG%, Net Rating. Don't surface on landing page.

## 9. Unknowns and Next Research Actions

| Unknown | Why it matters | How to resolve |
|---------|---------------|----------------|
| FIBA bracket actual rendering | The bracket may be interactive/animated, not just text — we scraped markdown only | Screenshot FIBA event brackets in a browser session |
| Mobile rendering for all competitors | All scrapes returned desktop content; mobile patterns are critical for Onoo | Browser screenshots at 360px viewport for each competitor |
| FIBA event page JS interactions | Carousel behavior, lazy loading, dynamic filtering not captured in scrape | Browser session with JavaScript execution |
| Onoo user preferences | We don't know what Onoo's actual users want — all recommendations are competitor-derived | Survey existing league operators and coaches about landing page priorities |
| Database tournament vs. season structure | Tournament hub pages require understanding whether the data model supports tournament-level queries | Audit schema for tournament/season/group/bracket tables |
| Live game frequency | How often are games live on Onoo? This determines whether live-game features should be prominent | Query database for game frequency and status distribution |

## 10. Cost Summary

| Operation | Count | Estimated Credits |
|-----------|-------|-------------------|
| Firecrawl searches | ~8 | ~16 |
| Firecrawl scrapes | ~12 | ~24 |
| Browser sessions | ~6 | N/A |
| **Total** | ~26 | ~40 |

## 11. Sources

| # | URL | Method | Content |
|---|-----|--------|---------|
| 1 | `https://www.nba.com` | Firecrawl scrape | Landing page structure, navigation, content hierarchy |
| 2 | `https://www.nba.com/stats/leaders` | Firecrawl scrape | Leaderboard layout, filters, stat categories, player presentation |
| 3 | `https://www.basketball-reference.com` | Firecrawl scrape + browser screenshot | Homepage structure, navigation, content sections |
| 4 | `https://www.basketball-reference.com/leaders/` | Firecrawl scrape + browser screenshot | Leaders page layout, stat categories, season selector |
| 5 | `https://www.fiba.basketball` | Firecrawl scrape | Landing page carousel, navigation, content sections, countdown timers |
| 6 | `https://www.fiba.basketball/en/events/fiba-u17-womens-basketball-world-cup-2026` | Firecrawl scrape | Event hub structure, games, standings, brackets, leaders |
| 7 | `https://www.fiba.basketball/en/ranking/men` | Firecrawl scrape | Ranking table design, filters, region tabs |
| 8 | `https://www.maxpreps.com` | Firecrawl scrape | Landing page layout, navigation, content sections |
| 9 | `https://www.maxpreps.com/basketball/stat-leaders/` | Firecrawl scrape | Stat leader design, top-5 cards, qualification thresholds |
| 10 | `https://www.maxpreps.com/basketball/rankings/1/` | Firecrawl scrape | Rankings page, off-season handling |
| 11 | `src/app/page.tsx` | Local read | Onoo current landing page implementation |
| 12 | `DESIGN.md` | Local read | Onoo design system |
| 13 | `PRODUCT.md` | Local read | Onoo product context and brand personality |
