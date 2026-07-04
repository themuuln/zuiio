<!-- Layout: Marketplace Extras -->
Design supplementary marketplace screens for a mobile horse trading app.

Include:
- Favorite/saved listings screen
- Market price history chart screen with region and lineage filters

Style: warm earthy palette, orange (#F06A2E) accents and favorites, clean card layouts, system font

Optimize for mobile, chart interactions, empty states

---

<!-- Component: Favorite Listings Screen -->
Design a saved/favorited marketplace listings screen for mobile.

Include:
- "Хадгалсан зарууд" (Saved Listings) title with back arrow
- Listing cards in vertical list:
  - Horse photo thumbnail (80dp, rounded)
  - Horse name (Headline)
  - Price in ₮ (Body, orange)
  - Breed + location (Caption, muted)
  - Heart icon (filled orange, trailing — tap to unfavorite)
  - "Зар үзэх" (View Listing) trailing chevron
- Empty state: heart outline illustration + "Хадгалсан зар алга" (No saved listings yet)
- Swipe-to-unfavorite with undo snackbar

Style: warm grouped background, white cards, orange filled hearts, clean list layout, system font

Optimize for mobile, swipe gestures, undo on unfavorite, pull-to-refresh

---

<!-- Component: Price History Screen -->
Design a market price history chart screen for mobile.

Include:
- "Үнийн түүх" (Price History) title with back arrow
- Filter row:
  - Region dropdown: "Бүс" (Region) — аймаг selector
  - Lineage dropdown: "Угсаа" (Lineage) — breed selector
- Time range selector: chips — "1 сар" | "3 сар" | "6 сар" | "1 жил" — orange active
- Price chart (line chart):
  - X-axis: months/dates
  - Y-axis: price in ₮ (MNT)
  - Orange line (#F06A2E) with data points
  - Average price line (dashed, muted)
  - Tooltip on tap showing exact price + date
- Summary stats below chart:
  - "Дундаж үнэ" (Average Price) — large number
  - "Өсөлт" (Growth) — percentage with up/down arrow (green/red)
  - "Нийт зар" (Total Listings) — count
- "Худалдан авах чиг хандлага" (Buying Trend) mini insight card

Style: clean chart design, orange data line, warm background, card-based stats, system font

Optimize for mobile, chart touch interactions, filter requery, responsive chart scaling
