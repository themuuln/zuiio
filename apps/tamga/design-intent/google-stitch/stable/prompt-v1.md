<!-- Component: Stable Management Screen -->
Design a stable management dashboard screen for mobile.

Include:
- "Хүлэмж" (Stable) title in Title 1, left-aligned
- Summary cards row (3 cards, horizontal):
  - "Морьд" (Horses) — count number in orange, horse icon
  - "Баг" (Team) — count number in orange, people icon
  - "Нэхэмжлэл" (Invoices) — count number in orange, invoice icon
- Segmented control: "Морьд" (Horses) | "Баг" (Team) | "Нэхэмжлэл" (Invoices) — orange active
- Content area based on active tab:
  - Horses tab: horse list cards (photo, name, status)
  - Team tab: team member list (avatar, name, role)
  - Invoices tab: invoice list (date, amount ₮, status badge)
- Empty state per tab with relevant illustration
- Orange FAB: "+" for adding to active tab context

Style: dashboard summary cards, warm grouped background, orange stat numbers, tabbed content, clean list layouts, system font

Optimize for mobile, card tap for detail, pull-to-refresh, tab switching with content swap
