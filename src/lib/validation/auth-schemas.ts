import { z } from "zod";

// ── Helpers ──

const phoneRegex = /^\+?[1-9]\d{7,14}$/;

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value: string): boolean {
  return phoneRegex.test(value.replace(/[\s\-()]/g, ""));
}

// ── Login ──

export const loginSchema = z
  .object({
    email: z.string().min(1, "Email or phone is required"),
    password: z.string().min(1, "Password is required"),
  })
  .refine((data) => isEmail(data.email) || isPhone(data.email), {
    message: "Enter a valid email or phone number",
    path: ["email"],
  });
export type LoginInput = z.infer<typeof loginSchema>;

// ── Signup ──

export const signupSchema = z
  .object({
    organizationName: z
      .string()
      .min(2, "Organization name must be at least 2 characters"),
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().min(1, "Email or phone is required"),
    phone: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => isEmail(data.email) || isPhone(data.email), {
    message: "Enter a valid email or phone number",
    path: ["email"],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type SignupInput = z.infer<typeof signupSchema>;

// ── Helpers for external use ──

export { isEmail, isPhone };

// ── Forgot Password ──

export const forgotPasswordSchema = z.object({
  email: z
    .email({ message: "Invalid email address" })
    .min(1, "Email is required"),
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
