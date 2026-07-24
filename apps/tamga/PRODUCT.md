# PRODUCT.md — Tamga

## Register
**product** — app UI, mobile-first tool for horse management.

## Users & Purpose
- **Who**: Horse owners, breeders, and the Mongolian equestrian community.
- **Context**: Daily use on mobile — in the field, at the stable, at events. Needs to work offline.
- **Job**: Manage horse records, track lineage/pedigree, buy/sell/lease on marketplace, organize events, find lost horses, coordinate with teams.

## Product Purpose
Tamga is Mongolia's horse management platform. It digitizes the paper-heavy workflow of horse ownership — registration, health tracking, breeding, marketplace, and community. Success means every Mongolian horse owner uses Tamga as their primary tool, replacing notebooks and word-of-mouth.

## Brand Personality
- **Voice**: Confident, direct, human. Not corporate. Not cute.
- **3 words**: Precise, fluid, confident.
- **Emotional goal**: Trust. This handles something valuable — someone's horse.

## Anti-References
- No "lifestyle brand" aesthetic — this is a tool, not a mood board.
- No rounded-everything soft UI — horses are strong, the app should feel capable.
- No generic SaaS dashboard patterns — this is vertical-specific, not a template.
- No English UI leaks — Mongolian-first, always.

## Design Principles
1. **Offline-first confidence** — the app works even when it shouldn't. Sync is invisible.
2. **Data over decoration** — show the horse, not the chrome. Information density wins.
3. **Mongolian-native** — text, formatting, and workflows match how Mongolians actually work with horses.
4. **Mobile-primary** — thumb-reachable, one-hand operable, fast to scan.
5. **Trust through precision** — exact numbers, clear states, no ambiguity about what's saved.

## Accessibility & Inclusion
- WCAG 2.1 AA minimum
- High contrast for outdoor use (bright sun on phone screens)
- Mongolian text can be long — layouts must handle variable text length
- Reduced motion support

## Tech Stack
- Expo React Native (migrating from Flutter)
- Supabase (PostgreSQL, Auth, Storage, Realtime)
- WatermelonDB (offline-first local DB)
- NativeWind / Tailwind CSS
- TanStack Query
- MapLibre (maps)

## Status
- v1.0.0 — heading to App Store
- Core features built: horses, lineage, marketplace, events, breeding, lost horse, map, documents, training, races, videos, stable, teams
