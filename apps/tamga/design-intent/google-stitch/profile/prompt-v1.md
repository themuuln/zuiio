<!-- Layout: Profile & Settings -->
Design a user profile and settings screen. Ultra-minimal — iOS Settings level.

Include:
- Profile header with avatar and stats
- Settings as plain grouped list rows
- Notification preferences with toggles

Style: iOS Settings app minimalism, no cards, warm gray section backgrounds with white rows, orange toggle accents, system font

Optimize for mobile, grouped list sections, haptic feedback

---

<!-- Component: Profile Screen -->
Design a user profile screen. Minimal like iOS Settings — zero card backgrounds.

Include:
- "Профайл" large title, bold
- Profile section (warm gray #F1E6E2 background):
  - Avatar (64dp, circular, orange thin border) with camera icon overlay
  - Name (Title 2, bold) — just text, no card
  - Email (muted text below name)
- Stats row: three numbers in large orange bold text with small labels below — "12 морьд · 3 зар · 5 гэрчилгээ" — just inline text, no containers
- Settings section 1 "Тохиргоо" (warm gray background, white rows):
  - "Хэл солих" → "Монгол" (with chevron) — plain row, hairline separator
  - "Кэш цэвэрлэх" — plain row
  - "Бүртгэл устгах" — red text row
- Settings section 2 "Бусад":
  - "Нууцлалын бодлого" → chevron
  - "Нөхцөл" → chevron
  - "Тухай" → "v1.0.0"
- "Гарах" (Logout) — red text, centered, no button background

Style: pure iOS Settings aesthetic, section headers in muted uppercase, white rows on gray, hairline separators, no cards anywhere, no shadows

Optimize for mobile, scrollable, toggle switches

---

<!-- Component: Notification Preferences -->
Design notification settings. Pure iOS toggle list — no cards.

Include:
- Back arrow + "Мэдэгдлийн тохиргоо" title
- Master toggle: "Бүх мэдэгдэл" — large row with orange toggle
- Category toggles (each is a plain row on warm gray background):
  - "Эрүүл мэндийн сануулга" + toggle
  - "Зах зээлийн шинэ зар" + toggle
  - "Тэмцээний мэдээлэл" + toggle
  - "Гео хашааны мэдэгдэл" + toggle
  - "Хамтын эзэмшлийн мэдээлэл" + toggle
  - "Системийн мэдэгдэл" + toggle
- Each row: label (Body) + description (Caption, muted) + toggle — hairline separator

Style: identical to iOS Settings > Notifications, zero card wrappers, warm gray sections, white rows, system font

Optimize for mobile, individual toggles, instant save
