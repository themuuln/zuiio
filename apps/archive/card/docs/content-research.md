# Content Research — Adult Party Game Questions

## Sources Analyzed

| Source | URL | Qty | Quality |
|--------|-----|-----|---------|
| MadPartyGames | madpartygames.com | 1,000+ | High — 1001 dirty truths + dares, well-organized |
| PsyCatGames | psycatgames.com | 450+ | High — multi-category, well-written |
| BuzzFeed | buzzfeed.com | 235 | Medium — good for spicy truths |
| DrinkCountr | drinkcountr.com | 500+ | High — 12 categories, well-researched |
| TheStallionStyle | thestallionstyle.com | 311+ | Medium — dirty WYR, some extreme |
| TOZ App | toz-app.com | 200+ | High — 13 game modes, professional |
| Parade | parade.com | 175 | Medium — dirty NHIE |
| Women's Health | womenshealthmag.com | 155 | Medium — Most Likely To |

## Seeded Content (451 entries in DB)

### Truth or Dare — 190 entries
| Tier | Truths | Dares |
|------|--------|-------|
| 🟢 Spicy | 50 flirty/cheeky truths | 20 fun dares |
| 🟠 Wild | 40 raunchy truths | 20 wild dares |
| 🔥 After Dark | 30 explicit truths | 30 extreme dares |

### Never Have I Ever — 101 entries
| Tier | Count | Categories |
|------|-------|-----------|
| 🟢 Spicy | 61 | embarrassing, funny, travel, food, work, friends, college, deep, party |
| 🟠 Wild | 20 | wild dating/sex confessions |
| 🔥 After Dark | 20 | explicit sexual experiences |

### Hot Takes — 50 entries
| Tier | Count | Type |
|------|-------|------|
| 🟢 Spicy | 30 | Agree/Disagree opinion statements |
| 🟠 Wild | 20 | Relationship/sex opinion statements |

### Most Likely To — 50 entries
| Tier | Count | Type |
|------|-------|------|
| 🟢 Spicy | 30 | Funny + drinking predictions |
| 🟠 Wild | 20 | Sexual/relationship predictions |

### Would You Rather — 60 entries
| Tier | Count | Type |
|------|-------|------|
| 🟢 Spicy | 25 | Funny dilemmas |
| 🟠 Wild | 20 | Sexual/relationship choices |
| 🔥 After Dark | 15 | Explicit choices |

## Language Support Architecture

The `game_content` table has two text columns:

- **`text_en`** — English source text (always populated)
- **`text_mn`** — Mongolian translation (nullable, populated when ready)

**Migration plan:**
1. When Mongolian translations are ready, write a script that `UPDATE game_content SET text_mn = <translated> WHERE id = <id>`
2. The app will query based on a language param: `SELECT coalesce(text_mn, text_en) as text FROM game_content ...`

## Mongolian Content Adaptation Notes

When translating/localizing for the Mongolian market:

- **Airag/vodka references**: Replace generic "drink" references with culturally relevant alcohol (vodka, airag) where appropriate
- **Relationship dynamics**: Mongolian dating culture differs — avoid overly Western-specific scenarios
- **Nightlife locations**: Reference Seoul Street, UB clubs, micro-districts
- **Traditional games**: Shagai bone games, Khorol tile games could be referenced in questions
- **Drinking culture**: Mongolians have heavy drinking traditions — safety messaging should be prominent
- **Age of majority**: 18 in Mongolia — content warnings should respect this
- **Facebook/Messenger**: Primary social platform — sharing flows should target these

## Expansion Plan

| Phase | Content | Size |
|-------|---------|------|
| Now | English seed (Spicy + Wild + After Dark) | 451 cards |
| V1.1 | More Wild tier content | +200 cards |
| V1.2 | Mongolian translation (text_mn) | 451 translations |
| V1.3 | Mongolian-specific content packs | +200 cards |
| V2 | Community-voted cards, flagging, custom uploads | Unlimited |
