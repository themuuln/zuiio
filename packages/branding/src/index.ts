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
    name: "zuiio",
    label: "Zuiio",
    light: {
      "--background": "oklch(0.98 0.005 80)",
      "--foreground": "oklch(0.13 0.003 80)",
      "--card": "oklch(0.98 0.005 80)",
      "--card-foreground": "oklch(0.13 0.003 80)",
      "--popover": "oklch(0.98 0.005 80)",
      "--popover-foreground": "oklch(0.13 0.003 80)",
      "--primary": "oklch(0.70 0.16 195)",
      "--primary-foreground": "oklch(0.13 0.003 80)",
      "--secondary": "oklch(0.96 0.008 80)",
      "--secondary-foreground": "oklch(0.13 0.003 80)",
      "--muted": "oklch(0.96 0.008 80)",
      "--muted-foreground": "oklch(0.55 0.008 80)",
      "--accent": "oklch(0.96 0.02 195)",
      "--accent-foreground": "oklch(0.22 0.12 195)",
      "--destructive": "oklch(0.6 0.22 25)",
      "--destructive-foreground": "oklch(1 0 0)",
      "--border": "oklch(0.92 0.01 80)",
      "--input": "oklch(0.92 0.01 80)",
      "--ring": "oklch(0.70 0.16 195)",
      "--sidebar": "oklch(0.13 0.003 80)",
      "--sidebar-foreground": "oklch(0.98 0.005 80)",
      "--sidebar-primary": "oklch(0.70 0.16 195)",
      "--sidebar-primary-foreground": "oklch(0.13 0.003 80)",
      "--sidebar-accent": "oklch(0.2 0.004 80)",
      "--sidebar-accent-foreground": "oklch(0.98 0.005 80)",
      "--sidebar-border": "oklch(0.92 0.01 80)",
      "--sidebar-ring": "oklch(0.70 0.16 195)",
    },
    dark: {
      "--background": "oklch(0.13 0.003 80)",
      "--foreground": "oklch(0.98 0.005 80)",
      "--card": "oklch(0.2 0.004 80)",
      "--card-foreground": "oklch(0.98 0.005 80)",
      "--popover": "oklch(0.2 0.004 80)",
      "--popover-foreground": "oklch(0.98 0.005 80)",
      "--primary": "oklch(0.82 0.12 195)",
      "--primary-foreground": "oklch(0.13 0.003 80)",
      "--secondary": "oklch(0.3 0.005 80)",
      "--secondary-foreground": "oklch(0.98 0.005 80)",
      "--muted": "oklch(0.3 0.005 80)",
      "--muted-foreground": "oklch(0.7 0.01 80)",
      "--accent": "oklch(0.70 0.16 195 / 15%)",
      "--accent-foreground": "oklch(0.9 0.04 195)",
      "--destructive": "oklch(0.65 0.22 25)",
      "--destructive-foreground": "oklch(0.13 0.003 80)",
      "--border": "oklch(1 0 0 / 10%)",
      "--input": "oklch(1 0 0 / 15%)",
      "--ring": "oklch(0.82 0.12 195)",
      "--sidebar": "oklch(0.13 0.003 80)",
      "--sidebar-foreground": "oklch(0.98 0.005 80)",
      "--sidebar-primary": "oklch(0.82 0.12 195)",
      "--sidebar-primary-foreground": "oklch(0.13 0.003 80)",
      "--sidebar-accent": "oklch(0.2 0.004 80)",
      "--sidebar-accent-foreground": "oklch(0.98 0.005 80)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.82 0.12 195)",
    },
  },
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
  {
    // Bujin rebrand (2026-10): banner-sampled earth palette. Primary is the
    // delivery-pill brown (#983D06), sidebar is deep moss green, surfaces are
    // warm cream/sand, accent is pale leaf. Primary-on-cream ≈ 6.7:1.
    name: "nature",
    label: "Байгаль",
    light: {
      "--background": "oklch(0.994 0.007 88.64)",
      "--foreground": "oklch(0.245 0.030 61.28)",
      "--card": "oklch(0.994 0.007 88.64)",
      "--card-foreground": "oklch(0.245 0.030 61.28)",
      "--popover": "oklch(0.994 0.007 88.64)",
      "--popover-foreground": "oklch(0.245 0.030 61.28)",
      "--primary": "oklch(0.478 0.135 44.30)",
      "--primary-foreground": "oklch(0.982 0.013 71.33)",
      "--secondary": "oklch(0.924 0.022 118.24)",
      "--secondary-foreground": "oklch(0.351 0.055 126.70)",
      "--muted": "oklch(0.935 0.020 87.52)",
      "--muted-foreground": "oklch(0.534 0.034 70.30)",
      "--accent": "oklch(0.915 0.033 122.08)",
      "--accent-foreground": "oklch(0.351 0.070 130.52)",
      "--destructive": "oklch(0.577 0.245 27.325)",
      "--destructive-foreground": "oklch(0.985 0 0)",
      "--border": "oklch(0.888 0.028 83.53)",
      "--input": "oklch(0.888 0.028 83.53)",
      "--ring": "oklch(0.478 0.135 44.30)",
      "--sidebar": "oklch(0.351 0.055 126.70)",
      "--sidebar-foreground": "oklch(0.982 0.013 71.33)",
      "--sidebar-primary": "oklch(0.735 0.150 65.81)",
      "--sidebar-primary-foreground": "oklch(0.245 0.030 61.28)",
      "--sidebar-accent": "oklch(0.369 0.050 123.84)",
      "--sidebar-accent-foreground": "oklch(0.982 0.013 71.33)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.735 0.150 65.81)",
    },
    dark: {
      "--background": "oklch(0.197 0.022 59.65)",
      "--foreground": "oklch(0.955 0.019 80.12)",
      "--card": "oklch(0.225 0.027 50.65)",
      "--card-foreground": "oklch(0.955 0.019 80.12)",
      "--popover": "oklch(0.225 0.027 50.65)",
      "--popover-foreground": "oklch(0.955 0.019 80.12)",
      "--primary": "oklch(0.735 0.150 65.81)",
      "--primary-foreground": "oklch(0.197 0.022 59.65)",
      "--secondary": "oklch(0.285 0.022 91.81)",
      "--secondary-foreground": "oklch(0.955 0.019 80.12)",
      "--muted": "oklch(0.269 0.023 66.57)",
      "--muted-foreground": "oklch(0.739 0.039 79.00)",
      "--accent": "oklch(0.369 0.050 123.84)",
      "--accent-foreground": "oklch(0.922 0.030 115.35)",
      "--destructive": "oklch(0.704 0.191 22.216)",
      "--destructive-foreground": "oklch(0.985 0 0)",
      "--border": "oklch(1 0 0 / 10%)",
      "--input": "oklch(1 0 0 / 15%)",
      "--ring": "oklch(0.735 0.150 65.81)",
      "--sidebar": "oklch(0.169 0.020 55.99)",
      "--sidebar-foreground": "oklch(0.955 0.019 80.12)",
      "--sidebar-primary": "oklch(0.735 0.150 65.81)",
      "--sidebar-primary-foreground": "oklch(0.197 0.022 59.65)",
      "--sidebar-accent": "oklch(0.269 0.023 66.57)",
      "--sidebar-accent-foreground": "oklch(0.955 0.019 80.12)",
      "--sidebar-border": "oklch(1 0 0 / 10%)",
      "--sidebar-ring": "oklch(0.735 0.150 65.81)",
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
  theme: "zuiio",
  radius: 0.5,
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
/**
 * Merge partial/nullable config with defaults.
 * Empty or null inputs resolve to the Zuiio default preset.
 * Unknown preset names fall back to "zuiio".
 */
export function resolveBrandConfig(
  input: Partial<BrandConfig> | null | undefined,
): BrandConfig {
  const base = { ...DEFAULT_BRAND_CONFIG };
  if (!input) return base;
  const theme = input.theme && getTheme(input.theme) ? input.theme : base.theme;
  const radius =
    typeof input.radius === "number" && input.radius >= 0 && input.radius <= 2
      ? input.radius
      : base.radius;
  const logo_url =
    "logo_url" in input ? (input.logo_url ?? null) : base.logo_url;
  const custom_colors: BrandConfig["custom_colors"] = {};
  if (input.custom_colors) {
    for (const [key, val] of Object.entries(input.custom_colors)) {
      if (val && isValidColorValue(val)) {
        custom_colors[key as keyof typeof custom_colors] = val;
      }
    }
  }
  const font_body =
    input.font_body && getFont(input.font_body) ? input.font_body : undefined;
  const font_heading =
    input.font_heading && getFont(input.font_heading)
      ? input.font_heading
      : undefined;
  return { theme, radius, logo_url, custom_colors, font_body, font_heading };
}

export function contrastForeground(cssColor: string): string | undefined {
  // Hex — compute luminance from RGB channels
  if (/^#[0-9a-fA-F]{6}$/.test(cssColor)) {
    const c = cssColor.replace("#", "");
    const r = parseInt(c.slice(0, 2), 16) / 255;
    const g = parseInt(c.slice(2, 4), 16) / 255;
    const b = parseInt(c.slice(4, 6), 16) / 255;
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 0.5 ? "oklch(0.15 0.02 0)" : "oklch(0.98 0.01 0)";
  }

  // Oklch — L value directly represents perceived lightness
  const oklchMatch = cssColor.match(/^oklch\(([\d.]+)\s/);
  if (oklchMatch) {
    const l = parseFloat(oklchMatch[1]);
    return l > 0.5 ? "oklch(0.15 0.02 0)" : "oklch(0.98 0.01 0)";
  }

  return undefined;
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
  // Curated 2026-09-17: every entry ships cyrillic-ext (Ө/Ү at U+460-52F),
  // verified in Next font-data. Killed: Playfair Display, Instrument Serif,
  // Fraunces, Outfit, Newsreader, Space Grotesk (no cyrillic-ext → Ө/Ү
  // fall back to Times). cssImportUrl is the org-preview path; apps load
  // via next/font with ["latin","cyrillic","cyrillic-ext"].
  {
    name: "onest",
    label: "Onest",
    family: "'Onest', sans-serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&display=swap",
  },
  {
    name: "golos-text",
    label: "Golos Text",
    family: "'Golos Text', sans-serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800&display=swap",
  },
  {
    name: "manrope",
    label: "Manrope",
    family: "'Manrope', sans-serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap",
  },
  {
    name: "ibm-plex-sans",
    label: "IBM Plex Sans",
    family: "'IBM Plex Sans', sans-serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap",
  },
  {
    name: "source-sans-3",
    label: "Source Sans 3",
    family: "'Source Sans 3', sans-serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&display=swap",
  },
  {
    name: "pt-sans",
    label: "PT Sans",
    family: "'PT Sans', sans-serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap",
  },
  {
    name: "lora",
    label: "Lora",
    family: "'Lora', serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap",
  },
  {
    name: "spectral",
    label: "Spectral",
    family: "'Spectral', serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;1,400&display=swap",
  },
  {
    name: "noto-sans",
    label: "Noto Sans",
    family: "'Noto Sans', sans-serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap",
  },
  {
    name: "inter",
    label: "Inter (legacy)",
    family: "'Inter', sans-serif",
    cssImportUrl:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
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
      const fg = contrastForeground(hex);
      if (fg) lines.push(`  ${key.fg}: ${fg};`);
    }
  }
  // Sync sidebar CSS variables when brand colors are customized.
  // Sidebar uses --sidebar-primary/--sidebar-accent which are separate
  // from --primary/--accent in the theme. Apply the same custom value
  // so org branding applies to sidebar elements (TeamSwitcher icon, etc.).
  // Note: values are already validated by resolveBrandConfig at this point.
  if (customColors.primary) {
    lines.push(`  --sidebar-primary: ${customColors.primary};`);
    lines.push(`  --sidebar-ring: ${customColors.primary};`);
    const fg = contrastForeground(customColors.primary);
    if (fg) lines.push(`  --sidebar-primary-foreground: ${fg};`);
  }
  if (customColors.accent) {
    lines.push(`  --sidebar-accent: ${customColors.accent};`);
    const fg = contrastForeground(customColors.accent);
    if (fg) lines.push(`  --sidebar-accent-foreground: ${fg};`);
  }
  return lines;
}

export function generateBrandCSS(
  config: BrandConfig | null | undefined,
): string {
  const resolved = resolveBrandConfig(config);
  const theme = getTheme(resolved.theme);
  if (!theme) return "";

  const customOverrides = resolved.custom_colors
    ? customColorLines(resolved.custom_colors)
    : [];

  const seenUrls = new Set<string>();
  const importLines: string[] = [];
  let bodyFamily: string | undefined;
  let headingFamily: string | undefined;

  if (resolved.font_body) {
    const font = getFont(resolved.font_body);
    if (font) {
      bodyFamily = font.family;
      if (!seenUrls.has(font.cssImportUrl)) {
        importLines.push(`@import url("${font.cssImportUrl}");`);
        seenUrls.add(font.cssImportUrl);
      }
    }
  }
  if (resolved.font_heading && resolved.font_heading !== resolved.font_body) {
    const font = getFont(resolved.font_heading);
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
  if (resolved.radius != null) {
    lines.push(...radiusLines(resolved.radius));
  }
  lines.push(...customOverrides);
  lines.push(...fontLines);
  lines.push("}");

  lines.push(".dark {");
  for (const [key, value] of Object.entries(theme.dark)) {
    lines.push(`  ${key}: ${value};`);
  }
  if (resolved.radius != null) {
    lines.push(...radiusLines(resolved.radius));
  }
  lines.push(...customOverrides);
  lines.push("}");

  return lines.join("\n");
}
