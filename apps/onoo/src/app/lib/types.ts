/**
 * Local type shim for @zuiio/core sports types.
 *
 * The workspace root packages/core shadows apps/onoo/packages/core for
 * @zuiio/core resolution. Import directly from the Onoo core source
 * until the workspace is restructured.
 */
export type {
  Game,
  GamePlayerStats,
  GameStatus,
  Player,
  SeasonPlayerStats,
  Standings,
  Team,
  Venue,
} from "../../../packages/core/src/types/index";
