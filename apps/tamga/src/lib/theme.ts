/**
 * Tamga theme colors — NativeWind-safe hex values.
 *
 * WHY: CSS custom properties (var(--primary)) don't resolve in React Native
 * inline `style` props. NativeWind only transforms `className` strings.
 * Components that need raw color values (tab bar, StatusBar, etc.) import
 * from here instead.
 *
 * Source of truth: global.css :root variables.
 */

export const Colors = {
  primary: "rgb(71, 56, 242)",
  primaryForeground: "rgb(247, 248, 252)",
  secondary: "rgb(241, 242, 245)",
  secondaryForeground: "rgb(4, 5, 12)",
  destructive: "rgb(212, 2, 55)",
  destructiveForeground: "rgb(247, 248, 252)",
  muted: "rgb(241, 242, 245)",
  mutedForeground: "rgb(82, 85, 96)",
  accent: "rgb(241, 242, 245)",
  accentForeground: "rgb(4, 5, 12)",
  background: "rgb(251, 252, 254)",
  foreground: "rgb(4, 5, 12)",
  card: "rgb(255, 255, 255)",
  cardForeground: "rgb(4, 5, 12)",
  border: "rgb(220, 222, 229)",
  input: "rgb(220, 222, 229)",
  ring: "rgb(71, 56, 242)",
} as const;
