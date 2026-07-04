# Tamga Phase 1 — Local-First Stabilization

## Process Overview

Sequential 4-phase process to stabilize Tamga's local-first architecture.

### Phase 1: Isar Migration
- Replace SharedPreferences/LocalJsonStore with Isar
- Create Isar schemas for all entities
- Implement Isar-backed repositories
- Data migration from SharedPreferences → Isar
- **Gate:** Build + tests pass → user approval

### Phase 2: Horse Model Merge
- Unify HorseRecord + LineageHorse → shared Horse
- Delete LineageHorse, redirect all imports
- Update lineage, horses, market, events features
- **Gate:** Build + tests pass → user approval

### Phase 3: Error Handling Integration
- Wrap all repository returns in Result<T>
- Add specific AppException codes
- Update providers + UI for error states
- **Gate:** Build + tests pass → user approval

### Phase 4: Phone + Email Auth (No Confirmation)
- Create auth feature (domain/data/presentation)
- Phone + email registration (no OTP/email confirmation)
- Login with phone or email + password
- Anonymous → registered migration
- Auth gate on app shell
- **Gate:** Build + tests pass → final approval

## Dependencies

```
Phase 1 (Isar)
    ↓
Phase 2 (Horse merge) — uses Isar for persistence
    ↓
Phase 3 (Error handling) — wraps merged model repos
    ↓
Phase 4 (Phone auth) — independent, but benefits from clean error handling
```

## Files Changed (Estimated)

| Phase | New Files | Modified Files |
|-------|-----------|----------------|
| Isar | ~10 (schemas, IsarStorage) | ~12 (all local repos) |
| Horse merge | 1 (shared/horse.dart) | ~15 (lineage + horses features) |
| Error handling | 0 | ~20 (all repos + providers) |
| Phone auth | 6 (auth feature) | 4 (router, bootstrap, shell, pubspec) |

## Risk Areas

1. **Isar migration data loss** — Must verify seed data migrates correctly
2. **Lineage tree rendering** — Complex algorithm, merge may break subtle things
3. **Cross-feature references** — Horse model used everywhere, rename cascades
4. **Supabase config** — Email confirmation must be disabled in Supabase dashboard
