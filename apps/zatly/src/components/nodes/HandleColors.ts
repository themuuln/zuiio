/**
 * Handle color constants for the React Flow handle system.
 *
 * Color scheme:
 * - Blue (#3b82f6): Standard flow handles (start output, most inputs/outputs)
 * - Green (#22c55e): Condition "yes" and AbTest variant handles
 * - Red (#ef4444): Condition "no" handles
 * - Purple (#a855f7): Button branch handles (quick replies, card buttons)
 */

export const HANDLE_COLORS = {
  /** Standard flow-through handles — blue */
  standard: { background: "#3b82f6", border: "#3b82f6" },
  /** Condition "yes" and AbTest variant handles — green */
  success: { background: "#22c55e", border: "#22c55e" },
  /** Condition "no" handles — red */
  failure: { background: "#ef4444", border: "#ef4444" },
  /** Button branch handles — purple */
  button: { background: "#a855f7", border: "#a855f7" },
} as const;

/**
 * Returns the style object for a handle based on its role/type.
 * Includes the color property so hover glow via `currentColor` works in CSS.
 *
 * @param type - The handle color role
 * @returns React CSS properties object for the Handle's style prop
 */
export function getHandleStyle(type: keyof typeof HANDLE_COLORS) {
  const hex = HANDLE_COLORS[type].background;
  return {
    width: 12,
    height: 12,
    background: hex,
    border: `2px solid ${hex}`,
    color: hex, // used by CSS hover glow via currentColor
    transition: "background-color 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.15s",
  };
}
