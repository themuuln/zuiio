import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveDomainVerificationToken,
  expectedTxtValue,
  flattenTxtRecords,
  hasMatchingTxt,
} from "@/lib/domain-verify";

test("deriveDomainVerificationToken is deterministic for the same org", () => {
  const orgId = "organization-123";
  assert.equal(
    deriveDomainVerificationToken(orgId),
    deriveDomainVerificationToken(orgId),
  );
});

test("deriveDomainVerificationToken returns 12 hex characters", () => {
  const token = deriveDomainVerificationToken("organization-123");
  assert.match(token, /^[0-9a-f]{12}$/);
});

test("deriveDomainVerificationToken differs for different orgs", () => {
  assert.notEqual(
    deriveDomainVerificationToken("organization-123"),
    deriveDomainVerificationToken("organization-456"),
  );
});

test("expectedTxtValue prefixes the token with zer-verify=", () => {
  assert.equal(expectedTxtValue("abc123def456"), "zer-verify=abc123def456");
});

test("flattenTxtRecords joins chunk arrays into one string per record", () => {
  assert.deepEqual(
    flattenTxtRecords([["zer-verify=abc"], ["chunk1", "chunk2"]]),
    ["zer-verify=abc", "chunk1chunk2"],
  );
});

test("flattenTxtRecords returns empty array for no records", () => {
  assert.deepEqual(flattenTxtRecords([]), []);
});

test("hasMatchingTxt matches an exact record", () => {
  const records = [["google-site-verification=xyz"], ["zer-verify=abc123"]];
  assert.equal(hasMatchingTxt(records, "zer-verify=abc123"), true);
});

test("hasMatchingTxt matches across a split chunk array", () => {
  const records = [["zer-verify=", "abc123"]];
  assert.equal(hasMatchingTxt(records, "zer-verify=abc123"), true);
});

test("hasMatchingTxt trims surrounding whitespace", () => {
  const records = [["  zer-verify=abc123  "]];
  assert.equal(hasMatchingTxt(records, "zer-verify=abc123"), true);
});

test("hasMatchingTxt does not match a substring-only record", () => {
  const records = [["prefix-zer-verify=abc123-suffix"]];
  assert.equal(hasMatchingTxt(records, "zer-verify=abc123"), false);
});

test("hasMatchingTxt returns false when no record matches", () => {
  const records = [["zer-verify=other"], ["google-site-verification=xyz"]];
  assert.equal(hasMatchingTxt(records, "zer-verify=abc123"), false);
});

test("hasMatchingTxt returns false for empty records", () => {
  assert.equal(hasMatchingTxt([], "zer-verify=abc123"), false);
});
