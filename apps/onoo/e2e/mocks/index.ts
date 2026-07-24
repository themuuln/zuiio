/**
 * Playwright route mocking helpers for Onoo E2E tests.
 *
 * Each function sets up a `page.route()` interceptor that returns fixture data
 * instead of hitting real Supabase. Fixtures are imported from ../fixtures.
 *
 * Usage in a test:
 *   test("shows players list", async ({ page }) => {
 *     await mockAdminPlayerList(page);
 *     await page.goto("/admin/players");
 *     // ... assertions against fixture data
 *   });
 */

import type { Page } from "@playwright/test";
import {
  type CompetitionFixture,
  type DashboardFixture,
  type GameFixture,
  type LeagueFixture,
  type PlayerFixture,
  type SeasonFixture,
  type SportFixture,
  type TeamFixture,
  type TeamSeasonFixture,
  type VenueFixture,
  competitionFixture,
  dashboardFixture,
  gameFixture,
  gameListFixture,
  leagueFixture,
  leagueListFixture,
  playerFixture,
  playerListFixture,
  seasonFixture,
  seasonListFixture,
  SEED,
  sportFixture,
  teamFixture,
  teamListFixture,
  teamSeasonFixture,
  venueFixture,
} from "../fixtures";


// ─── Helpers ──────────────────────────────────────────────────────────────

function ok(body: unknown) {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

function okData(data: unknown) {
  return ok({ data });
}

// ─── Sports ───────────────────────────────────────────────────────────────

/**
 * Mock GET /admin/api/sports
 */
export async function mockSports(page: Page, items?: SportFixture[]) {
  await page.route("**/admin/api/sports", (route) => {
    return route.fulfill(ok(items ?? [sportFixture()]));
  });
}

// ─── Leagues ──────────────────────────────────────────────────────────────

/**
 * Mock GET /admin/api/leagues
 */
export async function mockLeaguesList(
  page: Page,
  items?: LeagueFixture[],
) {
  await page.route("**/admin/api/leagues", (route) => {
    if (route.request().method() !== "GET") return route.continue();
    return route.fulfill(ok(items ?? leagueListFixture()));
  });
}

/**
 * Mock POST /admin/api/leagues (create)
 */
export async function mockLeaguesCreate(page: Page) {
  await page.route("**/admin/api/leagues", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill(
        ok(
          leagueFixture({
            id: "l-new-0000-0000-0000-000000000000",
            name: "Шинэ Лиг",
          }),
        ),
      );
    }
    return route.continue();
  });
}

/**
 * Mock PUT /admin/api/leagues/:id (update)
 */
export async function mockLeaguesUpdate(page: Page) {
  await page.route("**/admin/api/leagues/**", (route) => {
    if (route.request().method() === "PUT") {
      return route.fulfill(ok(leagueFixture()));
    }
    if (route.request().method() === "DELETE") {
      return route.fulfill(ok(null));
    }
    return route.continue();
  });
}

/**
 * Mock all league CRUD endpoints at once
 */
export async function mockLeaguesAll(page: Page) {
  await mockLeaguesList(page);
  await mockLeaguesCreate(page);
  await mockLeaguesUpdate(page);
}

// ─── Seasons ──────────────────────────────────────────────────────────────

/**
 * Mock GET /admin/api/seasons
 */
export async function mockSeasonsList(
  page: Page,
  items?: SeasonFixture[],
) {
  await page.route("**/admin/api/seasons*", (route) => {
    if (route.request().method() !== "GET") return route.continue();
    return route.fulfill(ok(items ?? seasonListFixture()));
  });
}

/**
 * Mock POST /admin/api/seasons (create)
 */
export async function mockSeasonsCreate(page: Page) {
  await page.route("**/admin/api/seasons", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill(ok(seasonFixture({ id: "se-new-season-id" })));
    }
    return route.continue();
  });
}

/**
 * Mock PUT /admin/api/seasons/:id and DELETE
 */
export async function mockSeasonsUpdate(page: Page) {
  await page.route("**/admin/api/seasons/**", (route) => {
    if (route.request().method() === "PUT") {
      return route.fulfill(ok(seasonFixture()));
    }
    if (route.request().method() === "DELETE") {
      return route.fulfill(ok(null));
    }
    return route.continue();
  });
}

/**
 * Mock all season CRUD endpoints at once
 */
export async function mockSeasonsAll(page: Page) {
  await mockSeasonsList(page);
  await mockSeasonsCreate(page);
  await mockSeasonsUpdate(page);
}

// ─── Teams ────────────────────────────────────────────────────────────────

/**
 * Mock GET /admin/api/teams
 */
export async function mockTeamsList(
  page: Page,
  items?: TeamFixture[],
) {
  await page.route("**/admin/api/teams*", (route) => {
    if (route.request().method() !== "GET") return route.continue();
    return route.fulfill(ok(items ?? teamListFixture()));
  });
}

/**
 * Mock POST /admin/api/teams (create)
 */
export async function mockTeamsCreate(page: Page) {
  await page.route("**/admin/api/teams", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill(ok(teamFixture({ id: "t-new-team-id" })));
    }
    return route.continue();
  });
}

/**
 * Mock PUT /admin/api/teams/:id and DELETE
 */
export async function mockTeamsUpdate(page: Page) {
  await page.route("**/admin/api/teams/**", (route) => {
    if (route.request().method() === "PUT") {
      return route.fulfill(ok(teamFixture()));
    }
    if (route.request().method() === "DELETE") {
      return route.fulfill(ok(null));
    }
    return route.continue();
  });
}

/**
 * Mock all team CRUD endpoints at once
 */
export async function mockTeamsAll(page: Page) {
  await mockTeamsList(page);
  await mockTeamsCreate(page);
  await mockTeamsUpdate(page);
}

// ─── Players ──────────────────────────────────────────────────────────────

/**
 * Mock GET /admin/api/players
 */
export async function mockPlayersList(
  page: Page,
  items?: PlayerFixture[],
) {
  await page.route("**/admin/api/players*", (route) => {
    if (route.request().method() !== "GET") return route.continue();
    return route.fulfill(ok(items ?? playerListFixture()));
  });
}

/**
 * Mock POST /admin/api/players (create)
 */
export async function mockPlayersCreate(page: Page) {
  await page.route("**/admin/api/players", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill(
        ok(
          playerFixture({
            id: "p-new-player-id",
            canonical_name: "Шинэ тоглогч",
          }),
        ),
      );
    }
    return route.continue();
  });
}

/**
 * Mock PUT /admin/api/players/:id and DELETE
 */
export async function mockPlayersUpdate(page: Page) {
  await page.route("**/admin/api/players/**", (route) => {
    if (route.request().method() === "PUT") {
      return route.fulfill(ok(playerFixture()));
    }
    if (route.request().method() === "DELETE") {
      return route.fulfill(ok(null));
    }
    return route.continue();
  });
}

/**
 * Mock all player CRUD endpoints at once
 */
export async function mockPlayersAll(page: Page) {
  await mockPlayersList(page);
  await mockPlayersCreate(page);
  await mockPlayersUpdate(page);
}

// ─── Games ────────────────────────────────────────────────────────────────

/**
 * Mock GET /admin/api/games
 */
export async function mockGamesList(
  page: Page,
  items?: GameFixture[],
) {
  await page.route("**/admin/api/games", (route) => {
    if (route.request().method() !== "GET") return route.continue();
    return route.fulfill(ok(items ?? gameListFixture()));
  });
}

/**
 * Mock GET /admin/api/games/:id (game detail)
 */
export async function mockGameDetail(
  page: Page,
  override?: Partial<GameFixture>,
) {
  await page.route("**/admin/api/games/*", (route) => {
    if (route.request().method() !== "GET") return route.continue();
    return route.fulfill(ok(gameFixture(override)));
  });
}

/**
 * Mock POST /admin/api/games (create)
 */
export async function mockGamesCreate(page: Page) {
  await page.route("**/admin/api/games", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill(ok(gameFixture({ id: "g-new-game-id" })));
    }
    return route.continue();
  });
}

/**
 * Mock PUT /admin/api/games/:id (status update)
 */
export async function mockGamesUpdate(page: Page) {
  await page.route("**/admin/api/games/**", (route) => {
    if (route.request().method() === "PUT") {
      return route.fulfill(ok(gameFixture()));
    }
    return route.continue();
  });
}

/**
 * Mock all game endpoints at once
 */
export async function mockGamesAll(page: Page) {
  await mockGamesList(page);
  await mockGamesCreate(page);
  await mockGamesUpdate(page);
}

// ─── Competitions ──────────────────────────────────────────────────────────

/**
 * Mock GET /admin/api/competitions
 */
export async function mockCompetitions(
  page: Page,
  items?: CompetitionFixture[],
) {
  await page.route("**/admin/api/competitions", (route) => {
    if (route.request().method() !== "GET") return route.continue();
    return route.fulfill(ok(items ?? [competitionFixture()]));
  });
}

// ─── Venues ────────────────────────────────────────────────────────────────

/**
 * Mock GET /admin/api/venues
 */
export async function mockVenues(
  page: Page,
  items?: VenueFixture[],
) {
  await page.route("**/admin/api/venues", (route) => {
    if (route.request().method() !== "GET") return route.continue();
    return route.fulfill(ok(items ?? [venueFixture()]));
  });
}

// ─── Team Seasons ──────────────────────────────────────────────────────────
/**
 * Mock GET /admin/api/team-seasons
 */
export async function mockTeamSeasons(
  page: Page,
  items?: TeamSeasonFixture[],
) {
  await page.route("**/admin/api/team-seasons*", (route) => {
    if (route.request().method() !== "GET") return route.continue();
    return route.fulfill(
      ok(items ?? [
        teamSeasonFixture(),
        teamSeasonFixture({
          team_id: SEED.teams.altan.id,
          teams: { name: "Алтан", short_code: "АЛТ" },
        }),
      ]),
    );
  });
}



// ─── Dashboard ─────────────────────────────────────────────────────────────

/**
 * Mock the admin dashboard (GET /admin/api/games shown on dashboard)
 */
export async function mockDashboard(
  page: Page,
  fixture?: Partial<DashboardFixture>,
) {
  const data = fixture ?? dashboardFixture();
  await page.route("**/admin/api/games", (route) => {
    if (route.request().method() !== "GET") return route.continue();
    return route.fulfill(ok(data.games));
  });
}

// ─── Supabase REST bypass ─────────────────────────────────────────────────

/**
 * Mock ALL Supabase REST calls — use as a safety net to ensure tests
 * never hit a real database. Override specific routes as needed.
 */
export async function mockSupabaseREST(page: Page) {
  await page.route("**/rest/v1/**", (route) => {
    return route.fulfill(ok([]));
  });
}

// ─── Admin Dashboard Mock All ──────────────────────────────────────────────

/**
 * Mock all admin endpoints that the dashboard page depends on.
 */
export async function mockAdminDashboard(page: Page) {
  await mockSupabaseREST(page);
  await mockDashboard(page);
}

/**
 * Mock all admin CRUD endpoints at once (for navigation tests etc.)
 */
export async function mockAdminAll(page: Page) {
  await mockSupabaseREST(page);
  await mockLeaguesAll(page);
  await mockSeasonsAll(page);
  await mockTeamsAll(page);
  await mockPlayersAll(page);
  await mockGamesAll(page);
  await mockCompetitions(page);
  await mockVenues(page);
  await mockTeamSeasons(page);
  await mockSports(page);
}
