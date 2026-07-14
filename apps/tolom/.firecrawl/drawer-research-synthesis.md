# Drawer UI/UX Research Synthesis
## Sources: Material Design 3, Apple HIG, Mobbin, Josh Collinsworth, Josh Comeau, CSS animation research

---

## 1. Design System Guidelines

### Material Design 3 — Side Sheets (most relevant to Tolom)
- **Standard side sheets**: non-modal, display content without blocking primary content
- **Modal side sheets**: appear in front of content, block interaction until dismissed
- **Shape**: 16dp corner radius on modal side sheets
- **Scrim**: modal sheets use a scrim behind them, dismissible by tapping scrim or swiping
- **Note**: M3 Expressive update recommends **expanded navigation rail** over navigation drawer — adapts better across window sizes

### Material Design 3 — Bottom Sheets (for reference)
- Max-width: 640dp
- Drag handle with accessible 48dp hit target
- 28dp top corner radius
- Standard vs Modal variants

### Apple HIG — Sheets
- **Always modal on macOS**; can be modal or nonmodal on iOS/iPadOS
- **Detents**: large (fully expanded) and medium (half height) — progressive disclosure
- **Grabber**: always include in resizable sheets (accessibility + visual affordance)
- **Swipe to dismiss**: users expect vertical swipe, not a dismiss button
- **One sheet at a time**: if opening another, close the first first
- **Button placement**: Cancel (leading), Done (trailing) — never show all three (Cancel + Done + Back)
- **For complex flows**: consider alternatives to sheets (full-screen, new window, split view)
- **For repeated input/observation**: use a **panel** instead of a sheet

### Mobbin — Drawer UI Patterns
- **Anatomy**: Container + optional Close button
- **Variants**: slide from any direction, floating (detached from edge), pushy (pushes content)
- **When to use**: secondary actions, limited space, filtering, notifications, help, chat
- **When NOT to use**: primary actions, critical discoverability, frequent section toggling
- **Drawer vs Dialog**: Drawer = sliding panel, hidden until accessed; Dialog = pop-up requiring interaction
- **Drawer vs Sidebar**: Drawer = hidden, slides out; Sidebar = always visible, same level as content

---

## 2. Animation & Easing Research

### Current Tolom Animation
```css
transition-transform duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)]
```
- Duration: 320ms
- Easing: cubic-bezier(0.32, 0.72, 0, 1) — standard ease-out curve
- No overshoot, no spring physics

### CSS `linear()` for Springs (Josh Comeau — May 2026)
- `linear()` timing function enables native CSS springs/bounces
- Requires many data points (25-50) for convincing spring simulation
- Values can overshoot 0-1 range (e.g., 1.25 = 25% overshoot)
- **Tools**: linear-easing-generator.netlify.app, easingwizard.com
- **Performance**: 40+ data points have negligible impact (~1.3kB CSS for 3 springs)
- **Limitation**: Still time-based (not physics-based), interrupt handling is imperfect
- **Pattern**: Use CSS variables with `@supports` fallback
```css
html {
  --spring-smooth: cubic-bezier(...); /* fallback */
  --spring-smooth-time: 300ms;
  @supports (animation-timing-function: linear(0, 1)) {
    --spring-smooth: linear(0, 0.013 0.6%, 0.05 1.2%, ...);
  }
}
```

### Josh Collinsworth — 10 Tips for Better CSS Transitions
1. **Make it shorter than you think** — 150-400ms sweet spot
2. **Match curve to action** — ease-out for entering, ease-in for exiting
3. **Accelerate and decelerate** — avoid abrupt starts/stops
4. **Less is more** — 5-40px movement range, subtle transforms
5. **Avoid browser defaults** — use custom cubic-bezier, not `ease`/`ease-out`
6. **Multiple properties, multiple easings** — opacity and transform may need different curves
7. **Use staggered delays** — items entering sequentially feel more polished
8. **Ins go out, outs go in** — entering = ease-out, exiting = ease-in
9. **Lean on hardware acceleration** — only `transform` and `opacity` are reliably GPU-accelerated
10. **Use `will-change` judiciously** — don't overuse

---

## 3. Tolom Drawer Improvement Suggestions

### A. Animation Improvements

#### Option 1: Subtle spring easing (minimal change)
Replace the flat ease-out with a slight spring overshoot:
```css
/* Current: feels flat */
ease-[cubic-bezier(0.32,0.72,0,1)]

/* Proposed: subtle spring (1.5% overshoot) */
ease-[cubic-bezier(0.32,0.82,0,1.015)]
```
This gives a barely perceptible "settling" feel without being bouncy.

#### Option 2: CSS linear() spring (modern browsers)
```css
transition: transform 280ms linear(
  0, 0.009 1.8%, 0.035 3.6%, 0.141 7.3%,
  0.281 10.9%, 0.547 16.4%, 0.749 21.8%,
  0.883 27.3%, 0.959 33.6%, 1.012 41.2%,
  1.026 49.7%, 1.015 57.5%, 1.001 65.3%,
  0.995 74%, 1 82.6%, 1 100%
);
/* stiffness: ~180, damping: ~12 */
```
Use with `@supports` fallback for older browsers.

#### Option 3: Faster duration + subtle spring
```css
transition: transform 220ms cubic-bezier(0.32,0.82,0,1.02);
```
Shorter duration (220ms vs 320ms) makes it feel snappier. The slight overshoot (1.02) adds polish.

### B. Structural Improvements

#### 1. Unified drawer component
Replace the 9 hardcoded sizes with 3 semantic sizes:
- `sm` (24rem) — pickers, quick actions
- `md` (36rem) — forms, moderate content
- `lg` (64rem) — detail panels, catalogs

#### 2. Content-driven width (adaptive)
For true "adaptive" width, use CSS container queries:
```css
.detail-drawer-content {
  container-type: inline-size;
  width: fit-content;
  min-width: var(--drawer-min-w, 24rem);
  max-width: var(--drawer-max-w, 64rem);
}
```
This lets content determine width within bounds.

#### 3. Nested drawer visual treatment
When a drawer opens inside another drawer:
- Parent shifts left by a subtle amount (current: 12px — consider 16-24px)
- Add a visual separator (border or shadow) between stacked drawers
- Consider opacity dimming on the parent drawer's content

### C. UX Improvements

#### 1. Grabber/drag handle
Add a drag handle indicator at the top of drawers (Apple HIG pattern):
- Visual affordance that drawer is dismissible
- Accessibility: VoiceOver can announce "drag to resize"
- Small horizontal bar, centered, 40px wide, 4px tall

#### 2. Staggered content entrance
When drawer opens, stagger the internal content:
```css
.drawer-section {
  opacity: 0;
  transform: translateY(8px);
  animation: drawer-section-in 200ms ease-out forwards;
}
.drawer-section:nth-child(1) { animation-delay: 50ms; }
.drawer-section:nth-child(2) { animation-delay: 100ms; }
.drawer-section:nth-child(3) { animation-delay: 150ms; }
```

#### 3. Backdrop blur
Add subtle backdrop blur to the scrim:
```css
backdrop-blur-xs /* already in Base UI drawer */
```
This creates depth and focus on the drawer content.

#### 4. Reduced motion support
```css
@media (prefers-reduced-motion: reduce) {
  .drawer-popup {
    transition: opacity 150ms ease-out !important;
    /* Remove translate, use opacity only */
  }
}
```

#### 5. Keyboard shortcuts
- `Escape` to close (already supported by Base UI)
- Consider `Cmd/Ctrl + Escape` as a global shortcut

### D. Specific Component Improvements

#### MechanicPickerDrawer (the "bouncy" one)
- The bounce is perceptual due to narrow size
- Solution: Either make it slightly wider (sm → md) or keep sm but use the same subtle spring easing as all other drawers
- Add a search input at the top (already has one via MechanicCombobox)
- Consider inline mode: instead of a drawer, show a popover/dropdown near the trigger button for simple pickers

#### WorkOrderDetailDrawer
- Already well-structured
- Consider: loading skeleton animation should match the drawer entrance timing
- The content fade/scale transition (0.98 → 1.0) at line 548 is good — keep this pattern

#### EmptyBayActionDrawer
- Simple action cards — consider if this should be a center dialog instead of a side panel
- The content is minimal enough for a modal dialog (Apple HIG: "present a simple task")

---

## 4. Recommended Implementation Priority

1. **Kill `variant` prop** — eliminate dead abstraction
2. **Standardize 3 sizes** — sm/md/lg across all drawers
3. **Fix ReadyForPickup** — raw Drawer → DetailDrawer
4. **Improve animation** — Option 1 (subtle spring cubic-bezier) as safe first step
5. **Add grabber** — visual affordance for swipe-to-dismiss
6. **Staggered content entrance** — polish detail
7. **Consider linear() spring** — Option 2 for modern browsers with fallback
