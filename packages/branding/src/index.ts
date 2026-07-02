/**
 * @zuiio/branding — Design token constants
 *
 * These mirror the CSS custom properties in globals.css.
 * Use for programmatic access to brand tokens in JS/TS.
 */

export const brandTokens = {
	violet: "oklch(0.50 0.26 275)",
	violetLight: "oklch(0.65 0.22 275)",
	violetDim: "oklch(0.38 0.24 275)",
	teal: "oklch(0.70 0.16 195)",
	tealLight: "oklch(0.82 0.12 195)",
} as const;

export const semanticColors = {
	background: "oklch(0.99 0.003 275)",
	foreground: "oklch(0.12 0.018 275)",
	primary: "oklch(0.50 0.26 275)",
	primaryForeground: "oklch(0.99 0.003 275)",
	accent: "oklch(0.92 0.06 195)",
	muted: "oklch(0.94 0.008 275)",
	mutedForeground: "oklch(0.50 0.025 275)",
	border: "oklch(0.90 0.010 275)",
	destructive: "oklch(0.55 0.22 20)",
} as const;

export const spacing = {
	1: "4px",
	2: "8px",
	3: "12px",
	4: "16px",
	5: "20px",
	6: "24px",
	8: "32px",
	10: "40px",
	12: "48px",
	16: "64px",
	20: "80px",
	24: "96px",
} as const;

export const radii = {
	sm: "4px",
	md: "8px",
	lg: "12px",
	xl: "16px",
	full: "9999px",
} as const;
