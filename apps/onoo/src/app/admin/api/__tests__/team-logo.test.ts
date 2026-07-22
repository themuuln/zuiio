import { beforeEach, describe, expect, it, vi } from "vitest";

// Mutable auth state per test
let currentAuthUser: { id: string; email: string } | null = {
  id: "admin-user-id",
  email: "admin@onoo.mn",
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => {
    const user = currentAuthUser;

    // Mock storage with chainable .from() => .upload() / .getPublicUrl()
    const mockStorageFrom = {
      upload: vi.fn().mockResolvedValue({ data: {} as never, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: "https://storage.example.com/team-logos/test.png" },
      }),
    };

    const mockFromUpdate = {
      eq: vi.fn().mockResolvedValue({ data: {} as never, error: null }),
    };

    const mock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: user ? { id: user.id, email: user.email } : null },
          error: null,
        }),
      },
      storage: {
        from: vi.fn(() => mockStorageFrom),
      },
      from: vi.fn(() => ({
        update: vi.fn(() => mockFromUpdate),
      })),
    };

    return mock as never;
  }),
}));

import { POST } from "../teams/[id]/logo/route";

/**
 * Mock FormData that works in Node.js.
 * The real File/FormData combo has issues with undici's webidl validation.
 */
class MockFormData {
  private entries: Array<
    [
      string,
      {
        name: string;
        type: string;
        size: number;
        stream: () => ReadableStream;
      },
    ]
  > = [];

  append(key: string, file: { name: string; type: string; size: number }) {
    this.entries.push([
      key,
      {
        name: file.name,
        type: file.type,
        size: file.size,
        stream: () => new ReadableStream(),
      },
    ]);
  }

  get(key: string) {
    const entry = this.entries.find(([k]) => k === key);
    return entry ? entry[1] : null;
  }

  getAll(key: string) {
    return this.entries.filter(([k]) => k === key).map(([, v]) => v);
  }

  has(key: string) {
    return this.entries.some(([k]) => k === key);
  }
}

/**
 * Create a mock Request for the logo upload endpoint.
 * Uses MockFormData instead of real FormData to avoid Node.js undici issues.
 */
function createMockLogoRequest(
  file: { name: string; type: string; size: number } | null,
  teamId = "team-1",
) {
  const formData = new MockFormData();
  if (file) {
    formData.append(
      "file",
      file as { name: string; type: string; size: number },
    );
  }

  return {
    formData: () => Promise.resolve(formData as unknown as FormData),
    json: () => Promise.resolve({}),
    method: "POST",
    headers: new Headers({ "Content-Type": "multipart/form-data" }),
    nextUrl: new URL(`http://localhost:3000/admin/api/teams/${teamId}/logo`),
  } as unknown as Request;
}

function createParams(teamId = "team-1") {
  return { params: Promise.resolve({ id: teamId }) };
}

function makeFile(name: string, type: string, size = 1024) {
  return { name, type, size };
}
describe("Team logo upload API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentAuthUser = { id: "admin-user-id", email: "admin@onoo.mn" };
  });

  it("returns 401 when user is not authenticated", async () => {
    currentAuthUser = null;
    const req = createMockLogoRequest(makeFile("logo.png", "image/png"));
    const response = await POST(req, createParams());
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when no file is provided", async () => {
    const req = createMockLogoRequest(null);
    const response = await POST(req, createParams());
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Файл оруулна уу");
  });

  it("returns 400 when file type is not allowed", async () => {
    const req = createMockLogoRequest(makeFile("doc.pdf", "application/pdf"));
    const response = await POST(req, createParams());
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("JPEG");
  });

  it("returns 400 when file exceeds 2MB", async () => {
    const req = createMockLogoRequest(
      makeFile("large.png", "image/png", 3 * 1024 * 1024),
    );
    const response = await POST(req, createParams());
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("2MB");
  });

  it("accepts PNG and returns logo_url", async () => {
    const req = createMockLogoRequest(makeFile("logo.png", "image/png"));
    const response = await POST(req, createParams());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.logo_url).toBeTruthy();
    expect(typeof body.logo_url).toBe("string");
  });

  it("accepts JPEG files", async () => {
    const req = createMockLogoRequest(makeFile("logo.jpg", "image/jpeg"));
    const response = await POST(req, createParams());
    expect(response.status).toBe(200);
  });

  it("accepts WebP files", async () => {
    const req = createMockLogoRequest(makeFile("logo.webp", "image/webp"));
    const response = await POST(req, createParams());
    expect(response.status).toBe(200);
  });

  it("rejects GIF files", async () => {
    const req = createMockLogoRequest(makeFile("logo.gif", "image/gif"));
    const response = await POST(req, createParams());
    expect(response.status).toBe(400);
  });
});
