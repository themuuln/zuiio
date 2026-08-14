type RangeCapable = {
  range(from: number, to: number): unknown;
};

export function withPagination<T extends RangeCapable>(
  query: T,
  page = 1,
  pageSize = 20,
): T {
  const from = Math.max(0, (page - 1) * pageSize);
  const to = from + Math.max(1, pageSize) - 1;
  return query.range(from, to) as T;
}
