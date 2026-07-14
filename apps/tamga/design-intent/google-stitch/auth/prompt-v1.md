<!-- Layout: Authentication Flow -->
Design a 3-screen authentication flow for a mobile horse management app.

Include:
- Login screen with email/password form (primary entry point)
- Phone login screen with country code and phone number input
- OTP verification screen with 6-digit code input and resend timer

Interactions:
- Login screen links to phone login and register
- Phone login sends OTP and navigates to verification
- OTP screen auto-submits on 6-digit completion

Style: warm earthy palette, Hermes orange (#F06A2E) buttons, iOS-minimal flat design, centered card layouts, warm white background (#FDF6F3), system font

Optimize for mobile single-column, keyboard-aware layouts, safe area insets

---

<!-- Component: Login Screen -->
Design a login screen for a mobile horse management app.

Include:
- App logo (horse silhouette) centered at top, small size
- "Нэвтрэх" (Sign In) title in Title 1 (28pt semibold)
- Email input field with envelope icon prefix, rounded border
- Password input field with lock icon prefix, show/hide toggle
- "Нууц үргээх" (Forgot Password?) text link aligned right below password, orange color
- "Нэвтрэх" primary button — full-width, orange (#F06A2E) fill, white text, 13pt corners
- Divider with "эсвэл" (or) centered
- Social login row: Google button + Apple button side by side, equal width, outlined style
- "Бүртгэлгүй юу? Бүртгүүлэх" (Don't have an account? Register) text link at bottom

Style: centered vertical layout, warm background (#FDF6F3), generous spacing, clean minimal inputs with subtle borders (#D4CBC8), system font, iOS aesthetic

Optimize for mobile, form above keyboard, 44dp touch targets

---

<!-- Component: Phone Login Screen -->
Design a phone number input screen for mobile OTP-based authentication.

Include:
- Back arrow (top-left, leading)
- "Утасны дугаар" (Phone Number) title in Title 2 (22pt semibold)
- Subtitle: "Баталгаажуулах код илгээх" (We'll send a verification code)
- Phone input row: country flag + "MN +976" prefix (non-editable) + phone number input field
- Phone field: large placeholder "99112233", numeric keyboard, 13pt rounded border
- "Код илгээх" (Send Code) primary button — full-width, orange fill
- Footer text: "Нүүр хуудас руу буцах" (Return to home) text link, muted color

Style: clean, minimal, focused single input, warm background, orange primary button, generous whitespace around input, iOS-style phone input

Optimize for mobile, numeric keyboard auto-focus, large touch targets

---

<!-- Component: OTP Verification Screen -->
Design a 6-digit OTP verification screen for mobile.

Include:
- Back arrow (top-left)
- "Баталгаажуулах" (Verify) title in Title 2
- Subtitle showing masked phone number: "+976 ****1234" in muted text
- 6 individual digit input boxes in a horizontal row, each with:
  - Centered large digit text (24pt)
  - Bottom border line (gray default, orange when focused/filled)
  - Auto-advance focus on digit entry
- "Дахин илгээх" (Resend) text link below inputs, with countdown timer: "60 секундийн дараа" (after 60 seconds), muted color when active, orange when clickable
- "Баталгаажуулах" primary button — full-width, orange, disabled until all 6 digits entered
- Error state: red text "Буруу код. Дахин оролдоно уу." (Wrong code. Try again.) below inputs

Style: centered layout, focused minimal design, large digit boxes for readability, orange accent on active state, warm background, clean typography

Optimize for mobile, auto-focus first box, paste support, numeric keyboard
