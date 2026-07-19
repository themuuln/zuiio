import assert from "node:assert/strict";
import test from "node:test";

// ---------------------------------------------------------------------------
// Fire-and-forget warning pattern
//
// In the codebase, server actions wrap side-effects (journal posting,
// invoice generation) in try/catch so the primary action still succeeds
// even if the side-effect fails.  The warning string is collected for
// the user but does NOT block the response.
//
// This file tests that conceptual contract:
//   - throwing function → returns warning string
//   - succeeding function → returns undefined
//   - warnings accumulate without short-circuiting
// ---------------------------------------------------------------------------

/**
 * Execute a side-effect function safely.  Returns a warning string on
 * failure, or undefined on success.  Mirrors the try/catch pattern
 * used across server actions (expenses, sales, purchases, shop).
 */
function runSideEffect(label: string, fn: () => void): string | undefined {
  try {
    fn();
    return undefined;
  } catch {
    return `${label} ажиллахад алдаа гарлаа.`;
  }
}

test("returns undefined when function succeeds", () => {
  const result = runSideEffect("journal_post", () => {
    /* no-op success */
  });
  assert.equal(result, undefined);
});

test("returns warning string when function throws", () => {
  const result = runSideEffect("journal_post", () => {
    throw new Error("db connection lost");
  });
  assert.ok(result, "should return a warning");
  // biome-ignore lint/style/noNonNullAssertion: assert.ok narrows, TS doesn't track it
  assert.match(result!, /journal_post/);
  assert.match(result!, /алдаа гарлаа/);
});

test("warnings accumulate without short-circuiting", () => {
  const warnings: string[] = [];

  // Simulate the pattern from shop/templates/actions.ts
  const sideEffects = [
    () =>
      runSideEffect("invoice_gen", () => {
        throw new Error("fail");
      }),
    () =>
      runSideEffect("journal_post", () => {
        /* ok */
      }),
    () =>
      runSideEffect("notification", () => {
        throw new Error("timeout");
      }),
  ];

  for (const run of sideEffects) {
    const warning = run();
    if (warning) warnings.push(warning);
  }

  assert.equal(warnings.length, 2, "two side-effects failed");
  assert.match(warnings[0], /invoice_gen/);
  assert.match(warnings[1], /notification/);
});

test("async variant works the same way", async () => {
  async function runSideEffectAsync(
    label: string,
    fn: () => Promise<void>,
  ): Promise<string | undefined> {
    try {
      await fn();
      return undefined;
    } catch {
      return `${label} ажиллахад алдаа гарлаа.`;
    }
  }

  const ok = await runSideEffectAsync("async_ok", async () => {});
  assert.equal(ok, undefined);

  const fail = await runSideEffectAsync("async_fail", async () => {
    throw new Error("network error");
  });
  assert.ok(fail);
  // biome-ignore lint/style/noNonNullAssertion: assert.ok narrows
  assert.match(fail!, /async_fail/);
});

test("original error is not exposed to the caller", () => {
  const result = runSideEffect("secret", () => {
    throw new Error("internal credentials leaked");
  });
  // Caller gets a user-friendly Mongolian string, not the raw error
  assert.ok(result);
  // biome-ignore lint/style/noNonNullAssertion: assert.ok narrows
  assert.doesNotMatch(result!, /credentials/);
});
