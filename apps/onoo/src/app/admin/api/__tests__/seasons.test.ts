import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockParams, createMockRequest } from "@/test/mocks";

// ── Self-contained chainable mock ────────────────────────────────
// The shared supabase-mock has two bugs that prevent it from working
// with route handlers: (1) the second select() is async, breaking the
// chain, and (2) createMockSupabase({ user: null }) still yields a
// truthy user. We build a minimal working mock here instead.

type MockResult = { data: unknown; error: Error | null };

class ChainableMock {
  private result: MockResult;

  constructor(result: MockResult) {
    this.result = result;
  }

  select() {
    return this;
  }
  eq() {
    return this;
  }
  single() {
    return this;
  }
  order() {
    return this;
  }
  insert() {
    return this;
  }
  update() {
    return this;
  }
  delete() {
    return this;
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable Supabase query-builder mock
  then(onfulfilled?: (v: MockResult) => unknown) {
    return Promise.resolve(this.result).then(
      onfulfilled as (v: MockResult) => unknown,
    );
  }
}

function buildMockClient(
  result: MockResult,
  user: { id: string; email: string } | null = {
    id: "admin-user-id",
    email: "admin@onoo.mn",
  },
) {
  const mock = {
    _result: result,
    from: vi.fn(() => new ChainableMock(result)),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: user ? { user } : null },
        error: null,
      }),
    },
  };
  return mock;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import * as idRoute from "../seasons/[id]/route";
import * as listRoute from "../seasons/route";

const mockCreateClient = vi.mocked(createClient);

// ── Shared fixtures ──────────────────────────────────────────────

const season = {
  id: "s1",
  league_id: "l1",
  name: "2026 Season",
  starts_on: "2026-01-01",
  ends_on: "2026-12-31",
  leagues: { name: "Premier League" },
};

const season2 = {
  id: "s2",
  league_id: "l2",
  name: "2026 Season B",
  starts_on: "2026-06-01",
  ends_on: "2026-11-30",
  leagues: { name: "Division 1" },
};

function setupMock(
  data: unknown,
  error: Error | null = null,
  user?: { id: string; email: string } | null,
) {
  const result = { data, error };
  const client =
    user === undefined
      ? buildMockClient(result)
      : buildMockClient(result, user);
  mockCreateClient.mockResolvedValue(client as never);
  return client;
}

function setupUnauthMock() {
  return setupMock([], null, null);
}

// ── GET /admin/api/seasons ──────────────────────────────────────

describe("GET /admin/api/seasons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all seasons", async () => {
    setupMock([season, season2]);

    const request = createMockRequest(
      undefined,
      "http://localhost:3000/admin/api/seasons",
    );
    const response = await listRoute.GET(request as never);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(2);
    expect(data[0].id).toBe("s1");
    expect(data[1].id).toBe("s2");
  });

  it("filters by league_id when provided", async () => {
    setupMock([season]);

    const request = createMockRequest(
      undefined,
      "http://localhost:3000/admin/api/seasons?league_id=l1",
    );
    const response = await listRoute.GET(request as never);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(1);
    expect(data[0].league_id).toBe("l1");
  });

  it("returns 401 when unauthenticated", async () => {
    setupUnauthMock();

    const request = createMockRequest(
      undefined,
      "http://localhost:3000/admin/api/seasons",
    );
    const response = await listRoute.GET(request as never);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 500 on query error", async () => {
    setupMock(null, new Error("connection refused"));

    const request = createMockRequest(
      undefined,
      "http://localhost:3000/admin/api/seasons",
    );
    const response = await listRoute.GET(request as never);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("connection refused");
  });
});

// ── POST /admin/api/seasons ─────────────────────────────────────

describe("POST /admin/api/seasons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a season with valid body", async () => {
    setupMock(season);

    const request = createMockRequest(
      {
        league_id: "l1",
        name: "2026 Season",
        starts_on: "2026-01-01",
        ends_on: "2026-12-31",
      },
      "http://localhost:3000/admin/api/seasons",
      "POST",
    );
    const response = await listRoute.POST(request as never);

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.name).toBe("2026 Season");
    expect(data.league_id).toBe("l1");
  });

  it("defaults starts_on and ends_on to null when omitted", async () => {
    setupMock({
      id: "s3",
      league_id: "l1",
      name: "Short Season",
      starts_on: null,
      ends_on: null,
      leagues: null,
    });

    const request = createMockRequest(
      { league_id: "l1", name: "Short Season" },
      "http://localhost:3000/admin/api/seasons",
      "POST",
    );
    const response = await listRoute.POST(request as never);

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.name).toBe("Short Season");
  });

  it("returns 400 when league_id is missing", async () => {
    const request = createMockRequest(
      { name: "Season" },
      "http://localhost:3000/admin/api/seasons",
      "POST",
    );
    const response = await listRoute.POST(request as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("league_id and name are required");
  });

  it("returns 400 when name is missing", async () => {
    const request = createMockRequest(
      { league_id: "l1" },
      "http://localhost:3000/admin/api/seasons",
      "POST",
    );
    const response = await listRoute.POST(request as never);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("league_id and name are required");
  });

  it("returns 401 when unauthenticated", async () => {
    setupUnauthMock();

    const request = createMockRequest(
      { league_id: "l1", name: "Season" },
      "http://localhost:3000/admin/api/seasons",
      "POST",
    );
    const response = await listRoute.POST(request as never);

    expect(response.status).toBe(401);
  });

  it("returns 500 on insert error", async () => {
    setupMock(null, new Error("insert failed"));

    const request = createMockRequest(
      { league_id: "l1", name: "Season" },
      "http://localhost:3000/admin/api/seasons",
      "POST",
    );
    const response = await listRoute.POST(request as never);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("insert failed");
  });
});

// ── GET /admin/api/seasons/[id] ─────────────────────────────────

describe("GET /admin/api/seasons/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a single season by id", async () => {
    setupMock(season);

    const request = createMockRequest(
      undefined,
      "http://localhost:3000/admin/api/seasons/s1",
    );
    const response = await idRoute.GET(request as never, {
      params: createMockParams("s1"),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe("s1");
    expect(data.name).toBe("2026 Season");
  });

  it("returns 401 when unauthenticated", async () => {
    setupUnauthMock();

    const request = createMockRequest(
      undefined,
      "http://localhost:3000/admin/api/seasons/s1",
    );
    const response = await idRoute.GET(request as never, {
      params: createMockParams("s1"),
    });

    expect(response.status).toBe(401);
  });

  it("returns 500 when season is not found", async () => {
    setupMock(null, new Error("Row not found"));

    const request = createMockRequest(
      undefined,
      "http://localhost:3000/admin/api/seasons/nonexistent",
    );
    const response = await idRoute.GET(request as never, {
      params: createMockParams("nonexistent"),
    });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Row not found");
  });
});

// ── PUT /admin/api/seasons/[id] ─────────────────────────────────

describe("PUT /admin/api/seasons/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a season", async () => {
    const updated = { ...season, name: "2026 Updated Season" };
    setupMock(updated);

    const request = createMockRequest(
      { name: "2026 Updated Season" },
      "http://localhost:3000/admin/api/seasons/s1",
      "PUT",
    );
    const response = await idRoute.PUT(request as never, {
      params: createMockParams("s1"),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.name).toBe("2026 Updated Season");
    expect(data.id).toBe("s1");
  });

  it("returns 401 when unauthenticated", async () => {
    setupUnauthMock();

    const request = createMockRequest(
      { name: "Updated" },
      "http://localhost:3000/admin/api/seasons/s1",
      "PUT",
    );
    const response = await idRoute.PUT(request as never, {
      params: createMockParams("s1"),
    });

    expect(response.status).toBe(401);
  });

  it("returns 500 on update error", async () => {
    setupMock(null, new Error("update failed"));

    const request = createMockRequest(
      { name: "Update" },
      "http://localhost:3000/admin/api/seasons/s1",
      "PUT",
    );
    const response = await idRoute.PUT(request as never, {
      params: createMockParams("s1"),
    });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("update failed");
  });
});

// ── DELETE /admin/api/seasons/[id] ──────────────────────────────

describe("DELETE /admin/api/seasons/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a season and returns 204", async () => {
    setupMock(null);

    const request = createMockRequest(
      undefined,
      "http://localhost:3000/admin/api/seasons/s1",
      "DELETE",
    );
    const response = await idRoute.DELETE(request as never, {
      params: createMockParams("s1"),
    });

    expect(response.status).toBe(204);
  });

  it("returns 401 when unauthenticated", async () => {
    setupUnauthMock();

    const request = createMockRequest(
      undefined,
      "http://localhost:3000/admin/api/seasons/s1",
      "DELETE",
    );
    const response = await idRoute.DELETE(request as never, {
      params: createMockParams("s1"),
    });

    expect(response.status).toBe(401);
  });

  it("returns 500 on delete error", async () => {
    setupMock(null, new Error("delete failed"));

    const request = createMockRequest(
      undefined,
      "http://localhost:3000/admin/api/seasons/s1",
      "DELETE",
    );
    const response = await idRoute.DELETE(request as never, {
      params: createMockParams("s1"),
    });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("delete failed");
  });
});
