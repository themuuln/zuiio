<!-- Component: Horse Transfer Screen -->
Design a horse ownership transfer form for a mobile app.

Include:
- "Эзэмшил шилжүүлэх" (Transfer Ownership) title in Title 2, with back arrow
- Current owner info card at top: avatar, name, "Одоогийн эзэн" (Current Owner) label
- Arrow icon pointing down to new owner section
- Form fields:
  - "Хүлээн авагчийн нэр" (Recipient Name) — text input
  - "Үнийн дүн" (Price) — numeric input with ₮ currency prefix
  - "Шилжүүлсэн огноо" (Transfer Date) — date picker, defaults to today
  - "Тэмдэглэл" (Notes) — multiline text area, optional
- Terms checkbox: "Шилжүүлэх нөхцөлийг зөвшөөрч байна" (I accept transfer terms)
- "Шилжүүлэх" (Transfer) primary button — full-width, orange
- Warning banner at bottom: "Энэ үйлдлийг буцаах боломжгүй" (This action cannot be undone) with warning icon

Style: step-by-step visual flow, warm background, orange accents, iOS form style, clear visual hierarchy between current/new owner, system font

Optimize for mobile, confirmation dialog before submit, form validation

---

<!-- Component: Health Logs Screen -->
Design a health log list screen for a specific horse on mobile.

Include:
- Back arrow + "Эрүүл мэндийн тэмдэглэл" (Health Logs) title in Title 2
- Horse name subtitle in muted text
- Filter chips row: "Бүгд" (All) | "Эмчилгээ" (Medical) | "Мөргөлт" (Farrier) — orange active chip
- Health log entries in a vertical list:
  - Date (Caption, left)
  - Log type icon (20dp, color-coded: medical=red, farrier=orange)
  - Log type label (Headline weight)
  - Brief description (Body, muted)
  - Tapped for detail
- Empty state: heartbeat illustration + "Эрүүл мэндийн тэмдэглэл алга" (No health logs yet)
- Orange FAB (bottom-right) with "+" for adding new log

Style: warm grouped background, white list cells, color-coded type icons, clean timeline feel, iOS grouped list pattern, system font

Optimize for mobile, filter chips scroll horizontally, pull-to-refresh

---

<!-- Component: Add Health Log Screen -->
Design a full-screen form for adding a health log entry on mobile.

Include:
- "Шинэ тэмдэглэл" (New Log) title with close (X) button
- Horse selector at top (if multiple horses): dropdown or chip showing selected horse
- Log type selector: horizontal chips — "Вакцин" (Vaccine) | "Өвчин" (Illness) | "Мөргөлт" (Farrier) | "Бусад" (Other)
- Date picker field: "Огноо" (Date), defaults to today
- Description textarea: "Тайлбар" (Description), multiline, placeholder "Дэлгэрүүлнэ үү..."
- Optional fields:
  - "Эмчийн нэр" (Veterinarian) — text input
  - "Зардал" (Cost) — numeric input with ₮ prefix
- "Хадгалах" (Save) primary button — full-width, orange

Style: clean compact form, warm background, orange type chips when selected, iOS-style inputs, consistent spacing, system font

Optimize for mobile, keyboard-aware, date picker modal, validate required fields
