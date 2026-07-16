import assert from "node:assert/strict";
import test from "node:test";
import { setCaptureHandler, withDbCapture } from "@zuiio/capture";

// Track capture calls for assertion
let capturedCalls: Array<{ error: unknown; ctx?: Record<string, unknown> }> =
  [];

test.beforeEach(() => {
  capturedCalls = [];
  setCaptureHandler(async (error, ctx) => {
    capturedCalls.push({ error, ctx });
  });
});

test.afterEach(() => {
  setCaptureHandler(null);
});

test("returns data when query succeeds", async () => {
  const mockPromise = Promise.resolve({ data: { id: 1 }, error: null });
  const result = await withDbCapture("getProfile", mockPromise);

  assert.deepEqual(result.data, { id: 1 });
  assert.equal(result.error, null);
  assert.equal(capturedCalls.length, 0, "should not capture on success");
});

test("captures error when query returns error object", async () => {
  const queryError = { message: "relation not found", code: "42P01" };
  const mockPromise = Promise.resolve({ data: null, error: queryError });

  const result = await withDbCapture("getProfile", mockPromise);

  assert.equal(result.error, queryError, "should return the error");
  assert.equal(capturedCalls.length, 1, "should call capture once");
  assert.equal(capturedCalls[0].error, queryError);
});

test("passes context label through to capture", async () => {
  const queryError = { message: "timeout" };
  const mockPromise = Promise.resolve({ data: null, error: queryError });

  await withDbCapture("dashboard_load", mockPromise, { orgId: "org-123" });

  assert.equal(capturedCalls.length, 1);
  assert.equal(
    capturedCalls[0].ctx?.context,
    "[db] dashboard_load",
    "label should be prefixed with [db]",
  );
  assert.equal(capturedCalls[0].ctx?.orgId, "org-123");
});

test("captures thrown exceptions and returns null data", async () => {
  const exception = new Error("network timeout");
  const mockPromise = Promise.reject(exception) as PromiseLike<{
    data: unknown;
    error: unknown;
  }>;

  const result = await withDbCapture("fetchOrders", mockPromise);

  assert.equal(result.data, null, "data should be null on exception");
  assert.equal(result.error, exception, "error should be the exception");
  assert.equal(capturedCalls.length, 1);
  assert.equal(capturedCalls[0].ctx?.context, "[db] fetchOrders");
});

test("works without optional ctx parameter", async () => {
  const queryError = { message: "access denied" };
  const mockPromise = Promise.resolve({ data: null, error: queryError });

  await withDbCapture("noCtxLabel", mockPromise);

  assert.equal(capturedCalls.length, 1);
  assert.equal(capturedCalls[0].ctx?.context, "[db] noCtxLabel");
  assert.equal(
    capturedCalls[0].ctx?.orgId,
    undefined,
    "no orgId when ctx omitted",
  );
});
