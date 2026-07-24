# Update _LineageTab to Display Sire/Dam Parent Info

## Context
The Horse model now has `sireId` (String?) and `damId` (String?) fields (lines 83-84 of horse.dart). The `_LineageTab` in horse_detail_screen.dart currently only shows `lineageRootId`. We need to look up sire/dam horses from the full list and display them.

## Files to Change
| File | Action | What changes |
|------|--------|--------------|
| lib/src/features/horses/presentation/horse_detail_screen.dart | Modify | Convert `_LineageTab` from `StatelessWidget` → `ConsumerWidget`, add sire/dam lookup + display |

No new files. No other files touched.

## Implementation Order
1. Convert `_LineageTab` to `ConsumerWidget` with `WidgetRef ref`
2. Read `horsesProvider` via `ref.watch(horsesProvider)` → `AsyncValue<List<HorseRecord>>`
3. Look up sire and dam by matching `horse.sireId` / `horse.damId` against list
4. Build parent Cards with ListTile (name, gender badge, link icon) if found
5. Keep existing `lineageRootId` card
6. Show "no info" fallback only when no parents and no lineage root

## Edge Cases
- `sireId`/`damId` set but horse not in list → show card with ID as fallback text
- No parents, no lineage root → existing "no info" message
- `horsesProvider` still loading → `valueOrNull` returns null, skip parent cards gracefully

## Verification
1. `dart analyze` on the file — zero issues
2. Hot reload, open horse detail → Угшил tab → verify sire/dam cards appear (or appropriate fallback)
