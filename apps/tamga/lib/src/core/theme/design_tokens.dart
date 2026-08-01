import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_spacing.dart';
import '../../app/theme/app_typography.dart';

/// Design tokens for the Tamga app.
/// Single import point for all design values. Provides:
/// - [TamgaColors] — Color palette with light/dark mode support
/// - [TamgaSpacing] — Spacing scale (re-exports AppSpacing)
/// - [TamgaTypography] — Type scale (re-exports AppTypography)
///
/// ## Usage
/// ```dart
/// import 'package:tamga/src/core/theme/design_tokens.dart';
///
/// Container(
///   color: TamgaColors.of(ctx).primary,
///   padding: TamgaSpacing.cardPadding,
///   child: Text('Hello', style: TamgaTypography.body()),
/// );
/// ```
@immutable
class TamgaColors extends ThemeExtension<TamgaColors> {
  const TamgaColors({
    required this.primary,
    required this.onPrimary,
    required this.primaryContainer,
    required this.onPrimaryContainer,
    required this.secondary,
    required this.onSecondary,
    required this.secondaryContainer,
    required this.onSecondaryContainer,
    required this.tertiary,
    required this.onTertiary,
    required this.surface,
    required this.onSurface,
    required this.onSurfaceVariant,
    required this.surfaceContainerLowest,
    required this.surfaceContainerLow,
    required this.surfaceContainer,
    required this.surfaceContainerHigh,
    required this.surfaceContainerHighest,
    required this.error,
    required this.onError,
    required this.outline,
    required this.outlineVariant,
    required this.shadow,
    // Semantic tokens
    required this.foreground,
    required this.mutedForeground,
    required this.destructive,
    required this.destructiveForeground,
    required this.border,
    required this.input,
    required this.ring,
    // Legacy aliases (deprecated — use semantic tokens above)
    required this.earthBrown,
    required this.earthDark,
    required this.labelPrimary,
    required this.labelSecondary,
    required this.labelTertiary,
  });

  final Color primary;
  final Color onPrimary;
  final Color primaryContainer;
  final Color onPrimaryContainer;
  final Color secondary;
  final Color onSecondary;
  final Color secondaryContainer;
  final Color onSecondaryContainer;
  final Color tertiary;
  final Color onTertiary;
  final Color surface;
  final Color onSurface;
  final Color onSurfaceVariant;
  final Color surfaceContainerLowest;
  final Color surfaceContainerLow;
  final Color surfaceContainer;
  final Color surfaceContainerHigh;
  final Color surfaceContainerHighest;
  final Color error;
  final Color onError;
  final Color outline;
  final Color outlineVariant;
  final Color shadow;

  final Color foreground;
  final Color mutedForeground;
  final Color destructive;
  final Color destructiveForeground;
  final Color border;
  final Color input;
  final Color ring;

  // Legacy aliases — keep existing code compiling during migration
  final Color earthBrown;
  final Color earthDark;
  final Color labelPrimary;
  final Color labelSecondary;
  final Color labelTertiary;

  // ── Light ───────────────────────────────────────────────────────────
  static const light = TamgaColors(
    primary: AppColors.primary,
    onPrimary: AppColors.primaryForeground,
    primaryContainer: Color(0xFFFAE8D0),
    onPrimaryContainer: Color(0xFF2A1500),
    secondary: AppColors.secondary,
    onSecondary: AppColors.secondaryForeground,
    secondaryContainer: Color(0xFFEDEDED),
    onSecondaryContainer: Color(0xFF1A1A1A),
    tertiary: Color(0xFF6B8F6B),
    onTertiary: Colors.white,
    surface: AppColors.background,
    onSurface: AppColors.foreground,
    onSurfaceVariant: AppColors.mutedForeground,
    surfaceContainerLowest: Colors.white,
    surfaceContainerLow: Color(0xFFFAFAFA),
    surfaceContainer: Color(0xFFF5F5F5),
    surfaceContainerHigh: Color(0xFFEEEEEE),
    surfaceContainerHighest: Color(0xFFE5E5E5),
    error: AppColors.destructive,
    onError: AppColors.destructiveForeground,
    outline: AppColors.border,
    outlineVariant: Color(0xFFD9D9D9),
    shadow: Color(0x14000000),
    foreground: AppColors.foreground,
    mutedForeground: AppColors.mutedForeground,
    destructive: AppColors.destructive,
    destructiveForeground: AppColors.destructiveForeground,
    border: AppColors.border,
    input: AppColors.input,
    ring: AppColors.ring,
    earthBrown: AppColors.primary,
    earthDark: AppColors.foreground,
    labelPrimary: AppColors.foreground,
    labelSecondary: AppColors.mutedForeground,
    labelTertiary: AppColors.mutedForeground,
  );

  // ── Dark ────────────────────────────────────────────────────────────
  static const dark = TamgaColors(
    primary: AppColors.darkPrimary,
    onPrimary: AppColors.darkPrimaryForeground,
    primaryContainer: Color(0xFF5C3410),
    onPrimaryContainer: Color(0xFFFBE8D0),
    secondary: AppColors.darkSecondary,
    onSecondary: AppColors.darkSecondaryForeground,
    secondaryContainer: Color(0xFF333333),
    onSecondaryContainer: Color(0xFFE5E5E5),
    tertiary: Color(0xFF8CB88C),
    onTertiary: Color(0xFF1A2E1A),
    surface: AppColors.darkBackground,
    onSurface: AppColors.darkForeground,
    onSurfaceVariant: AppColors.darkMutedForeground,
    surfaceContainerLowest: Color(0xFF1A1A1A),
    surfaceContainerLow: AppColors.darkBackground,
    surfaceContainer: AppColors.darkCard,
    surfaceContainerHigh: AppColors.darkSecondary,
    surfaceContainerHighest: Color(0xFF555555),
    error: AppColors.darkDestructive,
    onError: AppColors.darkDestructiveForeground,
    outline: AppColors.darkBorder,
    outlineVariant: Color(0x14FFFFFF),
    shadow: Color(0x3D000000),
    foreground: AppColors.darkForeground,
    mutedForeground: AppColors.darkMutedForeground,
    destructive: AppColors.darkDestructive,
    destructiveForeground: AppColors.darkDestructiveForeground,
    border: AppColors.darkBorder,
    input: AppColors.darkInput,
    ring: AppColors.darkRing,
    earthBrown: AppColors.darkPrimary,
    earthDark: AppColors.darkForeground,
    labelPrimary: AppColors.darkForeground,
    labelSecondary: AppColors.darkMutedForeground,
    labelTertiary: Color(0xFF636366),
  );

  static TamgaColors of(BuildContext context) {
    return Theme.of(context).extension<TamgaColors>() ?? TamgaColors.light;
  }

  @override
  TamgaColors copyWith({
    Color? primary,
    Color? onPrimary,
    Color? primaryContainer,
    Color? onPrimaryContainer,
    Color? secondary,
    Color? onSecondary,
    Color? secondaryContainer,
    Color? onSecondaryContainer,
    Color? tertiary,
    Color? onTertiary,
    Color? surface,
    Color? onSurface,
    Color? onSurfaceVariant,
    Color? surfaceContainerLowest,
    Color? surfaceContainerLow,
    Color? surfaceContainer,
    Color? surfaceContainerHigh,
    Color? surfaceContainerHighest,
    Color? error,
    Color? onError,
    Color? outline,
    Color? outlineVariant,
    Color? shadow,
    Color? foreground,
    Color? mutedForeground,
    Color? destructive,
    Color? destructiveForeground,
    Color? border,
    Color? input,
    Color? ring,
    Color? earthBrown,
    Color? earthDark,
    Color? labelPrimary,
    Color? labelSecondary,
    Color? labelTertiary,
  }) {
    return TamgaColors(
      primary: primary ?? this.primary,
      onPrimary: onPrimary ?? this.onPrimary,
      primaryContainer: primaryContainer ?? this.primaryContainer,
      onPrimaryContainer: onPrimaryContainer ?? this.onPrimaryContainer,
      secondary: secondary ?? this.secondary,
      onSecondary: onSecondary ?? this.onSecondary,
      secondaryContainer: secondaryContainer ?? this.secondaryContainer,
      onSecondaryContainer: onSecondaryContainer ?? this.onSecondaryContainer,
      tertiary: tertiary ?? this.tertiary,
      onTertiary: onTertiary ?? this.onTertiary,
      surface: surface ?? this.surface,
      onSurface: onSurface ?? this.onSurface,
      onSurfaceVariant: onSurfaceVariant ?? this.onSurfaceVariant,
      surfaceContainerLowest:
          surfaceContainerLowest ?? this.surfaceContainerLowest,
      surfaceContainerLow: surfaceContainerLow ?? this.surfaceContainerLow,
      surfaceContainer: surfaceContainer ?? this.surfaceContainer,
      surfaceContainerHigh: surfaceContainerHigh ?? this.surfaceContainerHigh,
      surfaceContainerHighest:
          surfaceContainerHighest ?? this.surfaceContainerHighest,
      error: error ?? this.error,
      onError: onError ?? this.onError,
      outline: outline ?? this.outline,
      outlineVariant: outlineVariant ?? this.outlineVariant,
      shadow: shadow ?? this.shadow,
      foreground: foreground ?? this.foreground,
      mutedForeground: mutedForeground ?? this.mutedForeground,
      destructive: destructive ?? this.destructive,
      destructiveForeground:
          destructiveForeground ?? this.destructiveForeground,
      border: border ?? this.border,
      input: input ?? this.input,
      ring: ring ?? this.ring,
      earthBrown: earthBrown ?? this.earthBrown,
      earthDark: earthDark ?? this.earthDark,
      labelPrimary: labelPrimary ?? this.labelPrimary,
      labelSecondary: labelSecondary ?? this.labelSecondary,
      labelTertiary: labelTertiary ?? this.labelTertiary,
    );
  }

  @override
  TamgaColors lerp(TamgaColors? other, double t) {
    if (other is! TamgaColors) return this;
    return TamgaColors(
      primary: Color.lerp(primary, other.primary, t)!,
      onPrimary: Color.lerp(onPrimary, other.onPrimary, t)!,
      primaryContainer: Color.lerp(
        primaryContainer,
        other.primaryContainer,
        t,
      )!,
      onPrimaryContainer: Color.lerp(
        onPrimaryContainer,
        other.onPrimaryContainer,
        t,
      )!,
      secondary: Color.lerp(secondary, other.secondary, t)!,
      onSecondary: Color.lerp(onSecondary, other.onSecondary, t)!,
      secondaryContainer: Color.lerp(
        secondaryContainer,
        other.secondaryContainer,
        t,
      )!,
      onSecondaryContainer: Color.lerp(
        onSecondaryContainer,
        other.onSecondaryContainer,
        t,
      )!,
      tertiary: Color.lerp(tertiary, other.tertiary, t)!,
      onTertiary: Color.lerp(onTertiary, other.onTertiary, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      onSurface: Color.lerp(onSurface, other.onSurface, t)!,
      onSurfaceVariant: Color.lerp(
        onSurfaceVariant,
        other.onSurfaceVariant,
        t,
      )!,
      surfaceContainerLowest: Color.lerp(
        surfaceContainerLowest,
        other.surfaceContainerLowest,
        t,
      )!,
      surfaceContainerLow: Color.lerp(
        surfaceContainerLow,
        other.surfaceContainerLow,
        t,
      )!,
      surfaceContainer: Color.lerp(
        surfaceContainer,
        other.surfaceContainer,
        t,
      )!,
      surfaceContainerHigh: Color.lerp(
        surfaceContainerHigh,
        other.surfaceContainerHigh,
        t,
      )!,
      surfaceContainerHighest: Color.lerp(
        surfaceContainerHighest,
        other.surfaceContainerHighest,
        t,
      )!,
      error: Color.lerp(error, other.error, t)!,
      onError: Color.lerp(onError, other.onError, t)!,
      outline: Color.lerp(outline, other.outline, t)!,
      outlineVariant: Color.lerp(outlineVariant, other.outlineVariant, t)!,
      shadow: Color.lerp(shadow, other.shadow, t)!,
      foreground: Color.lerp(foreground, other.foreground, t)!,
      mutedForeground: Color.lerp(mutedForeground, other.mutedForeground, t)!,
      destructive: Color.lerp(destructive, other.destructive, t)!,
      destructiveForeground: Color.lerp(
        destructiveForeground,
        other.destructiveForeground,
        t,
      )!,
      border: Color.lerp(border, other.border, t)!,
      input: Color.lerp(input, other.input, t)!,
      ring: Color.lerp(ring, other.ring, t)!,
      earthBrown: Color.lerp(earthBrown, other.earthBrown, t)!,
      earthDark: Color.lerp(earthDark, other.earthDark, t)!,
      labelPrimary: Color.lerp(labelPrimary, other.labelPrimary, t)!,
      labelSecondary: Color.lerp(labelSecondary, other.labelSecondary, t)!,
      labelTertiary: Color.lerp(labelTertiary, other.labelTertiary, t)!,
    );
  }
}

// ── Brand Gradients ─────────────────────────────────────────────────────

/// Brand gradient presets for Tamga.
///
/// Provides pre-composed [LinearGradient] values that express the brand's
/// warm, earthy personality without dropping raw stops in widgets.
///
/// ## Usage
/// ```dart
/// Container(
///   decoration: BoxDecoration(gradient: TamgaGradients.brandWarm),
/// )
/// ```
abstract final class TamgaGradients {
  TamgaGradients._();

  /// Brand warm — primary orange (#F06A2E) to shifted coral (#E87045).
  /// Use on hero sections, splash screens, featured cards.
  static const brandWarm = LinearGradient(
    colors: [Color(0xFFF06A2E), Color(0xFFE87045)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Brand subtle — warm neutral to slightly lighter.
  /// Use on card overlays, section backgrounds.
  static const brandSubtle = LinearGradient(
    colors: [Color(0xFFFDF6F3), Color(0xFFF1E6E2)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  /// Hero gradient — deep amber to rich dark orange.
  /// Use on full-screen hero banners, splash screen.
  static const hero = LinearGradient(
    colors: [Color(0xFFF06A2E), Color(0xFFA14721)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  /// Dark surface — subtle warm gradient for dark mode surfaces.
  static const darkSurface = LinearGradient(
    colors: [Color(0xFF151211), Color(0xFF1E1A19)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}

// ── Motion ──────────────────────────────────────────────────────────────

/// Motion tokens — branded animation constants.
///
/// A single source of truth for animation durations, easing curves, and
/// spring parameters. Use instead of hardcoded values to ensure consistent
/// micro-interactions across the app.
///
/// ## Usage
/// ```dart
/// AnimatedContainer(
///   duration: TamgaMotion.durationNormal,
///   curve: TamgaMotion.easingEnter,
///   // ...
/// )
/// ```
abstract final class TamgaMotion {
  TamgaMotion._();

  // ── Durations ──

  /// Instant — 50ms. Barely perceptible color/opacity flicks.
  static const durationInstant = Duration(milliseconds: 50);

  /// Fast — 100ms. Micro-interactions, press feedback, toggles.
  static const durationFast = Duration(milliseconds: 100);

  /// Normal — 200ms. Standard transitions, accordion, list items.
  static const durationNormal = Duration(milliseconds: 200);

  /// Page — 350ms. Page-level transitions, dialogs, bottom sheets.
  static const durationPage = Duration(milliseconds: 350);

  /// Slow — 500ms. Emphasized transitions, hero animations.
  static const durationSlow = Duration(milliseconds: 500);

  // ── Easing Curves ──

  /// Standard ease-in-out for general-purpose transitions.
  static const easingStandard = Curves.easeInOut;

  /// Enter — decelerated ease-out. Use when things appear.
  static const easingEnter = Curves.easeOut;

  /// Exit — accelerated ease-in. Use when things leave.
  static const easingExit = Curves.easeIn;

  /// Emphasized ease-in-out-cubic — steeper curve for hero / large changes.
  static const easingEmphasized = Curves.easeInOutCubicEmphasized;

  // ── Spring constants (for physics-based animations) ──

  /// Stiffness for press feedback: 400.
  static const double stiffnessPress = 400;

  /// Damping for press feedback: 30 (overdamped, minimal bounce).
  static const double dampingPress = 30;

  /// Stiffness for page transitions: 200.
  static const double stiffnessPage = 200;

  /// Damping for page transitions: 20 (subtle overshoot).
  static const double dampingPage = 20;

  /// Stiffness for hero animations: 150.
  static const double stiffnessHero = 150;

  /// Damping for hero animations: 25.
  static const double dampingHero = 25;

  /// Default mass for spring simulations: 1.0.
  static const double massDefault = 1.0;
}

// ── Spacing ─────────────────────────────────────────────────────────────
abstract final class TamgaSpacing {
  static const double xs = AppSpacing.xs;
  static const double sm = AppSpacing.sm;
  static const double md = AppSpacing.md;
  static const double lg = AppSpacing.lg;
  static const double xl = AppSpacing.xl;
  static const double xxl = AppSpacing.xxl;
  static const double xxxl = AppSpacing.xxxl;
  static const double xxxxl = AppSpacing.xxxxl;
  static const double section = AppSpacing.section;
  static const double page = AppSpacing.page;
  static const EdgeInsets horizontalInset = AppSpacing.horizontalInset;
  static const EdgeInsets screenPadding = AppSpacing.screenPadding;
  static const EdgeInsets groupedHorizontalInset =
      AppSpacing.groupedHorizontalInset;
  static const EdgeInsets cardPadding = AppSpacing.cardPadding;
  static const EdgeInsets cardPaddingCompact = AppSpacing.cardPaddingCompact;
  static const EdgeInsets listCellPadding = AppSpacing.listCellPadding;
  static const EdgeInsets sheetPadding = AppSpacing.sheetPadding;
  static const double sectionGap = AppSpacing.sectionGap;
  static const double elementGap = AppSpacing.elementGap;
  static const double itemGap = AppSpacing.itemGap;
  static const double inlineGap = AppSpacing.inlineGap;
  static const double cornerRadius = AppSpacing.cornerRadius;
  static const double cornerRadiusSmall = AppSpacing.cornerRadiusSmall;
  static const double cornerRadiusPill = AppSpacing.cornerRadiusPill;
  static const double hairline = AppSpacing.hairline;
}

// ── Typography ──────────────────────────────────────────────────────────
abstract final class TamgaTypography {
  static TextStyle largeTitle({
    FontWeight weight = FontWeight.w600,
    Color? color,
  }) => AppTypography.largeTitle(weight: weight, color: color);
  static TextStyle title1({
    FontWeight weight = FontWeight.w600,
    Color? color,
  }) => AppTypography.title1(weight: weight, color: color);
  static TextStyle title2({
    FontWeight weight = FontWeight.w600,
    Color? color,
  }) => AppTypography.title2(weight: weight, color: color);
  static TextStyle title3({
    FontWeight weight = FontWeight.w600,
    Color? color,
  }) => AppTypography.title3(weight: weight, color: color);
  static TextStyle headline({
    FontWeight weight = FontWeight.w600,
    double fontSize = 17,
    Color? color,
  }) =>
      AppTypography.headline(weight: weight, fontSize: fontSize, color: color);
  static TextStyle body({FontWeight weight = FontWeight.w400, Color? color}) =>
      AppTypography.body(weight: weight, color: color);
  static TextStyle callout({
    FontWeight weight = FontWeight.w400,
    Color? color,
  }) => AppTypography.callout(weight: weight, color: color);
  static TextStyle subheadline({
    FontWeight weight = FontWeight.w400,
    Color? color,
  }) => AppTypography.subheadline(weight: weight, color: color);
  static TextStyle footnote({
    FontWeight weight = FontWeight.w400,
    Color? color,
  }) => AppTypography.footnote(weight: weight, color: color);
  static TextStyle caption1({
    FontWeight weight = FontWeight.w400,
    Color? color,
  }) => AppTypography.caption1(weight: weight, color: color);
  static TextStyle caption2({
    FontWeight weight = FontWeight.w400,
    Color? color,
  }) => AppTypography.caption2(weight: weight, color: color);

  static const double largeTitleSize = FontSize.largeTitle;
  static const double title1Size = FontSize.title1;
  static const double title2Size = FontSize.title2;
  static const double title3Size = FontSize.title3;
  static const double headlineSize = FontSize.headline;
  static const double bodySize = FontSize.body;
  static const double calloutSize = FontSize.callout;
  static const double subheadlineSize = FontSize.subheadline;
  static const double footnoteSize = FontSize.footnote;
  static const double caption1Size = FontSize.caption1;
  static const double caption2Size = FontSize.caption2;
}

// ── Breakpoints ─────────────────────────────────────────────────────────
abstract final class Breakpoints {
  static const double mobile = 0;
  static const double tablet = 600;
  static const double desktop = 1024;
  static const double mobileMax = 599;
  static const double tabletMax = 1023;

  static bool isMobile(BuildContext context) =>
      MediaQuery.sizeOf(context).width < tablet;
  static bool isTablet(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    return width >= tablet && width < desktop;
  }

  static bool isDesktop(BuildContext context) =>
      MediaQuery.sizeOf(context).width >= desktop;
  static bool isCompact(BuildContext context) =>
      MediaQuery.sizeOf(context).width < tabletMax;
}
