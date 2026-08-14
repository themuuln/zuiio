import assert from "node:assert/strict";
import test from "node:test";
import {
  validateLoginInput,
  validateOrganizationInput,
  validatePasswordResetRequestInput,
  validatePasswordUpdateInput,
  validateRegistrationInput,
} from "@/lib/domain-rules";
import {
  getString,
  normalizePhone,
  requireEmail,
  requirePassword,
} from "@/lib/validation";

// ─── requireEmail ─────────────────────────────────────────────────────

test("requireEmail rejects empty string", () => {
  assert.equal(requireEmail(""), false);
});

test("requireEmail rejects missing @", () => {
  assert.equal(requireEmail("notanemail"), false);
});

test("requireEmail rejects missing domain", () => {
  assert.equal(requireEmail("user@"), false);
});

test("requireEmail rejects missing username", () => {
  assert.equal(requireEmail("@domain.com"), false);
});

test("requireEmail allows double dots in domain (regex limitation)", () => {
  // The regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/ doesn't detect double dots
  assert.equal(requireEmail("user@domain..com"), true);
});

test("requireEmail rejects spaces in email", () => {
  assert.equal(requireEmail("user @domain.com"), false);
});

test("requireEmail accepts valid email", () => {
  assert.equal(requireEmail("test@example.com"), true);
});

test("requireEmail accepts email with subdomain", () => {
  assert.equal(requireEmail("user@sub.example.com"), true);
});

test("requireEmail accepts email with plus sign", () => {
  assert.equal(requireEmail("user+tag@example.com"), true);
});

test("requireEmail accepts email with numbers", () => {
  assert.equal(requireEmail("user123@example.com"), true);
});

// ─── requirePassword ──────────────────────────────────────────────────

test("requirePassword rejects empty password", () => {
  assert.equal(requirePassword(""), false);
});

test("requirePassword rejects short password (7 chars)", () => {
  assert.equal(requirePassword("1234567"), false);
});

test("requirePassword accepts 8 character password", () => {
  assert.equal(requirePassword("12345678"), true);
});

test("requirePassword accepts longer password", () => {
  assert.equal(requirePassword("verylongpassword123"), true);
});

test("requirePassword accepts special characters", () => {
  assert.equal(requirePassword("pass!@#$%^&"), true);
});

// ─── normalizePhone ───────────────────────────────────────────────────

test("normalizePhone removes spaces", () => {
  assert.equal(normalizePhone("9911 2233"), "99112233");
});

test("normalizePhone removes dashes", () => {
  assert.equal(normalizePhone("9911-2233"), "99112233");
});

test("normalizePhone removes both spaces and dashes", () => {
  assert.equal(normalizePhone("9911-22 33"), "99112233");
});

test("normalizePhone returns unchanged when no formatting", () => {
  assert.equal(normalizePhone("99112233"), "99112233");
});

test("normalizePhone handles empty string", () => {
  assert.equal(normalizePhone(""), "");
});

// ─── getString ────────────────────────────────────────────────────────

test("getString extracts string value from FormData", () => {
  const formData = new FormData();
  formData.append("name", "  Тест нэр  ");
  assert.equal(getString(formData, "name"), "Тест нэр");
});

test("getString returns empty string for missing key", () => {
  const formData = new FormData();
  assert.equal(getString(formData, "nonexistent"), "");
});

test("getString returns empty string for non-string value", () => {
  const formData = new FormData();
  // Blob is not a string
  formData.append("file", new Blob(["test"]));
  assert.equal(getString(formData, "file"), "");
});

// ─── validateRegistrationInput ────────────────────────────────────────

test("validateRegistrationInput rejects empty fullName", () => {
  assert.equal(
    validateRegistrationInput({
      fullName: "",
      email: "test@example.com",
      password: "password123",
    }),
    "Нэр дор хаяж 2 тэмдэгттэй байх ёстой.",
  );
});

test("validateRegistrationInput rejects single character name", () => {
  assert.equal(
    validateRegistrationInput({
      fullName: "А",
      email: "test@example.com",
      password: "password123",
    }),
    "Нэр дор хаяж 2 тэмдэгттэй байх ёстой.",
  );
});

test("validateRegistrationInput rejects whitespace-only name", () => {
  assert.equal(
    validateRegistrationInput({
      fullName: "   ",
      email: "test@example.com",
      password: "password123",
    }),
    "Нэр дор хаяж 2 тэмдэгттэй байх ёстой.",
  );
});

test("validateRegistrationInput rejects invalid email", () => {
  assert.equal(
    validateRegistrationInput({
      fullName: "Тест Хэрэглэгч",
      email: "notanemail",
      password: "password123",
    }),
    "Зөв имэйл хаяг оруулна уу.",
  );
});

test("validateRegistrationInput rejects short password", () => {
  assert.equal(
    validateRegistrationInput({
      fullName: "Тест Хэрэглэгч",
      email: "test@example.com",
      password: "12345",
    }),
    "Нууц үг дор хаяж 8 тэмдэгттэй байх ёстой.",
  );
});

test("validateRegistrationInput validates name before email and password", () => {
  // Name validation should be checked first
  assert.equal(
    validateRegistrationInput({
      fullName: "",
      email: "invalid",
      password: "short",
    }),
    "Нэр дор хаяж 2 тэмдэгттэй байх ёстой.",
  );
});

test("validateRegistrationInput validates email before password", () => {
  assert.equal(
    validateRegistrationInput({
      fullName: "Тест Хэрэглэгч",
      email: "invalid",
      password: "short",
    }),
    "Зөв имэйл хаяг оруулна уу.",
  );
});

test("validateRegistrationInput accepts valid input", () => {
  assert.equal(
    validateRegistrationInput({
      fullName: "Тест Хэрэглэгч",
      email: "test@example.com",
      password: "password123",
    }),
    null,
  );
});

test("validateRegistrationInput accepts two-character name", () => {
  assert.equal(
    validateRegistrationInput({
      fullName: "Болд",
      email: "bold@example.com",
      password: "password123",
    }),
    null,
  );
});

// ─── validateLoginInput ───────────────────────────────────────────────

test("validateLoginInput rejects empty email", () => {
  assert.equal(
    validateLoginInput({ email: "", password: "password123" }),
    "Зөв имэйл хаяг оруулна уу.",
  );
});

test("validateLoginInput rejects invalid email", () => {
  assert.equal(
    validateLoginInput({ email: "notanemail", password: "password123" }),
    "Зөв имэйл хаяг оруулна уу.",
  );
});

test("validateLoginInput rejects empty password", () => {
  assert.equal(
    validateLoginInput({ email: "test@example.com", password: "" }),
    "Нууц үгээ оруулна уу.",
  );
});

test("validateLoginInput rejects whitespace-only password", () => {
  assert.equal(
    validateLoginInput({ email: "test@example.com", password: "   " }),
    "Нууц үгээ оруулна уу.",
  );
});

test("validateLoginInput validates email before password", () => {
  assert.equal(
    validateLoginInput({ email: "", password: "" }),
    "Зөв имэйл хаяг оруулна уу.",
  );
});

test("validateLoginInput accepts valid input", () => {
  assert.equal(
    validateLoginInput({ email: "test@example.com", password: "mypassword" }),
    null,
  );
});

// ─── validatePasswordResetRequestInput ────────────────────────────────

test("validatePasswordResetRequestInput rejects empty email", () => {
  assert.equal(
    validatePasswordResetRequestInput({ email: "" }),
    "Зөв имэйл хаяг оруулна уу.",
  );
});

test("validatePasswordResetRequestInput rejects invalid email", () => {
  assert.equal(
    validatePasswordResetRequestInput({ email: "invalid" }),
    "Зөв имэйл хаяг оруулна уу.",
  );
});

test("validatePasswordResetRequestInput accepts valid email", () => {
  assert.equal(
    validatePasswordResetRequestInput({ email: "user@example.com" }),
    null,
  );
});

// ─── validatePasswordUpdateInput ──────────────────────────────────────

test("validatePasswordUpdateInput rejects short password", () => {
  assert.equal(
    validatePasswordUpdateInput({
      password: "12345",
      confirmPassword: "12345",
    }),
    "Нууц үг дор хаяж 8 тэмдэгттэй байх ёстой.",
  );
});

test("validatePasswordUpdateInput rejects mismatched passwords", () => {
  assert.equal(
    validatePasswordUpdateInput({
      password: "password123",
      confirmPassword: "different456",
    }),
    "Нууц үг таарахгүй байна.",
  );
});

test("validatePasswordUpdateInput validates password length before mismatch", () => {
  assert.equal(
    validatePasswordUpdateInput({
      password: "short",
      confirmPassword: "short",
    }),
    "Нууц үг дор хаяж 8 тэмдэгттэй байх ёстой.",
  );
});

test("validatePasswordUpdateInput accepts valid matching passwords", () => {
  assert.equal(
    validatePasswordUpdateInput({
      password: "newpassword123",
      confirmPassword: "newpassword123",
    }),
    null,
  );
});

// ─── validateOrganizationInput ────────────────────────────────────────

test("validateOrganizationInput rejects short name (< 2 chars)", () => {
  assert.equal(
    validateOrganizationInput({ name: "А", slug: "my-org" }),
    "Байгууллагын нэр дор хаяж 2 тэмдэгттэй байна.",
  );
});

test("validateOrganizationInput rejects empty name", () => {
  assert.equal(
    validateOrganizationInput({ name: "", slug: "my-org" }),
    "Байгууллагын нэр дор хаяж 2 тэмдэгттэй байна.",
  );
});

test("validateOrganizationInput rejects short slug (< 3 chars)", () => {
  assert.equal(
    validateOrganizationInput({ name: "My Org", slug: "ab" }),
    "Холбоос дор хаяж 3 тэмдэгттэй байна.",
  );
});

test("validateOrganizationInput validates name before slug", () => {
  assert.equal(
    validateOrganizationInput({ name: "", slug: "" }),
    "Байгууллагын нэр дор хаяж 2 тэмдэгттэй байна.",
  );
});

test("validateOrganizationInput accepts valid input", () => {
  assert.equal(
    validateOrganizationInput({ name: "Миний Байгууллага", slug: "my-org" }),
    null,
  );
});
