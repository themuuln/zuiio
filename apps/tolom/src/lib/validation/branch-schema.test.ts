import { describe, expect, it } from "vitest";
import { branchSchema, quickBranchSchema } from "./branch-schema";

describe("branchSchema", () => {
  it("accepts valid branch", () => {
    expect(
      branchSchema.safeParse({
        name: "Main Branch",
        email: "branch@example.com",
      }).success,
    ).toBe(true);
  });

  it("accepts branch with phone and address", () => {
    expect(
      branchSchema.safeParse({
        name: "Branch 2",
        address: "SBD 1-r horoo",
        phone: "99112233",
        email: "b2@example.com",
      }).success,
    ).toBe(true);
  });

  it("rejects empty name", () => {
    const result = branchSchema.safeParse({ name: "", email: "test@test.com" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = branchSchema.safeParse({
      name: "Branch",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty email string", () => {
    expect(branchSchema.safeParse({ name: "Branch", email: "" }).success).toBe(
      true,
    );
  });

  it("rejects missing name", () => {
    expect(branchSchema.safeParse({ email: "test@test.com" }).success).toBe(
      false,
    );
  });
  it("accepts missing email (email is optional)", () => {
    expect(branchSchema.safeParse({ name: "Branch" }).success).toBe(true);
  });
});

describe("quickBranchSchema", () => {
  it("accepts valid quick branch", () => {
    expect(
      quickBranchSchema.safeParse({
        name: "Quick Branch",
        email: "quick@example.com",
      }).success,
    ).toBe(true);
  });

  it("rejects empty name", () => {
    expect(
      quickBranchSchema.safeParse({ name: "", email: "q@example.com" }).success,
    ).toBe(false);
  });
});
