import { describe, expect, it, vi } from "vitest";
import { withOrgScope } from "./with-org-scope";

describe("withOrgScope", () => {
  it("calls eq with organization_id", () => {
    const eq = vi.fn().mockReturnValue("result");
    const query = { eq };
    const result = withOrgScope(query, "org-123");
    expect(eq).toHaveBeenCalledWith("organization_id", "org-123");
    expect(result).toBe("result");
  });

  it("passes through the query type", () => {
    const eq = vi.fn().mockReturnValue("scoped-query");
    const result = withOrgScope({ eq } as any, "org-456");
    expect(result).toBe("scoped-query");
  });
});
