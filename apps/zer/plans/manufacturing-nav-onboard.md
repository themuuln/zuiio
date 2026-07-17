# Manufacturing Navigation & Onboarding Defaults

## Context
Phase 0 of the manufacturing module for Zer. Adds a "Үйлдвэрлэл" sidebar navigation group and wires manufacturing company type to auto-select manufacturing features during onboarding.

## Files to Change
| File | Action | What changes |
|------|--------|--------------|
| src/lib/navigation.ts | Modify | Add "Үйлдвэрлэл" nav group + `GearSix` icon import, add manufacturing feature keys to nav items |
| src/app/(onboarding)/onboarding/wizard-client.tsx | Modify | Add `getManufacturingDefaults()`, initialize `selectedFeatures` based on `companyType` prop |
| src/app/(onboarding)/onboarding/actions.ts | Modify (if needed) | Add `has_manufacturing` param if pattern demands it |

## Implementation Order

### 1. navigation.ts — Add nav group
- Import `GearSix` is already present; need `Factory` — check if `@phosphor-icons/react/dist/ssr` exports it. If not, use `Cube` as closest match.
- Add after "Шинжилгээ" group (line 175), before "Хүний нөөц" group (line 176):
  ```typescript
  {
    label: "Үйлдвэрлэл",
    items: [
      { title: "BOM", href: "/bom", icon: Cube, featureKey: "boms" },
      { title: "Үйлдвэрлэлийн захиалга", href: "/production", icon: ClipboardText, featureKey: "production_orders" },
      { title: "Чанарын хяналт", href: "/quality", icon: CheckCircle, featureKey: "quality_control" },
    ],
  },
  ```
- Uses existing Phosphor icons already imported (Cube, ClipboardText) — no new import needed. `CheckCircle` is already imported in wizard but not in navigation.ts. Use `ClipboardText` for quality too, or pick from existing imports. Looking at imports: Cube, ClipboardText exist. For quality control, `CheckCircle` is NOT imported in navigation.ts. Options: use `ClipboardText`, `FileText`, or add import. Best fit: use `Cube` for BOM, `ClipboardText` for production orders, `CheckCircle` would need import. Safer to add `GearSix` is already there. Let me pick icons from existing imports:
  - BOM → `Cube` (already imported)
  - Үйлдвэрлэлийн захиалга → `ClipboardText` (already imported)  
  - Чанарын хяналт → `CheckCircle` — NOT imported. Will use `FileText` (already imported) as closest match, or add `CheckCircle` import.

  Decision: Add `CheckCircle` to the `@phosphor-icons/react/dist/ssr` import block since it semantically matches quality control.

### 2. wizard-client.tsx — Manufacturing defaults
- Add `getManufacturingDefaults()` function returning `new Set(['boms', 'production_orders', 'job_costing', 'quality_control', 'material_tracking'])`
- Change `selectedFeatures` initial state: if `companyType === 'manufacturing'`, start with manufacturing defaults; otherwise empty set.
- Add `useEffect` to sync feature selection when companyType changes (user might change it via browser back, though in wizard flow it's set once).
- Actually, looking at the wizard — `companyType` is passed as a prop and doesn't change during the wizard flow (it's set during org creation). So just use it in initial state.

  ```typescript
  const manufacturingFeatures = useMemo(() => getManufacturingDefaults(), []);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(
    companyType === 'manufacturing' ? manufacturingFeatures : new Set(),
  );
  ```

  Also need to update `selectAllFeatures` to include manufacturing features when applicable — actually `selectAllFeatures` uses `FEATURES` from constants which doesn't include manufacturing features yet. That's fine — another worker will add manufacturing features to the FEATURES array. Our job is just the onboarding defaults.

### 3. actions.ts — Check if has_manufacturing needed
- Current pattern: boolean columns like `has_suppliers`, `has_inventory`, etc. are written to `organizations` table.
- Manufacturing features are gated via `enabled_features` array (the nav items use `featureKey` which is checked in `filterNavGroups`).
- The `_inventory`, `_suppliers` prefixed keys use underscore convention for internal nav gating, while standard features use the FEATURES array.
- Manufacturing nav items use standard `featureKey` values (`boms`, `production_orders`, `quality_control`) — these are in the `enabled_features` array.
- **No `has_manufacturing` column needed** — the feature gating pattern uses `enabled_features` array, not boolean columns. The boolean columns (`has_suppliers`, `has_inventory`) are for toggle settings, not feature gating.
- **No changes to actions.ts.**

## Edge Cases
- Company type "manufacturing" but user deselects some manufacturing features — fine, `toggleFeature` handles this.
- companyType is not "manufacturing" — selectedFeatures starts empty as before.
- `FEATURE_KEYS` doesn't have manufacturing keys yet — not needed for nav items since they use string literals directly (same pattern as `_inventory`, `_suppliers`).

## Verification
1. `npx tsc --noEmit` — zero new type errors
2. Visual check: sidebar shows Үйлдвэрлэл group with 3 items
3. Onboarding: when companyType is "manufacturing", features step shows manufacturing features pre-selected
