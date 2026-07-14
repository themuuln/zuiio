<!-- Layout: Events & Tournaments -->
Design an events and tournament section for a mobile horse management app.

Include:
- Events list screen with upcoming/past toggle and type filter chips
- Event creation/edit form screen

Interactions:
- Toggle between upcoming and past events
- Filter chips narrow by event type
- FAB opens create form
- Event card tap opens detail (not shown — detail uses existing patterns)

Style: warm earthy palette, orange (#F06A2E) active filters and FAB, iOS-minimal cards, warm white background, system font

Optimize for mobile, pull-to-refresh, infinite scroll

---

<!-- Component: Events List Screen -->
Design an events and tournament list screen for a mobile app.

Include:
- "Арга хэмжээ" (Events) title in Title 1, left-aligned
- Segmented control: "Удахгүй" (Upcoming) | "Өнгөрсөн" (Past) — orange active segment
- Filter chips row (horizontal scroll): "Бүгд" (All) | "Уралдаан" (Race) | "Үзэсгэлэн" (Show) | "Сургалт" (Training) | "Бусад" (Other)
- Event cards in vertical list:
  - Event type badge (colored pill: race=orange, show=blue, training=green)
  - Event name (Headline weight)
  - Date and location (Body, muted)
  - Participant count badge
  - Horse avatar row (small circles, overlapping, "+3" count)
- Empty state: calendar illustration + "Арга хэмжээ алга" (No events yet)
- Orange FAB (bottom-right) with "+" for creating event

Style: warm grouped background, white cards, color-coded type badges, clean list layout, iOS grouped list pattern, system font

Optimize for mobile, horizontal chip scroll, pull-to-refresh, pagination

---

<!-- Component: Add Event Screen -->
Design a full-screen form for creating or editing an event on mobile.

Include:
- "Шинэ арга хэмжээ" (New Event) title with close (X) button top-right
- Event type selector: horizontal chips — "Уралдаан" (Race) | "Үзэсгэлэн" (Show) | "Сургалт" (Training) | "Бусад" (Other) — orange selected
- Form fields stacked:
  - "Нэр" (Name) — text input, required
  - "Огноо" (Date) — date picker, required
  - "Байршил" (Location) — text input with map pin icon
  - "Тэмдэглэл" (Description) — multiline textarea
  - "Оролцогч морьд" (Participating Horses) — multi-select with horse avatars
- "Хадгалах" (Save) primary button — full-width, orange

Style: clean form layout, warm background, orange type chips, iOS-style inputs, consistent spacing, system font

Optimize for mobile, keyboard-aware, date/time pickers, validate required fields
