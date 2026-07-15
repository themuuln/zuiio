# 4. Pricing engine (`src/lib/pricing/` — pure, unit-tested)

```
pricing/
├── engine.ts     # computeRetailMnt(input): PricingResult
├── rounding.ts   # roundPrice(raw, {mode:"ceil_to", step:500})
├── resolve.ts    # resolveRule(pkg, rules): package > region > global
├── quote.ts      # server-only DB wrapper
└── types.ts
```

## Types

```ts
export interface PricingInput {
  costUsd: number;
  fxRate: number;                        // USD→MNT
  markupPercent: number;                 // from resolved rule
  minMarginPercent: number;              // floor from app_settings
  rounding: { mode: "ceil_to"; step: number };
}
export interface PricingResult {
  retailMnt: number;                     // integer ₮
  costMnt: number;
  marginMnt: number; marginPercent: number;
  minMarginApplied: boolean;
}
```

## Algorithm

1. `costMnt = round(costUsd × fxRate)`
2. `raw = costMnt × (1 + markupPercent/100)`
3. Floor: `raw = max(raw, costMnt × (1 + minMarginPercent/100))`; flag `minMarginApplied`
4. Round: **ceil to nearest ₮500** — e.g. `29,371 → 29,500`

Rounding rationale: MNT prices in the ₮15,000–₮150,000 range read cleanest at ₮500/₮1000 steps; ₮X,900 endings are uncommon in Mongolian e-commerce, and ceil-to-step guarantees rounding never violates the min-margin floor. Mode/step lives in `app_settings` so it's admin-changeable.

## Rule resolution (`resolve.ts`)

Active `package`-scoped rule → else active `region` rule for the package's region → else the single active `global` rule (required; seeded at 20%).

## DB wrapper (`quote.ts`, server-only)

Loads latest `fx_rates` row + active rules + settings → returns `PricingResult` **plus `fx_rate_id` and `pricing_rule_id`** for snapshotting onto `order_items` at order creation.

Catalog display and checkout both use this wrapper → displayed price ≡ charged price.

## FX

v1: manual admin-set rate (insert new `fx_rates` row). Structure is auto-fetch-ready: a v2 cron inserts `source='auto'` rows; latest-row-wins query unchanged.
