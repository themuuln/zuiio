# @zuiio/hooks

React 19 hooks shared across the zuiio monorepo. Peer dep: `@zuiio/core`.

## Hooks

| Hook | Description |
|---|---|
| `useCopyToClipboard` | Copies text to clipboard, returns `{ copied, copy }` |
| `useDebounce` | Debounces a value by `delay` ms |
| `useDisclosure` | Open/close/toggle pattern for modals, drawers, menus |
| `useIntersectionObserver` | Observe element visibility via `IntersectionObserver` |
| `useLocalStorage` | Synced `localStorage` state with JSON serialization |
| `useFuzzySearch` | Client-side fuzzy filtering over an array of items |
| `useLookup` | Memoized `Map<K, T>` from an array + key accessor |
| `useOnlineStatus` | Returns `navigator.onLine` reactively |
| `useTableFilters` | URL-synced table filter state for TanStack Table |

## Usage

### useDisclosure

```tsx
import { useDisclosure } from "@zuiio/hooks";

function SearchModal() {
  const { open, close, toggle, isOpen } = useDisclosure();
  return (
    <>
      <Button onClick={toggle}>Search</Button>
      <Dialog open={isOpen} onOpenChange={(v) => (v ? open() : close())}>
        <DialogContent>...</DialogContent>
      </Dialog>
    </>
  );
}
```

### useLookup

Builds a memoized `Map` — O(1) lookups instead of repeated `.find()`.

```tsx
import { useLookup } from "@zuiio/hooks";

function UserBadge({ userId }: { userId: string }) {
  const users = useQuery({ queryKey: ["users"], queryFn: fetchUsers });
  const byId = useLookup(users.data ?? [], (u) => u.id);
  const user = byId.get(userId);
  if (!user) return <Spinner />;
  return <Badge>{user.name}</Badge>;
}
```

### Other hooks

```tsx
// useLocalStorage — persists state to localStorage
const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");

// useFuzzySearch — client-side fuzzy match
const { query, setQuery, results } = useFuzzySearch(items, ["name", "email"]);

// useCopyToClipboard
const { copied, copy } = useCopyToClipboard();
await copy("text to copy");

// useDebounce — delays value changes
const debounced = useDebounce(searchQuery, 300);
```

## Conventions

- One hook per file, kebab-case filename matching the export.
- `useLookup` delegates to `@zuiio/core`'s `createLookup` — do not reimplement the map logic here.
- All hooks accept a single options object where applicable.
