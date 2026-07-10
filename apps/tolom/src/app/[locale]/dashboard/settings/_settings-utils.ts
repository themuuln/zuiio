export function getStringSetting(
  settings: Record<string, unknown> | null | undefined,
  key: string,
  fallback: string,
): string {
  const value = settings?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function getNumberSetting(
  settings: Record<string, unknown> | null | undefined,
  key: string,
  fallback: string,
): string {
  const value = settings?.[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return fallback;
}

export function getBooleanSetting(
  settings: Record<string, unknown> | null | undefined,
  key: string,
  fallback: boolean,
): boolean {
  const value = settings?.[key];
  return typeof value === "boolean" ? value : fallback;
}
