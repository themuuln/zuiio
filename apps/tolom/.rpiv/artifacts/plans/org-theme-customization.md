# Org Theme Customization — Blueprint

**Date:** 2026-05-28  
**Feature:** Per-organization theme customization (colors, radius, fonts)  
**Status:** Planning

---

## 1. Current State

### Theme System (shadcn v4 + Tailwind v4)
- All colors defined as CSS custom properties in `globals.css`
- Uses oklch color space for precision
- Components reference semantic tokens (`bg-primary`, `text-foreground`)
- Dark mode via `.dark` class selector
- Border radius: all set to `0px` (sharp corners)
- Fonts: Inter (sans), JetBrains Mono (mono)

### Key CSS Variables
```
Colors:     --primary, --secondary, --accent, --destructive, --muted, --card, --popover
Borders:    --border, --input, --ring
Radius:     --radius (base), --radius-sm/md/lg/xl
Fonts:      --font-sans, --font-mono
Sidebar:    --sidebar, --sidebar-primary, --sidebar-accent
Charts:     --chart-1 through --chart-10
```

### Organizations Table
- Has `settings` JSONB column (currently stores `{ language: "mn" }`)
- Perfect place to extend with theme properties

---

## 2. Design Decisions

### What to Make Customizable (matching shadcn Create page)

| Property | CSS Variable | Description | Default |
|----------|--------------|-------------|---------|
| **Primary Color** | `--primary` | Main brand color (buttons, links) | `oklch(0.205 0 0)` (black) |
| **Accent Color** | `--accent` | Secondary accent | `oklch(0.97 0 0)` (light gray) |
| **Border Radius** | `--radius` | Component roundness | `0px` (sharp) |
| **Font Family** | `--font-sans` | Body typography | Inter |

### What to Keep System-Wide
- Destructive colors (red for errors — consistency)
- Background/foreground (readability)
- Chart colors (can derive from primary)
- Sidebar colors (derive from primary)

### Why This Scope?
- **Primary + Accent**: These define 80% of brand identity
- **Radius**: Sharp vs rounded is a major visual personality switch
- **Font**: Typography is the other 20% of brand feel
- Keeping destructive/background fixed ensures accessibility

---

## 3. Database Schema

### Extend `organizations.settings` JSONB

No new table needed — just add theme keys to existing `settings` column:

```sql
-- Migration: Add theme defaults to organizations
UPDATE organizations 
SET settings = settings || '{
  "theme": {
    "primaryColor": "oklch(0.205 0 0)",
    "accentColor": "oklch(0.97 0 0)", 
    "radius": "0px",
    "fontFamily": "Inter, sans-serif"
  }
}'::jsonb
WHERE settings->>'theme' IS NULL;
```

### Settings JSONB Shape
```typescript
interface OrgSettings {
  language: string;
  theme?: {
    primaryColor: string;    // oklch value
    accentColor: string;     // oklch value
    radius: string;          // CSS value (0px, 0.25rem, etc.)
    fontFamily: string;      // CSS font-family stack
  };
}
```

---

## 4. Implementation Phases

### Phase 1: Schema + Service Layer
**Files:**
- `supabase/migrations/XXXX_org_theme.sql` — Add theme defaults
- `src/lib/types/index.ts` — Add `OrgTheme` type
- `src/lib/services/organization-service.ts` — Add `getOrgTheme()`, `updateOrgTheme()`
- `src/app/api/organizations/[id]/theme/route.ts` — API endpoint

**Success Criteria:**
- Migration runs successfully
- Types are generated
- API returns/updates theme settings
- Default theme values exist for all orgs

---

### Phase 2: Theme Provider + CSS Injection
**Files:**
- `src/components/org-theme-provider.tsx` — Reads theme, injects CSS vars
- `src/app/[locale]/layout.tsx` — Wrap app in provider
- `src/lib/queries/use-org-theme.ts` — React Query hook

**Success Criteria:**
- Theme loads on org switch
- CSS variables are injected on wrapper element
- Components update instantly when theme changes
- Dark mode still works (derive dark variants)

**Implementation:**
```tsx
// OrgThemeProvider.tsx
export function OrgThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: theme } = useOrgTheme();
  
  const style = {
    "--primary": theme?.primaryColor,
    "--accent": theme?.accentColor,
    "--radius": theme?.radius,
    "--font-sans": theme?.fontFamily,
  } as React.CSSProperties;
  
  return <div style={style}>{children}</div>;
}
```

---

### Phase 3: Settings UI
**Files:**
- `src/app/[locale]/dashboard/organization/settings/theme/page.tsx` — Theme page
- `src/components/org-theme-settings.tsx` — Settings form
- `src/components/theme-preview.tsx` — Live preview panel
- `src/components/color-picker.tsx` — Color input with presets
- `src/components/radius-picker.tsx` — Radius selector
- `src/components/font-picker.tsx` — Font selector

**UI Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Org Theme Settings                                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │  Customization       │  │  Live Preview            │  │
│  │                      │  │                          │  │
│  │  Primary Color       │  │  ┌──────────────────┐  │  │
│  │  [Color Picker]      │  │  │  Button (primary) │  │  │
│  │                      │  │  └──────────────────┘  │  │
│  │  Accent Color        │  │  ┌──────────────────┐  │  │
│  │  [Color Picker]      │  │  │  Card             │  │  │
│  │                      │  │  │  with content     │  │  │
│  │  Border Radius       │  │  └──────────────────┘  │  │
│  │  [0] [4] [8] [12]   │  │                          │  │
│  │                      │  │  ┌──────────────────┐  │  │
│  │  Font Family         │  │  │  Badge (accent)   │  │  │
│  │  [Inter] [Roboto]    │  │  └──────────────────┘  │  │
│  │                      │  │                          │  │
│  └─────────────────────┘  └─────────────────────────┘  │
│                                                          │
│  [Reset to Default]                    [Save Changes]    │
└─────────────────────────────────────────────────────────┘
```

**Success Criteria:**
- Color pickers work with oklch/hex conversion
- Radius selector shows visual examples
- Font selector shows actual font preview
- Live preview updates in real-time
- Save persists to database
- Reset restores defaults

---

### Phase 4: Polish + Dark Mode
**Files:**
- `src/components/org-theme-provider.tsx` — Add dark mode derivation
- `src/app/globals.css` — Add dark mode fallbacks

**Success Criteria:**
- Dark mode auto-derives from primary color
- Theme persists across page refreshes
- Theme loads fast (no flash of unstyled content)
- Performance: CSS injection is batched, not per-render

---

## 5. Color Presets

### Curated Palette (10 presets)
```typescript
const THEME_PRESETS = [
  { name: "Midnight", primary: "oklch(0.205 0 0)", accent: "oklch(0.97 0 0)" },
  { name: "Ocean", primary: "oklch(0.55 0.15 250)", accent: "oklch(0.95 0.05 250)" },
  { name: "Forest", primary: "oklch(0.5 0.15 145)", accent: "oklch(0.95 0.05 145)" },
  { name: "Sunset", primary: "oklch(0.6 0.18 30)", accent: "oklch(0.95 0.05 30)" },
  { name: "Royal", primary: "oklch(0.45 0.2 280)", accent: "oklch(0.95 0.05 280)" },
  { name: "Cherry", primary: "oklch(0.55 0.2 25)", accent: "oklch(0.95 0.05 25)" },
  { name: "Sky", primary: "oklch(0.6 0.12 230)", accent: "oklch(0.95 0.04 230)" },
  { name: "Amber", primary: "oklch(0.65 0.15 75)", accent: "oklch(0.95 0.05 75)" },
  { name: "Slate", primary: "oklch(0.45 0.03 250)", accent: "oklch(0.95 0.01 250)" },
  { name: "Rose", primary: "oklch(0.55 0.18 350)", accent: "oklch(0.95 0.05 350)" },
];
```

### Border Radius Options
```typescript
const RADIUS_OPTIONS = [
  { label: "Sharp", value: "0px", preview: "□" },
  { label: "Subtle", value: "0.25rem", preview: "▢" },
  { label: "Medium", value: "0.375rem", preview: "▣" },
  { label: "Rounded", value: "0.5rem", preview: "◆" },
  { label: "Pill", value: "0.75rem", preview: "◈" },
];
```

### Font Options
```typescript
const FONT_OPTIONS = [
  { label: "Inter", value: "Inter, sans-serif", preview: "The quick brown fox..." },
  { label: "Roboto", value: "Roboto, sans-serif", preview: "The quick brown fox..." },
  { label: "Open Sans", value: "'Open Sans', sans-serif", preview: "The quick brown fox..." },
  { label: "Lato", value: "Lato, sans-serif", preview: "The quick brown fox..." },
  { label: "Montserrat", value: "Montserrat, sans-serif", preview: "The quick brown fox..." },
];
```

---

## 6. API Endpoints

### GET /api/organizations/[id]/theme
Returns current theme settings for the org.

### PUT /api/organizations/[id]/theme
Updates theme settings. Validates oklch/hex values.

### Request/Response Types
```typescript
// GET Response
interface OrgThemeResponse {
  primaryColor: string;
  accentColor: string;
  radius: string;
  fontFamily: string;
  isDefault: boolean;
}

// PUT Request
interface UpdateOrgThemeRequest {
  primaryColor?: string;
  accentColor?: string;
  radius?: string;
  fontFamily?: string;
}
```

---

## 7. Performance Considerations

### CSS Injection Strategy
- **Server-side**: Load theme in layout, inject as inline style on wrapper
- **Client-side**: Cache in React Query, update on org switch
- **No FOUC**: Theme loads before first paint (server-side fetching)

### Caching
- React Query: `staleTime: Infinity` (theme rarely changes)
- API: Revalidate on update, cache for 1 hour
- Browser: No localStorage needed (server renders it)

---

## 8. Accessibility

### Color Contrast
- Primary color must meet WCAG AA contrast against background
- Validate on save: if contrast ratio < 4.5, show warning
- Offer "light variant" and "dark variant" inputs for power users

### Font Readability
- Only include fonts that support Latin + Cyrillic (for Mongolian)
- Minimum font size: 14px (already enforced)

### Keyboard Navigation
- All color/radius/font pickers must be keyboard accessible
- Live preview must announce changes to screen readers

---

## 9. Future Enhancements (Out of Scope)

- **Logo upload**: Custom org logo in sidebar/header
- **Custom CSS variables**: Power user mode for all variables
- **Theme templates**: Share themes between orgs
- **Brand kit**: Full design system (colors, fonts, spacing, icons)
- **White-label**: Complete UI rebranding for enterprise

---

## 10. Migration Strategy

### Phase 1 Deployment
1. Run migration to add default theme values
2. Deploy API endpoint
3. Deploy ThemeProvider (no UI yet — just defaults)
4. Verify all orgs have theme settings

### Phase 2 Deployment  
1. Deploy settings UI
2. Add navigation link to org settings
3. Announce feature to users

### Rollback Plan
- Theme is additive (CSS variables override defaults)
- Removing ThemeProvider restores original globals.css
- No data loss if feature is disabled

---

## 11. Open Questions

1. **Should we allow custom hex/oklch input or just presets?**
   - Recommendation: Both. Presets for quick start, custom for power users.

2. **Should dark mode colors be auto-derived or manually set?**
   - Recommendation: Auto-derive initially, manual override in v2.

3. **Should we validate color contrast on save?**
   - Recommendation: Yes, warn but don't block (user may know best).

4. **Should theme apply to login page too?**
   - Recommendation: No (login is before org context).

---

## 12. Dependencies

### External
- None (pure CSS variables + React)

### Internal
- React Query for caching
- shadcn components (ColorPicker, etc. — may need to build)
- Next.js App Router for API routes

---

## 13. Testing Strategy

### Unit Tests
- Theme service (get/update)
- Color conversion utilities (hex ↔ oklch)
- Contrast ratio calculator

### Integration Tests
- API endpoint returns/updates theme
- ThemeProvider injects correct CSS variables

### E2E Tests
- Settings UI saves theme
- Theme persists on page refresh
- Theme updates on org switch
- Dark mode works with custom theme

---

## 14. Success Metrics

- [ ] All orgs have default theme values after migration
- [ ] Theme settings page loads in < 500ms
- [ ] Theme changes apply in < 100ms (no visible delay)
- [ ] No FOUC on page load
- [ ] All color pickers are keyboard accessible
- [ ] Contrast ratio warnings display correctly

---

## 15. Time Estimate

| Phase | Effort | Duration |
|-------|--------|----------|
| Phase 1: Schema + Service | 3-4 hours | Day 1 |
| Phase 2: Theme Provider | 4-5 hours | Day 1-2 |
| Phase 3: Settings UI | 6-8 hours | Day 2-3 |
| Phase 4: Polish + Dark Mode | 3-4 hours | Day 3 |
| **Total** | **16-21 hours** | **3-4 days** |

---

## 16. References

- shadcn/ui Create: https://ui.shadcn.com/create
- shadcn Theming Docs: https://ui.shadcn.com/docs/theming
- oklch Color Space: https://oklch.com/
- WCAG Contrast: https://webaim.org/resources/contrastchecker/

---

**Next Step:** Get user approval on this blueprint, then start Phase 1 (Schema + Service).
