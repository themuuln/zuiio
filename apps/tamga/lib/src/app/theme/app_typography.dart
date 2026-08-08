import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// iOS-inspired type scale for the Tamga design system.
/// Follows Apple's Dynamic Type scale:
/// - System font (SF Pro on iOS, Roboto on Android) for platform authenticity
/// - Weight hierarchy: Regular (400), Medium (500), Semibold (600)
/// - Size scale based on iOS HIG
///
/// All text styles use [Color] references from [AppColors] — never raw hex.
abstract final class AppTypography {
  static const _largeTitleSize = 34.0;
  static const _title1Size = 28.0;
  static const _title2Size = 22.0;
  static const _title3Size = 20.0;
  static const _headlineSize = 17.0;
  static const _bodySize = 17.0;
  static const _calloutSize = 16.0;
  static const _subheadlineSize = 15.0;
  static const _footnoteSize = 13.0;
  static const _caption1Size = 12.0;
  static const _caption2Size = 11.0;

  /// Large Title — 34pt Semibold. Use sparingly for top-level screens.
  static TextStyle largeTitle({
    FontWeight weight = FontWeight.w600,
    Color? color,
  }) => TextStyle(
    fontSize: _largeTitleSize,
    fontWeight: weight,
    color: color ?? AppColors.foreground,
    letterSpacing: 0.37,
  );

  /// Title 1 — 28pt Semibold. Primary screen titles.
  static TextStyle title1({
    FontWeight weight = FontWeight.w600,
    Color? color,
  }) => TextStyle(
    fontSize: _title1Size,
    fontWeight: weight,
    color: color ?? AppColors.foreground,
    letterSpacing: 0.36,
  );

  /// Title 2 — 22pt Semibold. Section headers.
  static TextStyle title2({
    FontWeight weight = FontWeight.w600,
    Color? color,
  }) => TextStyle(
    fontSize: _title2Size,
    fontWeight: weight,
    color: color ?? AppColors.foreground,
    letterSpacing: 0.35,
  );

  /// Title 3 — 20pt Semibold. Subsection headers.
  static TextStyle title3({
    FontWeight weight = FontWeight.w600,
    Color? color,
  }) => TextStyle(
    fontSize: _title3Size,
    fontWeight: weight,
    color: color ?? AppColors.foreground,
    letterSpacing: 0.34,
  );

  /// Headline — 17pt Semibold. Emphasised body text.
  static TextStyle headline({
    FontWeight weight = FontWeight.w600,
    double fontSize = _headlineSize,
    Color? color,
  }) => TextStyle(
    fontSize: fontSize,
    fontWeight: weight,
    color: color ?? AppColors.foreground,
    letterSpacing: -0.41,
  );

  /// Body — 17pt Regular. Primary reading text.
  static TextStyle body({FontWeight weight = FontWeight.w400, Color? color}) =>
      TextStyle(
        fontSize: _bodySize,
        fontWeight: weight,
        color: color ?? AppColors.foreground,
        letterSpacing: -0.41,
      );

  /// Callout — 16pt Regular. Secondary reading text.
  static TextStyle callout({
    FontWeight weight = FontWeight.w400,
    Color? color,
  }) => TextStyle(
    fontSize: _calloutSize,
    fontWeight: weight,
    color: color ?? AppColors.foreground,
    letterSpacing: -0.32,
  );

  /// Subheadline — 15pt Regular. Tertiary text.
  static TextStyle subheadline({
    FontWeight weight = FontWeight.w400,
    Color? color,
  }) => TextStyle(
    fontSize: _subheadlineSize,
    fontWeight: weight,
    color: color ?? AppColors.mutedForeground,
    letterSpacing: -0.24,
  );

  /// Footnote — 13pt Regular. Captions and supplementary info.
  static TextStyle footnote({
    FontWeight weight = FontWeight.w400,
    Color? color,
  }) => TextStyle(
    fontSize: _footnoteSize,
    fontWeight: weight,
    color: color ?? AppColors.mutedForeground,
    letterSpacing: -0.08,
  );

  /// Caption 1 — 12pt Regular. Small labels, timestamps.
  static TextStyle caption1({
    FontWeight weight = FontWeight.w400,
    Color? color,
  }) => TextStyle(
    fontSize: _caption1Size,
    fontWeight: weight,
    color: color ?? AppColors.mutedForeground,
    letterSpacing: 0,
  );

  /// Caption 2 — 11pt Regular. Smallest UI text.
  static TextStyle caption2({
    FontWeight weight = FontWeight.w400,
    Color? color,
  }) => TextStyle(
    fontSize: _caption2Size,
    fontWeight: weight,
    color: color ?? AppColors.mutedForeground,
    letterSpacing: 0.07,
  );

  // ── Material TextTheme Builder ─────────────────────────────────────

  /// Maps our iOS scale to Flutter's [TextTheme] so Material widgets
  /// automatically pick up the correct sizing.
  static TextTheme textTheme() {
    return TextTheme(
      displayLarge: largeTitle(),
      displayMedium: title1(),
      displaySmall: title2(),
      headlineLarge: title3(),
      headlineMedium: headline(),
      headlineSmall: headline(weight: FontWeight.w500),
      titleLarge: body(weight: FontWeight.w600),
      titleMedium: body(),
      titleSmall: callout(),
      bodyLarge: body(),
      bodyMedium: callout(),
      bodySmall: subheadline(),
      labelLarge: headline(fontSize: _footnoteSize),
      labelMedium: footnote(),
      labelSmall: caption1(),
    );
  }

  /// Returns the same [TextTheme] but rendered with Google Fonts (Inter).
  static TextTheme googleFontsTextTheme() {
    return GoogleFonts.interTextTheme(textTheme());
  }
}

// ── Font size constants ─────────────────────────────────────────────────

abstract final class FontSize {
  static const double largeTitle = 34;
  static const double title1 = 28;
  static const double title2 = 22;
  static const double title3 = 20;
  static const double headline = 17;
  static const double body = 17;
  static const double callout = 16;
  static const double subheadline = 15;
  static const double footnote = 13;
  static const double caption1 = 12;
  static const double caption2 = 11;
}
