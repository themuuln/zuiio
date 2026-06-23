const MN_MONTHS = [
  "1 сар",
  "2 сар",
  "3 сар",
  "4 сар",
  "5 сар",
  "6 сар",
  "7 сар",
  "8 сар",
  "9 сар",
  "10 сар",
  "11 сар",
  "12 сар",
];

const MN_WEEKDAYS = [
  "Ням",
  "Даваа",
  "Мягмар",
  "Лхагва",
  "Пүрэв",
  "Баасан",
  "Бямба",
];

/**
 * "2026 оны 6 сарын 23"
 */
export function formatMNDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()} оны ${d.getMonth() + 1} сарын ${d.getDate()}`;
}

/**
 * "2026/06/23"
 */
export function formatMNShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

/**
 * "Даваа, 2026 оны 6 сарын 23"
 */
export function formatMNFull(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const weekday = MN_WEEKDAYS[d.getDay()];
  return `${weekday}, ${formatMNDate(d)}`;
}

/**
 * "6 сарын 23" (short, no year)
 */
export function formatMNMonthDay(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getMonth() + 1} сарын ${d.getDate()}`;
}

export { MN_MONTHS, MN_WEEKDAYS };
