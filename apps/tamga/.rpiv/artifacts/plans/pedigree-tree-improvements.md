# Pedigree Tree Improvement Plan

> Based on comparing our current implementation against Claude's suggested `graphview`-based rewrite.
> Decision: **Keep our custom tree, cherry-pick visual improvements.**
>
> **Status: ✅ Implemented** (2026-06-08) — Phases 1–4 complete. Phase 5 (Supabase repo) deferred.

---

## Why Not Migrate to `graphview`

- Our `pedigree_layout.dart` already implements Buchheim-Walker layout from scratch (587 lines)
- `graphview` can't do bidirectional (ancestors above, descendants below) — only top-down
- We'd lose: ownership badges, generation tracking, hidden branch support, disconnected component handling
- Dependency risk for a package that hasn't been updated recently
- Our edge painter (cubic Bezier, color-coded sire/dam/offspring) is more flexible than `TreeEdgeRenderer`

**Best path:** keep our custom layout, upgrade the cards and detail panel, add photo support.

---

## Cherry-Picked from Claude's Suggestion

| Idea | Where It Goes | Why |
|------|--------------|-----|
| Photo avatars with emoji fallback | `PedigreeNodeCard` | We only show first-letter initials now |
| Stat-chip detail panel layout | `SelectedNodeCard` | Cleaner than current plain text rows |
| "View Profile" CTA button | `SelectedNodeCard` | Direct navigation to horse profile |
| AnimatedSwitcher + SlideTransition | `lineage_tree_section.dart` | Smoother panel transitions |
| Supabase repository sketch | Future `SupabaseLineageRepository` | We need real data eventually |

**Rejected from Claude:**
- ❌ Hardcoded hex colors (breaks dark mode, doesn't match earth-tone design)
- ❌ Ancestor-only traversal (we need descendants too)
- ❌ No ownership distinction (core UX feature)
- ❌ Flat architecture (violates Clean Architecture)
- ❌ No error handling (no `Result<T>`, no `AppException`)

---

## Phase 1 — Domain Model Enhancement

**Files:**
- `lib/src/features/lineage/domain/lineage_tree_node.dart`
- `lib/src/features/lineage/application/pedigree_layout.dart` (`PedigreeNodeVm`)

**Changes:**

Add optional fields to `LineageTreeNode`:
```dart
final String? photoUrl;
final String? sex;          // 'stallion' | 'mare' | 'gelding'
final String? tamgaNo;
final String? region;
final double? speedIndex;
```

Add the same fields to `PedigreeNodeVm` (carry through from domain → VM).

**Rationale:** These fields exist on `Horse` already. We only map them into `LineageTreeNode` when building the snapshot. The fields stay optional so existing seed data doesn't break.

**Risk:** Duplication with `Horse` model. Mitigation: only add fields that affect tree card rendering, not the full horse profile.

---

## Phase 2 — Node Card Upgrade

**File:** `lib/src/features/lineage/presentation/pedigree_tree_content.dart` → `PedigreeNodeCard`

**Changes:**

1. **Photo avatar:**
   - If `node.photoUrl != null` → `CircleAvatar(backgroundImage: NetworkImage(...))`
   - Else if `node.sex == 'stallion'` → 🐎 emoji in stallion-tinted circle
   - Else if `node.sex == 'mare'` → 🐴 emoji in mare-tinted circle
   - Else → current first-letter initial (fallback)

2. **Keep existing elements:**
   - Name (title, bold)
   - Relation label + birth year
   - Offspring count + award count
   - Өрхийн/Гаднах badge
   - Hidden branch badge (+N)

3. **Add tamga badge** (if `tamgaNo` is non-null):
   - Small chip below the stat row: `Тамга: {tamgaNo}`

**No color changes** — keep Material 3 `colorScheme` theming, don't adopt Claude's hardcoded hex palette.

---

## Phase 3 — Selected Node Panel Upgrade

**File:** `lib/src/features/lineage/presentation/lineage_tree_section.dart` → `SelectedNodeCard`

**Changes:**

Replace plain text rows with a stat-chip grid (inspired by Claude's `_StatChip`):

```
┌─────────────────────────────────────────────┐
│ [Avatar]  Хан Хүлэг                    [→ Профайл] │
│           Root азарга • Хээр • 2012         │
│           Өрхийн                             │
├─────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ Шагнал   │ │ Үр төл   │ │ Тамга    │ │ Хурд     │ │
│ │ 7        │ │ 18       │ │ KH-001   │ │ 12.5 км │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                                                     │
│ + Нуусан салаа: +2  (if hiddenBranchCount > 0)      │
└─────────────────────────────────────────────┘
```

**Keep all existing info** — relation label, coat, birth year, ownership, hidden branches.

**Add "Профайл" button** — only show if a horse profile screen route exists for the node's ID. Uses `TextButton.icon` with `Icons.arrow_forward_ios`.

---

## Phase 4 — Panel Animation

**File:** `lib/src/features/lineage/presentation/lineage_tree_section.dart`

**Changes:**

Wrap `SelectedNodeCard` in `AnimatedSwitcher` with:
- `SlideTransition` (slide up from bottom, offset 0→1)
- `FadeTransition` (0.0→1.0)
- Duration: 220ms, curve: `Curves.easeOut`
- Keyed by `ValueKey(selectedNodeId)` for smooth swap between nodes

---

## Phase 5 — Supabase Lineage Repository (Future)

**Not implementing now.** Documenting for later.

**File:** `lib/src/features/lineage/data/supabase_lineage_repository.dart`

**Approach:**
```dart
class SupabaseLineageRepository implements LineageRepository {
  @override
  Future<Result<LineageSnapshot>> fetchSnapshot(String rootId) async {
    // 1. Fetch root horse from 'horses' table
    // 2. Traverse UP via sire_id/dam_id (ancestors, max 3 generations)
    // 3. Traverse DOWN via horses WHERE sire_id = id OR dam_id = id (descendants)
    // 4. Build LineageSnapshot with treeNodes, treeEdges, timeline
  }
}
```

**Key decisions (deferred):**
- Use bounded recursion (maxGeneration) to avoid N+1
- Later optimize with Postgres RPC / recursive CTE
- Map `Horse` columns → `LineageTreeNode` fields at query boundary
- Keep `Result<T>` error handling

---

## Phase 6 — Tests

**File:** `test/pedigree_layout_test.dart`

**Changes:**
- Add test cases for new optional fields (`photoUrl`, `sex`, `tamgaNo`)
- Verify `PedigreeNodeVm` carries fields through from `LineageTreeNode`
- Verify node card renders photo when `photoUrl` is set
- Verify node card falls back to emoji when `photoUrl` is null
- Verify stat chips render in `SelectedNodeCard`

---

## Execution Order

```
Phase 1 (domain) → Phase 2 (node cards) → Phase 3 (detail panel) → Phase 4 (animation) → Phase 6 (tests)
                                                                                    ↑
Phase 5 (Supabase repo) ─── separate PR, later ─────────────────────────────────────┘
```

**Phase 1–4** can be one PR. **Phase 5** is a separate future PR.

---

## Verification

After each phase:
1. `lsp_diagnostics` on changed files + parent directory
2. `flutter test` to catch regressions
3. Visual check on emulator/device for card rendering, photo fallback, panel animation
