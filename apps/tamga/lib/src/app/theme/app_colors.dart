import 'package:flutter/material.dart';

/// Color palette derived from oklch design tokens.
///
/// Primary: vibrant Hermes orange (#F06A2E) with warm neutrals.
/// Dark mode uses shifted orange (#E87045) with semi-transparent borders.
///
/// Rules:
/// 1. Never use raw hex in widgets — always reference `AppColors` tokens
/// 2. Primary actions use `primary` (orange), not a system color
/// 3. Error states always use `destructive`
/// 4. Text: `foreground` (default), `mutedForeground` (supporting)
abstract final class AppColors {
  // ── Light surfaces ──
  static const Color background = Color(0xFFFDF6F3); // neutral 50
  static const Color foreground = Color(0xFF2E2D2C); // neutral 500

  static const Color card = Color(0xFFFFFFFF);
  static const Color cardForeground = Color(0xFF2E2D2C);

  static const Color popover = Color(0xFFFFFFFF);
  static const Color popoverForeground = Color(0xFF2E2D2C);

  // ── Primary — Hermes orange oklch(0.68 0.18 42) ──
  static const Color primary = Color(0xFFF06A2E); // primary 500
  static const Color primaryForeground = Color(0xFFFFFFFF);

  // ── Secondary / Accent ──
  static const Color secondary = Color(0xFFF1E6E2); // neutral 100
  static const Color secondaryForeground = Color(0xFF2E2D2C);

  // ── Muted / Disabled ──
  static const Color muted = Color(0xFFF1E6E2); // neutral 100
  static const Color mutedForeground = Color(0xFF625F5D); // neutral 400

  static const Color accent = Color(0xFFF1E6E2);
  static const Color accentForeground = Color(0xFF2E2D2C);

  // ── Destructive / Error ──
  static const Color destructive = Color(0xFFC41012); // danger 500
  static const Color destructiveForeground = Color(0xFFFFFFFF);

  // ── Borders / Input ──
  static const Color border = Color(0xFFD4CBC8); // neutral 200
  static const Color input = Color(0xFFADA7A4); // neutral 300
  static const Color ring = Color(0xFFADA7A4); // neutral 300

  // ── Charts ──
  static const Color chart1 = Color(0xFFE87A48); // primary 300
  static const Color chart2 = Color(0xFFCC5824); // primary 600
  static const Color chart3 = Color(0xFFF06A2E); // primary 500
  static const Color chart4 = Color(0xFFA14721); // primary 700
  static const Color chart5 = Color(0xFF7C3A1F); // primary 800

  // ── Sidebar ──
  static const Color sidebar = Color(0xFFFDF6F3);
  static const Color sidebarForeground = Color(0xFF2E2D2C);
  static const Color sidebarPrimary = Color(0xFFF06A2E);
  static const Color sidebarPrimaryForeground = Color(0xFFFFFFFF);
  static const Color sidebarAccent = Color(0xFFF1E6E2);
  static const Color sidebarAccentForeground = Color(0xFF2E2D2C);
  static const Color sidebarBorder = Color(0xFFD4CBC8);
  static const Color sidebarRing = Color(0xFFADA7A4);

  // ═══════════════════════════════════════════════
  // Dark mode — shifted warmer hue (H=40)
  // ═══════════════════════════════════════════════
  static const Color darkBackground = Color(0xFF0D0B0A); // dark surface
  static const Color darkForeground = Color(0xFFF7EEEB);

  static const Color darkCard = Color(0xFF151211);
  static const Color darkCardForeground = Color(0xFFF7EEEB);

  static const Color darkPopover = Color(0xFF151211);
  static const Color darkPopoverForeground = Color(0xFFF7EEEB);

  /// Dark mode primary — oklch(0.68 0.16 40) = #E87045
  static const Color darkPrimary = Color(0xFFE87045);
  static const Color darkPrimaryForeground = Color(0xFFFFFFFF);

  static const Color darkSecondary = Color(0xFF1E1A19);
  static const Color darkSecondaryForeground = Color(0xFFF7EEEB);

  static const Color darkMuted = Color(0xFF1E1A19);
  static const Color darkMutedForeground = Color(0xFFA09895);

  static const Color darkAccent = Color(0xFF1E1A19);
  static const Color darkAccentForeground = Color(0xFFF7EEEB);

  static const Color darkDestructive = Color(0xFFC41012);
  static const Color darkDestructiveForeground = Color(0xFFFFFFFF);

  static const Color darkBorder = Color(0x1AFFFFFF); // 10% white
  static const Color darkInput = Color(0x26FFFFFF); // 15% white
  static const Color darkRing = Color(0xFFA09895);

  // ── Semantic colors ──
  static const Color success = Color(0xFF0A6B1C); // success 500
  static const Color warning = Color(0xFFB55A0A); // warning 500
  static const Color info = Color(0xFF0A3BA8); // info 500

  // ── Primary scale (for background tints, badges, etc.) ──
  static const Color primary50 = Color(0xFFFFEDE1);
  static const Color primary100 = Color(0xFFFFDBC8);
  static const Color primary200 = Color(0xFFF5956B);
  static const Color primary300 = Color(0xFFE87A48);
  static const Color primary400 = Color(0xFFE06830);
  static const Color primary600 = Color(0xFFCC5824);
  static const Color primary700 = Color(0xFFA14721);
  static const Color primary800 = Color(0xFF7C3A1F);
  static const Color primary900 = Color(0xFF5A2A15);
  static const Color primary950 = Color(0xFF361A0D);

  // ── Semantic badge helpers ──
  static const Color successLight = Color(0xFFBFF3C4); // success 50
  static const Color warningLight = Color(0xFFFFDCA9); // warning 50
  static const Color dangerLight = Color(0xFFFFCEC7); // danger 50
  static const Color infoLight = Color(0xFFC7E5FF); // info 50

  // Deprecated: use the new token names above.
  static const Color earthBrown = primary;
  static const Color earthTan = Color(0xFFFFDBC8); // primary 100
  static const Color earthPale = Color(0xFFFFEDE1); // primary 50
  static const Color earthDark = foreground;
  static const Color sageGreen = Color(0xFF0A6B1C);
  static const Color sageGreenLight = Color(0xFFBFF3C4);
  static const Color labelPrimary = foreground;
  static const Color labelSecondary = mutedForeground;
  static const Color labelTertiary = mutedForeground;
  static const Color labelQuaternary = border;
  static const Color separator = border;
  static const Color separatorOpaque = Color(0xFFADA7A4);
  static const Color fillPrimary = Color(0xFFD4CBC8);
  static const Color fillSecondary = muted;
  static const Color fillTertiary = Color(0x44FFFFFF);
  static const Color fillQuaternary = Color(0x1AFFFFFF);
  static const Color systemBlue = primary;
  static const Color systemGreen = Color(0xFF0A6B1C);
  static const Color systemRed = destructive;
  static const Color systemOrange = warning;
  static const Color systemYellow = Color(0xFFB55A0A);
  static const Color systemTeal = Color(0xFF0A3BA8);
  static const Color systemPurple = Color(0xFF8B6BB0);
  static const Color systemPink = Color(0xFFD45C7A);
  static const Color systemGray = mutedForeground;
  static const Color systemGray2 = Color(0xFFADA7A4);
  static const Color systemGray3 = Color(0xFFD4CBC8);
  static const Color systemGray4 = Color(0xFFE5E0DD);
  static const Color systemGray5 = Color(0xFFF1E6E2);
  static const Color systemGray6 = Color(0xFFFDF6F3);
  static const Color systemBackground = Color(0xFFFDF6F3);
  static const Color systemGroupedBackground = Color(0xFFF1E6E2);
  static const Color systemWhite = background;

  /// Build a Material [ColorScheme] from the oklch light tokens.
  static ColorScheme materialScheme() {
    return const ColorScheme(
      brightness: Brightness.light,
      primary: primary,
      onPrimary: primaryForeground,
      primaryContainer: Color(0xFFFFEDE1), // primary 50
      onPrimaryContainer: Color(0xFF361A0D), // primary 950
      secondary: secondary,
      onSecondary: secondaryForeground,
      secondaryContainer: Color(0xFFF1E6E2), // neutral 100
      onSecondaryContainer: Color(0xFF2E2D2C), // neutral 500
      tertiary: Color(0xFF0A6B1C), // success
      onTertiary: Colors.white,
      tertiaryContainer: Color(0xFFBFF3C4), // success 50
      onTertiaryContainer: Color(0xFF032A0B), // success 700
      error: destructive,
      onError: destructiveForeground,
      surface: background,
      onSurface: foreground,
      onSurfaceVariant: mutedForeground,
      outline: border,
      outlineVariant: Color(0xFFADA7A4), // neutral 300
      shadow: Color(0x14000000),
      scrim: Colors.black,
      inverseSurface: Color(0xFF2E2D2C), // neutral 500
      inversePrimary: Color(0xFFFFDBC8), // primary 100
      surfaceContainerLowest: Colors.white,
      surfaceContainerLow: Color(0xFFFDF6F3), // neutral 50
      surfaceContainer: Color(0xFFF1E6E2), // neutral 100
      surfaceContainerHigh: Color(0xFFD4CBC8), // neutral 200
      surfaceContainerHighest: Color(0xFFADA7A4), // neutral 300
    );
  }

  /// Build a Material [ColorScheme] from the oklch dark tokens.
  static ColorScheme darkMaterialScheme() {
    return const ColorScheme(
      brightness: Brightness.dark,
      primary: darkPrimary,
      onPrimary: darkPrimaryForeground,
      primaryContainer: Color(0xFF361A0D), // primary 950
      onPrimaryContainer: Color(0xFFFFEDE1), // primary 50
      secondary: darkSecondary,
      onSecondary: darkSecondaryForeground,
      secondaryContainer: Color(0xFF151211), // dark card
      onSecondaryContainer: Color(0xFFF7EEEB),
      tertiary: Color(0xFF0A6B1C), // success
      onTertiary: Colors.white,
      tertiaryContainer: Color(0xFF032A0B), // success 700
      onTertiaryContainer: Color(0xFFBFF3C4), // success 50
      error: darkDestructive,
      onError: darkDestructiveForeground,
      surface: darkBackground,
      onSurface: darkForeground,
      onSurfaceVariant: darkMutedForeground,
      outline: darkBorder,
      outlineVariant: Color(0x14FFFFFF),
      shadow: Color(0x3D000000),
      scrim: Colors.black,
      inverseSurface: Color(0xFFF7EEEB),
      inversePrimary: Color(0xFFF06A2E), // primary 500
      surfaceContainerLowest: Color(0xFF0D0B0A),
      surfaceContainerLow: darkBackground,
      surfaceContainer: darkCard,
      surfaceContainerHigh: darkSecondary,
      surfaceContainerHighest: Color(0xFF2E2D2C),
    );
  }
}
