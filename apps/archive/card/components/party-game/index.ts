/**
 * Party Game UI Components
 *
 * Reusable UI components for all party game modes.
 * Each component is responsive for mobile (375px viewport).
 */

export { QuestionDisplay } from "./question-display";
export type { QuestionDisplayProps } from "./question-display";

export { VotingArea } from "./voting-area";
export type {
  VotingAreaProps,
  PartyGameType,
  PlayerInfo,
} from "./voting-area";

export { RevealOverlay } from "./reveal-overlay";
export type { RevealOverlayProps, RevealResult, RevealBreakdown } from "./reveal-overlay";

export { DrinkingPrompt } from "./drinking-prompt";
export type { DrinkingPromptProps } from "./drinking-prompt";

export { GameHeader } from "./game-header";
export type { GameHeaderProps } from "./game-header";

export { PartyLobby } from "./party-lobby";
export type { PartyLobbyProps } from "./party-lobby";

export { GameOverScreen } from "./game-over-screen";
export type { GameOverScreenProps } from "./game-over-screen";
