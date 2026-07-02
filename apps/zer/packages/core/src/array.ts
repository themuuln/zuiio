export function groupBy<T>(
  arr: T[],
  key: (item: T) => string,
): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export function uniqueBy<T>(arr: T[], key: (item: T) => string | number): T[] {
  const seen = new Set<string | number>();
  return arr.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function sumBy<T>(arr: T[], key: (item: T) => number): number {
  return arr.reduce((acc, item) => acc + key(item), 0);
}

export function sortBy<T>(
  arr: T[],
  key: (item: T) => string | number,
  dir: "asc" | "desc" = "asc",
): T[] {
  return [...arr].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    const cmp = ka < kb ? -1 : ka > kb ? 1 : 0;
    return dir === "asc" ? cmp : -cmp;
  });
}
