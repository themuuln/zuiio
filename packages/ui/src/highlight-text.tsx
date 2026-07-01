import type { ReactNode } from "react";

interface Fragment {
  text: string;
  match: boolean;
}

/**
 * Case-insensitive search with multi-term support.
 * Breaks query into words and highlights each one independently.
 */
function highlightFragments(text: string, query: string): Fragment[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  if (terms.length === 0) return [{ text, match: false }];

  const lowerText = text.toLowerCase();
  const matchRanges: [number, number][] = [];

  for (const term of terms) {
    if (term.length < 2) continue;
    const idx = lowerText.indexOf(term);
    if (idx !== -1) {
      matchRanges.push([idx, idx + term.length]);
    }
  }

  if (matchRanges.length === 0) return [{ text, match: false }];

  // Merge overlapping/sorted ranges
  matchRanges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [matchRanges[0]!];
  for (let i = 1; i < matchRanges.length; i++) {
    const last = merged[merged.length - 1]!;
    const cur = matchRanges[i]!;
    if (cur[0] <= last[1]) {
      last[1] = Math.max(last[1], cur[1]);
    } else {
      merged.push(cur);
    }
  }

  // Build fragments from merged ranges
  const fragments: Fragment[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) {
      fragments.push({ text: text.slice(cursor, start), match: false });
    }
    fragments.push({ text: text.slice(start, end), match: true });
    cursor = end;
  }
  if (cursor < text.length) {
    fragments.push({ text: text.slice(cursor), match: false });
  }

  return fragments;
}

/**
 * Renders text with matching query terms highlighted using `<mark>`.
 *
 * Multi-term: breaks query into words and highlights each independently.
 * Matching is case-insensitive, uses first occurrence of each term.
 *
 * @example
 * ```tsx
 * <HighlightText text="Toyota Camry" query="toyo cam" />
 * // → <><mark>Toyo</mark>ta <mark>Cam</mark>ry</>
 * ```
 */
export function HighlightText({
  text,
  query,
  className,
}: {
  text: string;
  query: string;
  className?: string;
}): ReactNode {
  const trimmed = query.trim();
  if (!trimmed || !text) return text;

  const fragments = highlightFragments(text, trimmed);
  if (fragments.length === 1) return text;

  return (
    <span className={className}>
      {fragments.map((f, i) =>
        f.match ? (
          <mark
            key={i}
            className="bg-primary/15 text-foreground rounded-sm px-0.5"
          >
            {f.text}
          </mark>
        ) : (
          <span key={i}>{f.text}</span>
        ),
      )}
    </span>
  );
}

/**
 * Search a list of items by a query string, matching against
 * the given string fields. Uses simple substring matching
 * (not fuzzy — for that use `useFuzzySearch` from `@zuiio/hooks`).
 */
export function searchByFields<T extends Record<string, unknown>>(
  items: T[],
  query: string,
  fields: (keyof T)[],
): T[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return items;

  return items.filter((item) =>
    fields.some((field) => {
      const val = item[field];
      return typeof val === "string" && val.toLowerCase().includes(trimmed);
    }),
  );
}
