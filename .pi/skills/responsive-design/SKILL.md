---
name: responsive-design
description: Tolom responsive design — mobile-first layouts, tablet-touch patterns, container queries, breakpoint strategy, touch targets, and device-specific optimizations. Use when building page layouts, adjusting responsive behavior, optimizing for tablet/mobile, or fixing layout issues across devices.
---

# Responsive Design

Mobile-first, tablet-optimized. Tolom's users are on iPads in auto shops.

---

## Breakpoints

| Prefix | Width | Use |
|--------|-------|-----|
| (base) | < 768px | Mobile — phone layouts |
| `tablet:` | ≥ 768px | Tablet — iPad, landscape phones |
| `md:` | ≥ 768px | Same as tablet (Tailwind default) |
| `lg:` | ≥ 1024px | Desktop — laptop screens |
| `xl:` | ≥ 1280px | Large desktop |
| `2xl:` | ≥ 1536px | Ultra-wide |

### Custom Breakpoint

```css
/* globals.css */
@theme inline {
  --breakpoint-tablet: 768px;
}
```

Use `tablet:` for Tolom-specific tablet overrides. Use `md:` for standard Tailwind responsive styles.

---

## Mobile-First Pattern

Always start with mobile, add complexity for larger screens:

```tsx
// ✅ CORRECT — mobile base, tablet enhancement
<div className="flex flex-col gap-4 p-4 tablet:flex-row tablet:gap-6 tablet:p-6">

// ❌ FORBIDDEN — desktop first, then override down
<div className="hidden flex-row gap-6 p-6 md:flex md:flex-col md:gap-4 md:p-4">
```

### Layout Examples

```tsx
// Grid — 1 col mobile, 2 col tablet, 3 col desktop
<div className="grid grid-cols-1 tablet:grid-cols-2 lg:grid-cols-3 gap-4">

// Sidebar — hidden mobile, visible tablet+
<div className="hidden tablet:block w-64">

// Full-width mobile, constrained desktop
<main className="w-full max-w-5xl mx-auto px-4 tablet:px-6">
```

---

## Tablet-Touch Pattern

The `.tablet-touch` wrapper provides auto-optimized touch behavior:

```tsx
<div className="tablet-touch flex flex-col gap-6">
  <Card>
    <CardContent>
      <p>Content here</p>
    </CardContent>
  </Card>
</div>
```

### What `.tablet-touch` Does

| Behavior | Mobile | Tablet (≥768px) |
|----------|--------|-----------------|
| Card padding | Default (p-4) | p-5 (1.25rem) |
| Button min-height | Default | 44px (Apple HIG) |
| Tap highlight | Enabled | Disabled (no blue flash) |
| Double-tap zoom | Enabled | Disabled |
| Link/button tap area | Default | Expanded |

### CSS Behind It

```css
.tablet-touch {
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

@media (min-width: 768px) {
  .tablet-touch [data-slot="button"]:not([data-size="icon"]):not(
      [data-size="icon-xs"]
    ):not([data-size="icon-sm"]):not([data-size="icon-lg"]),
  .tablet-touch a,
  .tablet-touch select,
  .tablet-touch [role="button"] {
    min-height: 44px;
  }
}
```

### When to Use

| Situation | Use `.tablet-touch`? |
|-----------|---------------------|
| Dashboard page content | ✅ Yes |
| Form pages | ✅ Yes |
| List pages with actions | ✅ Yes |
| Navigation sidebar | ❌ No — already has its own touch handling |
| Modals/dialogs | ❌ No — Radix handles touch |
| Charts | ❌ No — not interactive in the same way |

---

## Container Queries

Use `@container` for components that respond to their parent, not the viewport:

```tsx
// ✅ CORRECT — card adapts to its container width
<Card className="@container/card">
  <CardContent className="flex flex-col gap-2 @md/card:flex-row @md/card:items-center">
    <Icon className="size-8 @lg/card:size-10" />
    <div>
      <p className="text-sm @md/card:text-base">Revenue</p>
      <p className="text-2xl font-semibold @lg/card:text-3xl">$12,345</p>
    </div>
  </CardContent>
</Card>
```

### Container Query Naming

Use descriptive names: `@container/card`, `@container/form`, `@container/sidebar`

```css
/* Defined in component files or globals.css */
@container/card (min-width: 400px) { ... }
@container/form (min-width: 600px) { ... }
```

### When to Use Container Queries vs Media Queries

| Use Case | Tool | Why |
|----------|------|-----|
| Page layout (sidebar, main content) | Media query (`tablet:`) | Responds to viewport |
| Card that adapts to available space | Container query (`@container`) | Responds to parent |
| Form that reflows at certain width | Container query (`@container`) | Responds to form width |
| Page-level responsive grid | Media query (`lg:grid-cols-3`) | Viewport-driven |

---

## Touch Targets

### Minimum Size

**44×44px** — Apple Human Interface Guidelines minimum.

```tsx
// ✅ CORRECT — explicit touch target
<Button size="default" className="min-h-[44px]">
  Save
</Button>

// ✅ CORRECT — icon button with padding
<Button size="icon" className="size-11">  {/* 44px */}
  <X className="size-5" />
</Button>

// ❌ FORBIDDEN — tiny touch target
<Button size="sm" className="h-8 px-2">
  <X className="size-3" />
</Button>
```

### Touch Target Rules

| Element | Minimum Size | How |
|---------|-------------|-----|
| Buttons | 44×44px | `min-h-[44px]` or `size-11` |
| Links in lists | 44px height | Padding or min-height |
| Form inputs | 44px height | Default shadcn Input is 40px — add `h-11` |
| Checkboxes/radios | 44×44px hit area | Padding around the control |
| Icon-only buttons | 44×44px | `size-11` with centered icon |

---

## Responsive Patterns

### Page Shell

```tsx
// ✅ CORRECT — standard tolom page layout
<div className="tablet-touch flex flex-col gap-6">
  <PageHeader title="Customers" />
  <Toolbar />
  <div className="grid grid-cols-1 gap-4">
    {customers.map(c => <CustomerCard key={c.id} customer={c} />)}
  </div>
</div>
```

### List Page

```tsx
// ✅ CORRECT — list-page-shell pattern
<div className="tablet-touch flex flex-col gap-6 tablet:px-2">
  <ListPageShell
    header={<PageHeader title="Work Orders" />}
    toolbar={<ListToolbar />}
  >
    <DataTable data={workOrders} columns={columns} />
  </ListPageShell>
</div>
```

### Detail Page (Sidebar + Main)

```tsx
// ✅ CORRECT — responsive detail layout
<div className="flex flex-col gap-6 lg:flex-row">
  <main className="flex-1 min-w-0">
    <WorkOrderContent />
  </main>
  <aside className="w-full lg:w-80 shrink-0">
    <WorkOrderSidebar />
  </aside>
</div>
```

### Form Layout

```tsx
// ✅ CORRECT — responsive form
<form className="flex flex-col gap-4 max-w-3xl mx-auto tablet:gap-6">
  <FormField ... />
  <FormField ... />
  <div className="flex flex-col-reverse gap-2 tablet:flex-row tablet:justify-end">
    <Button variant="outline">Cancel</Button>
    <Button type="submit">Save</Button>
  </div>
</form>
```

---

## Responsive Visibility

```tsx
// Hide on mobile, show on tablet
<div className="hidden tablet:block">Desktop nav</div>

// Show on mobile, hide on tablet
<div className="block tablet:hidden">Mobile menu</div>

// Show only on specific sizes
<div className="hidden lg:block xl:hidden">Laptops only</div>
```

---

## Responsive Typography

```tsx
// ✅ CORRECT — scale with viewport
<h1 className="text-2xl tablet:text-3xl lg:text-4xl">
  Dashboard
</h1>

// ✅ CORRECT — container query typography
<p className="text-sm @md/card:text-base @lg/card:text-lg">
  Description text
</p>
```

---

## Responsive Spacing

```tsx
// ✅ CORRECT — tighten on mobile, expand on tablet
<section className="p-4 gap-4 tablet:p-6 tablet:gap-6">

// ✅ CORRECT — page-level spacing
<div className="px-4 py-6 tablet:px-6 tablet:py-8 lg:px-8 lg:py-10">
```

---

## Image Responsiveness

```tsx
import Image from "next/image";

// ✅ CORRECT — responsive image
<Image
  src={vehicle.photo_url}
  alt="Vehicle"
  width={400}
  height={300}
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  className="w-full h-auto rounded-lg object-cover"
/>

// ✅ CORRECT — thumbnail with fixed aspect ratio
<div className="aspect-video w-full">
  <Image
    src={photo}
    alt="Photo"
    fill
    sizes="(max-width: 768px) 100vw, 400px"
    className="rounded-lg object-cover"
  />
</div>
```

---

## Testing Responsive

### Playwright Viewports

```ts
// playwright.config.ts
projects: [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
  { name: "Mobile Safari", use: { ...devices["iPhone 13"] } },
]
```

### Manual Testing Checklist

| Viewport | Width | Check |
|----------|-------|-------|
| iPhone SE | 375px | Single column, no horizontal scroll, touch targets |
| iPad | 768px | Tablet-touch active, cards padding, 44px buttons |
| iPad Pro | 1024px | Sidebar visible, grid layout |
| Desktop | 1280px+ | Full layout, hover states |

---

## Anti-Patterns

| Anti-Pattern | Why It's Wrong | Fix |
|---|---|---|
| `hidden md:block` (desktop-first) | Mobile is afterthought | Use mobile-first: `hidden tablet:block` |
| No `min-h-[44px]` on buttons | Tiny touch targets on tablet | Add minimum height |
| Hardcoded widths `w-[800px]` | Breaks on small screens | Use `max-w-*` or container queries |
| `overflow: hidden` to fix layout | Hides content instead of reflowing | Use responsive grid/flex |
| Pixel-perfect design | Doesn't scale | Design with spacing scale, not pixels |
| `!important` for responsive | Specificity hack, fragile | Use proper responsive utilities |
| Using `md:` for tablet-specific | Conflicts with standard Tailwind | Use `tablet:` for tolom-specific |

---

## Validation Checklist

Before merging responsive UI:

- [ ] Mobile-first approach (base → tablet → desktop)
- [ ] `.tablet-touch` wrapper on dashboard page content
- [ ] Touch targets ≥ 44px in tablet sections
- [ ] Container queries for cards/components that adapt to width
- [ ] Media queries for page-level layout changes
- [ ] No hardcoded widths that break on small screens
- [ ] Images use `next/image` with `sizes` prop
- [ ] Typography scales with viewport/container
- [ ] Tested on mobile (375px), tablet (768px), desktop (1280px)
- [ ] No horizontal scroll on any viewport
