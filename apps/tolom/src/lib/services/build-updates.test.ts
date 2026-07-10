import { describe, expect, it } from "vitest";
import { buildUpdates, type FieldMap } from "./build-updates";
import { trimField } from "./trim-field";

interface TestParams {
  name?: string;
  email?: string | null;
  age?: number;
  bio?: string | null;
}

describe("buildUpdates", () => {
  const fieldMap: FieldMap<TestParams> = {
    columns: {
      name: "name",
      email: "email",
      age: "age",
      bio: "bio",
    },
    transforms: {
      name: trimField,
      email: trimField,
      bio: trimField,
    },
  };

  it("skips undefined fields", () => {
    const result = buildUpdates({ name: "Alice" }, fieldMap);
    expect(result).toEqual({ name: "Alice" });
    expect(result).not.toHaveProperty("email");
    expect(result).not.toHaveProperty("age");
    expect(result).not.toHaveProperty("bio");
  });

  it("passes null through without transform", () => {
    // Setting email to null should clear it in the DB
    const result = buildUpdates({ name: "Alice", email: null }, fieldMap);
    expect(result).toEqual({ name: "Alice", email: null });
  });

  it("trims string values", () => {
    const result = buildUpdates(
      { name: "  Alice  ", email: " alice@test.com " },
      fieldMap,
    );
    expect(result).toEqual({
      name: "Alice",
      email: "alice@test.com",
    });
  });

  it("converts empty string to null", () => {
    const result = buildUpdates({ name: "Alice", email: "" }, fieldMap);
    expect(result).toEqual({ name: "Alice", email: null });
  });

  it("handles all-null values (clearing fields)", () => {
    const result = buildUpdates({ name: "Alice", bio: null }, fieldMap);
    expect(result).toEqual({ name: "Alice", bio: null });
  });

  it("handles number fields without transforms", () => {
    const result = buildUpdates({ age: 25 }, fieldMap);
    expect(result).toEqual({ age: 25 });
  });

  it("handles empty params object", () => {
    const result = buildUpdates({}, fieldMap);
    expect(result).toEqual({});
  });

  it("handles mixed undefined, null, and string values", () => {
    const result = buildUpdates(
      {
        name: "  Bob  ",
        email: null,
        bio: "  hello world  ",
      },
      fieldMap,
    );
    expect(result).toEqual({
      name: "Bob",
      email: null,
      bio: "hello world",
    });
  });

  it("never crashes on null values", () => {
    // This is the critical test that catches the bug pattern
    // that was duplicated across 9 service files
    const testFieldMap: FieldMap<Record<string, string | null | undefined>> = {
      columns: { name: "name", email: "email", bio: "bio" },
      transforms: { name: trimField, email: trimField, bio: trimField },
    };
    const nullCases: Record<string, string | null | undefined>[] = [
      { name: null },
      { name: null, email: null },
      { name: "Test", bio: null },
      { bio: null },
    ];

    for (const params of nullCases) {
      expect(() => buildUpdates(params, testFieldMap)).not.toThrow();
    }
  });

  it("never crashes on empty-string values", () => {
    const testFieldMap: FieldMap<Record<string, string | undefined>> = {
      columns: { name: "name", email: "email", bio: "bio" },
      transforms: { name: trimField, email: trimField, bio: trimField },
    };
    const emptyCases: Record<string, string | undefined>[] = [
      { name: "" },
      { name: "", email: "" },
      { name: "Test", bio: "" },
    ];

    for (const params of emptyCases) {
      expect(() => buildUpdates(params, testFieldMap)).not.toThrow();
    }
  });
});
