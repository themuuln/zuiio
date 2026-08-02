import { z } from "zod";

// ── Helpers ──

// ── Login ──

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email, phone, or username is required"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ── Signup ──

export const signupSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required"),
    identifier: z.string().min(1, "Email, phone, or username is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type SignupInput = z.infer<typeof signupSchema>;

// ── Create Organization ──

export const BUSINESS_TYPES = [
  "general_repair",
  "tire_shop",
  "body_shop",
  "dealership",
  "fleet",
  "quick_lube",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const createOrganizationSchema = z.object({
  organizationName: z
    .string()
    .min(2, "Organization name must be at least 2 characters"),
  businessType: z.enum([
    "general_repair",
    "tire_shop",
    "body_shop",
    "dealership",
    "fleet",
    "quick_lube",
  ]),
  /** Checkbox value: "on" when enabled (default), "off" when disabled. */
  enablePartSuggestions: z
    .enum(["on", "off"])
    .default("on")
    .transform((v) => v === "on"),
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

// ── Forgot Password ──

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Email, phone, or username is required"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ── Reset Password ──

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ── Customer Login ──

export const customerLoginSchema = z.object({
  email: z
    .email({ message: "Invalid email address" })
    .min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;

// ── Customer Set Password ──

export const customerSetPasswordSchema = z
  .object({
    email: z
      .email({ message: "Invalid email address" })
      .min(1, "Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type CustomerSetPasswordInput = z.infer<
  typeof customerSetPasswordSchema
>;

// ── Organization PIN ──

const pinSchema = z
  .string()
  .min(1, "PIN is required")
  .regex(/^\d{4,6}$/, "PIN must be 4-6 digits");

export const organizationPinSchema = z
  .object({
    organizationId: z.string().min(1, "Organization is required"),
    pin: pinSchema,
    confirmPin: z.string().optional(),
  })
  .refine(
    (data) => {
      // confirmPin is only required when setting up a new PIN (present in formData)
      // If confirmPin is provided, it must match pin
      if (data.confirmPin !== undefined && data.confirmPin !== "") {
        return data.pin === data.confirmPin;
      }
      return true;
    },
    {
      message: "PINs do not match",
      path: ["confirmPin"],
    },
  );
export type OrganizationPinInput = z.infer<typeof organizationPinSchema>;
