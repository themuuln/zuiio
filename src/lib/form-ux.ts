/**
 * Shared form UX helpers used across the app.
 *
 * Keep all phone-formatting, input-type mapping, and autoComplete
 * helpers here so every form gets consistent behavior.
 */

/** Strip non-digits and cap at 8 (Mongolian phone length). */
export function formatMongolianPhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

/**
 * Map a field name to its inputMode and autoComplete value.
 * Centralised so all forms get the same hints without repeating props.
 */
export function inputProps(
  field: string,
  overrides?: {
    type?: string;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
    autoComplete?: string;
  },
): {
  inputMode: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete: string;
} {
  if (overrides?.inputMode || overrides?.autoComplete) {
    return {
      inputMode: overrides.inputMode ?? "text",
      autoComplete: overrides.autoComplete ?? "off",
    };
  }

  const map: Record<
    string,
    {
      inputMode: React.HTMLAttributes<HTMLInputElement>["inputMode"];
      autoComplete: string;
    }
  > = {
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
