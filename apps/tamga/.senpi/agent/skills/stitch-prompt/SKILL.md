# Stitch Prompt Engineering Skill

> Generate production-quality Google Stitch design prompts for mobile app screens.
> Load this skill before writing any Stitch prompt, reviewing Stitch output, or iterating on designs.

---

## Table of Contents

1. [When to Use](#1-when-to-use)
2. [Stitch Constraints](#2-stitch-constraints)
3. [Prompt Anatomy](#3-prompt-anatomy)
4. [Style System](#4-style-system)
5. [Component Patterns](#5-component-patterns)
6. [Iteration Protocol](#6-iteration-protocol)
7. [Common Failures](#7-common-failures)
8. [Quality Checklist](#8-quality-checklist)
9. [Reference Library](#9-reference-library)

---

## 1. When to Use

Use this skill when:
- Writing a new Stitch prompt for a mobile screen
- Reviewing Stitch-generated screenshots for design quality
- Iterating on a screen that doesn't match intent
- Building a design system in Stitch
- Generating onboarding, dashboard, list, detail, form, or settings screens

Do NOT use for:
- Web layouts (Stitch is mobile-only)
- Complex animations (Stitch generates static screens)
- Code generation (use other skills)

---

## 2. Stitch Constraints

### Hard Limits
| Constraint | Value | Why |
|---|---|---|
| Prompt word count | ≤250 words | Longer prompts cause Stitch to ignore details |
| Scope per prompt | ONE screen | Never combine multiple screens |
| Intent per prompt | ONE primary action | Secondary elements support, don't compete |
| Technical terms | ZERO | No "React", "Flutter", "CSS", "padding" — use visual language |
| Implementation detail | ZERO | No "border-radius: 13px" — say "rounded corners" |

### What Stitch Handles Well
- ✅ Layout and composition (stacking, grids, alignment)
- ✅ Color and typography hierarchy
- ✅ Icon placement and style (general shapes, not specific icons)
- ✅ Spacing and proportions (relative, not exact dp)
- ✅ Light/dark mode variants
- ✅ Empty states, loading states
- ✅ Bottom sheets, modals, overlays

### What Stitch Handles Poorly
- ❌ Specific icon shapes (horse head → generates generic animal)
- ❌ Exact dp/px measurements (relative descriptions work better)
- ❌ Multi-step interactions (one state per prompt)
- ❌ Dynamic content (lists, feeds — show 3-5 items max)
- ❌ Complex data visualization (charts, graphs)
- ❌ Animation or transition effects

---

## 3. Prompt Anatomy

### The 5-Layer Framework

Every Stitch prompt follows this structure, in this order:

```
LAYER 1 — CONTEXT (1-2 sentences)
What is this screen? What app? What step in the flow?

LAYER 2 — BACKGROUND (1 sentence)
Page background color, gradient, or image.

LAYER 3 — HEADER (1-2 sentences)
Title, subtitle, back navigation, status bar area.

LAYER 4 — BODY (3-6 sentences)
Main content — cards, lists, forms, images. Describe each element's
position, color, and content. Use spatial language (top-left, below, centered).

LAYER 5 — FOOTER (1-2 sentences)
Fixed bottom elements — buttons, tab bars, step indicators.
```

### Prompt Template

```
Design a [SCREEN TYPE] for a mobile [APP TYPE] app called [APP NAME].

[BACKGROUND]: [Color/gradient/image description].

[HEADER]:
- [Navigation element]
- [Title] (style, size, color)
- [Subtitle] (style, size, color)

[BODY]:
[Element 1]: [Description — position, size, color, content]
[Element 2]: [Description — position, size, color, content]
[Element 3]: [Description — position, size, color, content]

[FOOTER]:
[Fixed element]: [Description]

Style: [STYLE TRAITS]. Mobile app (iPhone).
```

### Spatial Language Vocabulary

Use these words instead of measurements:

| Instead of | Say |
|---|---|
| "16dp padding" | "generous padding" or "comfortable spacing" |
| "8dp gap" | "tight gap" or "compact spacing" |
| "120dp height" | "tall card" or "compact card" |
| "position: absolute, top: 20dp" | "positioned near the top" |
| "width: 100%" | "full-width" or "spanning the screen" |
| "border-radius: 13px" | "rounded corners" or "softly rounded" |

---

## 4. Style System

### Defining a Design System in Stitch

The FIRST prompt in any project should establish the design system. This is a reference screen that Stitch uses as a style anchor.

**Design System Prompt Template:**

```
Create a design system reference screen for a mobile app called [NAME].

Show these components on a single screen:

TYPOGRAPHY:
- Title 1: 28pt, bold, [PRIMARY COLOR]
- Title 2: 22pt, bold, [PRIMARY COLOR]
- Headline: 17pt, semibold, [PRIMARY COLOR]
- Body: 17pt, regular, [PRIMARY COLOR]
- Callout: 16pt, regular, [SECONDARY COLOR]
- Subheadline: 15pt, regular, [SECONDARY COLOR]
- Footnote: 13pt, regular, [MUTED COLOR]
- Caption: 12pt, regular, [MUTED COLOR]

COLORS:
- Background: [HEX]
- Foreground/Text: [HEX]
- Primary (CTA): [HEX]
- Secondary/Accent: [HEX]
- Muted: [HEX]
- Border: [HEX]
- Card: [HEX]
- Success: [HEX]
- Error: [HEX]

COMPONENTS:
- Primary button: [color], [corner style], [text style]
- Secondary button: [color], [border], [text style]
- Card: [background], [corner radius], [shadow/border]
- Input field: [background], [border style], [focus state]
- Badge/pill: [color], [text style]
- Divider: [color], [thickness]
- Icon style: [rounded/square], [size], [color]

Layout: Components arranged in a clean grid showing each element with its label.
Background: [APP BACKGROUND COLOR]. No app content — just the design system reference.
```

### Style Trait Keywords

Include 3-6 of these in every prompt to anchor the visual feel:

| Trait | Effect | Use When |
|---|---|---|
| `ultra-minimal` | No shadows, no cards, whitespace hierarchy | Clean/productivity apps |
| `premium` | Generous whitespace, refined typography | Luxury/brand apps |
| `editorial` | Serif titles, magazine-like layout | Content-heavy apps |
| `warm` | Earth tones, soft corners, organic feel | Lifestyle/wellness apps |
| `playful` | Bright colors, rounded shapes, dynamic | Consumer/social apps |
| `clinical` | High contrast, precise spacing, neutral | Healthcare/fintech apps |
| `organic` | Asymmetric layouts, natural colors | Nature/cultural apps |
| `dark-mode-first` | Dark backgrounds, light text | Developer/pro tools |

---

## 5. Component Patterns

### Onboarding Screens

**Welcome/Hero Screen:**
```
Full-bleed hero photo (landscape/nature). Content overlaid on photo:
- Logo/icon at top (white or brand color)
- App name in large serif/display font
- Tagline centered below
- Feature highlights (3 items, icon + text, left-aligned)
- Step indicator dots (small, centered)
- CTA button at bottom (full-width, brand color)
- Dark gradient scrim at bottom 30% for readability
```

**Role/Selection Screen:**
```
Warm white background. Centered layout:
- Title + subtitle at top
- 3-4 selection cards stacked vertically with generous spacing
- Each card: large watermark icon (15-20% opacity) as background,
  title top-left, description below
- No borders by default; thin colored border on selection
- Fixed bottom: step dots + CTA button
```

**Form/Input Screen:**
```
Warm white background. Left-aligned:
- Title + subtitle at top
- Input fields stacked vertically (bottom-border style, not boxed)
- Helper text below each field
- Character count where relevant
- Fixed bottom: CTA button
```

### List Screens

**Settings/List:**
```
Grouped list on warm background:
- Section headers in muted uppercase text
- Rows: icon (left) + title + optional value (right) + chevron
- Hairline dividers between rows (no dividers between sections)
- Sections separated by 24dp gap
```

**Feed/Card List:**
```
Scrollable card feed:
- Each card: full-width, white, rounded corners, no shadow
- Card content: image (top) + title + metadata + action
- Consistent card height or masonry layout
- Floating action button (bottom-right, brand color)
```

### Detail Screens

**Profile/Detail:**
```
Hero section at top (photo or gradient), content below:
- Large title overlaying hero (white text)
- Stats row (3-4 metrics in a horizontal row)
- Action buttons (full-width, brand color)
- Tab bar for content sections
- Content below tabs
```

### Form Patterns

**Input Field:**
```
- Bottom-border only (1pt, muted color)
- Placeholder text in light muted color
- Label above field in small bold text
- Focus state: border changes to brand color
- Error state: border changes to red + error text below
```

**Selection/Radio:**
```
- List of options with radio indicator on right
- Selected: filled circle in brand color
- Unselected: empty circle in muted color
- Thin divider between options
```

---

## 6. Iteration Protocol

### First Pass → Review → Refine

**Step 1: Generate** — Send the prompt to Stitch.

**Step 2: Review** — Evaluate the output against the Quality Checklist (Section 8).

**Step 3: Classify Issues:**

| Issue Type | Action |
|---|---|
| **Layout wrong** | Regenerate with corrected spatial descriptions |
| **Color wrong** | Send edit prompt with exact hex codes |
| **Icon wrong** | Accept — fix in code. Stitch can't do specific iconography |
| **Missing element** | Send edit prompt adding the element |
| **Extra element** | Send edit prompt removing the element |
| **Spacing off** | Send edit prompt with "increase/decrease gap" language |
| **Style drifted** | Reference the design system screen: "Match the style of [design system screen name]" |

### Edit Prompt Rules

When refining an existing Stitch screen:

1. **One intent per edit** — Don't fix 5 things at once
2. **Describe what changed, not the whole screen** — "Change the button color to orange #F06A2E" not "Redesign the screen with..."
3. **Use exact values for colors** — hex codes, not "make it warmer"
4. **Use relative language for layout** — "move the button closer to the cards" not "set margin-top to 32dp"
5. **If Stitch ignores an edit** — Break it into a separate prompt. If still ignored, regenerate from scratch with the fix baked in.

### When to Regenerate vs Edit

| Situation | Action |
|---|---|
| 1-2 small changes needed | Edit |
| Layout structure is wrong | Regenerate |
| 3+ changes needed | Regenerate |
| Stitch ignored the edit | Regenerate with fixes in the original prompt |
| Color/style drift across edits | Regenerate and reference design system |

---

## 7. Common Failures

### Failure: Stitch Ignores Instructions

**Symptoms:** Output looks identical before and after edit prompt.

**Causes:**
- Prompt too long (>250 words)
- Conflicting instructions
- Too many changes in one edit

**Fixes:**
1. Shorten the prompt to ≤150 words
2. Make ONE change per edit
3. Put the most important change FIRST
4. If still ignored, regenerate from scratch

### Failure: Generic Icons

**Symptoms:** Horse head → generic animal. Custom logo → generic shape.

**Why:** Stitch doesn't understand specific brand/icon references.

**Fix:** Don't fight it. Accept the generic icon and replace in code. Focus prompts on layout, color, and composition instead.

### Failure: Color Drift

**Symptoms:** Colors shift between generations. Orange becomes peach, gray becomes blue-gray.

**Why:** Stitch interprets color names loosely.

**Fix:** Always use hex codes. Never say "warm orange" — say "#F06A2E". Reference the design system screen for color anchoring.

### Failure: Layout Compression

**Symptoms:** Content crammed together, no breathing room.

**Why:** Stitch optimizes for fitting content, not for whitespace.

**Fix:** Explicitly say "generous spacing", "large gaps between elements", "plenty of breathing room".

### Failure: Missing Step Dots / Navigation

**Symptoms:** Step indicator dots don't appear. Back button missing.

**Why:** Stitch treats these as optional chrome.

**Fix:** Mention them explicitly in the FOOTER section. "Step indicator dots (6 dots, third dot orange) are visible above the button."

---

## 8. Quality Checklist

Rate every Stitch output on these dimensions:

### Layout (3 points)
- [ ] Visual hierarchy is clear (eye flows top → bottom)
- [ ] Spacing is generous, not cramped
- [ ] Fixed elements (nav, button) are in expected positions

### Color (2 points)
- [ ] Colors match the design system hex codes
- [ ] Contrast is sufficient (text readable on backgrounds)

### Typography (2 points)
- [ ] Title/body/muted hierarchy is clear
- [ ] Font sizes feel proportional (not all same size)

### Components (2 points)
- [ ] Buttons, cards, inputs match intended style
- [ ] Icons are reasonable (even if not exact)

### Completeness (1 point)
- [ ] All required elements are present
- [ ] No unexpected extra elements

**Scoring:**
- 9-10: Lock the screen ✅
- 7-8: Minor refinements needed
- 5-6: Significant issues, consider regenerating
- Below 5: Start over

---

## 9. Reference Library

### Color Palettes (Copy-Paste Ready)

**Warm Minimal (Tamga-style):**
```
Background: #FDF6F3
Foreground: #2E2D2C
Primary: #F06A2E (orange)
Accent: #2D8A4E (green)
Muted: #625F5D
Border: #D4CBC8
Card: #FFFFFF
Surface: #F1E6E2
```

**Dark Professional:**
```
Background: #1A1A2E
Foreground: #E8E8E8
Primary: #4ECDC4 (teal)
Accent: #FF6B6B (coral)
Muted: #8888AA
Border: #2A2A4A
Card: #16213E
```

**Clean Neutral:**
```
Background: #FAFAFA
Foreground: #1A1A1A
Primary: #2563EB (blue)
Accent: #10B981 (emerald)
Muted: #6B7280
Border: #E5E7EB
Card: #FFFFFF
```

### Typography Scales

**iOS Standard:**
```
Large Title: 34pt, bold
Title 1: 28pt, bold
Title 2: 22pt, bold
Title 3: 20pt, semibold
Headline: 17pt, semibold
Body: 17pt, regular
Callout: 16pt, regular
Subheadline: 15pt, regular
Footnote: 13pt, regular
Caption 1: 12pt, regular
Caption 2: 11pt, regular
```

**Compact (Data-heavy screens):**
```
Section Header: 13pt, semibold, uppercase, muted
Row Title: 17pt, regular
Row Detail: 15pt, regular, muted
Caption: 12pt, regular, muted
```

### Icon Style Guide

| Style | When to Use | Stitch Description |
|---|---|---|
| Rounded circles | Friendly, approachable apps | "icon in a circular background" |
| Squircles (iOS) | Apple-like, system apps | "icon in a rounded square (squircle)" |
| Outline only | Minimal, editorial apps | "outline icon, no background" |
| Filled | Bold, confident apps | "filled solid icon" |
| Watermark | Premium card backgrounds | "large icon as background watermark at 20% opacity" |

### Button Patterns

**Primary CTA:**
```
Full-width button, [PRIMARY COLOR] background, white text, 
[corner style] corners, [Body/Bold] text style.
Pinned to bottom of screen above safe area.
```

**Secondary/Outline:**
```
Full-width button, transparent background, [PRIMARY COLOR] border (1.5pt),
[PRIMARY COLOR] text, [corner style] corners.
```

**Text Button:**
```
[PRIMARY COLOR] text, no background, no border.
Used for "Skip", "Later", "Back" actions.
```

### Spacing Scale (for prompt descriptions)

| Term | Approximate Value | Use For |
|---|---|---|
| `compact` | 4-8dp | Inline elements, icon-to-text |
| `tight` | 8-12dp | Related items in a group |
| `comfortable` | 16-20dp | Between cards, list items |
| `generous` | 24-32dp | Between sections |
| `spacious` | 40-48dp | Major content blocks |
| `airy` | 64dp+ | Hero sections, dramatic whitespace |

---

## Quick Reference: Prompt Checklist

Before sending any Stitch prompt, verify:

- [ ] ≤250 words
- [ ] ONE screen only
- [ ] ONE primary intent
- [ ] No technical terms (React, Flutter, CSS, dp, px)
- [ ] No implementation details (border-radius, padding, margin)
- [ ] Includes background color/gradient
- [ ] Includes all navigation elements (back, close)
- [ ] Includes typography hierarchy (title, body, muted)
- [ ] Includes fixed bottom elements (button, dots)
- [ ] Includes 3-6 style trait keywords
- [ ] Uses hex codes for colors, not color names
- [ ] Uses spatial language (left-aligned, centered, below)
- [ ] Describes 3-6 main content elements
- [ ] Mentions what should NOT appear (shadows, cards, etc.)
