import 'package:flutter/painting.dart';

/// 4pt / 8dp spacing system for the Tamga iOS minimal design.
///
/// Follows Apple's HIG and Material 3 spacing conventions.
/// All values in logical pixels.
abstract final class AppSpacing {
  // ── Base Grid ──────────────────────────────────────────────────────
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double xxxl = 32;
  static const double xxxxl = 40;
  static const double section = 48;
  static const double page = 64;

  // ── Horizontal Insets ──────────────────────────────────────────────
  /// Standard screen horizontal padding (16dp).
  static const EdgeInsets horizontalInset = EdgeInsets.symmetric(
    horizontal: lg,
  );

  /// Standard screen padding (16dp all sides).
  static const EdgeInsets screenPadding = EdgeInsets.all(lg);

  /// Compact horizontal padding for grouped lists (20dp).
  static const EdgeInsets groupedHorizontalInset = EdgeInsets.symmetric(
    horizontal: xl,
  );

  // ── Card / List Tile ───────────────────────────────────────────────
  /// Standard card content padding.
  static const EdgeInsets cardPadding = EdgeInsets.all(lg);

  /// Compact card content padding.
  static const EdgeInsets cardPaddingCompact = EdgeInsets.all(md);

  /// List-style cell padding (row).
  static const EdgeInsets listCellPadding = EdgeInsets.symmetric(
    horizontal: lg,
    vertical: md,
  );

  // ── Bottom Sheet ───────────────────────────────────────────────────
  static const EdgeInsets sheetPadding = EdgeInsets.fromLTRB(lg, md, lg, xxl);

  // ─── Section Gaps ──────────────────────────────────────────────────
  static const double sectionGap = xxl;
  static const double elementGap = lg;
  static const double itemGap = md;
  static const double inlineGap = sm;

  // ── Border Radius ──────────────────────────────────────────────────
  /// iOS standard corner radius (13pt).
  static const double cornerRadius = 13;

  /// Small radius for inline controls.
  static const double cornerRadiusSmall = 8;

  /// Pill shape for badges / chips.
  static const double cornerRadiusPill = 999;

  // ── Divider / Hairline ─────────────────────────────────────────────
  static const double hairline = 0.5;
}
