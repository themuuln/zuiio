/// smooth_sheets-ийн [ModalSheetRoute]-г хялбархан дуудах туслах функц, extension.
///
/// [showModalBottomSheet]-г солих жишээ:
/// ```dart
/// // Before:
/// final result = await showModalBottomSheet<T>(
///   context: context,
///   isScrollControlled: true,
///   builder: (_) => MySheet(),
/// );
///
/// // After:
/// final result = await context.showSmoothSheet(
///   builder: (_) => MySheet(),
///   initialFraction: 0.5,
/// );
/// ```
library;

import 'package:flutter/material.dart';
import 'package:smooth_sheets/smooth_sheets.dart';

/// Өгөгдсөн widget-ийг smooth_sheets [ModalSheetRoute]-д ороосон Sheet.
///
/// - `initialFraction`: Эхний өндрийн хувь (0.0–1.0). null бол default (0.5).
/// - `snapFractions`: Snap grid цэгүүд. null бол default [0.5, 1.0].
/// - `swipeDismissible`: Чирч хаах боломжтой эсэх. Default true.
/// - `borderRadius`: Дээд булангийн радиус. null бол 20.
/// - `backgroundColor`: Дэвсгэр өнгө. null бол тунгалаг.
/// - `safeArea`: Доод SafeArea ашиглах эсэх (дээд талынхыг оруулахгүй — notch-оос
/// - `scrollConfiguration`: Scroll-ийн sheet-тэй интеграци хийх тохиргоо.
///   Default-оор [SheetScrollConfiguration]/disabled (унтраалгатай).
///   scrollable content агуулсан sheet-д `const SheetScrollConfiguration()`
///   дамжуулж, чирэх/scroll-ийг зохицуулах.

///   үүсэх том зайг арилгах). Default true.
Future<T?> pushSmoothSheet<T>(
  BuildContext context, {
  required Widget Function(BuildContext) builder,
  double? initialFraction,
  List<double>? snapFractions,
  SheetScrollConfiguration? scrollConfiguration,
  bool swipeDismissible = true,
  BorderRadius? borderRadius,
  Color? backgroundColor,
  bool safeArea = true,
}) {
  final snaps = (snapFractions ?? [0.5, 1.0])
      .map((f) => SheetOffset(f))
      .toList();

  Widget buildContent(BuildContext ctx) {
    final content = builder(ctx);
    return safeArea ? SafeArea(top: false, child: content) : content;
  }

  return Navigator.push<T>(
    context,
    ModalSheetRoute(
      swipeDismissible: swipeDismissible,
      swipeDismissSensitivity: const SwipeDismissSensitivity(
        minFlingVelocityRatio: 2.0,
        dismissalOffset: SheetOffset.proportionalToViewport(0.3),
      ),
      builder: (ctx) => Sheet(
        scrollConfiguration:
            scrollConfiguration ?? SheetScrollConfiguration.disabled,
        initialOffset: initialFraction != null
            ? SheetOffset(initialFraction)
            : snaps.first,
        snapGrid: SheetSnapGrid(snaps: snaps),
        decoration: MaterialSheetDecoration(
          size: SheetSize.stretch,
          clipBehavior: Clip.antiAlias,
          shape: RoundedRectangleBorder(
            borderRadius: borderRadius ?? BorderRadius.circular(20),
          ),
          color: backgroundColor,
        ),
        child: buildContent(ctx),
      ),
    ),
  );
}

/// BuildContext дээрх extension — `.showSmoothSheet(...)` гэж дуудахад.
extension SmoothSheetContext on BuildContext {
  /// [showModalBottomSheet]-г солих smooth_sheets дуудлага.
  Future<T?> showSmoothSheet<T>({
    required Widget Function(BuildContext) builder,
    double? initialFraction,
    List<double>? snapFractions,
    SheetScrollConfiguration? scrollConfiguration,
    bool swipeDismissible = true,
    BorderRadius? borderRadius,
    Color? backgroundColor,
    bool safeArea = true,
  }) {
    return pushSmoothSheet<T>(
      this,
      builder: builder,
      initialFraction: initialFraction,
      snapFractions: snapFractions,
      scrollConfiguration: scrollConfiguration,
      swipeDismissible: swipeDismissible,
      borderRadius: borderRadius,
      backgroundColor: backgroundColor,
      safeArea: safeArea,
    );
  }
}

/// Функц хэлбэрээр (extension ашиглахгүй) энгийн дуудлага.
Future<T?> smoothSheet<T>(
  BuildContext context, {
  required Widget Function(BuildContext) builder,
  double? initialFraction,
  List<double>? snapFractions,
  SheetScrollConfiguration? scrollConfiguration,
  bool swipeDismissible = true,
  BorderRadius? borderRadius,
  Color? backgroundColor,
  bool safeArea = true,
}) {
  return pushSmoothSheet<T>(
    context,
    builder: builder,
    initialFraction: initialFraction,
    snapFractions: snapFractions,
    scrollConfiguration: scrollConfiguration,
    swipeDismissible: swipeDismissible,
    borderRadius: borderRadius,
    backgroundColor: backgroundColor,
    safeArea: safeArea,
  );
}
