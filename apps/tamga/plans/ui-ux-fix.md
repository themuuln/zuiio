# UI/UX Fix — Home Screen

## Context
The home screen has 4 visible issues: 9 bottom tabs overflowing with truncated labels, header text clipped behind the dynamic island, a bare empty state, and a UUID error from the dev auth mock. All are scoped to 4 files.

## Files to Change

| File | Action | What changes |
|------|--------|-------------|
| `src/app/(tabs)/_layout.tsx` | Modify | Reduce 9 tabs → 5 visible + "Бусад" overflow. Hide search, lineage, documents, transfers, notifications from tab bar. Add a "Бусад" (More) tab that groups them. |
| `src/app/(tabs)/index.tsx` | Modify | Replace `pt-12` with `useSafeAreaInsets().top`. Redesign empty state with styled illustration area, larger icon in a circle, bold title, subtitle, and a prominent "Морь нэмэх" CTA button. Use the `FAB` component for the add button. |
| `src/components/ui/PageHeader.tsx` | Modify | Replace hardcoded `pt-12` with `useSafeAreaInsets().top` for consistent safe area across all screens. |
| `src/lib/auth.ts` | Modify | Change dev mock `id: "dev-user-000"` → `id: "00000000-0000-0000-0000-000000000000"` (nil UUID) to pass Postgres UUID validation. |

## New File

| File | Action | What changes |
|------|--------|-------------|
| `src/app/(tabs)/more.tsx` | Create | New "Бусад" tab screen that lists links to: Хайх (Search), Удам (Lineage), Баримт (Documents), Шилжүүлэг (Transfers), Мэдэгдэл (Notifications). Simple list with icons and chevrons. |

## Implementation Order

1. Create `more.tsx` (no deps on other changes)
2. Modify `_layout.tsx` — restructure tabs, hide secondary tabs, add Бусад
3. Modify `index.tsx` — safe area + empty state redesign
4. Modify `PageHeader.tsx` — safe area fix
5. Modify `auth.ts` — UUID fix

## Tab Structure (after)

| Tab | Icon | Route | Visibility |
|-----|------|-------|-----------|
| Морь | pets | index | visible |
| Зах | storefront | market | visible |
| Эвент | event | events | visible |
| Профайл | person | profile | visible |
| Бусад | apps | more | visible |

Hidden from tab bar (accessible via Бусад): search, lineage, documents, transfers, notifications.

## Edge Cases

- Empty horses list → styled empty state with CTA
- Dev auth UUID → nil UUID passes Postgres `uuid` type check
- Safe area → works on all iPhone models (notch, dynamic island, no notch)

## Verification

1. `cd src && npx tsc --noEmit` — zero type errors
2. Visual: 5 tabs, no truncation, proper labels
3. Visual: header text not clipped by dynamic island
4. Visual: empty state has visual hierarchy and CTA
5. Runtime: no UUID error in console
