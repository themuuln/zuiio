import { parseAsInteger, parseAsString, useQueryState } from "nuqs";

/**
 * Pre-built URL state hooks for data-heavy pages.
 *
 * Usage:
 *   const { search, setSearch, page, setPage, sort, setSort } = useTableFilters();
 *
 * URL becomes: ?page=2&search=toyota&sort=name-asc
 */

interface TableFilterDefaults {
  search?: string;
  page?: number;
  sort?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  view?: string;
  category?: string;
}

function withPrefix(key: string, prefix?: string) {
  return prefix ? `${prefix}-${key}` : key;
}

export function useTableFilters(
  prefix?: string,
  defaults: TableFilterDefaults = {},
) {
  const scopedKey = (key: string) => withPrefix(key, prefix);

  const [search, setSearch] = useQueryState(scopedKey("search"), {
    ...parseAsString.withDefault(defaults.search ?? ""),
    shallow: true,
  });
  const [page, setPage] = useQueryState(scopedKey("page"), {
    ...parseAsInteger.withDefault(defaults.page ?? 1),
    shallow: true,
  });
  const [sort, setSort] = useQueryState(scopedKey("sort"), {
    ...parseAsString.withDefault(defaults.sort ?? ""),
    shallow: true,
  });
  const [status, setStatus] = useQueryState(scopedKey("status"), {
    ...parseAsString.withDefault(defaults.status ?? ""),
    shallow: true,
  });
  const [dateFrom, setDateFrom] = useQueryState(scopedKey("dateFrom"), {
    ...parseAsString.withDefault(defaults.dateFrom ?? ""),
    shallow: true,
  });
  const [dateTo, setDateTo] = useQueryState(scopedKey("dateTo"), {
    ...parseAsString.withDefault(defaults.dateTo ?? ""),
    shallow: true,
  });
  const [view, setView] = useQueryState(scopedKey("view"), {
    ...parseAsString.withDefault(defaults.view ?? "table"),
    shallow: true,
  });
  const [category, setCategory] = useQueryState(scopedKey("category"), {
    ...parseAsString.withDefault(defaults.category ?? ""),
    shallow: true,
  });

  /** Reset all filters to defaults */
  const resetAll = () => {
    setSearch(defaults.search ?? "");
    setPage(defaults.page ?? 1);
    setSort(defaults.sort ?? "");
    setStatus(defaults.status ?? "");
    setDateFrom(defaults.dateFrom ?? "");
    setDateTo(defaults.dateTo ?? "");
    setView(defaults.view ?? "table");
    setCategory(defaults.category ?? "");
  };

  /** Number of active non-default filters (for badge count) */
  const activeCount =
    (search !== (defaults.search ?? "") ? 1 : 0) +
    (status !== (defaults.status ?? "") ? 1 : 0) +
    (dateFrom !== (defaults.dateFrom ?? "") ? 1 : 0) +
    (dateTo !== (defaults.dateTo ?? "") ? 1 : 0) +
    (category !== (defaults.category ?? "") ? 1 : 0) +
    (sort !== (defaults.sort ?? "") ? 1 : 0) +
    (page !== (defaults.page ?? 1) ? 1 : 0) +
    (view !== (defaults.view ?? "table") ? 1 : 0);

  return {
    search,
    setSearch,
    page,
    setPage,
    sort,
    setSort,
    status,
    setStatus,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    view,
    setView,
    category,
    setCategory,
    resetAll,
    activeCount,
  };
}
