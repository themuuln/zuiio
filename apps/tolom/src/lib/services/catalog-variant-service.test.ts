import { describe, expect, it } from "vitest";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import { getVariantGroups } from "./catalog-variant-service";

describe("catalog-variant-service", () => {
  describe("getVariantGroups", () => {
    it("returns variant groups", async () => {
      const mockSupabase = createMockSupabaseClient();
      const groups = [
        { id: "g1", name: "Size", applies_to: "service" },
        { id: "g2", name: "Grade", applies_to: "part" },
      ];
      mockSupabase.__qb.resolveWith({ data: groups, error: null });

      const result = await getVariantGroups(mockSupabase as any, "org-1");
      expect(Array.isArray(result)).toBe(true);
    });

    it("returns empty array when no groups", async () => {
      const mockSupabase = createMockSupabaseClient();
      mockSupabase.__qb.resolveWith({ data: null, error: null });

      const result = await getVariantGroups(mockSupabase as any, "org-1");
      expect(result).toEqual([]);
    });
  });
});
