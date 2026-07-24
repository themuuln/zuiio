/// Smooth sheets-д зориулсан reusable wrapper.
///
/// Drag handle, зөв padding, SafeArea (зөвхөн доод талд) зэргийг
/// нэгтгэж, бүх bottom sheet-ууд ижил харагдацыг хангана.
///
/// ## Жишээ
/// ```dart
/// context.showSmoothSheet(
///   builder: (_) => TamgaBottomSheet(
///     child: Column(
///       mainAxisSize: MainAxisSize.min,
///       children: [
///         Text('Гарчиг'),
///         Text('Агуулга'),
///       ],
///     ),
///   ),
/// );
/// ```
library;

import 'package:flutter/material.dart';

import '../../app/theme/app_spacing.dart';

/// Smooth sheet доторх агуулгыг стандартчилсан харагдацаар харуулах widget.
///
/// - Drag handle (notch) дээд хэсэгт
/// - Зөвхөн доод SafeArea (top-г хассан — notch-оос үүсэх том зайг арилгана)
/// - Стандарт хэвтээ/босоо padding
/// - Гар гарч ирэхэд keyboard-ийн зайг тооцно
class TamgaBottomSheet extends StatelessWidget {
  const TamgaBottomSheet({
    required this.child,
    this.showDragHandle = true,
    this.horizontalPadding = AppSpacing.lg,
    this.bottomPadding = AppSpacing.xxl,
    super.key,
  });

  /// Sheet-ийн гол агуулга.
  final Widget child;

  /// Drag handle (notch) харуулах эсэх. Default `true`.
  final bool showDragHandle;

  /// Зүүн/баруун padding. Default `AppSpacing.lg` (16px).
  final double horizontalPadding;

  /// Доод padding. Default `AppSpacing.xxl` (24px).
  /// [MediaQuery.viewInsetsOf] доод зайтай нийлнэ (keyboard avoidance).
  final double bottomPadding;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SafeArea(
      top: false,
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          horizontalPadding,
          0,
          horizontalPadding,
          MediaQuery.viewInsetsOf(context).bottom + bottomPadding,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (showDragHandle) ...[
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(
                    top: AppSpacing.sm,
                    bottom: AppSpacing.md,
                  ),
                  decoration: BoxDecoration(
                    color: colorScheme.onSurfaceVariant.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
            ],
            child,
          ],
        ),
      ),
    );
  }
}
