import assert from "node:assert/strict";
import test from "node:test";
import {
  validateExpenseInput,
  validateLoginInput,
  validateOrganizationInput,
  validatePasswordResetRequestInput,
  validatePasswordUpdateInput,
  validateProductInput,
  validateRegistrationInput,
  validateSaleInput,
} from "@/lib/domain-rules";
import { sanitizeRedirectPath } from "@/lib/validation";

test("sanitizeRedirectPath keeps safe internal paths", () => {
  assert.equal(sanitizeRedirectPath("/sales/new"), "/sales/new");
  assert.equal(sanitizeRedirectPath("/"), "/");
});

test("sanitizeRedirectPath rejects external redirects", () => {
  assert.equal(sanitizeRedirectPath("https://evil.test"), "/");
  assert.equal(sanitizeRedirectPath("//evil.test"), "/");
  assert.equal(sanitizeRedirectPath("javascript:alert(1)"), "/");
});

test("validateRegistrationInput enforces full name, email, password", () => {
  assert.equal(
    validateRegistrationInput({
      fullName: "A",
      email: "valid@example.com",
      password: "password123",
    }),
    "Нэр дор хаяж 2 тэмдэгттэй байх ёстой.",
  );

  assert.equal(
    validateRegistrationInput({
      fullName: "Valid Name",
      email: "invalid",
      password: "password123",
    }),
    "Зөв имэйл хаяг оруулна уу.",
  );

  assert.equal(
    validateRegistrationInput({
      fullName: "Valid Name",
      email: "valid@example.com",
      password: "short",
    }),
    "Нууц үг дор хаяж 8 тэмдэгттэй байх ёстой.",
  );

  assert.equal(
    validateRegistrationInput({
      fullName: "Valid Name",
      email: "valid@example.com",
      password: "password123",
    }),
    null,
  );
});

test("validateLoginInput enforces email and password rules", () => {
  assert.equal(
    validateLoginInput({
      email: "invalid",
      password: "password123",
    }),
    "Зөв имэйл хаяг оруулна уу.",
  );
  assert.equal(
    validateLoginInput({
      email: "valid@example.com",
      password: "",
    }),
    "Нууц үгээ оруулна уу.",
  );
  assert.equal(
    validateLoginInput({
      email: "valid@example.com",
      password: "short",
    }),
    null,
  );
  assert.equal(
    validateLoginInput({
      email: "valid@example.com",
      password: "password123",
    }),
    null,
  );
});

test("validatePasswordResetRequestInput accepts only valid email", () => {
  assert.equal(
    validatePasswordResetRequestInput({ email: "invalid" }),
    "Зөв имэйл хаяг оруулна уу.",
  );
  assert.equal(
    validatePasswordResetRequestInput({ email: "valid@example.com" }),
    null,
  );
});

test("validatePasswordUpdateInput enforces password length and confirmation", () => {
  assert.equal(
    validatePasswordUpdateInput({
      password: "short",
      confirmPassword: "short",
    }),
    "Нууц үг дор хаяж 8 тэмдэгттэй байх ёстой.",
  );
  assert.equal(
    validatePasswordUpdateInput({
      password: "password123",
      confirmPassword: "password456",
    }),
    "Нууц үг таарахгүй байна.",
  );
  assert.equal(
    validatePasswordUpdateInput({
      password: "password123",
      confirmPassword: "password123",
    }),
    null,
  );
});

test("validateOrganizationInput checks name and slug length", () => {
  assert.equal(
    validateOrganizationInput({ name: "A", slug: "good-slug" }),
    "Байгууллагын нэр дор хаяж 2 тэмдэгттэй байна.",
  );
  assert.equal(
    validateOrganizationInput({ name: "Shop", slug: "ab" }),
    "Холбоос дор хаяж 3 тэмдэгттэй байна.",
  );
  assert.equal(
    validateOrganizationInput({ name: "Shop", slug: "shop-1" }),
    null,
  );
});

test("validateProductInput rejects empty name and negative numeric values", () => {
  assert.equal(
    validateProductInput({
      name: "",
      costPrice: 0,
      salePrice: 0,
      currentStock: 0,
      minStock: 0,
    }),
    "Бүтээгдэхүүний нэр шаардлагатай.",
  );

  assert.equal(
    validateProductInput({
      name: "Tea",
      costPrice: -1,
      salePrice: 10,
      currentStock: 3,
      minStock: 1,
    }),
    "Үнэ болон үлдэгдлийн утгууд 0 эсвэл түүнээс их тоо байх ёстой.",
  );

  assert.equal(
    validateProductInput({
      name: "Tea",
      costPrice: 5,
      salePrice: 10,
      currentStock: 3,
      minStock: 1,
    }),
    null,
  );
});

test("validateExpenseInput enforces category and positive amount", () => {
  assert.equal(
    validateExpenseInput({ category: "", amount: 100 }),
    "Ангилал шаардлагатай.",
  );
  assert.equal(
    validateExpenseInput({ category: "Rent", amount: 0 }),
    "Зарлагын дүн 0-ээс их байх ёстой.",
  );
  assert.equal(validateExpenseInput({ category: "Rent", amount: 100 }), null);
});

test("validateSaleInput guards invalid quantity, price, and overpayment", () => {
  assert.equal(
    validateSaleInput({
      productId: "",
      quantity: 1,
      unitPrice: 100,
      paidAmount: 100,
      totalAmount: 100,
    }),
    "Бүтээгдэхүүн, тоо хэмжээ, үнэ зөв бөглөгдөх ёстой.",
  );

  assert.equal(
    validateSaleInput({
      productId: "product-1",
      quantity: 1,
      unitPrice: 100,
      paidAmount: 200,
      totalAmount: 100,
    }),
    "Төлсөн дүн 0-ээс их бөгөөд нийт дүнгээс хэтрэхгүй байна.",
  );

  assert.equal(
    validateSaleInput({
      productId: "product-1",
      quantity: 2,
      unitPrice: 100,
      paidAmount: 150,
      totalAmount: 200,
    }),
    null,
  );
});
