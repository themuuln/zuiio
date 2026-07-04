<!-- Component: Public Horse Profile -->
Design a public-facing horse profile screen for a mobile marketplace app.

Include:
- Large hero photo (full-width, 240dp, rounded bottom corners)
- Horse name overlay (Title 1, white text on photo gradient)
- "Нийтийн профайл" (Public Profile) badge pill
- Info section: stat chips row (gender, age, breed, coat color)
- Ownership section: current owner avatar + name
- Tournament results section: list of results with rank badges (gold/silver/bronze)
- "Холбоо барих" (Contact Owner) primary button — full-width, orange
- "Сонирхож байна" (Interested) secondary button — outlined

Style: immersive photo header, warm palette, orange CTAs, clean card sections, tournament rank badges with metallic colors, system font

Optimize for mobile, scroll with sticky contact button, share functionality

---

<!-- Component: Stamp Tracing Canvas -->
Design a stamp tracing canvas screen for digitizing an owner's stamp on mobile.

Include:
- Back arrow + "Тэмдэг улах" (Trace Stamp) title
- Reference photo area (top half): uploaded horse ownership stamp image
- Tracing canvas area (bottom half): blank canvas with grid overlay
- Drawing toolbar at bottom: pen tool, eraser, undo, redo, clear, thickness slider
- Color picker: black only (stamps are traditionally black ink)
- "Дуусгах" (Finish) primary button — full-width, orange
- Export options: "SVG болгон хадгалах" (Save as SVG)

Style: dark canvas area (#2E2D2C background), white drawing strokes, orange toolbar accents, minimal chrome, focused drawing experience

Optimize for touch drawing, pressure sensitivity, zoom on canvas, undo/redo stack

---

<!-- Component: Co-Ownership Sheet -->
Design a bottom sheet for managing co-owners of a horse on mobile.

Include:
- Grab handle at top (5dp × 40dp, centered, gray)
- Title "Хамтын эзэмшил" (Co-Ownership) in Headline weight
- Current owner card at top: avatar, name, "Үндсэн эзэн" (Primary Owner) badge in orange
- Co-owner list below:
  - Each row: avatar, name, ownership percentage, role badge
  - Trailing: more options icon (⋯) for edit/remove
- "Нэмэх" (Add) button — text link, orange, with person+ icon
- Add co-owner form (expandable): name input, percentage slider, role dropdown
- "Хадгалах" (Save) button at bottom — full-width, orange

Style: iOS-style bottom sheet, warm background, orange primary owner badge, clean list rows with separators, system font

Optimize for mobile half-sheet, drag to dismiss, percentage validation (total ≤ 100%)
