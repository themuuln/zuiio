# Validation Assertions — Supabase Repository Mixin (Milestone 2)

> Area: **Supabase Repository Boilerplate**
> Prefix: `VAL-REPO-`

---

### VAL-REPO-001: SupabaseRepositoryMixin exists in `lib/src/core/data/`

A `SupabaseRepositoryMixin` named `SupabaseRepositoryMixin` exists in `lib/src/core/data/`.

**Verification:**

- File exists at `lib/src/core/data/supabase_repository_mixin.dart`
- Contains `mixin SupabaseRepositoryMixin` declaration

---

### VAL-REPO-002: Mixin provides `_safe` getter

The mixin exposes a `SupabaseClient? get _safe` getter that returns the nullable Supabase client instance, replacing the identical getter currently duplicated in every repository.

**Verification:**

- `supabase_repository_mixin.dart` contains `SupabaseClient? get _safe => _client;`
- The getter returns `null` when the `SupabaseClient` is not configured

---

### VAL-REPO-003: Mixin provides `_userId` getter

The mixin exposes a `Future<String?> get _userId` getter that wraps `ensureSupabaseUserId()`, replacing the identical getter currently duplicated in every repository.

**Verification:**

- `supabase_repository_mixin.dart` contains `Future<String?> get _userId async => ensureSupabaseUserId();`
- When Supabase is not configured, the getter returns `null`

---

### VAL-REPO-004: Mixin provides `_wrap` error converter

The mixin exposes an `AppException _wrap(Object e)` method that converts `PostgrestException` to `AppException` with appropriate code and details, and all other exceptions to `AppException` with code `UNKNOWN_ERROR`.

**Verification:**

- `supabase_repository_mixin.dart` contains `AppException _wrap(Object e) { ... }`
- When `e is PostgrestException`, returns `AppException` with `e.message`, `e.code ?? 'SUPABASE_ERROR'`, and details from `e.hint` and `e.details`
- When `e` is not a `PostgrestException`, returns `AppException` with `message: e.toString()` and `code: 'UNKNOWN_ERROR'`

---

### VAL-REPO-005: Mixin provides `_noClient` AppException factory

The mixin exposes a method or getter that returns an `AppException` for the "Supabase not configured" case, replacing the identical `_noClient()` method currently duplicated in every repository.

**Verification:**

- `supabase_repository_mixin.dart` contains either `AppException _noClient()` or `AppException get _noClient`
- Returns `AppException` with `message: 'Supabase тохиргоо байхгүй байна'` and `code: 'SUPABASE_NOT_CONFIGURED'`

---

### VAL-REPO-006: All eligible Supabase repositories use the mixin

Every Supabase repository that currently duplicates the boilerplate helpers (`_safe`, `_userId`, `_wrap`, `_noClient`) is refactored to `with SupabaseRepositoryMixin`.

Excluded repos (not expected to use the mixin):

- `SupabaseAuthRepository` — uses different helper names (`_safeClient`, `_wrapError`, `_noClientError`) and has different semantics
- `SupabaseAiRepository` — uses HTTP directly, not `SupabaseClient`
- `SupabaseMessageRepository` — delegates to local storage, no `_safe`/`_userId` pattern

**Verification:**

- Run: `grep -rl 'with SupabaseRepositoryMixin' lib/src/features/` and count >= 19
- Run: `grep -rl 'SupabaseClient? get _safe' lib/src/features/` — returns 0 matches (none remain)
- `SupabaseAuthRepository`, `SupabaseAiRepository`, `SupabaseMessageRepository` do NOT have the mixin

---

### VAL-REPO-007: Duplicated boilerplate blocks removed

The 17–22 line boilerplate block (`_safe`, `_userId`, `_wrap`, `_noClient`) is removed from every repository that now uses the mixin.

**Verification:**

- Run: `grep -c 'AppException _wrap(Object e)' lib/src/features/*/data/supabase_*_repository.dart` — count equals 0 for refactored files (only superseded by mixin)
- Run: `grep -c 'SupabaseClient? get _safe' lib/src/features/*/data/supabase_*_repository.dart` — count equals 0 for refactored files

---

### VAL-REPO-008: All row mapping uses domain model `fromSupabaseJson`/`toSupabaseJson`

Every Supabase repository method that reads from or writes to a Supabase table uses the domain model's `fromSupabaseJson` factory and `toSupabaseJson` method for row mapping, rather than inline `_fromRow`/`_toRow` mappers.

**Verification:**

- No repository in `lib/src/features/*/data/supabase_*_repository.dart` contains `_fromRow` or `_toRow` methods
- Every `.from('table').select()` call result is mapped via `Model.fromSupabaseJson(row)`
- Every `.upsert()` or `.insert()` call passes data returned by `model.toSupabaseJson(ownerId: ...)`

---

### VAL-REPO-009: `dart analyze` passes with zero errors

The project passes `dart analyze` with no errors, warnings, or hints related to the refactored files.

**Verification:**

- Run: `dart analyze lib/src/core/data/supabase_repository_mixin.dart` — zero issues
- Run: `dart analyze lib/src/features/` — zero issues in `data/supabase_*_repository.dart` files
- Run: `dart analyze` — zero issues project-wide (or only pre-existing unrelated issues)

---

### VAL-REPO-010: All existing tests pass

All existing tests continue to pass after the refactoring. The mixin is a pure extraction of existing behavior, so no test logic changes are needed.

**Verification:**

- Run: `flutter test` — all tests pass, exit code 0
- Run: `flutter test test/features/lineage/supabase_lineage_repository_test.dart` — passes
- Run: `flutter test test/features/auth/supabase_auth_repository_test.dart` — passes
- Run: `flutter test test/features/ai/data/supabase_ai_repository_test.dart` — passes

---

### VAL-REPO-011: No `PostgrestException` import in individual repository files

The `PostgrestException` import (from `package:supabase_flutter`) is removed from individual repository files since the `_wrap` logic in the mixin handles it centrally.

**Verification:**

- Run: `grep 'import.*PostgrestException' lib/src/features/*/data/supabase_*_repository.dart` — returns 0 matches
- Run: `grep 'import.*PostgrestException' lib/src/core/data/supabase_repository_mixin.dart` — returns 1 match (only in mixin)

---

### VAL-REPO-012: Each refactored repository declares `SupabaseClient` field and passes it to the mixin

Each refactored repository has a `final SupabaseClient? _client` field initialized via the constructor, and the mixin's `on` clause requires a type that provides this field.

**Verification:**

- The mixin declaration includes `on` clause, e.g., `mixin SupabaseRepositoryMixin on HasSupabaseClient` or similar
- Each refactored repository still has `final SupabaseClient? _client;` in the class body
- `dart analyze` confirms all mixin applications are valid via the `on` constraint

---

**Total assertions: 12**
