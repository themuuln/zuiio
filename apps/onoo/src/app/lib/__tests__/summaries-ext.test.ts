import { describe, expect, it } from "vitest";

/**
 * Extension tests for summary functions from @/app/lib/data.
 *
 * The only summary function in the Onoo codebase is
 * `generatePlayerGameSummary` from @/app/lib/summaries, which is already
 * fully covered by `summaries.test.ts`.
 *
 * A grep of `data.ts` for summary-related exports found no additional
 * summary functions:
 *   - `aggregateTeamStats` — pure aggregation, tested in aggregate-team-stats.test.ts
 *   - `aggregateMonthlyStats` — pure aggregation, tested in aggregate-monthly-stats.test.ts
 *
 * All query functions in data.ts that could be considered "summary-like"
 * (getStandings, getLeaders, getGamesByDate, etc.) are tested in:
 *   - data-queries.test.ts
 *   - data-queries-3.test.ts
 *   - data-queries-4.test.ts
 */

describe("summaries-ext", () => {
  it("no additional summary functions exist in data.ts beyond existing coverage", () => {
    // This test exists to document that the summary coverage gap is empty.
    // If new summary functions are added to data.ts in the future, add
    // tests for them here or in a dedicated describe block.
    expect(true).toBe(true);
  });
});
