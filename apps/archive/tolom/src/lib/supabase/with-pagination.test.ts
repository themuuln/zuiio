import { describe, expect, it, vi } from "vitest";
import { withPagination } from "./with-pagination";

describe("withPagination", () => {
  it("calls range with correct from/to for page 1", () => {
    const range = vi.fn().mockReturnValue("paged-query");
    const result = withPagination({ range } as any, 1, 20);
    expect(range).toHaveBeenCalledWith(0, 19);
    expect(result).toBe("paged-query");
  });

  it("calls range with correct from/to for page 2", () => {
    const range = vi.fn().mockReturnValue("paged-query");
    const result = withPagination({ range } as any, 2, 20);
    expect(range).toHaveBeenCalledWith(20, 39);
    expect(result).toBe("paged-query");
  });

  it("uses default page 1 and pageSize 20", () => {
    const range = vi.fn().mockReturnValue("paged-query");
    withPagination({ range } as any);
    expect(range).toHaveBeenCalledWith(0, 19);
  });

  it("handles custom page sizes", () => {
    const range = vi.fn().mockReturnValue("paged-query");
    withPagination({ range } as any, 3, 50);
    expect(range).toHaveBeenCalledWith(100, 149);
  });

  it("handles page 0 by clamping to page 1", () => {
    const range = vi.fn().mockReturnValue("paged-query");
    withPagination({ range } as any, 0, 20);
    expect(range).toHaveBeenCalledWith(0, 19);
  });
});
