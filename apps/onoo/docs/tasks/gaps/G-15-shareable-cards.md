---
**ID:** `G-15`
**Name:** Shareable Stat Cards
**Priority:** `P3`
**Status:** `⬜`
**Effort:** `M` (1-2d)
**Tags:** `frontend`, `share`, `social`, `og-image`, `player-profile`
**DB Readiness:** `✅` Fully supported by current schema

---

## Goal

Generate Instagram/Twitter-ready stat graphics showing a player's top performance or game result. OG-image-style cards rendered server-side. Add share buttons on player and game pages.

## Why

Shareable stat graphics are the most viral form of sports content — "Player X dropped 45 points last night" with a clean graphic. No competitor in this space generates them, making it a unique differentiator. Every stat line shared on social media is free marketing for Onoo.

## Technical Approach

### Card Types

**1. Player performance card:**
- Player photo + name + team
- Stat line: PTS, REB, AST, STL, BLK, FG% in a clean grid
- Game context: vs [Opponent], [Date]
- "Career high" or "Season best" badge if applicable
- Onoo branding: logo + URL at the bottom

**2. Game result card:**
- Home team logo + score vs Away team logo + score
- Winner highlighted
- Top performer stat line (PTS leader)
- Game date, venue
- Onoo branding

**3. Season milestone card:**
- Player photo
- Milestone description: "1,000 career points!"
- Current season stats
- "Follow on Onoo" CTA

### Rendering

- **Option A: `@vercel/og` (Satori + Resvg)**
  - Server-side rendering of JSX to PNG
  - Works with Next.js App Router in Edge Runtime
  - Supports flexbox layout, text, images
  - Output: `<img>` tag or social preview

- **Option B: `satori` directly**
  - Same engine as `@vercel/og`
  - More control over layout

**Recommendation:** `@vercel/og` — already a Vercel ecosystem dep, works with Edge Functions, simpler API.

### Share Mechanisms

1. **Download:** `download` attribute on `<a>` link to the generated image
2. **Web Share API:** `navigator.share({ files: [blob] })` — works on mobile
3. **Copy to clipboard:** `navigator.clipboard.write()` for pasting into social apps
4. **Direct social share:** Links to Twitter/Whatsapp with text + image URL

### Route Structure

```
/api/og/player/[id]          → Player stat card (PNG)
/api/og/game/[id]            → Game result card (PNG)
/api/og/milestone/[id]       → Milestone card (PNG)
```

These routes use `@vercel/og`'s `ImageResponse`.

### Component Structure (Server)

```tsx
// app/api/og/player/[id]/route.tsx
import { ImageResponse } from '@vercel/og';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const player = await getPlayer(params.id);
  const stats = await getPlayerSeasonStats(params.id);

  return new ImageResponse(
    (
      <div tw="flex bg-dark-bg text-white p-8 w-800 h-400">
        {/* Layout */}
      </div>
    ),
    { width: 800, height: 400 }
  );
}
```

## Data Dependencies

| Entity | Access | Purpose |
|--------|--------|---------|
| `getPlayerById` | Already exists | Player name, photo, team |
| `getPlayerSeasonStats` | Already exists | Per-game averages |
| `getPlayerCareerTotals` | Already exists | Milestone data |
| Game results | Already exist | Score, opponent, top performer |

No database changes needed.

## Implementation Steps

1. **Install `@vercel/og`:**
   ```bash
   pnpm add @vercel/og
   ```

2. **Create player stat card OG route:**
   - `/api/og/player/[id]/route.tsx`
   - JSX layout for stat card with player photo, name, stats grid
   - Style with Tailwind classes via `tw` prop

3. **Create game result card OG route:**
   - `/api/og/game/[id]/route.tsx`
   - Team logos, scores, top performer

4. **Add download/share buttons:**
   - On player page: "Share Card" button
   - On game detail page: "Share Result" button
   - Uses Web Share API with fallback

5. **Set OG meta tags for social preview:**
   - Player pages: `<meta property="og:image" content="/api/og/player/[id]" />`
   - Game pages: `<meta property="og:image" content="/api/og/game/[id]" />`

6. **Test:**
   - Visit OG route → PNG renders with correct data
   - Download button → downloads PNG
   - Share button → shares via mobile share sheet

## Implementation Complexity & Effort

**Complexity:** Medium. ~200 lines for card template + generation endpoint.

**Effort:** M (1-2 days)
- OG route setup: 1h
- Player card layout: 2-3h
- Game card layout: 2h
- Share/download buttons: 1h
- OG meta tag integration: 30min
- Testing cross-platform: 1h

## Dependencies / Prereqs

**Blocked by:** None
**Prereqs:** `@vercel/og` compatible with the project's Next.js version. Edge Runtime available.

## Design Decisions

- **`@vercel/og` over client-side canvas rendering.** Server-side ensures images are available for social preview (OG tags) and can be downloaded without a browser canvas dependency.
- **800×400px aspect ratio** (2:1) — optimized for social media previews. Twitter/X recommends 2:1 for card images.
- **Dark background + brand colors** — stat cards should pop in social feeds. Dark theme with Onoo's violet/teal gradient accents.
- **No complex visualizations** (radar charts, etc.) in OG images. Keep to clean typography and stat grids for fast generation.

## Risks & Gotchas

- **`@vercel/og` font loading** requires explicit font URL references. Default system fonts may look different. Bundle a custom font file or reference from a CDN.
- **Image resolution limits.** OG images are small previews. Keep text readable at small sizes (minimum 28px font).
- **Edge Runtime timeouts.** Complex images may exceed Edge Function timeout (30s on Vercel Hobby). Keep images simple.
- **Player photos may not exist** or may be low resolution. Show initials + gradient background as fallback.
- **Web Share API support** is limited on desktop. Provide clipboard copy as fallback.

## Verification

```bash
# Type check
pnpm exec tsc --noEmit

# Build
pnpm build
```

### Done When

- [ ] `/api/og/player/[id]` returns a PNG image with correct player stats
- [ ] `/api/og/game/[id]` returns a PNG image with game result
- [ ] Share/download buttons appear on player pages
- [ ] OG meta tags on player pages reference the card image URL
- [ ] Player pages show card preview in social media link sharing
- [ ] Download works on mobile and desktop
- [ ] TypeScript compilation passes

---

_Last updated: 2026-07-21 | Status: ⬜_
