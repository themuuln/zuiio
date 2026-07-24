/**
 * Game definitions for the game picker.
 * Each game defines metadata used for display and filtering.
 * Games are ordered by priority — party games first for the adult focus.
 */

export type GameTag =
  | "quick"
  | "strategic"
  | "luck-based"
  | "drinking"
  | "question"
  | "dare"
  | "after-dark"
  | "no-drink"
  | "card-game"
  | "team";

export interface GameDefinition {
  id: string;
  name: string;
  emoji: string;
  minPlayers: number;
  maxPlayers: number;
  estimatedTime: string;
  description: string;
  tags: GameTag[];
  /** Minimum vibe tier required to access this game's full content */
  minVibeTier?: "spicy" | "wild" | "after-dark";
}

export const AVAILABLE_GAMES: GameDefinition[] = [
  // ─── PARTY GAMES (Adult Focus) ───
  {
    id: "truth-or-dare",
    name: "Truth or Dare",
    emoji: "🎯",
    minPlayers: 2,
    maxPlayers: 20,
    estimatedTime: "15-45 min",
    description: "The classic party game for adults. Spicy truths, daring dares, and everything in between. Pick your path or drink!",
    tags: ["question", "dare", "drinking", "no-drink"],
  },
  {
    id: "never-have-i-ever",
    name: "Never Have I Ever",
    emoji: "🫣",
    minPlayers: 2,
    maxPlayers: 20,
    estimatedTime: "15-30 min",
    description: "Reveal secrets you've never told anyone. Confess what you've done and watch your friends' jaws drop. Drink if you've done it!",
    tags: ["question", "drinking", "quick", "no-drink"],
  },
  {
    id: "hot-takes",
    name: "Hot Takes",
    emoji: "🔥",
    minPlayers: 3,
    maxPlayers: 20,
    estimatedTime: "15-30 min",
    description: "Agree or disagree with spicy takes. See who in your group shares your (possibly unhinged) opinions. The minority drinks!",
    tags: ["question", "drinking", "quick", "no-drink"],
  },
  {
    id: "most-likely-to",
    name: "Most Likely To",
    emoji: "🎪",
    minPlayers: 3,
    maxPlayers: 20,
    estimatedTime: "15-30 min",
    description: "Who in this room is most likely to...? Vote anonymously and watch your friends get roasted. The winner drinks!",
    tags: ["question", "drinking", "quick", "no-drink"],
  },
  {
    id: "would-you-rather",
    name: "Would You Rather",
    emoji: "🤔",
    minPlayers: 2,
    maxPlayers: 20,
    estimatedTime: "10-25 min",
    description: "Two wild options, one choice. See how your friends think (or don't). Minority vote drinks!",
    tags: ["question", "drinking", "quick", "no-drink"],
  },
  {
    id: "paranoia",
    name: "Paranoia",
    emoji: "👁️",
    minPlayers: 3,
    maxPlayers: 12,
    estimatedTime: "15-30 min",
    description: "Everyone submits anonymous questions for one player. They answer truthfully or drink. The ultimate trust exercise.",
    tags: ["question", "drinking", "after-dark"],
  },
  {
    id: "you-laugh-you-drink",
    name: "You Laugh, You Drink",
    emoji: "😐",
    minPlayers: 3,
    maxPlayers: 12,
    estimatedTime: "15-30 min",
    description: "Make your target laugh without breaking character. If they laugh, they drink. If they stay stone-faced, you drink!",
    tags: ["dare", "drinking", "quick"],
  },
  {
    id: "dss",
    name: "Drunk, Stoned or Stupid",
    emoji: "🤡",
    minPlayers: 4,
    maxPlayers: 12,
    estimatedTime: "20-40 min",
    description: "A card describes a toxic trait — the group decides who fits best. First to 7 cards loses (and chugs). Roast your friends!",
    tags: ["question", "drinking", "dare"],
  },

  // ─── CLASSIC CARD GAMES ───
  {
    id: "uno",
    name: "UNO",
    emoji: "🃏",
    minPlayers: 2,
    maxPlayers: 10,
    estimatedTime: "15-30 min",
    description: "The classic card-matching game with an adult twist. Match colors and numbers, use action cards, and make your friends drink!",
    tags: ["card-game", "luck-based", "drinking", "no-drink"],
  },
];

/**
 * Filter games by the current number of players in the room.
 */
export function getGamesForPlayerCount(playerCount: number): GameDefinition[] {
  return AVAILABLE_GAMES.filter(
    (game) => playerCount >= game.minPlayers && playerCount <= game.maxPlayers
  );
}

/**
 * Filter games by vibe tier. Games with minVibeTier higher than the
 * current vibe are hidden from the game picker.
 */
export function getGamesForVibeTier(
  games: GameDefinition[],
  vibeTier: "spicy" | "wild" | "after-dark"
): GameDefinition[] {
  const tierOrder = ["spicy", "wild", "after-dark"];
  const currentTierIndex = tierOrder.indexOf(vibeTier);

  return games.filter((game) => {
    if (!game.minVibeTier) return true;
    const requiredIndex = tierOrder.indexOf(game.minVibeTier);
    return requiredIndex <= currentTierIndex;
  });
}

/**
 * Filter party games vs card games for prioritized display.
 */
export function getPartyGames(games: GameDefinition[]): GameDefinition[] {
  return games.filter((g) => g.tags.includes("question") || g.tags.includes("dare") || g.id === "you-laugh-you-drink");
}

export function getCardGames(games: GameDefinition[]): GameDefinition[] {
  return games.filter((g) => g.tags.includes("card-game"));
}

/**
 * Check if a mutual match exists — all non-spectator players
 * have voted "yes" on the same game.
 */
export function findMutualMatch(
  playerIds: string[],
  votes: Array<{
    player_id: string;
    game_type: string;
    vote: string;
  }>
): string | null {
  // For each game, check if all players voted "yes"
  const gameTypes = [...new Set(votes.map((v) => v.game_type))];

  for (const gameType of gameTypes) {
    const gameVotes = votes.filter((v) => v.game_type === gameType && v.vote === "yes");
    const votedPlayerIds = gameVotes.map((v) => v.player_id);

    // All non-spectator players must have voted "yes" on this game
    const allVotedYes = playerIds.every((pid) => votedPlayerIds.includes(pid));

    if (allVotedYes) {
      return gameType;
    }
  }

  return null;
}

/**
 * Calculate the most-voted game based on "yes" votes.
 * Returns the game with the most "yes" votes.
 * If there's a tie, returns the first one.
 */
export function findMostVotedGame(
  votes: Array<{
    player_id: string;
    game_type: string;
    vote: string;
  }>
): string | null {
  const yesVotes: Record<string, number> = {};

  for (const v of votes) {
    if (v.vote === "yes") {
      yesVotes[v.game_type] = (yesVotes[v.game_type] ?? 0) + 1;
    }
  }

  const entries = Object.entries(yesVotes);
  if (entries.length === 0) return null;

  // Sort by count descending, return highest
  entries.sort(([, a], [, b]) => b - a);
  return entries[0][0];
}

/**
 * Get a game definition by its ID.
 */
export function getGameById(id: string): GameDefinition | undefined {
  return AVAILABLE_GAMES.find((g) => g.id === id);
}

/**
 * Constants for the game picker.
 */
export const GAME_PICKER_TIMEOUT_SECONDS = 30;
