/**
 * Shared form validation helpers for TOLOM forms.
 * Kept dependency-free so it can be imported anywhere.
 */

/** Normalize Mongolian phone: strip spaces/dashes, add +976 if missing 976 prefix */
export function normalizeMongolianPhone(phone: string): string {
  const digits = phone.replace(/[\s\-()]/g, "");
  if (digits.startsWith("+976")) return digits;
  if (digits.startsWith("976") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 8) return `+976${digits}`;
  if (digits.length === 8) return `+976${digits}`;
  return digits;
}

/** Validate a Mongolian phone number: must result in +976 + 8 digits */
export function isValidMongolianPhone(phone: string): boolean {
  const normalized = normalizeMongolianPhone(phone);
  return /^\+976\d{8}$/.test(normalized);
}

/** Validate vehicle year: between 1950 and current year + 1 */
export function isValidVehicleYear(year: string): boolean {
  const n = Number(year);
  if (!Number.isInteger(n)) return false;
  const currentYear = new Date().getFullYear();
  return n >= 1950 && n <= currentYear + 1;
}

/** Validate VIN: if provided, must be 17 alphanumeric characters (excluding I, O, Q) */
export function isValidVin(vin: string): boolean {
  if (!vin) return true; // optional
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
}

/** Validate a positive number string (for amounts, prices, etc.) */
export function isValidPositiveNumber(value: string): boolean {
  if (!value.trim()) return false;
  const n = Number(value);
  return !Number.isNaN(n) && n > 0;
}

/** Validate a non-negative number (allow 0) */
export function isValidNonNegativeNumber(value: string): boolean {
  if (!value.trim()) return true; // optional
  const n = Number(value);
  return !Number.isNaN(n) && n >= 0;
}

// Latin → Cyrillic look-alike mapping for Mongolian license plates.
// People commonly type Latin letters that visually resemble Cyrillic ones.
const LATIN_TO_CYRILLIC: Record<string, string> = {
  A: "А",
  B: "В",
  C: "С",
  E: "Е",
  H: "Н",
  K: "К",
  M: "М",
  N: "Н",
  O: "О",
  P: "Р",
  T: "Т",
  U: "У",
  V: "В",
  X: "Х",
  Y: "Ү",
};

/**
 * Transliterate Latin letters that look like Cyrillic into their Cyrillic equivalents.
 * E.g. "UNA" → "УНА", "ABC" → "АВС", "H123" → "Н123".
 * Non-mapped Latin letters are left as-is (will fail validation).
 */
export function transliterateMongolianPlate(plate: string): string {
  return plate
    .toUpperCase()
    .split("")
    .map((ch) => LATIN_TO_CYRILLIC[ch] ?? ch)
    .join("");
}

/**
 * Normalize a Mongolian plate: strip separators, transliterate Latin→Cyrillic, uppercase.
 * This lets users type "4444 UNA" or "4444УНА" or "4444-uNa" — all resolve to "4444УНА".
 */
export function normalizeMongolianPlate(plate: string): string {
  return transliterateMongolianPlate(plate.replace(/[\s\-–—._/\\]/g, ""));
}

/**
 * Validate a Mongolian plate number.
 * Format: 4 digits followed by 3 Cyrillic letters, e.g. 4444УНА.
 * Input is normalized first (Latin → Cyrillic transliteration applied).
 */
export function isValidMongolianPlate(plate: string): boolean {
  const normalized = normalizeMongolianPlate(plate);
  return /^\d{4}[А-ЯӨҮ]{3}$/.test(normalized);
}

