---
name: accessibility
description: WCAG 2.1 AA compliance for tolom — ARIA patterns, keyboard navigation, focus management, screen reader testing, and color contrast. Use when building forms, dialogs, navigation, interactive components, or reviewing UI for accessibility issues.
---

# Accessibility

WCAG 2.1 AA compliance. Every user interaction must work without a mouse.

---

## Core Principles

1. **Keyboard first** — every interactive element reachable via Tab, operable via Enter/Space/Arrows
2. **Focus visible** — never `outline: none` without a visible replacement
3. **Semantic HTML** — `<button>` over `<div onClick>`, `<nav>` over `<div role="navigation">`
4. **ARIA as last resort** — use native semantics before adding ARIA attributes

---

## Focus Management

### Focus Ring

Global rule in `globals.css`:

```css
*:focus-visible {
  @apply outline-none ring-2 ring-ring/50;
}
```

**Never override with `outline: none`** without providing an alternative:

```tsx
// ✅ CORRECT — custom focus style
<button className="focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2">

// ❌ FORBIDDEN — removes focus indicator
<button className="focus:outline-none">
```

### Focus Trap (Dialogs, Sheets)

Radix handles this automatically. **Never disable it:**

```tsx
// ✅ CORRECT — Radix traps focus
<DialogContent>
  <input placeholder="Search" />
</DialogContent>

// ❌ FORBIDDEN — breaks focus trap
<DialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
```

### Focus Restoration

When a dialog/sheet closes, focus must return to the trigger element. Radix handles this. If you dismiss programmatically:

```tsx
// ✅ CORRECT — let Radix restore focus
const handleClose = useCallback(() => {
  setOpen(false);
  // Radix automatically returns focus to trigger
}, []);

// ❌ FORBIDDEN — manual focus without restoration
const handleClose = useCallback(() => {
  setOpen(false);
  document.body.focus(); // loses track of trigger
}, []);
```

---

## Keyboard Navigation

### Interactive Elements

| Element | Keys | Behavior |
|---------|------|----------|
| Button | `Enter`, `Space` | Activates |
| Link | `Enter` | Navigates |
| Input | All typing keys | Enters text |
| Select/Dropdown | `↑` `↓` `Enter` `Escape` | Navigate, select, close |
| Dialog | `Escape` | Closes dialog |
| Tabs | `←` `→` | Switch tabs |
| Table | `↑` `↓` | Navigate rows |

### Custom Keyboard Handlers

When building custom interactive components:

```tsx
// ✅ CORRECT — full keyboard support
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  onClick={handleClick}
>
  Click me
</div>

// ❌ FORBIDDEN — click only, no keyboard
<div onClick={handleClick}>
  Click me
</div>
```

### Skip Navigation

Every page with a sidebar needs a skip link:

```tsx
// ✅ In layout.tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4"
>
  Skip to main content
</a>
<main id="main-content">
  {children}
</main>
```

---

## ARIA Patterns

### Labels

Every interactive element needs an accessible name:

```tsx
// ✅ CORRECT — labeled
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

<Input aria-label="Search customers" placeholder="Search..." />

// ✅ CORRECT — associated label
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

// ❌ FORBIDDEN — no label
<Button><X className="h-4 w-4" /></Button>
<Input placeholder="Search..." />  {/* placeholder is NOT a label */}
```

### Live Regions

For dynamic content updates:

```tsx
// ✅ CORRECT — announce changes
<div aria-live="polite" aria-atomic="true">
  {items.length} results found
</div>

// ✅ For urgent updates
<div aria-live="assertive">
  {error && <p role="alert">{error}</p>}
</div>
```

### Landmarks

Use semantic HTML for page structure:

```tsx
// ✅ CORRECT
<header role="banner">...</header>
<nav aria-label="Main navigation">...</nav>
<main id="main-content">...</main>
<aside aria-label="Sidebar">...</aside>
<footer role="contentinfo">...</footer>

// ❌ FORBIDDEN — div soup
<div className="header">...</div>
<div className="nav">...</div>
<div className="content">...</div>
```

### Tables

```tsx
// ✅ CORRECT — accessible table
<Table>
  <TableCaption>Recent invoices</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Invoice</TableHead>
      <TableHead scope="col">Status</TableHead>
      <TableHead scope="col" className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {invoices.map((inv) => (
      <TableRow key={inv.id}>
        <TableCell className="font-medium">{inv.invoice}</TableCell>
        <TableCell>{inv.status}</TableCell>
        <TableCell className="text-right">{inv.amount}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Forms

```tsx
// ✅ CORRECT — accessible form
<Form>
  <FormField
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel required>Email address</FormLabel>
        <FormControl>
          <Input
            type="email"
            aria-describedby="email-help"
            aria-invalid={!!form.formState.errors.email}
            {...field}
          />
        </FormControl>
        <FormDescription id="email-help">
          We'll never share your email.
        </FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>

// ❌ FORBIDDEN — no labels, no error association
<form>
  <input type="email" />
  {error && <span>{error}</span>}
</form>
```

---

## Color Contrast

### Minimum Ratios (WCAG AA)

| Element | Ratio |
|---------|-------|
| Normal text (< 18pt) | 4.5:1 |
| Large text (≥ 18pt or 14pt bold) | 3:1 |
| UI components & graphical objects | 3:1 |

### Checking Contrast

Use the browser DevTools or:

```bash
# Quick check with Chrome DevTools
# Inspect element → computed → check color contrast indicator
```

### Tolom Token Compliance

All semantic tokens in `globals.css` meet AA contrast in both light and dark modes. **Never bypass tokens with raw colors** — they may fail contrast.

---

## Screen Reader Testing

### Checklist

| Test | How |
|------|-----|
| Page announces title | Navigate to page, verify `<title>` or `h1` announced |
| Landmarks reachable | Use rotor (VO+U on Mac) to jump between landmarks |
| Forms labeled | Tab through form, verify each input announced with label |
| Images alt text | Verify all `<img>` have `alt` (decorative: `alt=""`) |
| Dynamic content | Trigger update, verify `aria-live` region announces change |
| Dialog focus | Open dialog, verify focus moves to dialog, `Escape` closes |
| Data tables | Navigate cells, verify row/column headers announced |

### Common Failures

| Issue | Fix |
|-------|-----|
| "Click here" link text | Use descriptive text: "View invoice details" |
| Image without alt | Add `alt="description"` or `alt=""` for decorative |
| Missing form label | Add `<Label>` or `aria-label` |
| Focus trap broken | Don't override Radix's `onOpenAutoFocus` |
| Icon-only button | Add `aria-label` |

---

## Testing Commands

```bash
# Automated accessibility audit
npx @axe-core/cli http://localhost:3000

# Lighthouse accessibility score
npx lighthouse http://localhost:3000 --only-categories=accessibility

# Playwright accessibility test
# Add to e2e tests:
import { AxeBuilder } from '@axe-core/playwright';

test('homepage has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

---

## Anti-Patterns

| Anti-Pattern | Why It Breaks | Fix |
|---|---|---|
| `onClick` on `<div>` | Not keyboard accessible | Use `<button>` or add `role="button"` + `tabIndex={0}` + `onKeyDown` |
| `outline: none` without replacement | Focus invisible | Use `focus-visible:ring-2` |
| Placeholder as label | Screen readers skip it | Add `<Label>` or `aria-label` |
| `tabIndex={-1}` on interactive | Removes from tab order | Only for programmatic focus, not user-facing |
| Auto-playing audio | Disorients screen reader users | Never auto-play |
| `aria-hidden="true"` on focusable | Focus goes into void | Remove `aria-hidden` or `tabIndex={-1}` |
| Color-only status indicators | Colorblind users miss it | Add icon or text: `text-destructive` + `<AlertCircle>` |

---

## Validation Checklist

Before merging any interactive UI:

- [ ] All buttons/links have accessible names (visible text or `aria-label`)
- [ ] All form inputs have associated `<Label>` or `aria-label`
- [ ] Focus ring visible on all interactive elements
- [ ] Dialog/sheet traps focus correctly (Radix default)
- [ ] `Escape` closes all overlays
- [ ] Focus returns to trigger when overlay closes
- [ ] Dynamic content uses `aria-live` regions
- [ ] Tables use `<TableHead scope="col">`
- [ ] No color-only status indicators
- [ ] Skip link present on pages with sidebar
- [ ] Images have `alt` text (decorative: `alt=""`)
- [ ] Contrast ratio ≥ 4.5:1 for text, ≥ 3:1 for UI components
