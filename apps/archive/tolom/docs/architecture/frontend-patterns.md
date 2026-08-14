# Tolom Frontend Patterns

## Data Flow

```
Pages → React Query hooks → API routes → Services → Supabase
```

Never skip a layer. See `src/lib/queries/` (hooks), `src/lib/services/` (business logic), `src/app/api/` (routes).

## State Management

| State type | Tool | Location |
|-----------|------|----------|
| Server data | React Query | `src/lib/queries/` |
| URL state (pagination, search) | nuqs | In components |
| Form values | react-hook-form | In components |
| Transient UI state | Zustand | `src/lib/stores/` |

**Zustand stores** require `devtools + persist + immer` middleware. Always export selector hooks — never destructure the full store.

## Styling

- **Semantic color tokens only.** Use `bg-primary`, `text-muted-foreground`, etc. Never `bg-blue-500`.
- **`gap-*` with flex**, not `space-y-*` or `space-x-*`.
- **`size-*`** when width equals height.
- **`truncate` shorthand**, not `overflow-hidden text-ellipsis whitespace-nowrap`.
- **shadcn/ui components first.** Never build from raw HTML what the library provides.

## Border Radius Hierarchy

| Token | Used On | DO NOT use on |
|-------|---------|---------------|
| `rounded-md` (8px) | Segmented controls, inline chips, stat badges | Buttons, inputs, cards |
| `rounded-lg` (10px) | **Buttons**, **Inputs**, dropdowns, popovers | Card containers |
| `rounded-xl` (14px) | **Card-level containers** | Buttons, inputs |
| `rounded-4xl` (~26px) | Badges, status pills | Buttons, cards |
| `rounded-full` | Avatars, icon containers | Buttons, cards |

**Card container pattern:** `rounded-xl border border-border/60 bg-card/40 p-3`

## Drawer/Sheet Consistency

```
DetailDrawer
├── DetailDrawer.Header   ← shrink-0, border-b
├── DetailDrawer.Body     ← flex-1, overflow-y-auto
└── DetailDrawer.Footer   ← shrink-0, border-t (buttons outside <form>)
```

- Footer outside `<form>` — buttons connect via `form="<id>"` + `type="submit"`
- Width: simple forms → `size="md"`, standard → `size="lg"` (default), complex → `size="2xl"`
- `modal={false}` only when nested dialog opens while drawer stays open
