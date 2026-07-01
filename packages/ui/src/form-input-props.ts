import type { HTMLAttributes } from "react";

type InputMode = HTMLAttributes<HTMLInputElement>["inputMode"];

/**
 * Strip non-digits and cap at 8 (Mongolian phone length).
 */
export function formatMongolianPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("976") && digits.length > 8) {
    return digits.slice(3).slice(0, 8);
  }
  return digits.slice(0, 8);
}

/**
 * Enforce Mongolian plate format while typing: 4 digits + 3 Cyrillic letters.
 * Strips non-alphanumeric, collects up to 4 digits then up to 3 letters.
 */
export function formatPlateInput(value: string): string {
  const raw = value.replace(/[^0-9а-яА-ЯӨҮөүa-zA-Z]/g, "");
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  const letters = raw.replace(/[0-9]/g, "").slice(0, 3);
  return digits + letters;
}

/**
 * Map a field name to its inputMode and autoComplete values.
 * Centralised so all forms get the same hints without repeating props.
 *
 * Supports exact match and partial match (e.g. "plateNumber" → matches "plate").
 *
 * @example
 * ```tsx
 * const { inputMode, autoComplete } = inputProps("phone");
 * <input inputMode={inputMode} autoComplete={autoComplete} />
 * ```
 */
export function inputProps(
  field: string,
  overrides?: {
    type?: string;
    inputMode?: InputMode;
    autoComplete?: string;
  },
): {
  inputMode: InputMode;
  autoComplete: string;
} {
  if (overrides?.inputMode || overrides?.autoComplete) {
    return {
      inputMode: overrides.inputMode ?? "text",
      autoComplete: overrides.autoComplete ?? "off",
    };
  }

  const map: Record<string, { inputMode: InputMode; autoComplete: string }> = {
    firstName: { inputMode: "text", autoComplete: "given-name" },
    lastName: { inputMode: "text", autoComplete: "family-name" },
    companyName: { inputMode: "text", autoComplete: "organization" },
    contactPerson: { inputMode: "text", autoComplete: "name" },
    phone: { inputMode: "tel", autoComplete: "tel" },
    email: { inputMode: "email", autoComplete: "email" },
    address: { inputMode: "text", autoComplete: "street-address" },
    make: { inputMode: "text", autoComplete: "organization" },
    model: { inputMode: "text", autoComplete: "off" },
    plate: { inputMode: "text", autoComplete: "off" },
    year: { inputMode: "numeric", autoComplete: "off" },
    odometer: { inputMode: "numeric", autoComplete: "off" },
    vin: { inputMode: "text", autoComplete: "off" },
    trim: { inputMode: "text", autoComplete: "off" },
    engine: { inputMode: "text", autoComplete: "off" },
    fullName: { inputMode: "text", autoComplete: "name" },
    password: { inputMode: "text", autoComplete: "new-password" },
    currentPassword: { inputMode: "text", autoComplete: "current-password" },
    pin: { inputMode: "numeric", autoComplete: "off" },
    quantity: { inputMode: "numeric", autoComplete: "off" },
    price: { inputMode: "decimal", autoComplete: "off" },
    discount: { inputMode: "decimal", autoComplete: "off" },
    taxId: { inputMode: "text", autoComplete: "off" },
    invoicePrefix: { inputMode: "text", autoComplete: "off" },
  };

  // Fallback for compound names like "plateNumber" → "plate"
  for (const [key, val] of Object.entries(map)) {
    if (field.toLowerCase().includes(key.toLowerCase())) return val;
  }

  return { inputMode: "text", autoComplete: "off" };
}
