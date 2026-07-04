---
title: Onboarding Design — v4 (2026-06)
description: 6-screen onboarding flow — ultra-minimal flat design, Stitch-approved.
---

# Onboarding Design — v4 (2026-06)

> Visual design spec for Tamga's 6-screen onboarding flow.
> Ultra-minimal flat design — whitespace + typography for hierarchy.
> All 6 screens approved via Google Stitch (score 8.5–10/10).

---

## Design Principles (Research-Backed)

| Principle | Source | Application |
|---|---|---|
| Fogg Behavior Model | BJ Fogg, Stanford | Maximize ability by removing friction; time prompts well |
| Cognitive Load Theory | Swwer et al. | Profile setup deferred; fewer fields per screen |
| Zeigarnik Effect | 1927 | Step dots create tension to finish all 6 |
| Self-Determination Theory | Deci & Ryan | Role selection = autonomy; quick win = competence |
| Peak-End Rule | Kahneman | Celebration after horse entry = peak moment |
| Authenticity | Founder transparency | Real story > inflated numbers for early-stage products |

---

## Flow Architecture (v4)

```
Screen 1: Welcome      — full-bleed steppe photo, value prop, founder story
Screen 2: Role         — watermark background icon cards (3 roles)
Screen 3: Region       — search + Mongolian province list (21 аймаг)
Screen 4: Horse Entry  — photo upload, form with toggle pills, year picker
Screen 5: Notifications — bell icon, green checkmark benefits, permission priming
Screen 6: Sync Setup   — cloud icon, benefits, final CTA
```

### Why This Order

1. **Welcome → Role**: Full-bleed hero photo creates emotional first impression. One-tap role selection is a "quick win" (Zeigarnik + competence).
2. **Role → Region**: Region grounds the user geographically — connects them to local community.
3. **Region → Horse Entry**: User is invested. Horse entry is the "aha moment" — celebration overlay on success.
4. **Horse → Notifications**: After peak emotional moment (celebration), permission ask has highest acceptance.
5. **Notifications → Sync**: Final step — cloud sync promise closes the loop.

### What Changed from v2

| v2 (5 screens) | v4 (6 screens) | Rationale |
|---|---|---|
| 5 screens with progress bar | 6 screens with step dots | Dots match ultra-minimal aesthetic; progress bar felt heavy |
| Auth prompt as screen 3 | Replaced with Region selection | Auth deferred to post-onboarding; region is lower friction |
| Goal selection as screen 3 | Replaced with Region selection | Goals are abstract; region is concrete and actionable |
| Card-based layouts | Watermark icon cards (role) + flat lists (region) | Ultra-minimal — no card shadows, whitespace for hierarchy |
| Linear progress bar | Step dots (circle indicators) | Matches Stitch approved design |
| Hermès luxury palette | Warm earth tone palette | Brand-aligned: Hermes orange + steppe green |
| No camera picker | Camera/gallery picker on horse entry | Production-ready photo upload |
| Auth as last screen | Sync setup as last screen | Cloud sync promise, not auth gate |

---

## Color Palette (v4)

### Primary

| Token | Hex | Role |
|---|---|---|
| `primary` | `#F06A2E` | CTA buttons, active states, links |
| `foreground` | `#2E2D2C` | Primary text |
| `background` | `#FDF6F3` | Screen background (warm white) |

### Supporting

| Token | Hex | Role |
|---|---|---|
| `muted` | `#F1E6E2` | Subtle backgrounds |
| `mutedForeground` | `#777171` | Secondary text |
| `border` | `#D4CBC8` | Dividers, input borders |
| `success` | `#2D8A4E` | Steppe green — nature accent, badges, health indicators |

### Semantic

| Token | Hex | Role |
|---|---|---|
| `primary950` | Dark orange-brown | Welcome screen fallback bg |
| `secondary` | Light warm | Photo upload container bg |

---

## Typography (v4)

| Style | Size | Weight | Font | Use |
|---|---|---|---|---|
| Brand title | 44pt | 600 | Playfair Display | "Тамга" on welcome screen |
| Screen title | 28–34pt | 600 | System | Screen headlines |
| Subtitle | 17–20pt | 600 | System | Section headers |
| Body | 15–17pt | 400 | System | Primary text |
| Caption | 12–13pt | 400 | System | Supporting text |
| Button | 17pt | 600 | System | CTA labels |

---

## Screen Specifications

### Screen 1 — Welcome (Full-Bleed Hero)

```
┌─────────────────────────┐
│  ████████████████████   │  ← Full-bleed steppe photo
│  ████ steppe photo ███  │
│  ████████████████████   │
│  ▓▓ dark gradient ▓▓▓  │  ← Gradient scrim (10%→50%)
│                         │
│      ◯ circle+line      │  ← Tamga stamp logo (CustomPaint)
│       Тамга             │  ← Serif title (Playfair Display)
│   Морины тань цорын     │
│   ганц үнэн эх сурвалж  │
│                         │
│  🌳 Удам угшил          │  ← 3 green feature icons
│     Баталгаатай удмын сан│
│  🩺 Эрүүл мэнд          │
│     Вакцины түүх         │
│  🏪 Зах зээл            │
│     Найдвартай худалдаа  │
│                         │
│  ┌───────────────────┐  │
│  │     Эхлэх         │  │  ← Orange CTA (52dp, r13)
│  └───────────────────┘  │
│  Зүүн голын малчдаас     │  ← Founder authenticity (60% opacity)
│     эхэлсэн              │
└─────────────────────────┘
```

**Elements:**
- Photo: Network image (CDN), fallback to `primary950` solid
- Gradient: Black 10%→50%, top→bottom, stops 0.3→0.85
- Logo: `_TamgaStampLogo` CustomPaint widget (circle + vertical line + dots)
- Feature icons: `AppColors.success` (#2D8A4E), 28dp
- CTA: `AppColors.primary` (#F06A2E), full-width, 52dp height, 13dp radius
- Social proof: 12pt, 60% white opacity

### Screen 2 — Role Selection (Watermark Cards)

```
┌─────────────────────────┐
│  ← back                 │
│                         │
│     Таны үүрэг          │
│   Та ямар хүн бэ?       │
│                         │
│  ┌─────────────────┐    │
│  │ 🐾 Морь сонирхогч│   │  ← Watermark icon 120dp at 15%
│  │   Цөөн адуутай   │    │    Selected = orange border + tinted icon
│  └─────────────────┘    │
│  ┌─────────────────┐    │
│  │ 🏍️ Уяач/Малчин   │   │
│  │   Олон адуутай   │    │
│  └─────────────────┘    │
│  ┌─────────────────┐    │
│  │ 👁️ Жүчээ/Бизнес  │   │
│  │   Жүчээ бизнес   │    │
│  └─────────────────┘    │
│                         │
│  ┌───────────────────┐  │
│  │ Үргэлжлүүлэх      │  │  ← Enabled only when role selected
│  └───────────────────┘  │
└─────────────────────────┘
```

**Elements:**
- Cards: 88dp height, 13dp radius, white bg
- Watermark: 120dp icon at 15% opacity, right-aligned
- Selected: 2px orange border, icon tints to orange at 15%
- Unselected: 0.5px border at 40% opacity
- Animation: 200ms easeInOut border + color transition

### Screen 3 — Region Selection (Search + List)

```
┌─────────────────────────┐
│  ← back                 │
│                         │
│  Аймаг сонгох           │
│  хаана морьтай вэ?       │
│                         │
│  🔍 Аймаг хайх...       │  ← Bottom-border search input
│  ─────────────────────  │
│  Улаанбаатар         ✓  │  ← Selected = orange bg + check
│  ─────────────────────  │
│  Төв                  → │  ← Unselected = chevron
│  ─────────────────────  │
│  Хэнтий               → │
│  ...                    │
│                         │
│  ┌───────────────────┐  │
│  │ Үргэлжлүүлэх      │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

**Elements:**
- 21 Mongolian provinces (9 аймаг + нийслэл)
- Search: bottom-border only, no container
- List items: 14dp vertical padding, 0.5dp hairline dividers
- Selected: orange background tint + check icon
- Content scrolls, CTA fixed at bottom

### Screen 4 — Horse Profile (Form)

```
┌─────────────────────────┐
│  ← back                 │
│                         │
│  Морь нэмэх             │
│  Эхний морьоо бүртгүүлэх │
│                         │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│  │  📷 Зураг нэмэх   │  │  ← Dashed border container
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │    Tap → camera/gallery bottom sheet
│                         │    Picked → photo preview
│  Нэр                    │
│  Морины нэр ──────────  │  ← Bottom-border input
│                         │
│  Угсаа          Монгол → │  ← Tappable row → breed picker
│  ─────────────────────  │
│  Өнгө            Хүрэн → │  ← Tappable row → coat picker
│  ─────────────────────  │
│                         │
│  Хүйс                   │
│  (Эр)  (Эм)            │  ← Toggle pills (r999)
│                         │
│  Төрсөн он              │
│  (2026)(2025)(2024)...  │  ← Horizontal scroll pills
│                         │
│  ┌───────────────────┐  │
│  │ Үргэлжлүүлэх      │  │
│  └───────────────────┘  │
│  Алгасах — дараа оруулна │  ← Skip link
└─────────────────────────┘
```

**Elements:**
- Photo: 160dp height, dashed border, `secondary` bg tint
- Picker: `image_picker` — camera + gallery, 1024px max, 85% quality
- Inputs: bottom-border only (UnderlineInputBorder)
- Breed: Монгол адуу, Адын элдэв, Морин уралдаан, etc.
- Coat: Хүрэн, Халтар, Хээр, Саарал, etc. (14 options)
- Gender pills: 64dp width, r999, orange when selected
- Year pills: horizontal scroll, 15 years back, r999 outline
- Validation: name required, gender required, coat required

### Screen 5 — Notifications (Permission Priming)

```
┌─────────────────────────┐
│  ← back                 │
│     Мэдэгдэл            │
│                         │
│         🔔              │  ← Bell icon in orange circle (128dp)
│   Notifications active   │
│                         │
│  Хэрэгтэй мэдээгээ      │
│  цаг тухайд нь аваарай   │  ← Bold headline
│                         │
│  Вакцины сануулга,       │
│  зах зээлийн шинэчлэл,   │  ← Muted description
│  уралдааны мэдээ         │
│                         │
│  ✅ Вакцины сануулга     │  ← Green checkmark benefits
│  ✅ Зах зээлийн шинэ     │
│  ✅ Уралдааны хуваарь    │
│                         │
│  ┌───────────────────┐  │
│  │    Зөвшөөрөх       │  │  ← Triggers OS permission dialog
│  └───────────────────┘  │
│    Одоохондоо үгүй      │  ← Skip link
└─────────────────────────┘
```

**Elements:**
- Bell icon: 64dp in 128dp orange circle (10% opacity bg)
- Benefits: green checkmark circles (#2D8A4E) + body text
- CTA: "Зөвшөөрөх" → triggers `flutter_local_notifications` permission
- After permission granted: button text changes to "Үргэлжлүүлэх"
- Skip: "Одоохондоо үгүй" → completes onboarding without notifications

### Screen 6 — Sync Setup (Cloud Sync)

```
┌─────────────────────────┐
│  ← back                 │
│    Синк тохиргоо        │
│                         │
│       ☁️🔄              │  ← Cloud sync icon in green circle
│     (online dot)        │
│                         │
│  Өөрийнхөө мэдээллийг   │
│  хянах боломжтой        │  ← Headline
│                         │
│  Таны морьдын мэдээлэл   │
│  аюулгүй хадгалагдаж,   │  ← Description
│  бүх төхөөрөмж дээр     │
│  шинэчлэгдэнэ.          │
│                         │
│  ✅ Нэмэлт төхөөрөмжид   │  ← Green checkmark benefits
│     нэвтрэх боломж       │
│  ✅ Мэдээлэл алдах      │
│     эрсдэл бага          │
│                         │
│  ┌───────────────────┐  │
│  │     Эхлэх         │  │  ← Final CTA (all 6 dots filled)
│  └───────────────────┘  │
│   Дараа тохируулъя      │  ← Skip link
└─────────────────────────┘
```

**Elements:**
- Cloud icon: `Icons.cloud_sync` in 128dp green circle (10% opacity bg)
- Online indicator: green dot on cloud icon
- Benefits: green checkmark circles + text
- CTA: "Эхлэх" → completes onboarding
- Skip: "Дараа тохируулъя" → completes onboarding, sync later

---

## Step Dots Spec

```
○ ● ○ ○ ○ ○    (Screen 1 — 1st dot orange)
○ ○ ● ○ ○ ○    (Screen 2 — 2nd dot orange)
○ ○ ○ ● ○ ○    (Screen 3 — 3rd dot orange)
○ ○ ○ ○ ● ○    (Screen 4 — 4th dot orange)
○ ○ ○ ○ ○ ●    (Screen 5 — 5th dot orange)
● ● ● ● ● ●    (Screen 6 — all filled)
```

- Size: 8dp circle
- Active: `AppColors.primary` (#F06A2E)
- Inactive: `AppColors.border` (#D4CBC8)
- Spacing: 6dp between dots
- Position: centered, 16dp above CTA button
- Not shown on Screen 1 (full-bleed hero has its own layout)

---

## Celebration Animation Spec

```
Duration: 1200ms total
├── Container fade-in: 600ms ease-out (primary wash at 10% opacity)
├── Checkmark scale: 0→1, 500ms elastic curve
├── Text fade-in: 300ms ease-out (delayed 200ms)
└── Auto-dismiss: 1200ms → advance to next page
```

- Checkmark: 88dp circle, `AppColors.primary` bg, white icon
- Text: "Баяр хүргэе! 🎉" + "Таны адууны профайл бэлэн боллоо"

---

## Interactions

| Action | Animation |
|---|---|
| Page transition | 400ms easeInOut slide |
| Step dots | Instant swap (active dot color) |
| Card selection (role) | 200ms border + bg transition |
| Photo picker | Bottom sheet modal |
| Gender toggle | 200ms pill color transition |
| Year pill scroll | Horizontal ListView |
| Horse entry celebration | 1200ms overlay + elastic check |
| Form validation | Instant inline error |

---

## Localization

All UI text in Mongolian (Cyrillic). No English in-app.

| English | Mongolian |
|---|---|
| Get Started | Эхлэх |
| Your role | Таны үүрэг |
| Who are you? | Та ямар хүн бэ? |
| Horse enthusiast | Морь сонирхогч |
| Breeder / Herder | Уяач / Малчин |
| Stable / Business | Жүчээ / Бизнес |
| Select region | Аймаг сонгох |
| Where is your horse? | хаана морьтай вэ? |
| Search regions | Аймаг хайх... |
| Add horse | Морь нэмэх |
| Horse name | Морины нэр |
| Breed | Угсаа |
| Color | Өнгө |
| Gender | Хүйс |
| Stallion | Эр |
| Mare | Эм |
| Birth year | Төрсөн он |
| Add photo | Зураг нэмэх |
| Camera | Камера |
| Gallery | Зургийн сан |
| Continue | Үргэлжлүүлэх |
| Skip — add later | Алгасах — дараа оруулна |
| Notifications | Мэдэгдэл |
| Allow | Зөвшөөрөх |
| Not now | Одоохондоо үгүй |
| Sync setup | Синк тохиргоо |
| Start | Эхлэх |
| Set up later | Дараа тохируулъя |
| Congratulations! | Баяр хүргэе! |
| Your horse profile is ready | Таны адууны профайл бэлэн боллоо |

---

## Implementation Notes

### File Structure

```
lib/src/features/onboarding/
├── domain/
│   └── onboarding_data.dart          # OnboardingData, UserRole enum
├── data/
│   └── onboarding_repository.dart    # Local storage persistence
├── application/
│   └── onboarding_providers.dart     # OnboardingNotifier + providers
└── presentation/
    ├── onboarding_screen.dart         # PageView orchestrator + step dots
    └── pages/
        ├── welcome_page.dart          # Screen 1 — full-bleed hero
        ├── role_selection_page.dart   # Screen 2 — watermark cards
        ├── region_selection_page.dart # Screen 3 — search + province list
        ├── horse_entry_page.dart      # Screen 4 — form + photo picker
        ├── notification_page.dart     # Screen 5 — permission priming
        └── sync_setup_page.dart       # Screen 6 — cloud sync
```

### Key Packages

| Package | Use |
|---|---|
| `image_picker` | Camera/gallery photo selection |
| `flutter_local_notifications` | Notification permission + scheduling |
| `flutter_riverpod` | State management |
| `shared_preferences` | Onboarding completion persistence |

### Back Navigation

All screens 2–6 have a back button (chevron icon) wired to `onBack` callback → `_goToPreviousPage()` in orchestrator. PageView uses `NeverScrollableScrollPhysics` (no swipe back — only tap back).

### Photo Upload

- `ImagePicker.pickImage()` with `maxWidth: 1024, maxHeight: 1024, imageQuality: 85`
- Bottom sheet with "Камера" and "Зургийн сан" options
- iOS: `NSCameraUsageDescription` + `NSPhotoLibraryUsageDescription` in Info.plist
- Android: No permissions needed (scoped storage / system Photo Picker)

---

## Metrics to Track

| Metric | Target | Why |
|---|---|---|
| Onboarding start rate | >90% | First screen engagement |
| Step-by-step drop-off | <10% per step | Identify friction points |
| Time to horse entry | <3 min | Aha moment speed |
| Horse entry completion | >70% | Quick win adoption |
| Photo upload rate | >50% | Visual engagement |
| Notification enable rate | >60% | Permission priming effectiveness |
| Day 1 retention | >30% | Onboarding → engagement |
| Day 7 retention | >15% | Extended value delivery |

---

## Related

- [Design](./index.md) — Brand & UI direction
- [Palette](./palette.md) — Color system
- [Features](../features/index.md) — Feature inventory
- [Roadmap](../product/roadmap.md) — Product phases
