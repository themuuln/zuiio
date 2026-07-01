export interface PageRange {
  from: number;
  to: number;
}

/** Build Supabase `.range(from, to)` args from 1-based page number. */
export function paginate(page: number, pageSize: number): PageRange {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

/** Total page count for pagination. */
export function totalPages(totalCount: number, pageSize: number): number {
  return Math.ceil(totalCount / pageSize);
}

/** Whether there is another page after the current one. */
export function hasNextPage(
  page: number,
  totalCount: number,
  pageSize: number,
): boolean {
  return page < totalPages(totalCount, pageSize);
}
