import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[₮,\s]/g, "").trim();
  return cleaned === "" ? 0 : Number(cleaned);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("mn-MN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `₮ ${formatted}`;
}

export function formatMNT(amount: number): string {
  return formatCurrency(amount);
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]?.[0]?.toUpperCase() ?? "?";
  const first = parts[0]?.[0]?.toUpperCase() ?? "";
  const last = parts[1]?.[0]?.toUpperCase() ?? "";
  return `${first}${last}` || "?";
}

export function stableStringify(value: unknown): string {
  const sort = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(sort);
    if (input && typeof input === "object") {
      return Object.fromEntries(
        Object.entries(input as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, nested]) => [key, sort(nested)]),
      );
    }
    return input;
  };

  return JSON.stringify(sort(value));
}

export function formatPlateNumber(plate: string | null | undefined): string {
  if (!plate) return "";
  const normalized = normalizeMongolianPlate(plate);
  const match = normalized.match(/^(\d{4})([А-ЯӨҮҢ]{3})$/);
  if (!match) return normalized;
  return `${match[1]} ${match[2]}`;
}

export function generateUUID(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code = "INTERNAL_ERROR",
    statusCode = 500,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: unknown) {
    super(message, "NOT_FOUND", 404, details);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details?: unknown) {
    super(message, "UNAUTHORIZED", 401, details);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details?: unknown) {
    super(message, "FORBIDDEN", 403, details);
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists", details?: unknown) {
    super(message, "CONFLICT", 409, details);
    this.name = "ConflictError";
  }
}

export interface ApiErrorResponse {
  status: number;
  body: {
    error: {
      code: string;
      message: string;
      details?: unknown;
    };
  };
  headers?: Record<string, string>;
}

export function toApiErrorResponse(error: unknown): ApiErrorResponse {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      },
      headers:
        error instanceof UnauthorizedError
          ? { "X-Auth-Required": "true" }
          : undefined,
    };
  }

  const message =
    typeof process !== "undefined" &&
    process.env.NODE_ENV === "development" &&
    error instanceof Error
      ? error.message
      : "An unexpected error occurred";

  return {
    status: 500,
    body: { error: { code: "INTERNAL_ERROR", message } },
  };
}

export function flattenFieldErrors(
  issues: ReadonlyArray<{ path: readonly PropertyKey[]; message: string }>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !(key in errors)) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export type ActionState<
  TSuccess extends Record<string, unknown> = Record<string, never>,
> = {
  formError?: string;
  fieldErrors?: Record<string, string>;
  values?: TSuccess;
};

export function normalizeMongolianPhone(phone: string): string {
  const digits = phone.replace(/[\s\-()]/g, "");
  if (digits.startsWith("+976")) return digits;
  if (digits.startsWith("976") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 8) return `+976${digits}`;
  if (digits.length === 8) return `+976${digits}`;
  return digits;
}

export function isValidMongolianPhone(phone: string): boolean {
  return /^\+976\d{8}$/.test(normalizeMongolianPhone(phone));
}

export function isValidVehicleYear(year: string): boolean {
  const value = Number(year);
  if (!Number.isInteger(value)) return false;
  const currentYear = new Date().getFullYear();
  return value >= 1950 && value <= currentYear + 1;
}

export function isValidVin(vin: string): boolean {
  if (!vin) return true;
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
}

export function isValidPositiveNumber(value: string): boolean {
  if (!value.trim()) return false;
  const parsed = Number(value);
  return !Number.isNaN(parsed) && parsed > 0;
}

export function isValidNonNegativeNumber(value: string): boolean {
  if (!value.trim()) return true;
  const parsed = Number(value);
  return !Number.isNaN(parsed) && parsed >= 0;
}

const LATIN_TO_CYRILLIC: Record<string, string> = {
  A: "А",
  B: "Б",
  C: "Ц",
  D: "Д",
  E: "Э",
  F: "Ф",
  G: "Г",
  H: "Х",
  I: "И",
  J: "Ж",
  K: "К",
  L: "Л",
  M: "М",
  N: "Н",
  O: "О",
  P: "П",
  Q: "Ө",
  R: "Р",
  S: "С",
  T: "Т",
  U: "У",
  V: "В",
  W: "Ү",
  X: "Х",
  Y: "Ы",
  Z: "З",
};

export function transliterateMongolianPlate(plate: string): string {
  return plate
    .toUpperCase()
    .split("")
    .map((char) => LATIN_TO_CYRILLIC[char] ?? char)
    .join("");
}

export function normalizeMongolianPlate(plate: string): string {
  return transliterateMongolianPlate(plate.replace(/[\s\-–—._/\\]/g, ""));
}

export function isValidMongolianPlate(plate: string): boolean {
  return /^(\d{4})([А-ЯӨҮҢ]{3})$/.test(normalizeMongolianPlate(plate));
}

export interface RateLimiterResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimiterConfig {
  limit: number;
  windowMs: number;
}

export interface RateLimiter {
  check(key: string): Promise<RateLimiterResult>;
}

export function createRateLimiter({
  limit,
  windowMs,
}: RateLimiterConfig): RateLimiter {
  const store = new Map<string, number[]>();

  return {
    async check(key: string) {
      const now = Date.now();
      const cutoff = now - windowMs;
      const recent = (store.get(key) ?? []).filter(
        (timestamp) => timestamp > cutoff,
      );
      const allowed = recent.length < limit;
      const nextTimestamps = allowed ? [...recent, now] : recent;
      store.set(key, nextTimestamps);
      const oldest = nextTimestamps[0] ?? now;
      return {
        allowed,
        remaining: Math.max(0, limit - nextTimestamps.length),
        resetAt: oldest + windowMs,
      };
    },
  };
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): { error?: string } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const recent = (legacyRateStore.get(key) ?? []).filter(
    (timestamp) => timestamp > cutoff,
  );

  if (recent.length >= limit) {
    const retryAfterSeconds =
      recent.length > 0
        ? Math.ceil((recent[0] + windowMs - now) / 1000)
        : Math.ceil(windowMs / 1000);
    return {
      error: `Хэт олон хүсэлт. ${limit} хүсэлт / ${windowMs / 1000}сек. ${retryAfterSeconds}сек дараа дахин оролдоно уу.`,
    };
  }

  legacyRateStore.set(key, [...recent, now]);
  return {};
}

const legacyRateStore = new Map<string, number[]>();

export function resetRateLimit(key: string): void {
  legacyRateStore.delete(key);
}

export function clearAllRateLimits(): void {
  legacyRateStore.clear();
}

export const apiRateLimiter = createRateLimiter({
  limit: 120,
  windowMs: 60_000,
});
export const authRateLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60_000,
});
export const mutationRateLimiter = createRateLimiter({
  limit: 60,
  windowMs: 60_000,
});
