# Settings Module

**Purpose:** Single-page settings hub for the entire organization -- all 10 configuration sections scroll on one page with a sticky icon sidebar.

## File Structure

```
settings/
├── page.tsx                     # Main page: orchestrates all sections, search, form state
├── layout.tsx                   # Passthrough layout (max-w-7xl container only)
├── error.tsx                    # Error boundary
├── loading.tsx                  # Loading fallback
├── _settings-sections.ts        # Section registry (10 sections with icons/titles)
├── _settings-sub-sidebar.tsx    # Sticky icon-only nav sidebar (scrollspy + click-to-navigate)
├── _settings-utils.ts           # Type-safe setting accessors (getStringSetting, getNumberSetting, getBooleanSetting)
├── _organization-card.tsx       # Org info card (name, slug, logo upload)
├── _business-defaults-form.tsx  # General section form (invoice prefix, currency, tax, timezone, date format, language)
├── _appearance-customization.tsx # Theme toggle + brand color picker with presets
├── _branches-section.tsx        # Branch list table + finance separation toggle + add branch
├── _commission-rules-section.tsx # CRUD dialog for mechanic commission rules (percentage/flat/none)
├── _pricing-rules-section.tsx   # CRUD for conditional pricing rules (type, conditions, adjustment)
├── _diagnosis-labels-section.tsx # Drag-reorderable diagnosis label list with CRUD
├── _telegram-section.tsx        # Telegram bot connection (generate link, copy link)
├── _vehicle-niche-form.tsx      # Car brand/model selection (accordion with checkboxes)
├── _data-sharing-form.tsx       # Opt-in data sharing toggle (cross-org customer data)
└── _data-export-section.tsx     # JSON export button + backup commands reference
```

## Page Architecture

The page uses a **single-page scroll layout** with `IntersectionObserver` scrollspy:

1. **Top bar** -- title, section badge, search input (filters sections by name)
2. **Sidebar** (`SettingsSubSidebar`) -- icon-only nav, sticky `top-20`, hidden on mobile
3. **Content** -- all 10 sections render in sequence, each with an `<section id="settings-section-{value}">` anchor

State management: `useState` for form data (`SettingsForm`), synced from `organization.settings` via `buildFormFromOrganization()`. Form saves via `PATCH /api/organizations/{id}` with merged settings object.

## Settings Sections (10 total)

| # | Value | Component | Fields / Features |
|---|-------|-----------|-------------------|
| 1 | `general` | `_business-defaults-form.tsx` + `_organization-card.tsx` | Invoice prefix, default currency, default tax rate, timezone, date format, language. Card shows org name, slug, logo upload |
| 2 | `branches` | `_branches-section.tsx` | Branch list table (name, address, phone, active status), finance-separate-per-branch toggle, add branch sheet (`QuickCreateBranchSheet`) |
| 3 | `appearance` | `_appearance-customization.tsx` | Theme toggle (light/dark/system), brand color picker with 9 presets + hex input + native color picker. Live preview via `applyBrandThemePreview` |
| 4 | `commission` | `_commission-rules-section.tsx` | Mechanic commission rules: type (percentage/flat/none), value, service scope. Dialog for add/edit/delete. Fetches mechanics list |
| 5 | `pricing` | `_pricing-rules-section.tsx` | Conditional pricing rules: rule type, conditions (operator + value), price adjustment. Full CRUD dialog |
| 6 | `diagnosis` | `_diagnosis-labels-section.tsx` | Reorderable diagnosis labels (drag-and-drop via `@dnd-kit`). Add/edit/delete dialog |
| 7 | `telegram` | `_telegram-section.tsx` | Telegram bot integration: generate connection link, copy link |
| 8 | `niche` | `_vehicle-niche-form.tsx` | Vehicle niche: car brand accordion with model checkboxes. Saves as `niche_brands` + `niche_models` in org settings |
| 9 | `sharing` | `_data-sharing-form.tsx` | Data sharing toggle: opt-in cross-org customer/vehicle data. PATCHes `sharingEnabled` on org |
| 10 | `export` | `_data-export-section.tsx` | JSON data export (downloads blob) + CLI backup commands reference |

## Data Flow

| Source | Endpoint | Usage |
|--------|----------|-------|
| `useCurrentOrg()` | `/api/profile` | Get current org ID |
| `orgKeys.detail(orgId)` | `GET /api/organizations/{id}` | Load full org (settings object) |
| `handleSubmit` | `PATCH /api/organizations/{id}` | Save general settings (merged into `settings` JSON) |
| `useBranches(orgId)` | via React Query | Branch list for branches section |
| `useOrgSettings(orgId)` | via React Query | Org-level settings (finance separation) |
| Commission/Pricing/Diagnosis | Dedicated API routes | CRUD via their respective section components |

## Conventions

- **`SettingsForm`** type defined in `_business-defaults-form.tsx` -- all fields optional-ish, defaults in `DEFAULT_FORM`
- **`buildFormFromOrganization()`** extracts settings from `organization.settings` JSON using `_settings-utils.ts` helpers
- **`renderSectionContent()`** in `page.tsx` switches on `section.value` to render the right component
- All section components receive `orgId` as a prop; general + appearance also receive `form`/`setForm`/`organization`
- `IntersectionObserver` scrollspy updates `activeSection` with rootMargin `-96px 0px -55% 0px`
- Language change triggers cookie update + full page reload

## Dependencies

- `@tanstack/react-query` -- org data fetching
- `next-intl` -- all labels via `useTranslations("settings")`
- `next-themes` -- theme toggle
- `sonner` -- toast notifications
- `zod` -- form validation (in sub-components)
- `@dnd-kit/core` -- drag-and-drop in diagnosis labels
- `@/components/org-logo-upload` -- logo upload widget
- `@/components/branches/quick-create-branch-drawer` -- branch creation drawer
- `@/components/brand-theme-provider` -- live brand color preview
