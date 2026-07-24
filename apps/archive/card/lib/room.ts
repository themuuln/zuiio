import {
  DISPLAY_NAME_MIN_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
  AVATAR_EMOJIS,
} from "./constants";

/**
 * Validate a display name.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return "Display name is required";
  }

  if (trimmed.length < DISPLAY_NAME_MIN_LENGTH) {
    return `Display name must be at least ${DISPLAY_NAME_MIN_LENGTH} characters`;
  }

  if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
    return `Display name must be at most ${DISPLAY_NAME_MAX_LENGTH} characters`;
  }

  return null;
}

/**
 * Sanitize a display name by escaping HTML entities (XSS prevention).
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Assign an emoji avatar based on the number of existing players in the room.
 * Cycles through the avatar list.
 */
export function assignAvatar(existingPlayerCount: number): string {
  return AVATAR_EMOJIS[existingPlayerCount % AVATAR_EMOJIS.length];
}
