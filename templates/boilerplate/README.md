# stacks/boilerplate

Essential package stack for a modern React Native + Expo app. Install categories as needed for your project.

## Quick start (everything)

```bash
npx expo install zustand @tanstack/react-query \
  react-native-mmkv \
  react-hook-form zod @tanstack/react-form \
  nativewind tailwindcss \
  react-native-reanimated react-native-gesture-handler \
  @shopify/flash-list \
  expo-image expo-secure-store expo-font \
  @gorhom/bottom-sheet \
  @shopify/react-native-skia victory-native
```

---

## Core data & state

| Library | Purpose |
|---------|---------|
| `zustand` | Global client state (UI state, auth state, app-wide flags). No providers, hooks-based. |
| `@tanstack/react-query` | Server state — caching, background refetching, mutations, pagination, optimistic updates. Server data lives here, not in Zustand. |
| `react-native-mmkv` | Fast synchronous KV storage — persist Zustand slices, cache auth tokens. Much faster than AsyncStorage. |
| `expo-secure-store` | Encrypted storage for sensitive secrets (tokens). Complements MMKV — different concern. |

## Navigation

| Library | Purpose |
|---------|---------|
| `expo-router` | File-based routing (default in Expo). Built on React Navigation — native stack/tabs/drawer underneath. Just use this. |

## Forms & validation

| Library | Purpose |
|---------|---------|
| `react-hook-form` | Performant uncontrolled forms. |
| `zod` | Schema validation that doubles as TypeScript types. Validate API responses inside TanStack Query too. |
| `@tanstack/react-form` | Alternative if you prefer the TanStack ecosystem. |

## UI & styling

| Library | Purpose |
|---------|---------|
| `nativewind` + `tailwindcss` | Tailwind for React Native. Fastest path if your team knows Tailwind. |
| `expo-image` | Optimized image component with caching — way better than the built-in `Image`. |
| `phosphor-react-native` | Icons (mirrors `@phosphor-icons/react` on web). |

## Animations & gestures

| Library | Purpose |
|---------|---------|
| `react-native-reanimated` | UI-thread animations — foundational, not optional. Expo Router and React Navigation depend on it. |
| `react-native-gesture-handler` | Gesture primitives — installed alongside Reanimated. |

Install both at project start even if you don't use them directly yet — the ecosystem depends on them.

## Lists

| Library | Purpose |
|---------|---------|
| `@shopify/flash-list` | Drop-in `FlatList` replacement with much better performance on long lists. Worth it the moment you have a scrolling list of any real size. |

## Tables

| Library | Purpose |
|---------|---------|
| `@tanstack/react-table` | Headless, renderer-agnostic table logic (sorting, filtering, pagination, column sizing, grouping). Render with `View`/`Text` + FlashList. |

Simple display tables: just FlashList with custom row components.
Interactive tables (sort/filter/edit): TanStack Table + FlashList.

## Charts

| Library | Purpose |
|---------|---------|
| `@shopify/react-native-skia` | Skia canvas — foundation for custom visualizations. |
| `victory-native` (XL) | Modern Skia-based charts (line, bar, area, scatter). Performant, touch-interactive (tooltips, pan/zoom). |

**Decision guide:**

- Simple charts fast → `react-native-gifted-charts`
- Performant, interactive, room to grow → Victory Native XL + Skia
- Fully custom viz → raw Skia (draw your own)
- One-off simple pie/donut → gifted-charts (lighter dependency than Skia)

## Overlays

### Bottom sheets

| Library | Purpose |
|---------|---------|
| `@gorhom/bottom-sheet` | The de facto standard. Gesture-driven, UI-thread sheets with snap points, backdrop, keyboard handling, scrollable content. |

Use `BottomSheetScrollView` / `BottomSheetFlatList` for scrollable content inside sheets (avoids gesture conflicts).

### Dialogs / modals

| Pattern | When to use |
|---------|-------------|
| `Alert.alert()` | Simple confirm/cancel prompts. Native OS dialog — zero effort, don't replace it. |
| `react-native-modal` | Custom branded dialogs with animations, backdrop, swipe-to-dismiss. |
| Built-in `Modal` / Expo `presentationStyle="pageSheet"` | Simple iOS-native sheet presentations, no dragging needed. |

On mobile, many "dialogs" are better as bottom sheets — easier to reach, more native-feeling.

### Drawers

| Library | Purpose |
|---------|---------|
| `expo-router/drawer` | Navigation drawer (hamburger menu) — built into Expo Router as a layout route. |
| `react-native-drawer-layout` | Standalone non-navigation side panel (filters, settings slide-out). |

For non-nav content on mobile, consider a bottom sheet before reaching for a side drawer.

## Expo first-party modules

Install only what you use. These ship from Expo and are well-maintained:

- `expo-image` — optimized images (prefer over built-in `Image`)
- `expo-secure-store` — encrypted token storage
- `expo-constants` — app constants
- `expo-linking` — deep links
- `expo-notifications` — push notifications
- `expo-camera` — camera access
- `expo-location` — device location
- `expo-haptics` — haptic feedback
- `expo-font` — font loading
- `expo-splash-screen` — splash screen control
- `expo-dev-client` — custom dev builds for native-module testing

---

## Design rules (zuiio conventions)

- **Colors**: always OKLch, always from `@zuiio/branding` tokens — no raw hex
- **Spacing**: multiples of 4px only
- **Radius**: use `--radius-*` tokens, never hardcoded `px`
- **Icons**: `phosphor-react-native` — `regular` weight default, `fill` for active state
- **Motion**: never animate layout properties (`width`, `height`) — use `transform` and `opacity` only
- **Fonts**: Geist Sans (UI), Instrument Serif (display), Geist Mono (code)

## Related

- [`docs/stack-mobile.md`](/docs/stack-mobile.md) — monorepo mobile stack
- [`AGENTS.md`](/AGENTS.md) — monorepo conventions and adding new apps/packages
- [`docs/design.md`](/docs/design.md) — full design system reference
