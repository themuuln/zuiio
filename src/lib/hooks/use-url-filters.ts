import { parseAsInteger, parseAsString, useQueryState } from "nuqs";

/**
 * Pre-built URL state hooks for data-heavy pages.
 *
 * Usage:
 *   const { search, setSearch, page, setPage, sort, setSort } = useTableFilters();
 *
 * URL becomes: ?page=2&search=toyota&sort=name-asc
 */

const parsers = {
  search: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  sort: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
  dateFrom: parseAsString.withDefault(""),
  dateTo: parseAsString.withDefault(""),
  view: parseAsString.withDefault("table"),
};

export function useTableFilters(prefix?: string) {
  const [search, setSearch] = useQueryState("search", {
    ...parsers.search,
    shallow: true,
  });
  const [page, setPage] = useQueryState("page", {
    ...parsers.page,
    shallow: true,
  });
  const [sort, setSort] = useQueryState("sort", {
    ...parsers.sort,
    shallow: true,
  });
  const [status, setStatus] = useQueryState("status", {
    ...parsers.status,
    shallow: true,
  });
  const [dateFrom, setDateFrom] = useQueryState("dateFrom", {
    ...parsers.dateFrom,
    shallow: true,
  });
  const [dateTo, setDateTo] = useQueryState("dateTo", {
    ...parsers.dateTo,
    shallow: true,
  });
  const [view, setView] = useQueryState("view", {
    ...parsers.view,
    shallow: true,
  });

  /** Reset all filters to defaults */
  const resetAll = () => {
    setSearch("");
    setPage(1);
    setSort("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
  };

  /** Number of active non-default filters (for badge count) */
  const activeCount =
    [search, status, dateFrom, dateTo].filter(Boolean).length +
    (sort ? 1 : 0) +
    (page > 1 ? 1 : 0);

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
    resetAll,
    activeCount,
  };
}
