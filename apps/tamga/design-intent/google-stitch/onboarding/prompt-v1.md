<!-- Layout: Onboarding Flow -->
Design a 6-step onboarding flow for a mobile horse management app.

Include:
- Full-screen page steps with swipe-based horizontal navigation (page controller)
- Each step fills the entire screen with centered content
- Step indicator dots at bottom showing progress (active dot in orange, inactive in gray)
- "Skip" text button on top-right for steps 1–5, hidden on step 6
- "Next" primary button at bottom, spanning full width with orange fill
- Smooth slide transitions between pages

Interactions:
- Horizontal swipe navigates between steps
- Step dots update on swipe
- "Skip" jumps to auth prompt (step 5)
- "Next" advances to next step

Style: warm earthy palette, Hermes orange (#F06A2E) accents, iOS-minimal flat design, generous whitespace, centered layouts, Mongolian cultural feel, system font typography

Optimize for mobile single-column, safe area insets, smooth page transitions

---

<!-- Component: Welcome Page -->
Design a welcome screen as the first step of a mobile onboarding flow.

Include:
- Large app logo or horse silhouette illustration at center-top
- App name "Tamga" in large title (28pt semibold)
- Tagline in Mongolian: "Морины тань цорын ганц үнэн эх сурвалж" (subtitle weight, muted color)
- Three benefit bullets below with small icons: horse records, pedigree tracking, marketplace
- "Эхлэх" (Get Started) primary button at bottom, full-width, orange (#F06A2E) fill, white text
- Social proof text below button: "50,000+ монгол адуучин итгэж байна" (50,000+ Mongolian horse owners trust us)

Style: clean, welcoming, warm background (#FDF6F3), centered vertical layout, generous spacing between elements, Hermes orange accents, system font

Optimize for mobile, content vertically centered with safe area padding

---

<!-- Component: Role Selection Page -->
Design a role selection screen for a mobile onboarding flow.

Include:
- Title "Таны хувь заяа" (Your Role) at top, left-aligned
- Subtitle explaining personalization benefit in muted text
- 3 selection cards stacked vertically with generous spacing:
  - "Энгийн морь унаач" (Casual Rider) — horse icon, brief description
  - "Малчин/үржүүлэгч" (Breeder) — DNA/繁殖 icon, brief description
  - "Хүлэмжийн эзэн" (Stable Owner) — stable icon, brief description
- Each card: white background, 13pt corners, orange left border when selected, subtle shadow
- Selected state: orange border, check icon, tinted background (#FFEDE1)
- "Үргэлжлүүлэх" (Continue) primary button at bottom, disabled until selection

Style: warm earthy palette, iOS grouped list feel, cards on warm gray (#F1E6E2) background, Hermes orange selection accent, clean typography

Optimize for mobile, scrollable if needed, 44dp minimum touch targets

---

<!-- Component: Goal Selection Page -->
Design a goal selection screen for a mobile onboarding flow.

Include:
- Title "Таны зорилго" (Your Goal) at top
- Subtitle: "Таныг хувийн тохиргоо хийхэд тусална" (Helps us personalize your experience)
- Grid of 4–6 goal options (2 columns), each with icon and label:
  - "Адуугаа бүртгүүлэх" (Register horses)
  - "Удамшлыг мэдэх" (Know lineage)
  - "Эрүүл мэндээ хянах" (Monitor health)
  - "Зах зээлд худалдах" (Sell on marketplace)
  - "Тэмцээн орох" (Join tournaments)
  - "Бүх зүйлээ нэг дороос" (Everything in one place)
- Each option: white card, rounded icon circle (orange tinted background), label below
- Multi-select allowed — selected cards get orange border + check badge
- "Үргэлжлүүлэх" primary button at bottom, active after 1+ selection

Style: 2-column grid layout, warm background, orange selection indicators, clean cards with subtle borders, system font

Optimize for mobile grid, equal card sizes, tap-friendly targets

---

<!-- Component: Horse Entry Page -->
Design a quick horse data entry screen for onboarding "aha moment" on mobile.

Include:
- Title "Эхний морьоо нэмээрэй" (Add Your First Horse) at top
- Subtitle: "30 секундэд бүтэн мэдээлэл оруулна" (Full info in 30 seconds)
- Compact form with 4 fields stacked vertically:
  - "Нэр" (Name) — text input with horse emoji prefix
  - "Хүйс" (Gender) — segmented control (Эр/Эм = Male/Female)
  - "Өнгө" (Coat Color) — dropdown with common coat options
  - "Төрсөн он" (Birth Year) — numeric picker
- Optional photo upload circle at top-right (camera icon, dashed border)
- "Хадгалах" (Save) primary button at bottom, full-width, orange
- Progress indicator: "Алхам 4/6" (Step 4 of 6)

Style: compact form layout, warm background, orange accents on active fields, iOS-style inputs with rounded borders, clean minimal spacing

Optimize for single-column mobile form, keyboard-aware layout, quick completion

---

<!-- Component: Auth Prompt Page -->
Design an auth prompt screen shown after the onboarding quick-win on mobile.

Include:
- Celebration illustration or checkmark animation at top (orange themed)
- Title "Баяр хүргэе!" (Congratulations!) in large semibold
- Subtitle: "Таны морин бүртгэгдлээ. Нэвтэрч эхлээрэй." (Your horse is registered. Sign in to continue.)
- "Нэвтрэх" (Sign In) primary button — full-width, orange fill, white text
- Divider line with "эсвэл" (or) text centered
- "Бүртгүүлэх" (Register) secondary button — outlined style
- Social login row: Google icon button, Apple icon button (side by side, equal width)
- "Зочлоор үргэлжлүүлэх" (Continue as Guest) text link at bottom, muted color

Style: centered vertical layout, warm celebration feel, orange primary actions, clean card-free design, generous whitespace, iOS-style social login buttons

Optimize for mobile, centered content with safe area padding, clear visual hierarchy
