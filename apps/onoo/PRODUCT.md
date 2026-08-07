# Onoo — Product Context

> This file is for AI agents and designers. It explains what Onoo is, who it serves, what it should feel like, and what it must never become.

## Product

**Onoo** is a Mongolian basketball statistics platform that provides live game tracking, box score derivation, standings, and player/team statistics. It operates in two modes: **public-facing read-only stats views** for fans and the public, and **admin panels** for league operators to record, review, and manage game data.

The product is in a **paid-pilot** phase — a small set of real leagues using the system for live scoring and historical records.

## Register

**Product** — this is a data-driven application, not a marketing site. Design serves the product experience: fast data lookup, reliable scoring workflows, and clear admin operations.

The public surface should feel **editorial and energetic** (like a professional sports stats outlet), while the admin surface should feel **trustworthy and operational** (like a reliable tool for game-day work).

## Users

### Primary: League operators (admin)
- **Context**: Sitting courtside during a game, entering stat events in real time on a tablet or phone
- **Job**: Record every play accurately; review and finalize game records after the game
- **Mood**: Focused, time-pressured, needs to trust the tool works offline and under bad connectivity

### Secondary: Coaches and players
- **Context**: Checking stats after a game or during the season
- **Job**: Look up a player's performance, compare games, see season trends
- **Mood**: Curious, competitive, wants clean data fast

### Tertiary: Public fans
- **Context**: Browsing league standings, game scores, player profiles
- **Job**: Find a game, check the score, explore a player's stats
- **Mood**: Casual but engaged — wants to see real data, not generic summaries

## Product Purpose

Onoo exists to make Mongolian basketball data **trustworthy, accessible, and visible**. Basketball leagues in Mongolia need a reliable system for recording, storing, and sharing game statistics. Without it, records are lost, scores are disputed, and players' achievements go unrecognized.

Success looks like: league operators prefer Onoo over paper scorekeeping; public fans find and use the stats site; data integrity is unquestioned.

## Brand Personality

**Athlete-first. Editorial. Energetic.**

- **Athlete-first**: Every surface centers the player and the game. Stats are the hero, not the UI. The player profile is the most important page in the product.
- **Editorial**: Public pages read like a well-produced sports stats outlet — clean typography, strong numeric hierarchy, confident layout. Not a spreadsheet, not a dashboard.
- **Energetic**: The amber sports accent signals competition and action. The product should feel alive and confident, not sterile or corporate.

**Voice**: Concise, direct, human, confident. Mongolian-first for all user-facing text.

## Anti-References

What Onoo must NOT look like:

1. **Generic SaaS dashboard** — Blue/navy gradient headers, card grids with icon + heading + text repeated endlessly, numbered section markers (01/02/03), tiny uppercase tracked eyebrows. This is the default AI look. Onoo has a specific sports identity, not a template.
2. **ESPN / sportsbook betting site** — Dark cluttered layouts, neon accents, odds-heavy, overwhelming density. Onoo is informational, not transactional.
3. **Corporate enterprise app** — Sterile gray, oversized sidebar, form-heavy, no personality. Onoo has energy and editorial voice.

## Design Principles

1. **Data is the hero.** Numbers, stats, and game results are the most important content on every page. The UI exists to make them legible and compelling, not to show off design.
2. **Editorial confidence.** Public pages should feel like a professional sports stats outlet — strong typography, clean hierarchy, no clutter. The design should feel deliberate, not templated.
3. **Operational trust.** Admin surfaces must be reliable and clear. No ambiguity about what action to take, no decoration that distracts from the task.
4. **Offline-first honesty.** The tracker works offline by design. Don't hide the offline state — surface it clearly and let the user know their work is saved locally and will sync when connected.
5. **Respect the data contract.** `stat_events` are journal entries. They cannot be deleted or rewritten. The UI must make this constraint visible and respected, never suggesting destructive actions on immutable data.

## Accessibility

- **WCAG AA** — standard contrast ratios, visible focus states, reduced motion, semantic HTML
- Charts include textual summaries or stat labels
- Public navigation must be reachable at 360px viewport
- Team color never carries meaning alone
- Semantic headings and landmarks throughout

## Design Context

- **Shared design system**: `docs/design.md` (zuiio brand tokens, semantic colors, typography scale, spacing, elevation, motion)
- **Product-specific tokens**: `src/app/globals.css` (sports-amber accent, chart colors, sidebar theme, player showcase gradients)
- **Component inventory**: `DESIGN.md` (HeroCard, RecentGames, SeasonArc, ShootingProfile, SkillRadar, Milestones, SeasonSelector, SiteNav)
- **Responsive contract**: 360px one-column → md stacked → lg asymmetric showcase grid
