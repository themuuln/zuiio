import assert from "node:assert/strict";
import test from "node:test";
import { toCsv } from "@/lib/csv";

// ─── toCsv ────────────────────────────────────────────────────────────

test("toCsv produces header and data rows", () => {
  const csv = toCsv(
    [{ name: "Alice", age: 30 }],
    [
      { header: "Name", key: "name" },
      { header: "Age", key: "age" },
    ],
  );
  assert.equal(csv, "Name,Age\nAlice,30");
});

test("toCsv handles null and undefined as empty", () => {
  const csv = toCsv(
    [{ name: "Alice", age: null }],
    [
      { header: "Name", key: "name" },
      { header: "Age", key: "age" },
    ],
  );
  assert.equal(csv, "Name,Age\nAlice,");
});

test("toCsv escapes commas with quotes", () => {
  const csv = toCsv(
    [{ name: "Alice, Inc.", age: 30 }],
    [
      { header: "Name", key: "name" },
      { header: "Age", key: "age" },
    ],
  );
  assert.equal(csv, 'Name,Age\n"Alice, Inc.",30');
});

// ─── CSV Formula Injection Prevention ────────────────────────────────

test("toCsv sanitizes leading = to prevent formula injection", () => {
  const csv = toCsv(
    [{ name: "=SUM(A1:A10)", age: 30 }],
    [
      { header: "Name", key: "name" },
      { header: "Age", key: "age" },
    ],
  );
  assert.equal(csv, "Name,Age\n'=SUM(A1:A10),30");
});

test("toCsv sanitizes leading + to prevent formula injection", () => {
  const csv = toCsv(
    [{ name: "+12345", age: 30 }],
    [
      { header: "Name", key: "name" },
      { header: "Age", key: "age" },
    ],
  );
  assert.equal(csv, "Name,Age\n'+12345,30");
});

test("toCsv sanitizes leading - to prevent formula injection", () => {
  const csv = toCsv(
    [{ name: "-1+2", age: 30 }],
    [
      { header: "Name", key: "name" },
      { header: "Age", key: "age" },
    ],
  );
  assert.equal(csv, "Name,Age\n'-1+2,30");
});

test("toCsv sanitizes leading @ to prevent formula injection", () => {
  const csv = toCsv(
    [{ name: "@SUM(A1)", age: 30 }],
    [
      { header: "Name", key: "name" },
      { header: "Age", key: "age" },
    ],
  );
  assert.equal(csv, "Name,Age\n'@SUM(A1),30");
});

test("toCsv does not modify normal entries that start with safe chars", () => {
  const csv = toCsv(
    [{ name: "Alice", age: 30 }],
    [
      { header: "Name", key: "name" },
      { header: "Age", key: "age" },
    ],
  );
  assert.equal(csv, "Name,Age\nAlice,30");
});

test("toCsv preserves numbers that look like formulas in the middle of text", () => {
  const csv = toCsv(
    [{ name: "score=-1", age: 30 }],
    [
      { header: "Name", key: "name" },
      { header: "Age", key: "age" },
    ],
  );
  // = is not at the start, so no sanitization
  assert.equal(csv, "Name,Age\nscore=-1,30");
});
