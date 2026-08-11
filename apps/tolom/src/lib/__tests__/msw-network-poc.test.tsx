import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { server } from "@/test/mocks/handlers";

/**
 * MSW network-level mocking POC.
 *
 * Proves requests flow through real fetch → MSW interception (no module-level
 * mocks of the query/client layer). This is the seed pattern for migrating
 * tests off chainable Supabase module mocks: mock the wire, not the client.
 */
describe("MSW network-level interception", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("serves the existing /api route handler over real fetch", async () => {
    const response = await fetch("/api/organizations/org-1/customers");

    expect(response.status).toBe(200);
    const body = await response.json();
    // The factory randomizes ids — assert the wire shape, not exact values.
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({ id: expect.any(String) });
  });

  it("fails loudly on unhandled requests instead of hitting the network", async () => {
    await expect(fetch("/api/does-not-exist")).rejects.toThrow();
  });
});
