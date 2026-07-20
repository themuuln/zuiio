import { describe, expect, it } from "vitest";
import { quickCustomerSchema, customerSchema } from "./customer-schema";

describe("quickCustomerSchema", () => {
  it("accepts valid customer with phone", () => {
    expect(
      quickCustomerSchema.safeParse({
        firstName: "Bat",
        phone: "99112233",
        email: "",
      }).success,
    ).toBe(true);
  });

  it("defaults type to individual", () => {
    const result = quickCustomerSchema.safeParse({
      firstName: "Bat",
      phone: "99112233",
      email: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("individual");
    }
  });

  it("accepts company type", () => {
    expect(
      quickCustomerSchema.safeParse({
        type: "company",
        firstName: "Company",
        phone: "99112233",
        email: "",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid type", () => {
    expect(
      quickCustomerSchema.safeParse({
        type: "invalid",
        firstName: "Bat",
        phone: "99112233",
        email: "",
      }).success,
    ).toBe(false);
  });

  it("rejects empty firstName", () => {
    expect(
      quickCustomerSchema.safeParse({
        firstName: "",
        phone: "99112233",
        email: "",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid phone number", () => {
    expect(
      quickCustomerSchema.safeParse({
        firstName: "Bat",
        phone: "123",
        email: "",
      }).success,
    ).toBe(false);
  });

  it("accepts optional fields", () => {
    expect(
      quickCustomerSchema.safeParse({
        firstName: "Bat",
        phone: "99112233",
        email: "bat@example.com",
        address: "Ulaanbaatar",
        notes: "VIP customer",
      }).success,
    ).toBe(true);
  });
});

describe("customerSchema", () => {
  it("accepts full customer data", () => {
    expect(
      customerSchema.safeParse({
        firstName: "Bat",
        lastName: "Dorj",
        phone: "99112233",
        email: "bat@example.com",
        address: "SBD",
        notes: "Regular",
      }).success,
    ).toBe(true);
  });

  it("accepts minimal data (email only)", () => {
    expect(
      customerSchema.safeParse({ email: "" }).success,
    ).toBe(true);
  });

  it("accepts individual type default", () => {
    const result = customerSchema.safeParse({ email: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("individual");
    }
  });

  it("rejects invalid email", () => {
    expect(
      customerSchema.safeParse({ email: "bad-email" }).success,
    ).toBe(false);
  });
});
