// shadcn base color presets (from official docs)
// Each preset includes light + dark mode values
export const SHADCN_PRESETS: {
  name: string;
  light: { primary: string; accent: string; [key: string]: string };
  dark: { primary: string; accent: string; [key: string]: string };
}[] = [
  {
    name: "Neutral",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0 0)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.145 0 0)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.145 0 0)",
      primary: "oklch(0.205 0 0)",
      "primary-foreground": "oklch(0.985 0 0)",
      secondary: "oklch(0.97 0 0)",
      "secondary-foreground": "oklch(0.205 0 0)",
      muted: "oklch(0.97 0 0)",
      "muted-foreground": "oklch(0.556 0 0)",
      accent: "oklch(0.97 0 0)",
      "accent-foreground": "oklch(0.205 0 0)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.922 0 0)",
      input: "oklch(0.922 0 0)",
      ring: "oklch(0.708 0 0)",
    },
    dark: {
      background: "oklch(0.145 0 0)",
      foreground: "oklch(0.985 0 0)",
      card: "oklch(0.205 0 0)",
      "card-foreground": "oklch(0.985 0 0)",
      popover: "oklch(0.205 0 0)",
      "popover-foreground": "oklch(0.985 0 0)",
      primary: "oklch(0.922 0 0)",
      "primary-foreground": "oklch(0.205 0 0)",
      secondary: "oklch(0.269 0 0)",
      "secondary-foreground": "oklch(0.985 0 0)",
      muted: "oklch(0.269 0 0)",
      "muted-foreground": "oklch(0.708 0 0)",
      accent: "oklch(0.269 0 0)",
      "accent-foreground": "oklch(0.985 0 0)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.556 0 0)",
    },
  },
  {
    name: "Stone",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0.005 286)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.145 0.005 286)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.145 0.005 286)",
      primary: "oklch(0.205 0.006 286)",
      "primary-foreground": "oklch(0.985 0.001 286)",
      secondary: "oklch(0.97 0.001 286)",
      "secondary-foreground": "oklch(0.205 0.006 286)",
      muted: "oklch(0.97 0.001 286)",
      "muted-foreground": "oklch(0.556 0.005 286)",
      accent: "oklch(0.97 0.001 286)",
      "accent-foreground": "oklch(0.205 0.006 286)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.922 0.004 286)",
      input: "oklch(0.922 0.004 286)",
      ring: "oklch(0.708 0.005 286)",
    },
    dark: {
      background: "oklch(0.145 0.005 286)",
      foreground: "oklch(0.985 0.001 286)",
      card: "oklch(0.205 0.006 286)",
      "card-foreground": "oklch(0.985 0.001 286)",
      popover: "oklch(0.205 0.006 286)",
      "popover-foreground": "oklch(0.985 0.001 286)",
      primary: "oklch(0.922 0.004 286)",
      "primary-foreground": "oklch(0.205 0.006 286)",
      secondary: "oklch(0.269 0.006 286)",
      "secondary-foreground": "oklch(0.985 0.001 286)",
      muted: "oklch(0.269 0.006 286)",
      "muted-foreground": "oklch(0.708 0.005 286)",
      accent: "oklch(0.269 0.006 286)",
      "accent-foreground": "oklch(0.985 0.001 286)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.556 0.005 286)",
    },
  },
  {
    name: "Zinc",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0.004 285)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.145 0.004 285)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.145 0.004 285)",
      primary: "oklch(0.205 0.005 285)",
      "primary-foreground": "oklch(0.985 0.001 285)",
      secondary: "oklch(0.97 0.001 285)",
      "secondary-foreground": "oklch(0.205 0.005 285)",
      muted: "oklch(0.97 0.001 285)",
      "muted-foreground": "oklch(0.556 0.004 285)",
      accent: "oklch(0.97 0.001 285)",
      "accent-foreground": "oklch(0.205 0.005 285)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.922 0.003 285)",
      input: "oklch(0.922 0.003 285)",
      ring: "oklch(0.708 0.004 285)",
    },
    dark: {
      background: "oklch(0.145 0.004 285)",
      foreground: "oklch(0.985 0.001 285)",
      card: "oklch(0.205 0.005 285)",
      "card-foreground": "oklch(0.985 0.001 285)",
      popover: "oklch(0.205 0.005 285)",
      "popover-foreground": "oklch(0.985 0.001 285)",
      primary: "oklch(0.922 0.003 285)",
      "primary-foreground": "oklch(0.205 0.005 285)",
      secondary: "oklch(0.269 0.005 285)",
      "secondary-foreground": "oklch(0.985 0.001 285)",
      muted: "oklch(0.269 0.005 285)",
      "muted-foreground": "oklch(0.708 0.004 285)",
      accent: "oklch(0.269 0.005 285)",
      "accent-foreground": "oklch(0.985 0.001 285)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.556 0.004 285)",
    },
  },
  {
    name: "Mauve",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0.008 288)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.145 0.008 288)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.145 0.008 288)",
      primary: "oklch(0.205 0.01 288)",
      "primary-foreground": "oklch(0.985 0.002 288)",
      secondary: "oklch(0.97 0.002 288)",
      "secondary-foreground": "oklch(0.205 0.01 288)",
      muted: "oklch(0.97 0.002 288)",
      "muted-foreground": "oklch(0.556 0.008 288)",
      accent: "oklch(0.97 0.002 288)",
      "accent-foreground": "oklch(0.205 0.01 288)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.922 0.006 288)",
      input: "oklch(0.922 0.006 288)",
      ring: "oklch(0.708 0.008 288)",
    },
    dark: {
      background: "oklch(0.145 0.008 288)",
      foreground: "oklch(0.985 0.002 288)",
      card: "oklch(0.205 0.01 288)",
      "card-foreground": "oklch(0.985 0.002 288)",
      popover: "oklch(0.205 0.01 288)",
      "popover-foreground": "oklch(0.985 0.002 288)",
      primary: "oklch(0.922 0.006 288)",
      "primary-foreground": "oklch(0.205 0.01 288)",
      secondary: "oklch(0.269 0.01 288)",
      "secondary-foreground": "oklch(0.985 0.002 288)",
      muted: "oklch(0.269 0.01 288)",
      "muted-foreground": "oklch(0.708 0.008 288)",
      accent: "oklch(0.269 0.01 288)",
      "accent-foreground": "oklch(0.985 0.002 288)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.556 0.008 288)",
    },
  },
  {
    name: "Olive",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0.006 100)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.145 0.006 100)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.145 0.006 100)",
      primary: "oklch(0.205 0.008 100)",
      "primary-foreground": "oklch(0.985 0.002 100)",
      secondary: "oklch(0.97 0.002 100)",
      "secondary-foreground": "oklch(0.205 0.008 100)",
      muted: "oklch(0.97 0.002 100)",
      "muted-foreground": "oklch(0.556 0.006 100)",
      accent: "oklch(0.97 0.002 100)",
      "accent-foreground": "oklch(0.205 0.008 100)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.922 0.005 100)",
      input: "oklch(0.922 0.005 100)",
      ring: "oklch(0.708 0.006 100)",
    },
    dark: {
      background: "oklch(0.145 0.006 100)",
      foreground: "oklch(0.985 0.002 100)",
      card: "oklch(0.205 0.008 100)",
      "card-foreground": "oklch(0.985 0.002 100)",
      popover: "oklch(0.205 0.008 100)",
      "popover-foreground": "oklch(0.985 0.002 100)",
      primary: "oklch(0.922 0.005 100)",
      "primary-foreground": "oklch(0.205 0.008 100)",
      secondary: "oklch(0.269 0.008 100)",
      "secondary-foreground": "oklch(0.985 0.002 100)",
      muted: "oklch(0.269 0.008 100)",
      "muted-foreground": "oklch(0.708 0.006 100)",
      accent: "oklch(0.269 0.008 100)",
      "accent-foreground": "oklch(0.985 0.002 100)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.556 0.006 100)",
    },
  },
  {
    name: "Mist",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0.01 210)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.145 0.01 210)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.145 0.01 210)",
      primary: "oklch(0.205 0.012 210)",
      "primary-foreground": "oklch(0.985 0.002 210)",
      secondary: "oklch(0.97 0.003 210)",
      "secondary-foreground": "oklch(0.205 0.012 210)",
      muted: "oklch(0.97 0.003 210)",
      "muted-foreground": "oklch(0.556 0.01 210)",
      accent: "oklch(0.97 0.003 210)",
      "accent-foreground": "oklch(0.205 0.012 210)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.922 0.008 210)",
      input: "oklch(0.922 0.008 210)",
      ring: "oklch(0.708 0.01 210)",
    },
    dark: {
      background: "oklch(0.145 0.01 210)",
      foreground: "oklch(0.985 0.002 210)",
      card: "oklch(0.205 0.012 210)",
      "card-foreground": "oklch(0.985 0.002 210)",
      popover: "oklch(0.205 0.012 210)",
      "popover-foreground": "oklch(0.985 0.002 210)",
      primary: "oklch(0.922 0.008 210)",
      "primary-foreground": "oklch(0.205 0.012 210)",
      secondary: "oklch(0.269 0.012 210)",
      "secondary-foreground": "oklch(0.985 0.002 210)",
      muted: "oklch(0.269 0.012 210)",
      "muted-foreground": "oklch(0.708 0.01 210)",
      accent: "oklch(0.269 0.012 210)",
      "accent-foreground": "oklch(0.985 0.002 210)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.556 0.01 210)",
    },
  },
  {
    name: "Taupe",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0.01 60)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.145 0.01 60)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.145 0.01 60)",
      primary: "oklch(0.205 0.012 60)",
      "primary-foreground": "oklch(0.985 0.002 60)",
      secondary: "oklch(0.97 0.003 60)",
      "secondary-foreground": "oklch(0.205 0.012 60)",
      muted: "oklch(0.97 0.003 60)",
      "muted-foreground": "oklch(0.556 0.01 60)",
      accent: "oklch(0.97 0.003 60)",
      "accent-foreground": "oklch(0.205 0.012 60)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.922 0.008 60)",
      input: "oklch(0.922 0.008 60)",
      ring: "oklch(0.708 0.01 60)",
    },
    dark: {
      background: "oklch(0.145 0.01 60)",
      foreground: "oklch(0.985 0.002 60)",
      card: "oklch(0.205 0.012 60)",
      "card-foreground": "oklch(0.985 0.002 60)",
      popover: "oklch(0.205 0.012 60)",
      "popover-foreground": "oklch(0.985 0.002 60)",
      primary: "oklch(0.922 0.008 60)",
      "primary-foreground": "oklch(0.205 0.012 60)",
      secondary: "oklch(0.269 0.012 60)",
      "secondary-foreground": "oklch(0.985 0.002 60)",
      muted: "oklch(0.269 0.012 60)",
      "muted-foreground": "oklch(0.708 0.01 60)",
      accent: "oklch(0.269 0.012 60)",
      "accent-foreground": "oklch(0.985 0.002 60)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.556 0.01 60)",
    },
  },
];

import { reportServerError } from "@/lib/sentry-report-server";

export const RADIUS_OPTIONS = [
  { label: "Sharp", value: "0px" },
  { label: "Subtle", value: "0.25rem" },
  { label: "Medium", value: "0.375rem" },
  { label: "Rounded", value: "0.5rem" },
  { label: "Pill", value: "0.75rem" },
];

// Parse oklch for color input (convert to hex for input[type="color"])
export function oklchToHex(oklch: string): string {
  try {
    const match = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
    if (!match) return "#000000";
    const [, l, c, h] = match;
    const lightness = parseFloat(l);
    const chroma = parseFloat(c);
    const hue = parseFloat(h);

    if (chroma < 0.01) {
      const gray = Math.round(lightness * 255);
      return `#${gray.toString(16).padStart(2, "0").repeat(3)}`;
    }

    const r = Math.round(128 + 127 * Math.cos((hue * Math.PI) / 180));
    const g = Math.round(128 + 127 * Math.cos(((hue - 120) * Math.PI) / 180));
    const b = Math.round(128 + 127 * Math.cos(((hue - 240) * Math.PI) / 180));
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  } catch (error) {
    reportServerError("Unexpected error", error);
    return "#000000";
  }
}

export function hexToOklch(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const l = 0.299 * r + 0.587 * g + 0.114 * b;
  const c = Math.sqrt((r - l) ** 2 + (g - l) ** 2 + (b - l) ** 2);
  const h = Math.atan2(g - b, r - l) * (180 / Math.PI);

  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(3)})`;
}
