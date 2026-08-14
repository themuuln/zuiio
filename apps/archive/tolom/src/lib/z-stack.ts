/**
 * @deprecated Z-index layering for nested overlays is now handled automatically
 * by the Base UI dialog system. No manual push/pop is needed.
 * This file is kept for backward compatibility and will be removed in a
 * future release.
 *
 * Z-Index Stack Manager for overlay stacking (Sheet→Sheet, Sheet→Dialog, etc.)
 *
 * Base UI Dialog renders every portal at the same z-50 level. When multiple
 * overlays stack, the second one doesn't reliably appear on top and focus
 * management breaks. This manager assigns incrementing z-index layers so
 * each new overlay sits above the previous one.
 *
 * Usage:
 *   const layer = zStack.push();  // returns 1, 2, 3...
 *   // use layer for z-50 + layer (e.g. layer=1 → z-51)
 *   zStack.pop();                 // decrement when overlay closes
 */

const BASE_SHEET_Z = 50;
const MAX_LAYERS = 10;

let currentLayer = 0;
let onChange: (() => void) | null = null;

export const zStack = {
  /** Push a new layer. Returns the layer number (1-based). */
  push(): number {
    if (currentLayer >= MAX_LAYERS) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[zStack] Max nesting depth (${MAX_LAYERS}) reached. ` +
            `New overlay will use the same z-index as the topmost layer.`,
        );
      }
      return currentLayer;
    }
    currentLayer++;
    onChange?.();
    return currentLayer;
  },

  /** Pop the top layer. */
  pop() {
    currentLayer = Math.max(0, currentLayer - 1);
    onChange?.();
  },

  /** Get the current top layer number. */
  top() {
    return currentLayer;
  },

  /** Convert a layer number to a Tailwind z-index class string (e.g. "z-51") */
  toZClass(layer: number): string {
    return `z-${BASE_SHEET_Z + layer}`;
  },

  /** Convert a layer number to a raw z-index value (e.g. "51") */
  toZIndex(layer: number): string {
    return String(BASE_SHEET_Z + layer);
  },

  /** Subscribe to layer changes. Returns unsubscribe function. */
  subscribe(cb: () => void): () => void {
    onChange = cb;
    return () => {
      onChange = null;
    };
  },

  /** Reset (for testing only) */
  _reset() {
    currentLayer = 0;
    onChange = null;
  },
};
