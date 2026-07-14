<!-- Layout: Breeding Management -->
Design a breeding management section for a mobile horse management app.

Include:
- Breeding records list with gestation tracker and FAB
- Breeding creation bottom sheet form
- Foal registration bottom sheet form

Interactions:
- Breeding list shows gestation progress bars
- FAB opens creation sheet
- Gestation calculator auto-computes due date
- Foal registration linked from breeding record

Style: warm earthy palette, orange (#F06A2E) gestation progress bars and FAB, DNA/繁殖 themed icons, iOS list style, system font

Optimize for mobile, progress visualization, bottom sheet forms

---

<!-- Component: Breeding Records Screen -->
Design a breeding records list screen for mobile.

Include:
- "Үржүүлэг" (Breeding) title in Title 1, left-aligned
- Breeding cards in vertical list:
  - Sire and Dam names with avatars (side by side, arrow between)
  - Breeding date (Caption, muted)
  - Gestation progress bar (orange fill, percentage label)
  - Status badge: "Хүлээгдэж буй" (Pending) yellow / "Төрсөн" (Born) green / "Дуусаагүй" (In Progress) orange
  - Due date or birth date
- Empty state: DNA helix illustration + "Үржүүлгийн бүртгэл алга" (No breeding records yet)
- Orange FAB: "+" for adding breeding record

Style: warm grouped background, white cards, orange progress bars, status badges, clean layout with avatar pairs, system font

Optimize for mobile, progress bar animations, pull-to-refresh, filter by status

---

<!-- Component: Breeding Creator Sheet -->
Design a breeding record creation bottom sheet for mobile.

Include:
- Grab handle at top
- "Шинэ үржүүлэг" (New Breeding) title in Headline
- Sire selector: "Эцэг" (Sire) — card with photo, name, breed — tap to choose from horse list
- Dam selector: "Эх" (Dam) — card with photo, name, breed — tap to choose
- Swap button between sire and dam (arrows icon)
- "Үржүүлсэн огноо" (Breeding Date) — date picker, defaults to today
- "Төлөвлөсөн төрөлт" (Expected Due Date) — auto-calculated (340 days), display only
- "Тэмдэглэл" (Notes) — multiline textarea, optional
- "Хадгалах" (Save) primary button — full-width, orange
- Validation: sire ≠ dam, both required

Style: iOS bottom sheet, warm background, orange swap button, avatar selector cards, clean form, system font

Optimize for mobile, auto-calculate due date, horse picker modal, validation feedback

---

<!-- Component: Foal Registration Sheet -->
Design a foal registration bottom sheet for mobile.

Include:
- Grab handle at top
- "Шинэ шунуулга бүртгэх" (Register Foal) title
- Parent info display: Sire name + Dam name with arrow
- Form fields:
  - "Нэр" (Name) — text input, required
  - "Хүйс" (Gender) — segmented: Эр/Эм
  - "Өнгө" (Coat Color) — dropdown
  - "Төрсөн он" (Birth Year) — year picker
  - "Төрсөн огноо" (Birth Date) — date picker, optional
- "Хадгалах" (Save) primary button — full-width, orange

Style: iOS bottom sheet, warm background, parent info section, clean form inputs, system font

Optimize for mobile, keyboard-aware, parent auto-fill from breeding record, validation
