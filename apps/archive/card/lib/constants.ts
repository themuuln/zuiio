export const APP_NAME = "Friday";
export const APP_DESCRIPTION = "Adult party game night — truth or dare, never have I ever, hot takes, drinking games & more. 18+ only.";
export const APP_TAGLINE = "Your Friday nights just got spicier.";
export const ROOM_CODE_LENGTH = 4;
export const MAX_PLAYERS = 8;
export const MAX_PLAYERS_PREMIUM = 20;
export const MIN_PLAYERS = 1;
export const ROOM_EXPIRY_HOURS = 24;
export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 20;
export const AGE_GATE_REQUIRED = true;
export const AGE_GATE_MIN_AGE = 18;

export type VibeTier = "spicy" | "wild" | "after-dark";

export const VIBE_TIERS: Record<VibeTier, { label: string; emoji: string; description: string; color: string }> = {
  spicy: { label: "Spicy", emoji: "🟢", description: "Flirty, cheeky, mild drinking — fun for any group", color: "green" },
  wild: { label: "Wild", emoji: "🟠", description: "Raunchy, heavy drinking, sexual references — turn up the heat", color: "orange" },
  "after-dark": { label: "After Dark", emoji: "🔥", description: "Explicit, no limits, intended for close friend groups", color: "red" },
};

export const AVATAR_EMOJIS = [
  "🦊", "🐼", "🐨", "🦁", "🐯", "🐸", "🐵", "🦄",
  "🐧", "🐥", "🦉", "🐺", "🦋", "🐝", "🐙", "🦑",
  "🐬", "🦈", "🐊", "🦕", "🦖", "🐳", "🦚", "🦜",
  "🐲", "🐉", "🦓", "🦍", "🐘", "🦛", "🦒", "🦘",
];

export const PARTY_GAME_TIMER_SECONDS = 30;
export const PARTY_GAME_REVEAL_DELAY_SECONDS = 3;
export const DRINK_ACTIONS = ["sip", "shot", "assign", "waterfall", "group-shot"] as const;
export type DrinkAction = typeof DRINK_ACTIONS[number];
