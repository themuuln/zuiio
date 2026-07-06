export type BrandTheme = {
  name: string;
  label: string;
  /** CSS variable overrides for :root (light mode) */
  light: Record<string, string>;
  /** CSS variable overrides for .dark (dark mode) */
  dark: Record<string, string>;
};

export const BRAND_THEMES: BrandTheme[] = [
  {
    name: "neutral",
    label: "Стандарт",
    light: {
      "--background": "oklch(0.98 0.01 95)",
      "--foreground": "oklch(0.22 0.02 55)",
      "--primary": "oklch(0.43 0.11 215)",
      "--primary-foreground": "oklch(0.98 0.01 95)",
      "--secondary": "oklch(0.94 0.02 95)",
      "--secondary-foreground": "oklch(0.28 0.03 55)",
      "--muted": "oklch(0.955 0.015 95)",
      "--muted-foreground": "oklch(0.49 0.03 60)",
      "--accent": "oklch(0.92 0.04 175)",
      "--accent-foreground": "oklch(0.24 0.03 175)",
      "--destructive": "oklch(0.577 0.245 27.325)",
      "--border": "oklch(0.89 0.02 85)",
      "--input": "oklch(0.9 0.02 85)",
      "--ring": "oklch(0.57 0.11 215)",
      "--sidebar": "oklch(0.24 0.03 245)",
      "--sidebar-foreground": "oklch(0.95 0.01 95)",
      "--sidebar-primary": "oklch(0.68 0.13 170)",
      "--sidebar-primary-foreground": "oklch(0.2 0.02 170)",
      "--sidebar-accent": "oklch(0.3 0.03 245)",
      "--sidebar-accent-foreground": "oklch(0.97 0.01 95)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.68 0.13 170)",
    },
    dark: {
      "--background": "oklch(0.145 0 0)",
      "--foreground": "oklch(0.985 0 0)",
      "--primary": "oklch(0.922 0 0)",
      "--primary-foreground": "oklch(0.205 0 0)",
      "--secondary": "oklch(0.269 0 0)",
      "--secondary-foreground": "oklch(0.985 0 0)",
      "--muted": "oklch(0.269 0 0)",
      "--muted-foreground": "oklch(0.708 0 0)",
      "--accent": "oklch(0.269 0 0)",
      "--accent-foreground": "oklch(0.985 0 0)",
      "--destructive": "oklch(0.704 0.191 22.216)",
      "--border": "oklch(1 0 0 / 10%)",
      "--input": "oklch(1 0 0 / 15%)",
      "--ring": "oklch(0.556 0 0)",
      "--sidebar": "oklch(0.205 0 0)",
      "--sidebar-foreground": "oklch(0.985 0 0)",
      "--sidebar-primary": "oklch(0.488 0.243 264.376)",
      "--sidebar-primary-foreground": "oklch(0.985 0 0)",
      "--sidebar-accent": "oklch(0.269 0 0)",
      "--sidebar-accent-foreground": "oklch(0.985 0 0)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.556 0 0)",
    },
  },
  {
    name: "blue",
    label: "Цэнхэр",
    light: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.129 0.042 264.695)",
      "--primary": "oklch(0.546 0.245 262.881)",
      "--primary-foreground": "oklch(0.985 0 0)",
      "--secondary": "oklch(0.968 0.007 247.896)",
      "--secondary-foreground": "oklch(0.21 0.065 255.207)",
      "--muted": "oklch(0.968 0.007 247.896)",
      "--muted-foreground": "oklch(0.554 0.046 257.417)",
      "--accent": "oklch(0.968 0.007 247.896)",
      "--accent-foreground": "oklch(0.21 0.065 255.207)",
      "--destructive": "oklch(0.577 0.245 27.325)",
      "--border": "oklch(0.929 0.013 255.508)",
      "--input": "oklch(0.929 0.013 255.508)",
      "--ring": "oklch(0.546 0.245 262.881)",
      "--sidebar": "oklch(0.21 0.065 255.207)",
      "--sidebar-foreground": "oklch(0.985 0 0)",
      "--sidebar-primary": "oklch(0.546 0.245 262.881)",
      "--sidebar-primary-foreground": "oklch(0.985 0 0)",
      "--sidebar-accent": "oklch(0.328 0.102 256.848)",
      "--sidebar-accent-foreground": "oklch(0.985 0 0)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.546 0.245 262.881)",
    },
    dark: {
      "--background": "oklch(0.129 0.042 264.695)",
      "--foreground": "oklch(0.985 0 0)",
      "--primary": "oklch(0.546 0.245 262.881)",
      "--primary-foreground": "oklch(0.985 0 0)",
      "--secondary": "oklch(0.279 0.076 262.041)",
      "--secondary-foreground": "oklch(0.985 0 0)",
      "--muted": "oklch(0.279 0.076 262.041)",
      "--muted-foreground": "oklch(0.719 0.062 262.041)",
      "--accent": "oklch(0.279 0.076 262.041)",
      "--accent-foreground": "oklch(0.985 0 0)",
      "--destructive": "oklch(0.704 0.191 22.216)",
      "--border": "oklch(1 0 0 / 10%)",
      "--input": "oklch(1 0 0 / 15%)",
      "--ring": "oklch(0.546 0.245 262.881)",
      "--sidebar": "oklch(0.21 0.065 255.207)",
      "--sidebar-foreground": "oklch(0.985 0 0)",
      "--sidebar-primary": "oklch(0.546 0.245 262.881)",
      "--sidebar-primary-foreground": "oklch(0.985 0 0)",
      "--sidebar-accent": "oklch(0.328 0.102 256.848)",
      "--sidebar-accent-foreground": "oklch(0.985 0 0)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.546 0.245 262.881)",
    },
  },
  {
    name: "green",
    label: "Ногоон",
    light: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.13 0.028 142.495)",
      "--primary": "oklch(0.527 0.154 150.069)",
      "--primary-foreground": "oklch(0.982 0.018 155.826)",
      "--secondary": "oklch(0.962 0.018 149.768)",
      "--secondary-foreground": "oklch(0.232 0.061 146.928)",
      "--muted": "oklch(0.962 0.018 149.768)",
      "--muted-foreground": "oklch(0.556 0.046 147.021)",
      "--accent": "oklch(0.962 0.018 149.768)",
      "--accent-foreground": "oklch(0.232 0.061 146.928)",
      "--destructive": "oklch(0.577 0.245 27.325)",
      "--border": "oklch(0.925 0.029 147.104)",
      "--input": "oklch(0.925 0.029 147.104)",
      "--ring": "oklch(0.527 0.154 150.069)",
      "--sidebar": "oklch(0.232 0.061 146.928)",
      "--sidebar-foreground": "oklch(0.982 0.018 155.826)",
      "--sidebar-primary": "oklch(0.527 0.154 150.069)",
      "--sidebar-primary-foreground": "oklch(0.982 0.018 155.826)",
      "--sidebar-accent": "oklch(0.332 0.069 147.519)",
      "--sidebar-accent-foreground": "oklch(0.982 0.018 155.826)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.527 0.154 150.069)",
    },
    dark: {
      "--background": "oklch(0.13 0.028 142.495)",
      "--foreground": "oklch(0.982 0.018 155.826)",
      "--primary": "oklch(0.527 0.154 150.069)",
      "--primary-foreground": "oklch(0.982 0.018 155.826)",
      "--secondary": "oklch(0.275 0.066 147.697)",
      "--secondary-foreground": "oklch(0.982 0.018 155.826)",
      "--muted": "oklch(0.275 0.066 147.697)",
      "--muted-foreground": "oklch(0.713 0.049 147.856)",
      "--accent": "oklch(0.275 0.066 147.697)",
      "--accent-foreground": "oklch(0.982 0.018 155.826)",
      "--destructive": "oklch(0.704 0.191 22.216)",
      "--border": "oklch(1 0 0 / 10%)",
      "--input": "oklch(1 0 0 / 15%)",
      "--ring": "oklch(0.527 0.154 150.069)",
      "--sidebar": "oklch(0.232 0.061 146.928)",
      "--sidebar-foreground": "oklch(0.982 0.018 155.826)",
      "--sidebar-primary": "oklch(0.527 0.154 150.069)",
      "--sidebar-primary-foreground": "oklch(0.982 0.018 155.826)",
      "--sidebar-accent": "oklch(0.332 0.069 147.519)",
      "--sidebar-accent-foreground": "oklch(0.982 0.018 155.826)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.527 0.154 150.069)",
    },
  },
  {
    name: "purple",
    label: "Ягаан",
    light: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.141 0.039 296.744)",
      "--primary": "oklch(0.558 0.288 302.321)",
      "--primary-foreground": "oklch(0.985 0 0)",
      "--secondary": "oklch(0.966 0.016 298.164)",
      "--secondary-foreground": "oklch(0.253 0.095 297.496)",
      "--muted": "oklch(0.966 0.016 298.164)",
      "--muted-foreground": "oklch(0.56 0.051 297.496)",
      "--accent": "oklch(0.966 0.016 298.164)",
      "--accent-foreground": "oklch(0.253 0.095 297.496)",
      "--destructive": "oklch(0.577 0.245 27.325)",
      "--border": "oklch(0.924 0.024 297.425)",
      "--input": "oklch(0.924 0.024 297.425)",
      "--ring": "oklch(0.558 0.288 302.321)",
      "--sidebar": "oklch(0.253 0.095 297.496)",
      "--sidebar-foreground": "oklch(0.985 0 0)",
      "--sidebar-primary": "oklch(0.558 0.288 302.321)",
      "--sidebar-primary-foreground": "oklch(0.985 0 0)",
      "--sidebar-accent": "oklch(0.335 0.128 298.108)",
      "--sidebar-accent-foreground": "oklch(0.985 0 0)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.558 0.288 302.321)",
    },
    dark: {
      "--background": "oklch(0.141 0.039 296.744)",
      "--foreground": "oklch(0.985 0 0)",
      "--primary": "oklch(0.558 0.288 302.321)",
      "--primary-foreground": "oklch(0.985 0 0)",
      "--secondary": "oklch(0.286 0.101 297.282)",
      "--secondary-foreground": "oklch(0.985 0 0)",
      "--muted": "oklch(0.286 0.101 297.282)",
      "--muted-foreground": "oklch(0.717 0.068 297.282)",
      "--accent": "oklch(0.286 0.101 297.282)",
      "--accent-foreground": "oklch(0.985 0 0)",
      "--destructive": "oklch(0.704 0.191 22.216)",
      "--border": "oklch(1 0 0 / 10%)",
      "--input": "oklch(1 0 0 / 15%)",
      "--ring": "oklch(0.558 0.288 302.321)",
      "--sidebar": "oklch(0.253 0.095 297.496)",
      "--sidebar-foreground": "oklch(0.985 0 0)",
      "--sidebar-primary": "oklch(0.558 0.288 302.321)",
      "--sidebar-primary-foreground": "oklch(0.985 0 0)",
      "--sidebar-accent": "oklch(0.335 0.128 298.108)",
      "--sidebar-accent-foreground": "oklch(0.985 0 0)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.558 0.288 302.321)",
    },
  },
  {
    name: "orange",
    label: "Улбар шар",
    light: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.14 0.04 45)",
      "--primary": "oklch(0.65 0.17 45)",
      "--primary-foreground": "oklch(0.98 0.01 95)",
      "--secondary": "oklch(0.96 0.02 45)",
      "--secondary-foreground": "oklch(0.24 0.05 45)",
      "--muted": "oklch(0.96 0.02 45)",
      "--muted-foreground": "oklch(0.55 0.04 45)",
      "--accent": "oklch(0.96 0.02 45)",
      "--accent-foreground": "oklch(0.24 0.05 45)",
      "--destructive": "oklch(0.577 0.245 27.325)",
      "--border": "oklch(0.92 0.02 45)",
      "--input": "oklch(0.92 0.02 45)",
      "--ring": "oklch(0.65 0.17 45)",
      "--sidebar": "oklch(0.24 0.05 45)",
      "--sidebar-foreground": "oklch(0.98 0.01 95)",
      "--sidebar-primary": "oklch(0.65 0.17 45)",
      "--sidebar-primary-foreground": "oklch(0.98 0.01 95)",
      "--sidebar-accent": "oklch(0.35 0.06 45)",
      "--sidebar-accent-foreground": "oklch(0.98 0.01 95)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.65 0.17 45)",
    },
    dark: {
      "--background": "oklch(0.14 0.04 45)",
      "--foreground": "oklch(0.98 0.01 95)",
      "--primary": "oklch(0.65 0.17 45)",
      "--primary-foreground": "oklch(0.98 0.01 95)",
      "--secondary": "oklch(0.28 0.05 45)",
      "--secondary-foreground": "oklch(0.98 0.01 95)",
      "--muted": "oklch(0.28 0.05 45)",
      "--muted-foreground": "oklch(0.72 0.04 45)",
      "--accent": "oklch(0.28 0.05 45)",
      "--accent-foreground": "oklch(0.98 0.01 95)",
      "--destructive": "oklch(0.704 0.191 22.216)",
      "--border": "oklch(1 0 0 / 10%)",
      "--input": "oklch(1 0 0 / 15%)",
      "--ring": "oklch(0.65 0.17 45)",
      "--sidebar": "oklch(0.24 0.05 45)",
      "--sidebar-foreground": "oklch(0.98 0.01 95)",
      "--sidebar-primary": "oklch(0.65 0.17 45)",
      "--sidebar-primary-foreground": "oklch(0.98 0.01 95)",
      "--sidebar-accent": "oklch(0.35 0.06 45)",
      "--sidebar-accent-foreground": "oklch(0.98 0.01 95)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.65 0.17 45)",
    },
  },
  {
    name: "rose",
    label: "Ягаан өнгө",
    light: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.145 0.041 10)",
      "--primary": "oklch(0.585 0.233 10)",
      "--primary-foreground": "oklch(0.985 0 0)",
      "--secondary": "oklch(0.965 0.021 10)",
      "--secondary-foreground": "oklch(0.253 0.075 10)",
      "--muted": "oklch(0.965 0.021 10)",
      "--muted-foreground": "oklch(0.556 0.041 10)",
      "--accent": "oklch(0.965 0.021 10)",
      "--accent-foreground": "oklch(0.253 0.075 10)",
      "--destructive": "oklch(0.577 0.245 27.325)",
      "--border": "oklch(0.925 0.021 10)",
      "--input": "oklch(0.925 0.021 10)",
      "--ring": "oklch(0.585 0.233 10)",
      "--sidebar": "oklch(0.253 0.075 10)",
      "--sidebar-foreground": "oklch(0.985 0 0)",
      "--sidebar-primary": "oklch(0.585 0.233 10)",
      "--sidebar-primary-foreground": "oklch(0.985 0 0)",
      "--sidebar-accent": "oklch(0.335 0.092 10)",
      "--sidebar-accent-foreground": "oklch(0.985 0 0)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.585 0.233 10)",
    },
    dark: {
      "--background": "oklch(0.145 0.041 10)",
      "--foreground": "oklch(0.985 0 0)",
      "--primary": "oklch(0.585 0.233 10)",
      "--primary-foreground": "oklch(0.985 0 0)",
      "--secondary": "oklch(0.283 0.072 10)",
      "--secondary-foreground": "oklch(0.985 0 0)",
      "--muted": "oklch(0.283 0.072 10)",
      "--muted-foreground": "oklch(0.713 0.049 10)",
      "--accent": "oklch(0.283 0.072 10)",
      "--accent-foreground": "oklch(0.985 0 0)",
      "--destructive": "oklch(0.704 0.191 22.216)",
      "--border": "oklch(1 0 0 / 10%)",
      "--input": "oklch(1 0 0 / 15%)",
      "--ring": "oklch(0.585 0.233 10)",
      "--sidebar": "oklch(0.253 0.075 10)",
      "--sidebar-foreground": "oklch(0.985 0 0)",
      "--sidebar-primary": "oklch(0.585 0.233 10)",
      "--sidebar-primary-foreground": "oklch(0.985 0 0)",
      "--sidebar-accent": "oklch(0.335 0.092 10)",
      "--sidebar-accent-foreground": "oklch(0.985 0 0)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.585 0.233 10)",
    },
  },
  {
    name: "goku-gym",
    label: "Goku Gym",
    light: {
      "--background": "oklch(0.985 0 0)",
      "--foreground": "oklch(0.15 0 0)",
      "--primary": "oklch(0.78 0.18 85)",
      "--primary-foreground": "oklch(0.15 0 0)",
      "--secondary": "oklch(0.15 0 0)",
      "--secondary-foreground": "oklch(0.985 0 0)",
      "--muted": "oklch(0.96 0.02 85)",
      "--muted-foreground": "oklch(0.45 0 0)",
      "--accent": "oklch(0.85 0.12 85)",
      "--accent-foreground": "oklch(0.15 0 0)",
      "--destructive": "oklch(0.577 0.245 27.325)",
      "--border": "oklch(0.85 0.02 85)",
      "--input": "oklch(0.85 0.02 85)",
      "--ring": "oklch(0.78 0.18 85)",
      "--sidebar": "oklch(0.98 0 0)",
      "--sidebar-foreground": "oklch(0.15 0 0)",
      "--sidebar-primary": "oklch(0.78 0.18 85)",
      "--sidebar-primary-foreground": "oklch(0.15 0 0)",
      "--sidebar-accent": "oklch(0.9 0.06 85)",
      "--sidebar-accent-foreground": "oklch(0.15 0 0)",
      "--sidebar-border": "oklch(0.85 0.02 85)",
      "--sidebar-ring": "oklch(0.78 0.18 85)",
    },
    dark: {
      "--background": "oklch(0.12 0 0)",
      "--foreground": "oklch(0.985 0 0)",
      "--primary": "oklch(0.78 0.18 85)",
      "--primary-foreground": "oklch(0.15 0 0)",
      "--secondary": "oklch(0.25 0 0)",
      "--secondary-foreground": "oklch(0.985 0 0)",
      "--muted": "oklch(0.2 0.02 85)",
      "--muted-foreground": "oklch(0.65 0 0)",
      "--accent": "oklch(0.85 0.12 85)",
      "--accent-foreground": "oklch(0.15 0 0)",
      "--destructive": "oklch(0.704 0.191 22.216)",
      "--border": "oklch(1 0 0 / 10%)",
      "--input": "oklch(1 0 0 / 15%)",
      "--ring": "oklch(0.78 0.18 85)",
      "--sidebar": "oklch(0.1 0 0)",
      "--sidebar-foreground": "oklch(0.985 0 0)",
      "--sidebar-primary": "oklch(0.78 0.18 85)",
      "--sidebar-primary-foreground": "oklch(0.15 0 0)",
      "--sidebar-accent": "oklch(0.2 0 0)",
      "--sidebar-accent-foreground": "oklch(0.985 0 0)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.78 0.18 85)",
    },
  },
];

export type BrandConfig = {
  theme: string;
  radius: number;
  logo_url: string | null;
  custom_colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  font_body?: string;
  font_heading?: string;
};

export const DEFAULT_BRAND_CONFIG: BrandConfig = {
  theme: "neutral",
  radius: 0.625,
  logo_url: null,
};

export function getTheme(name: string): BrandTheme | undefined {
  return BRAND_THEMES.find((t) => t.name === name);
}

function radiusLines(radius: number): string[] {
  const r = radius;
  return [
    `  --radius: ${r}rem;`,
    `  --radius-sm: ${r * 0.6}rem;`,
    `  --radius-md: ${r * 0.8}rem;`,
    `  --radius-lg: ${r}rem;`,
    `  --radius-xl: ${r * 1.4}rem;`,
    `  --radius-2xl: ${r * 1.8}rem;`,
    `  --radius-3xl: ${r * 2.2}rem;`,
    `  --radius-4xl: ${r * 2.6}rem;`,
  ];
}

export function contrastForeground(cssColor: string): string | undefined {
  if (!/^#[0-9a-fA-F]{6}$/.test(cssColor)) return undefined;

  const c = cssColor.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 0.5 ? "oklch(0.15 0.02 0)" : "oklch(0.98 0.01 0)";
}

const VALID_COLOR_RE =
  /^(#[0-9a-fA-F]{3,8}|(oklch|hsl|hwb|lab|lch|rgb|rgba|color|var)\([^)]*\)|[a-zA-Z]+)$/;

export function isValidColorValue(value: string): boolean {
  return VALID_COLOR_RE.test(value.trim());
}

const CUSTOM_COLOR_KEYS = [
  { var: "--primary", fg: "--primary-foreground" },
  { var: "--secondary", fg: "--secondary-foreground" },
  { var: "--accent", fg: "--accent-foreground" },
] as const;

export type FontOption = {
  name: string;
  label: string;
  family: string;
  cssImportUrl: string;
};

export const FONT_OPTIONS: FontOption[] = [
  {
    name: "inter",
    label: "Inter",
    family: "'Inter', sans-serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300..900&display=swap",
  },
  {
    name: "onest",
    label: "Onest",
    family: "'Onest', sans-serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=Onest:wght@300..900&display=swap",
  },
  {
    name: "manrope",
    label: "Manrope",
    family: "'Manrope', sans-serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=Manrope:wght@300..800&display=swap",
  },
  {
    name: "nunito",
    label: "Nunito",
    family: "'Nunito', sans-serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=Nunito:opsz,wght@6..12,300..800&display=swap",
  },
  {
    name: "montserrat",
    label: "Montserrat",
    family: "'Montserrat', sans-serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=Montserrat:opsz,wght@14..32,300..800&display=swap",
  },
  {
    name: "noto-sans",
    label: "Noto Sans",
    family: "'Noto Sans', sans-serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=Noto+Sans:opsz,wght@6..12,300..900&display=swap",
  },
  {
    name: "open-sans",
    label: "Open Sans",
    family: "'Open Sans', sans-serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=Open+Sans:opsz,wght@6..12,300..800&display=swap",
  },
  {
    name: "roboto",
    label: "Roboto",
    family: "'Roboto', sans-serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=Roboto:opsz,wght@14..32,300..700&display=swap",
  },
  {
    name: "plus-jakarta-sans",
    label: "Plus Jakarta Sans",
    family: "'Plus Jakarta Sans', sans-serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:opsz,wght@14..32,300..800&display=swap",
  },
  {
    name: "dm-sans",
    label: "DM Sans",
    family: "'DM Sans', sans-serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300..800&display=swap",
  },
];

export function getFont(name: string): FontOption | undefined {
  return FONT_OPTIONS.find((f) => f.name === name);
}

function customColorLines(
  customColors: NonNullable<BrandConfig["custom_colors"]>,
): string[] {
  const lines: string[] = [];
  for (const key of CUSTOM_COLOR_KEYS) {
    const hex =
      customColors[key.var.replace("--", "") as keyof typeof customColors];
    if (hex) {
      if (!isValidColorValue(hex)) continue;
      lines.push(`  ${key.var}: ${hex};`);
      lines.push(`  ${key.fg}: ${contrastForeground(hex)};`);
    }
  }
  return lines;
}

export function generateBrandCSS(config: BrandConfig): string {
  const theme = getTheme(config.theme);
  if (!theme) return "";

  const customOverrides = config.custom_colors
    ? customColorLines(config.custom_colors)
    : [];

  const seenUrls = new Set<string>();
  const importLines: string[] = [];
  let bodyFamily: string | undefined;
  let headingFamily: string | undefined;

  if (config.font_body) {
    const font = getFont(config.font_body);
    if (font) {
      bodyFamily = font.family;
      if (!seenUrls.has(font.cssImportUrl)) {
        importLines.push(`@import url("${font.cssImportUrl}");`);
        seenUrls.add(font.cssImportUrl);
      }
    }
  }
  if (config.font_heading && config.font_heading !== config.font_body) {
    const font = getFont(config.font_heading);
    if (font) {
      headingFamily = font.family;
      if (!seenUrls.has(font.cssImportUrl)) {
        importLines.push(`@import url("${font.cssImportUrl}");`);
      }
    }
  }

  const fontLines: string[] = [];
  if (bodyFamily) {
    fontLines.push(`  --font-sans: ${bodyFamily};`);
  }
  if (headingFamily) {
    fontLines.push(`  --font-heading: ${headingFamily};`);
  } else if (bodyFamily) {
    fontLines.push(`  --font-heading: ${bodyFamily};`);
  }

  const lines: string[] = [];

  lines.push(...importLines);

  lines.push(":root {");
  for (const [key, value] of Object.entries(theme.light)) {
    lines.push(`  ${key}: ${value};`);
  }
  if (config.radius != null) {
    lines.push(...radiusLines(config.radius));
  }
  lines.push(...customOverrides);
  lines.push(...fontLines);
  lines.push("}");

  lines.push(".dark {");
  for (const [key, value] of Object.entries(theme.dark)) {
    lines.push(`  ${key}: ${value};`);
  }
  if (config.radius != null) {
    lines.push(...radiusLines(config.radius));
  }
  lines.push(...customOverrides);
  lines.push("}");

  return lines.join("\n");
}
