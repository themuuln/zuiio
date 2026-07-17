# Dynamic Parent Map for Inbreeding Calculator

## Context
The inbreeding calculator uses a hardcoded `parentMap` with only seed horses. Horses added via UI have `sireId`/`damId` fields but are ignored. The COI calculation only works for built-in seed data.

## Files to Change
| File | Action | What changes |
|------|--------|--------------|
| `lib/src/features/lineage/application/inbreeding_calculator.dart` | Modify | Add `buildParentMapFromHorses()`, modify `calculate()` to accept optional horses list, merge seed + dynamic data |
| `lib/src/features/lineage/presentation/inbreeding_calculator_screen.dart` | Modify | Pass `horses` list to `InbreedingCalculator.calculate()` |

## Implementation
1. Add `import '../../../shared/domain/horse.dart';` to inbreeding_calculator.dart
2. Add `buildParentMapFromHorses(List<Horse> horses)` method that maps `sireId`/`damId` to `Parents`
3. Add optional `List<Horse>? horses` parameter to `calculate()`
4. In `calculate()`: merge seed data (via existing `buildParentMap()`) with dynamic data (via `buildParentMapFromHorses()`), dynamic overwriting seed
5. Update TODO comment to reflect resolution
6. Update caller in screen to pass horses list

## Edge Cases
- `horses` is null or empty → falls back to seed-only parentMap (backward compatible)
- Horse has neither sireId nor damId → skipped (no entry added to dynamic map)
- Dynamic horse overrides seed entry → dynamic wins (correct for user-added data)

## Verification
- `dart analyze lib/src/features/lineage/application/inbreeding_calculator.dart` — zero errors
- `dart analyze lib/src/features/lineage/presentation/inbreeding_calculator_screen.dart` — zero errors
