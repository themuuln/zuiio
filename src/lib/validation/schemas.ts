import { z } from "zod";
import {
  isValidMongolianPhone,
  isValidMongolianPlate,
} from "@/lib/form-validation";

// ── Common Validators ──────────────────────────────────────────

/**
 * Mongolian phone number validation.
 * Normalizes to +976XXXXXXXX format. Phone must result in 8 digits.
 */
export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .refine(
    (val) => isValidMongolianPhone(val),
    "Enter a valid Mongolian phone number (8 digits)",
  );

/**
 * Amount/price string validation.
 * Form fields use <input type="number"> which returns a string.
 */
export const amountSchema = z
  .string()
  .min(1, "Amount is required")
  .refine((val) => {
    const n = Number(val);
    return !Number.isNaN(n) && n > 0;
  }, "Enter a valid amount");

/**
 * Mongolian license plate validation.
 * Format: 4 digits + 3 Cyrillic letters (e.g. 4444УНА).
 * Supports Latin→Cyrillic transliteration for user convenience.
 */
export const plateSchema = z
  .string()
  .min(1, "Plate number is required")
  .refine(
    (val) => isValidMongolianPlate(val),
    "Must be 4 digits + 3 letters (e.g. 4444УНА)",
  );

/**
 * Optional date string (ISO format, e.g. "2024-01-15").
 * Accepts empty string or a parseable date.
 */
export const dateSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || !Number.isNaN(Date.parse(val)),
    "Enter a valid date",
  );

/**
 * Percentage validation (0–100).
 */
export const percentageSchema = z
  .number()
  .min(0, "Percentage cannot be negative")
  .max(100, "Percentage cannot exceed 100");

/**
 * Email validation that accepts empty string.
 * Common pattern across TOLOM forms where email is optional.
 */
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .optional()
  .or(z.literal(""));

// ── Re-exported Types ─────────────────────────────────────────

export type PhoneInput = z.infer<typeof phoneSchema>;
export type AmountInput = z.infer<typeof amountSchema>;
export type PlateInput = z.infer<typeof plateSchema>;
export type DateInput = z.infer<typeof dateSchema>;
export type PercentageInput = z.infer<typeof percentageSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
