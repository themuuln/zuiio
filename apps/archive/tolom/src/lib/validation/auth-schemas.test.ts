import { describe, expect, it } from "vitest";
import {
  createOrganizationSchema,
  customerLoginSchema,
  customerSetPasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  organizationPinSchema,
  resetPasswordSchema,
  signupSchema,
} from "./auth-schemas";

describe("loginSchema", () => {
  it("accepts valid login", () => {
    expect(
      loginSchema.safeParse({
        identifier: "test@test.com",
        password: "pass123",
      }).success,
    ).toBe(true);
  });

  it("rejects missing identifier", () => {
    expect(loginSchema.safeParse({ password: "pass123" }).success).toBe(false);
  });

  it("rejects missing password", () => {
    expect(loginSchema.safeParse({ identifier: "test@test.com" }).success).toBe(
      false,
    );
  });

  it("rejects empty fields", () => {
    expect(
      loginSchema.safeParse({ identifier: "", password: "" }).success,
    ).toBe(false);
  });
});

describe("signupSchema", () => {
  it("accepts valid signup with matching passwords", () => {
    expect(
      signupSchema.safeParse({
        fullName: "Test User",
        identifier: "test@test.com",
        password: "password123",
        confirmPassword: "password123",
      }).success,
    ).toBe(true);
  });

  it("accepts signup without full name (optional field)", () => {
    expect(
      signupSchema.safeParse({
        identifier: "test@test.com",
        password: "password123",
        confirmPassword: "password123",
      }).success,
    ).toBe(true);
  });

  it("rejects signup without identifier (required field)", () => {
    expect(
      signupSchema.safeParse({
        fullName: "Test User",
        password: "password123",
        confirmPassword: "password123",
      }).success,
    ).toBe(false);
  });

  it("rejects non-matching passwords", () => {
    expect(
      signupSchema.safeParse({
        fullName: "Test User",
        identifier: "test@test.com",
        password: "password123",
        confirmPassword: "different",
      }).success,
    ).toBe(false);
  });

  it("rejects short password (< 8 chars)", () => {
    const result = signupSchema.safeParse({
      fullName: "Test User",
      identifier: "test@test.com",
      password: "1234567",
      confirmPassword: "1234567",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    expect(
      signupSchema.safeParse({
        password: "password123",
        confirmPassword: "password123",
      }).success,
    ).toBe(false);
  });
});

describe("createOrganizationSchema", () => {
  it("accepts valid org data", () => {
    expect(
      createOrganizationSchema.safeParse({
        organizationName: "My Shop",
        businessType: "general_repair",
      }).success,
    ).toBe(true);
  });

  it("rejects empty org name", () => {
    expect(
      createOrganizationSchema.safeParse({
        organizationName: "",
        businessType: "general_repair",
      }).success,
    ).toBe(false);
  });

  it("rejects missing business type", () => {
    expect(
      createOrganizationSchema.safeParse({
        organizationName: "My Shop",
        businessType: "",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid business type", () => {
    expect(
      createOrganizationSchema.safeParse({
        organizationName: "My Shop",
        businessType: "invalid_type",
      }).success,
    ).toBe(false);
  });

  it("defaults enablePartSuggestions to true when omitted", () => {
    const result = createOrganizationSchema.safeParse({
      organizationName: "My Shop",
      businessType: "general_repair",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enablePartSuggestions).toBe(true);
    }
  });

  it("parses enablePartSuggestions checkbox value", () => {
    const on = createOrganizationSchema.safeParse({
      organizationName: "My Shop",
      businessType: "general_repair",
      enablePartSuggestions: "on",
    });
    expect(on.success).toBe(true);
    if (on.success) {
      expect(on.data.enablePartSuggestions).toBe(true);
    }

    const off = createOrganizationSchema.safeParse({
      organizationName: "My Shop",
      businessType: "general_repair",
      enablePartSuggestions: "off",
    });
    expect(off.success).toBe(true);
    if (off.success) {
      expect(off.data.enablePartSuggestions).toBe(false);
    }
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts valid identifier", () => {
    expect(
      forgotPasswordSchema.safeParse({ identifier: "test@test.com" }).success,
    ).toBe(true);
  });

  it("rejects empty identifier", () => {
    expect(forgotPasswordSchema.safeParse({ identifier: "" }).success).toBe(
      false,
    );
  });
});

describe("resetPasswordSchema", () => {
  it("accepts matching passwords (>= 8 chars)", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "newpass123",
        confirmPassword: "newpass123",
      }).success,
    ).toBe(true);
  });

  it("rejects non-matching passwords", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "newpass123",
        confirmPassword: "different",
      }).success,
    ).toBe(false);
  });
});

describe("customerLoginSchema", () => {
  it("accepts valid customer login", () => {
    expect(
      customerLoginSchema.safeParse({
        email: "customer@test.com",
        password: "pass123",
      }).success,
    ).toBe(true);
  });

  it("rejects missing email", () => {
    expect(customerLoginSchema.safeParse({ password: "pass123" }).success).toBe(
      false,
    );
  });

  it("rejects missing password", () => {
    expect(
      customerLoginSchema.safeParse({ email: "customer@test.com" }).success,
    ).toBe(false);
  });
});

describe("customerSetPasswordSchema", () => {
  it("accepts matching passwords (>= 6 chars)", () => {
    expect(
      customerSetPasswordSchema.safeParse({
        email: "customer@test.com",
        password: "strongPass1",
        confirmPassword: "strongPass1",
      }).success,
    ).toBe(true);
  });

  it("rejects non-matching passwords", () => {
    expect(
      customerSetPasswordSchema.safeParse({
        email: "customer@test.com",
        password: "strongPass1",
        confirmPassword: "different",
      }).success,
    ).toBe(false);
  });

  it("rejects short password (< 6 chars)", () => {
    const result = customerSetPasswordSchema.safeParse({
      email: "customer@test.com",
      password: "ab",
      confirmPassword: "ab",
    });
    expect(result.success).toBe(false);
  });
});

describe("organizationPinSchema", () => {
  it("accepts valid PIN (4-6 digits)", () => {
    expect(
      organizationPinSchema.safeParse({
        organizationId: "org-1",
        pin: "1234",
        confirmPin: "1234",
      }).success,
    ).toBe(true);
  });

  it("rejects non-matching PINs", () => {
    expect(
      organizationPinSchema.safeParse({
        organizationId: "org-1",
        pin: "1234",
        confirmPin: "5678",
      }).success,
    ).toBe(false);
  });

  it("rejects non-numeric PIN", () => {
    expect(
      organizationPinSchema.safeParse({
        organizationId: "org-1",
        pin: "abcd",
        confirmPin: "abcd",
      }).success,
    ).toBe(false);
  });

  it("rejects PIN with wrong length (2 digits)", () => {
    expect(
      organizationPinSchema.safeParse({
        organizationId: "org-1",
        pin: "12",
        confirmPin: "12",
      }).success,
    ).toBe(false);
  });
});
